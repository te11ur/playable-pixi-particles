import {Texture} from "../pixi.js/packages/core/src/textures/Texture";
import {Point} from "../pixi.js/packages/math/src/Point";
import {Sprite} from "../pixi.js/packages/sprite/src/Sprite";

import {
	combineRGBComponents,
	DEG_TO_RADS,
	GetTextureFromString,
	normalize,
	rotatePoint,
	scaleBy,
	length
} from "./ParticleUtils";
import {PropertyList} from "./PropertyList";

/**
 * An individual particle image. You shouldn't have to deal with these.
 */
export class Particle extends Sprite
{
	/**
	 * The emitter that controls this particle.
	 */
	emitter;
	/**
	 * The velocity of the particle. Speed may change, but the angle also
	 * contained in velocity is constant.
	 */
	velocity;
	/**
	 * The maximum lifetime of this particle, in seconds.
	 */
	maxLife;
	/**
	 * The current age of the particle, in seconds.
	 */
	age;
	/**
	 * A simple easing function to be applied to all properties that
	 * are being interpolated.
	 */
	ease;
	/**
	 * Extra data that the emitter passes along for custom particles.
	 */
	extraData;
	/**
	 * The alpha of the particle throughout its life.
	 */
	alphaList;
	/**
	 * The speed of the particle throughout its life.
	 */
	speedList;
	/**
	 * A multiplier from 0-1 applied to the speed of the particle at all times.
	 */
	speedMultiplier;
	/**
	 * Acceleration to apply to the particle.
	 */
	acceleration;
	/**
	 * The maximum speed allowed for accelerating particles. Negative values, values of 0 or NaN
	 * will disable the maximum speed.
	 */
	maxSpeed;
	/**
	 * Speed at which the particle rotates, in radians per second.
	 */
	rotationSpeed;

	/**
	 * Acceleration of rotation (angular acceleration) to apply to the particle.
	 */
	rotationAcceleration;

	/**
	 * If particle rotation is locked, preventing rotation from occurring due
	 * to directional changes.
	 */
	noRotation;
	/**
	 * The scale of the particle throughout its life.
	 */
	scaleList;
	/**
	 * A multiplier from 0-1 applied to the scale of the particle at all times.
	 */
	scaleMultiplier;
	/**
	 * The tint of the particle throughout its life.
	 */
	colorList;
	/**
	 * A reference to init, so that subclasses can access it without the penalty of Function.call()
	 */
	Particle_init;
	/**
	 * A reference to update so that subclasses can access the original without the overhead
	 * of Function.call().
	 * @param delta Time elapsed since the previous frame, in __seconds__.
	 * @return The standard interpolation multiplier (0-1) used for all relevant particle
	 *                   properties. A value of -1 means the particle died of old age instead.
	 */
	Particle_update;
	Particle_destroy;
	Sprite_destroy;
	/**
	 * If alpha should be interpolated at all.
	 */
	_doAlpha;
	/**
	 * If scale should be interpolated at all.
	 */
	_doScale;
	/**
	 * If speed should be interpolated at all.
	 */
	_doSpeed;
	/**
	 * If acceleration should be handled at all. _doSpeed is mutually exclusive with this,
	 * and _doSpeed gets priority.
	 */
	_doAcceleration;
	/**
	 * If color should be interpolated at all.
	 */
	_doColor;
	/**
	 * If normal movement should be handled. Subclasses wishing to override movement
	 * can set this to false in init().
	 */
	_doNormalMovement;
	/**
	 * One divided by the max life of the particle, saved for slightly faster math.
	 */
	_oneOverLife;
	/**
	 * Reference to the next particle in the list.
	 */
	next;

	/**
	 * Reference to the previous particle in the list.
	 */
	prev;

	/**
	 * @param {PIXI.particles.Emitter} emitter The emitter that controls this particle.
	 */
	constructor(emitter)
	{
		//start off the sprite with a blank texture, since we are going to replace it
		//later when the particle is initialized.
		super();
		this.emitter = emitter;
		//particles should be centered
		this.anchor.x = this.anchor.y = 0.5;
		this.velocity = new Point();
		this.rotationSpeed = 0;
		this.rotationAcceleration = 0;
		this.maxLife = 0;
		this.age = 0;
		this.ease = null;
		this.extraData = null;
		this.alphaList = new PropertyList();
		this.speedList = new PropertyList();
		this.speedMultiplier = 1;
		this.acceleration = new Point();
		this.maxSpeed = NaN;
		this.scaleList = new PropertyList();
		this.scaleMultiplier = 1;
		this.colorList = new PropertyList(true);
		this._doAlpha = false;
		this._doScale = false;
		this._doSpeed = false;
		this._doAcceleration = false;
		this._doColor = false;
		this._doNormalMovement = false;
		this._oneOverLife = 0;
		this.next = null;
		this.prev = null;

		//save often used functions on the instance instead of the prototype for better speed
		this.init = this.init;
		this.Particle_init = Particle.prototype.init;
		this.update = this.update;
		this.Particle_update = Particle.prototype.update;
		this.Sprite_destroy = super.destroy;
		this.Particle_destroy = Particle.prototype.destroy;
		this.applyArt = this.applyArt;
		this.kill = this.kill;
	}

	/**
	 * Initializes the particle for use, based on the properties that have to
	 * have been set already on the particle.
	 */
	init()
	{
		//reset the age
		this.age = 0;
		//set up the velocity based on the start speed and rotation
		this.velocity.x = this.speedList.current.value * this.speedMultiplier;
		this.velocity.y = 0;
		rotatePoint(this.rotation, this.velocity);
		if (this.noRotation)
		{
			this.rotation = 0;
		}
		else
		{
			//convert rotation to Radians from Degrees
			this.rotation *= DEG_TO_RADS;
		}
		//convert rotation speed to Radians from Degrees
		this.rotationSpeed *= DEG_TO_RADS;
		this.rotationAcceleration *= DEG_TO_RADS;

		//set alpha to inital alpha
		this.alpha = this.alphaList.current.value;
		//set scale to initial scale
		this.scale.x = this.scale.y = this.scaleList.current.value;
		//figure out what we need to interpolate
		this._doAlpha = !!this.alphaList.current.next;
		this._doSpeed = !!this.speedList.current.next;
		this._doScale = !!this.scaleList.current.next;
		this._doColor = !!this.colorList.current.next;
		this._doAcceleration = this.acceleration.x !== 0 || this.acceleration.y !== 0;
		//_doNormalMovement can be cancelled by subclasses
		this._doNormalMovement = this._doSpeed || this.speedList.current.value !== 0 || this._doAcceleration;
		//save our lerp helper
		this._oneOverLife = 1 / this.maxLife;
		//set the inital color
		let color = this.colorList.current.value;
		this.tint = combineRGBComponents(color.r, color.g, color.b);
		//ensure visibility
		this.visible = true;
	}

	/**
	 * Sets the texture for the particle. This can be overridden to allow
	 * for an animated particle.
	 * @param art The texture to set.
	 */
	applyArt(art)
	{
		this.texture = art || Texture.EMPTY;
	}

	/**
	 * Updates the particle.
	 * @param delta Time elapsed since the previous frame, in __seconds__.
	 * @return The standard interpolation multiplier (0-1) used for all
	 *         relevant particle properties. A value of -1 means the particle
	 *         died of old age instead.
	 */
	update(delta)
	{
		//increase age
		this.age += delta;
		//recycle particle if it is too old
		if(this.age >= this.maxLife || this.age < 0)
		{
			this.kill();
			return -1;
		}

		//determine our interpolation value
		let lerp = this.age * this._oneOverLife;//lifetime / maxLife;
		if (this.ease)
		{
			if(this.ease.length == 4)
			{
				//the t, b, c, d parameters that some tween libraries use
				//(time, initial value, end value, duration)
				lerp = (this.ease as any)(lerp, 0, 1, 1);
			}
			else
			{
				//the simplified version that we like that takes
				//one parameter, time from 0-1. TweenJS eases provide this usage.
				lerp = this.ease(lerp);
			}
		}

		//interpolate alpha
		if (this._doAlpha)
			this.alpha = this.alphaList.interpolate(lerp);
		//interpolate scale
		if (this._doScale)
		{
			let scale = this.scaleList.interpolate(lerp) * this.scaleMultiplier;
			this.scale.x = this.scale.y = scale;
		}
		//handle movement
		if(this._doNormalMovement)
		{
			let deltaX;
			let deltaY;
			//interpolate speed
			if (this._doSpeed)
			{
				let speed = this.speedList.interpolate(lerp) * this.speedMultiplier;
				normalize(this.velocity);
				scaleBy(this.velocity, speed);
				deltaX = this.velocity.x * delta;
				deltaY = this.velocity.y * delta;
			}
			else if(this._doAcceleration)
			{
				const oldVX = this.velocity.x;
				const oldVY = this.velocity.y;
				this.velocity.x += this.acceleration.x * delta;
				this.velocity.y += this.acceleration.y * delta;
				if (this.maxSpeed)
				{
					let currentSpeed = length(this.velocity);
					//if we are going faster than we should, clamp at the max speed
					//DO NOT recalculate vector length
					if (currentSpeed > this.maxSpeed)
					{
						scaleBy(this.velocity, this.maxSpeed / currentSpeed);
					}
				}
				// calculate position delta by the midpoint between our old velocity and our new velocity
				deltaX = (oldVX + this.velocity.x) / 2 * delta;
				deltaY = (oldVY + this.velocity.y) / 2 * delta;
			}
			else
			{
				deltaX = this.velocity.x * delta;
				deltaY = this.velocity.y * delta;
			}
			//adjust position based on velocity
			this.position.x += deltaX;
			this.position.y += deltaY;
		}
		//interpolate color
		if (this._doColor)
		{
			this.tint = this.colorList.interpolate(lerp);
		}
		//update rotation
		if (this.rotationAcceleration !== 0)
		{
			const newRotationSpeed = this.rotationSpeed + this.rotationAcceleration * delta;

			this.rotation += (this.rotationSpeed + newRotationSpeed) / 2 * delta;
			this.rotationSpeed = newRotationSpeed;
		}
		else if (this.rotationSpeed !== 0)
		{
			this.rotation += this.rotationSpeed * delta;
		}
		else if(this.acceleration && !this.noRotation)
		{
			this.rotation = Math.atan2(this.velocity.y, this.velocity.x);// + Math.PI / 2;
		}
		return lerp;
	}

	/**
	 * Kills the particle, removing it from the display list
	 * and telling the emitter to recycle it.
	 */
	kill()
	{
		this.emitter.recycle(this);
	}

	/**
	 * Destroys the particle, removing references and preventing future use.
	 */
	destroy()
	{
		if (this.parent)
			this.parent.removeChild(this);
		this.Sprite_destroy();
		this.emitter = this.velocity = this.colorList = this.scaleList = this.alphaList =
			this.speedList = this.ease = this.next = this.prev = null;
	}

	/**
	 * Checks over the art that was passed to the Emitter's init() function, to do any special
	 * modifications to prepare it ahead of time.
	 * @param art The array of art data. For Particle, it should be an array of
	 *            Textures. Any strings in the array will be converted to
	 *            Textures via Texture.from().
	 * @return The art, after any needed modifications.
	 */
	static parseArt(art)
	{
		//convert any strings to Textures.
		let i;
		for(i = art.length; i >= 0; --i)
		{
			if(typeof art[i] == "string")
				art[i] = GetTextureFromString(art[i]);
		}
		//particles from different base textures will be slower in WebGL than if they
		//were from one spritesheet
		if(ParticleUtils.verbose)
		{
			for(i = art.length - 1; i > 0; --i)
			{
				if(art[i].baseTexture != art[i - 1].baseTexture)
				{
					if (window.console)
						console.warn("PixiParticles: using particle textures from different images may hinder performance in WebGL");
					break;
				}
			}
		}

		return art;
	}

	/**
	 * Parses extra emitter data to ensure it is set up for this particle class.
	 * Particle does nothing to the extra data.
	 * @param extraData The extra data from the particle config.
	 * @return The parsed extra data.
	 */
	static parseData(extraData)
	{
		return extraData;
	}
}
