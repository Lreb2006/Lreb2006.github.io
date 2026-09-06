export interface InverseTilt {
	rotateX: number;
	rotateY: number;
	shiftX: number;
	shiftY: number;
}

export interface CelestialParallax {
	nearX: number;
	nearY: number;
	farX: number;
	farY: number;
}

const clampUnit = (value: number) => Math.min(1, Math.max(0, value));
const inverse = (value: number) => (value === 0 ? 0 : -value);
const roundMotion = (value: number) => Math.round(value * 1000) / 1000;

export function calculateInverseTilt(
	pointerX: number,
	pointerY: number,
	maxTilt = 6,
	imageShift = 10,
): InverseTilt {
	const offsetX = (clampUnit(pointerX) - 0.5) * 2;
	const offsetY = (clampUnit(pointerY) - 0.5) * 2;

	return {
		rotateX: inverse(offsetY) * maxTilt,
		rotateY: inverse(offsetX) * maxTilt,
		shiftX: inverse(offsetX) * imageShift,
		shiftY: inverse(offsetY) * imageShift,
	};
}

export function calculateCelestialParallax(
	pointerX: number,
	pointerY: number,
	maxShift = 14,
): CelestialParallax {
	const offsetX = (clampUnit(pointerX) - 0.5) * 2;
	const offsetY = (clampUnit(pointerY) - 0.5) * 2;

	return {
		nearX: roundMotion(offsetX * maxShift),
		nearY: roundMotion(offsetY * maxShift),
		farX: roundMotion(inverse(offsetX) * maxShift * 0.4),
		farY: roundMotion(inverse(offsetY) * maxShift * 0.4),
	};
}
