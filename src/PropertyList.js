import {combineRGBComponents} from "./ParticleUtils";

/**
 * Singly linked list container for keeping track of interpolated properties for particles.
 * Each Particle will have one of these for each interpolated property.
 */
export class PropertyList
{
	/**
	 * The current property node in the linked list.
	 */
	current;
	/**
	 * The next property node in the linked list. Stored separately for slightly less variable
	 * access.
	 */
	next;
	/**
	 * Calculates the correct value for the current interpolation value. This method is set in
	 * the reset() method.
	 * @param lerp The interpolation value from 0-1.
	 * @return The interpolated value. Colors are converted to the hex value.
	 */
	interpolate;
	/**
	 * A custom easing method for this list.
	 * @param lerp The interpolation value from 0-1.
	 * @return The eased value, also from 0-1.
	 */
	ease;
	/**
	 * If this list manages colors, which requires a different method for interpolation.
	 */
	isColor;
	
    /**
     * @param isColor If this list handles color values
     */
	constructor(isColor = false)
	{
		this.current = null;
		this.next = null;
		this.isColor = !!isColor;
		this.interpolate = null;
		this.ease = null;
	}

	/**
	 * Resets the list for use.
	 * @param first The first node in the list.
	 * @param first.isStepped If the values should be stepped instead of interpolated linearly.
	 */
	reset(first)
	{
		this.current = first;
		this.next = first.next;
		const isSimple = this.next && this.next.time >= 1;
		if (isSimple)
		{
			this.interpolate = this.isColor ? intColorSimple : intValueSimple;
		}
		else if (first.isStepped)
		{
			this.interpolate = this.isColor ? intColorStepped : intValueStepped;
		}
		else
		{
			this.interpolate = this.isColor ? intColorComplex : intValueComplex;
		}
		this.ease = this.current.ease;
	}
}

function intValueSimple(_this, lerp)
{
	if (_this.ease){
		lerp = this.ease(lerp);
	}
	return (_this.next.value - _this.current.value) * lerp + _this.current.value;
}

function intColorSimple(_this, lerp)
{
	if (_this.ease) {
		lerp = this.ease(lerp);
	}
	let curVal = _this.current.value, nextVal = _this.next.value;
	let r = (nextVal.r - curVal.r) * lerp + curVal.r;
	let g = (nextVal.g - curVal.g) * lerp + curVal.g;
	let b = (nextVal.b - curVal.b) * lerp + curVal.b;
	return combineRGBComponents(r, g, b);
}

function intValueComplex(_this, lerp)
{
	if (_this.ease){
		lerp = _this.ease(lerp);
	}
	//make sure we are on the right segment
	while (lerp > _this.next.time)
	{
		_this.current = _this.next;
		_this.next = _this.next.next;
	}
	//convert the lerp value to the segment range
	lerp = (lerp - _this.current.time) / (_this.next.time - _this.current.time);
	return (_this.next.value - _this.current.value) * lerp + _this.current.value;
}

function intColorComplex(_this, lerp)
{
	if (_this.ease){
		lerp = _this.ease(lerp);
	}
	//make sure we are on the right segment
	while (lerp > _this.next.time)
	{
		_this.current = _this.next;
		_this.next = _this.next.next;
	}
	//convert the lerp value to the segment range
	lerp = (lerp - _this.current.time) / (_this.next.time - _this.current.time);
	let curVal = _this.current.value, nextVal = _this.next.value;
	let r = (nextVal.r - curVal.r) * lerp + curVal.r;
	let g = (nextVal.g - curVal.g) * lerp + curVal.g;
	let b = (nextVal.b - curVal.b) * lerp + curVal.b;
	return combineRGBComponents(r, g, b);
}

function intValueStepped(_this, lerp)
{
	if (_this.ease){
		lerp = _this.ease(lerp);
	}
	//make sure we are on the right segment
	while (_this.next && lerp > _this.next.time)
	{
		_this.current = _this.next;
		_this.next = _this.next.next;
	}
	return _this.current.value;
}

function intColorStepped(_this, lerp)
{
	if (_this.ease){
		lerp = _this.ease(lerp);
	}
	//make sure we are on the right segment
	while (_this.next && lerp > _this.next.time)
	{
		_this.current = _this.next;
		_this.next = _this.next.next;
	}
	let curVal = _this.current.value;
	return combineRGBComponents(curVal.r, curVal.g, curVal.b);
}