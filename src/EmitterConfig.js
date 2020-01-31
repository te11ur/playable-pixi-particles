export class EmitterConfig {
	alpha;
	speed;
	minimumSpeedMultiplier;
	maxSpeed;
	acceleration;
	scale;
	minimumScaleMultiplier;
	color;
	startRotation;
	noRotation;
	rotationSpeed;
	rotationAcceleration;
	lifetime;
	blendMode;
	ease;
	extraData;
	particlesPerWave;
	/**
	 * Really "rect"|"circle"|"ring"|"burst"|"point"|"polygonalChain", but that
	 * tends to be too strict for random object creation.
	 */
	spawnType;
	spawnRect ;
	spawnCircle;
	particleSpacing;
	angleStart;
	spawnPolygon;
	frequency;
	spawnChance;
	emitterLifetime;
	maxParticles;
	addAtBack;
	pos;
	emit;
	autoUpdate;
	orderedArt;
}

export class RandNumber {
	max;
	min;
}

export class BasicTweenable {
	start;
	end;
}

export class OldEmitterConfig {
	alpha;
	speed;
	maxSpeed;
	acceleration;
	scale;
	color;
	startRotation;
	noRotation;
	rotationSpeed;
	rotationAcceleration;
	lifetime;
	blendMode;
	ease;
	extraData;
	particlesPerWave;
	/**
	 * Really "rect"|"circle"|"ring"|"burst"|"point"|"polygonalChain", but that
	 * tends to be too strict for random object creation.
	 */
	spawnType;
	spawnRect;
	spawnCircle;
	particleSpacing;
	angleStart;
	spawnPolygon;
	frequency;
	spawnChance;
	emitterLifetime;
	maxParticles;
	addAtBack;
	pos;
	emit;
	autoUpdate;
	orderedArt;
}