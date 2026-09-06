import assert from "node:assert/strict";
import test from "node:test";

type InverseTilt = {
	rotateX: number;
	rotateY: number;
	shiftX: number;
	shiftY: number;
};

type CalculateInverseTilt = (
	pointerX: number,
	pointerY: number,
	maxTilt?: number,
	imageShift?: number,
) => InverseTilt;

type CelestialParallax = {
	nearX: number;
	nearY: number;
	farX: number;
	farY: number;
};

type CalculateCelestialParallax = (
	pointerX: number,
	pointerY: number,
	maxShift?: number,
) => CelestialParallax;

let calculateInverseTilt: CalculateInverseTilt = () => ({
	rotateX: 0,
	rotateY: 0,
	shiftX: 0,
	shiftY: 0,
});

let calculateCelestialParallax: CalculateCelestialParallax = () => ({
	nearX: Number.NaN,
	nearY: Number.NaN,
	farX: Number.NaN,
	farY: Number.NaN,
});

try {
	const tiltModule = await import("./inverse-tilt");
	calculateInverseTilt = tiltModule.calculateInverseTilt;
	calculateCelestialParallax =
		(
			tiltModule as typeof tiltModule & {
				calculateCelestialParallax?: CalculateCelestialParallax;
			}
		).calculateCelestialParallax ?? calculateCelestialParallax;
} catch {
	// The fallback keeps the first red test focused on the missing behavior.
}

test("pointer movement moves the card weight in the opposite direction", () => {
	assert.deepEqual(calculateInverseTilt(1, 0, 6, 10), {
		rotateX: 6,
		rotateY: -6,
		shiftX: -10,
		shiftY: 10,
	});
});

test("the center position has no tilt or image shift", () => {
	assert.deepEqual(calculateInverseTilt(0.5, 0.5, 6, 10), {
		rotateX: 0,
		rotateY: 0,
		shiftX: 0,
		shiftY: 0,
	});
});

test("pointer coordinates are clamped to the card bounds", () => {
	assert.deepEqual(calculateInverseTilt(2, -1, 6, 10), {
		rotateX: 6,
		rotateY: -6,
		shiftX: -10,
		shiftY: 10,
	});
});

test("celestial layers move at different depths around the pointer", () => {
	assert.deepEqual(calculateCelestialParallax(1, 0, 14), {
		nearX: 14,
		nearY: -14,
		farX: -5.6,
		farY: 5.6,
	});
});

test("celestial parallax rests at the center and clamps outside the viewport", () => {
	assert.deepEqual(calculateCelestialParallax(0.5, 0.5, 14), {
		nearX: 0,
		nearY: 0,
		farX: 0,
		farY: 0,
	});
	assert.deepEqual(calculateCelestialParallax(3, -2, 10), {
		nearX: 10,
		nearY: -10,
		farX: -4,
		farY: 4,
	});
});
