import assert from "node:assert/strict";
import test from "node:test";

type HomeSceneFrame = {
	sceneProgress: number;
	aquariumX: number;
	finalX: number;
	aquariumOpacity: number;
	finalOpacity: number;
	cardRotateZ: number;
	portalProgress: number;
};

type SortHomeCarouselPaths = (paths: string[]) => string[];
type GetHomeSceneFrame = (
	progress: number,
	velocity?: number,
) => HomeSceneFrame;
type GetHomeStoryDistance = (viewportHeight: number) => number;
type GetAquariumOwner = (
	shrinkProgress: number,
	scenePhaseStarted: boolean,
) => "hero" | "portal" | "scene";
type GetHomeForegroundTransform = (options: {
	sourceLeft: number;
	sourceTop: number;
	sourceWidth: number;
	sourceHeight: number;
	targetMaxWidth: number;
	targetMaxHeight: number;
	viewportWidth: number;
	viewportHeight: number;
}) => {
	x: number;
	y: number;
	scale: number;
	renderedWidth: number;
	renderedHeight: number;
};
type GetHomeStorySceneGeometry = (options: {
	heroWidth: number;
	heroHeight: number;
	viewportWidth: number;
	viewportHeight: number;
}) => {
	aspect: number;
	width: number;
	height: number;
	gap: number;
	stride: number;
};
type GetSmoothedHomeTilt = (
	current: number,
	target: number,
	deltaMs: number,
	idleMs: number,
) => number;
type GetSmoothedHomeFinaleProgress = (
	current: number,
	target: number,
	deltaMs: number,
) => number;
type GetHomeFinaleOwner = (
	targetProgress: number,
	renderedProgress: number,
) => "portal" | "scene";
type GetHomeFinaleHandoffFrame = (renderedProgress: number) => {
	portalOpacity: number;
	sceneOpacity: number;
};
type GetHomeAfterglowFrame = (progress: number) => {
	portalOpacity: number;
	imageOpacity: number;
	maskStartPercent: number;
};
type GetHomeHeroBrandOpacity = (shrinkProgress: number) => 0 | 1;

let sortHomeCarouselPaths: SortHomeCarouselPaths = () => [];
let getHomeSceneFrame: GetHomeSceneFrame = () => ({
	sceneProgress: Number.NaN,
	aquariumX: Number.NaN,
	finalX: Number.NaN,
	aquariumOpacity: Number.NaN,
	finalOpacity: Number.NaN,
	cardRotateZ: Number.NaN,
	portalProgress: Number.NaN,
});
let getHomeStoryDistance: GetHomeStoryDistance = () => Number.NaN;
let getAquariumOwner: GetAquariumOwner = () => "portal";
let getHomeForegroundTransform: GetHomeForegroundTransform = () => ({
	x: Number.NaN,
	y: Number.NaN,
	scale: Number.NaN,
	renderedWidth: Number.NaN,
	renderedHeight: Number.NaN,
});
let getHomeStorySceneGeometry: GetHomeStorySceneGeometry = () => ({
	aspect: Number.NaN,
	width: Number.NaN,
	height: Number.NaN,
	gap: Number.NaN,
	stride: Number.NaN,
});
let getSmoothedHomeTilt: GetSmoothedHomeTilt = () => Number.NaN;
let getSmoothedHomeFinaleProgress: GetSmoothedHomeFinaleProgress = () =>
	Number.NaN;
let getHomeFinaleOwner: GetHomeFinaleOwner = () => "scene";
let getHomeFinaleHandoffFrame: GetHomeFinaleHandoffFrame = (
	renderedProgress,
) => ({
	portalOpacity: renderedProgress > 0 ? 1 : 0,
	sceneOpacity: renderedProgress > 0 ? 0 : 1,
});
let getHomeAfterglowFrame: GetHomeAfterglowFrame = () => ({
	portalOpacity: Number.NaN,
	imageOpacity: Number.NaN,
	maskStartPercent: Number.NaN,
});
let getHomeHeroBrandOpacity: GetHomeHeroBrandOpacity = () => 1;

try {
	const storyModule = await import("./home-scroll-story");
	sortHomeCarouselPaths = storyModule.sortHomeCarouselPaths;
	getHomeSceneFrame = storyModule.getHomeSceneFrame;
	getHomeStoryDistance = storyModule.getHomeStoryDistance;
	getAquariumOwner = storyModule.getAquariumOwner;
	getHomeForegroundTransform =
		storyModule.getHomeForegroundTransform ?? getHomeForegroundTransform;
	getHomeStorySceneGeometry =
		storyModule.getHomeStorySceneGeometry ?? getHomeStorySceneGeometry;
	getSmoothedHomeTilt = storyModule.getSmoothedHomeTilt;
	getSmoothedHomeFinaleProgress =
		storyModule.getSmoothedHomeFinaleProgress ?? getSmoothedHomeFinaleProgress;
	getHomeFinaleOwner = storyModule.getHomeFinaleOwner ?? getHomeFinaleOwner;
	getHomeFinaleHandoffFrame =
		storyModule.getHomeFinaleHandoffFrame ?? getHomeFinaleHandoffFrame;
	getHomeAfterglowFrame = storyModule.getHomeAfterglowFrame;
	getHomeHeroBrandOpacity = storyModule.getHomeHeroBrandOpacity ?? (() => 1);
} catch {
	// Fallbacks keep the first red run focused on the missing feature.
}

test("numeric filename prefixes control carousel order", () => {
	assert.deepEqual(
		sortHomeCarouselPaths([
			"/images/100-last.jpg",
			"/images/020-second.png",
			"/images/010-first.webp",
		]),
		[
			"/images/010-first.webp",
			"/images/020-second.png",
			"/images/100-last.jpg",
		],
	);
});

test("unnumbered carousel files follow numbered files deterministically", () => {
	assert.deepEqual(
		sortHomeCarouselPaths([
			"/images/zeta.jpg",
			"/images/010-numbered.jpg",
			"/images/alpha.jpg",
		]),
		["/images/010-numbered.jpg", "/images/alpha.jpg", "/images/zeta.jpg"],
	);
});

test("story progress is clamped before mapping visual phases", () => {
	assert.deepEqual(getHomeSceneFrame(-2, 0), getHomeSceneFrame(0, 0));
	assert.deepEqual(getHomeSceneFrame(4, 0), getHomeSceneFrame(1, 0));
});

test("the aquarium scene completes its faster horizontal move before expansion", () => {
	const start = getHomeSceneFrame(0, 0);
	const finalCentered = getHomeSceneFrame(0.7, 0);

	assert.equal(start.sceneProgress, 0);
	assert.equal(start.aquariumX, 0);
	assert.equal(start.finalX, 1);
	assert.equal(finalCentered.sceneProgress, 1);
	assert.equal(finalCentered.aquariumX, -1);
	assert.equal(finalCentered.finalX, 0);
	assert.equal(finalCentered.portalProgress, 0);
});

test("desktop story uses a shorter scroll runway for longer wheel travel", () => {
	assert.equal(getHomeStoryDistance(800), 1600);
	assert.equal(getHomeStoryDistance(1200), 2160);
});

test("only the last part of the pin expands the final image", () => {
	const moving = getHomeSceneFrame(0.5, 0);
	const expanded = getHomeSceneFrame(1, 0);

	assert.equal(moving.portalProgress, 0);
	assert.equal(moving.aquariumOpacity, 1);
	assert.equal(moving.finalOpacity, 1);
	assert.equal(expanded.portalProgress, 1);
	assert.equal(expanded.aquariumOpacity, 0);
	assert.equal(expanded.finalOpacity, 0);
});

test("scroll velocity gives both foreground cards a small reversed clamped tilt", () => {
	assert.equal(getHomeSceneFrame(0.5, 5000).cardRotateZ, -2.6);
	assert.equal(getHomeSceneFrame(0.5, -5000).cardRotateZ, 2.6);
	assert.equal(getHomeSceneFrame(0.5, 0).cardRotateZ, 0);
});

test("the homepage and story keep separate foreground ownership", () => {
	assert.equal(getAquariumOwner(0, false), "hero");
	assert.equal(getAquariumOwner(0.65, false), "hero");
	assert.equal(getAquariumOwner(1, false), "hero");
	assert.equal(getAquariumOwner(1, true), "scene");
	assert.equal(getAquariumOwner(0.65, true), "scene");
});

test("both story cards share the scaled homepage aspect and one stride", () => {
	assert.deepEqual(
		getHomeStorySceneGeometry({
			heroWidth: 1800,
			heroHeight: 900,
			viewportWidth: 1920,
			viewportHeight: 1080,
		}),
		{
			aspect: 2,
			width: 992,
			height: 496,
			gap: 307.2,
			stride: 1299.2,
		},
	);
});

test("the foreground card reaches its target with one uniform scale", () => {
	const frame = getHomeForegroundTransform({
		sourceLeft: 100,
		sourceTop: 50,
		sourceWidth: 1800,
		sourceHeight: 900,
		targetMaxWidth: 900,
		targetMaxHeight: 560,
		viewportWidth: 1920,
		viewportHeight: 1080,
	});

	assert.deepEqual(frame, {
		x: -40,
		y: 40,
		scale: 0.5,
		renderedWidth: 900,
		renderedHeight: 450,
	});
	assert.equal(frame.renderedWidth / frame.renderedHeight, 2);
});

test("the homepage brand ignores residual top-edge progress before disappearing", () => {
	assert.equal(getHomeHeroBrandOpacity(0), 1);
	assert.equal(getHomeHeroBrandOpacity(Number.EPSILON), 1);
	assert.equal(getHomeHeroBrandOpacity(0.01), 1);
	assert.equal(getHomeHeroBrandOpacity(0.011), 0);
	assert.equal(getHomeHeroBrandOpacity(0.5), 0);
	assert.equal(getHomeHeroBrandOpacity(1), 0);
	assert.equal(getHomeHeroBrandOpacity(-1), 1);
});

test("foreground tilt approaches its target continuously and returns without snapping", () => {
	const firstFrame = getSmoothedHomeTilt(0, -2.6, 16, 0);
	const secondFrame = getSmoothedHomeTilt(firstFrame, -2.6, 16, 16);
	const firstIdleFrame = getSmoothedHomeTilt(secondFrame, -2.6, 16, 320);

	assert.ok(firstFrame < 0 && firstFrame > -2.6);
	assert.ok(secondFrame < firstFrame && secondFrame > -2.6);
	assert.ok(firstIdleFrame > secondFrame && firstIdleFrame < 0);
	assert.notEqual(firstIdleFrame, 0);
});

test("released foreground tilt settles at the approved middle pace", () => {
	let releasedTilt = -2;
	for (let idleMs = 64; idleMs <= 160; idleMs += 16) {
		releasedTilt = getSmoothedHomeTilt(releasedTilt, -2.6, 16, idleMs);
	}

	assert.ok(Math.abs(releasedTilt) > 0.5);
	assert.ok(Math.abs(releasedTilt) < 0.85);
});

test("final foreground expansion follows wheel progress with light inertia", () => {
	const firstFrame = getSmoothedHomeFinaleProgress(0, 1, 16);
	const secondFrame = getSmoothedHomeFinaleProgress(firstFrame, 1, 16);

	assert.ok(firstFrame > 0 && firstFrame < 0.25);
	assert.ok(secondFrame > firstFrame && secondFrame < 1);
});

test("final foreground inertia reaches its target exactly without overshooting", () => {
	let progress = 0;
	for (let frame = 0; frame < 120; frame += 1) {
		progress = getSmoothedHomeFinaleProgress(progress, 1, 16);
	}

	assert.equal(progress, 1);
	assert.equal(getSmoothedHomeFinaleProgress(1.2, 2, 16), 1);
	assert.equal(getSmoothedHomeFinaleProgress(-0.2, -1, 16), 0);
});

test("the portal keeps sole ownership while its rendered reverse motion is unfinished", () => {
	assert.equal(getHomeFinaleOwner(0, 0.35), "portal");
	assert.equal(getHomeFinaleOwner(0.25, 0), "portal");
	assert.equal(getHomeFinaleOwner(0, 0), "scene");
});

test("aligned finale layers crossfade continuously at the rendered handoff", () => {
	assert.deepEqual(getHomeFinaleHandoffFrame(0.018), {
		portalOpacity: 1,
		sceneOpacity: 0,
	});
	assert.deepEqual(getHomeFinaleHandoffFrame(0.009), {
		portalOpacity: 0.5,
		sceneOpacity: 0.5,
	});
	assert.deepEqual(getHomeFinaleHandoffFrame(0), {
		portalOpacity: 0,
		sceneOpacity: 1,
	});
	assert.deepEqual(getHomeFinaleHandoffFrame(0.35), {
		portalOpacity: 1,
		sceneOpacity: 0,
	});
});

test("the final scene washes nonlinearly into the page background", () => {
	const start = getHomeAfterglowFrame(0);
	const quarter = getHomeAfterglowFrame(0.25);
	const middle = getHomeAfterglowFrame(0.5);
	const threeQuarter = getHomeAfterglowFrame(0.75);
	const end = getHomeAfterglowFrame(1);

	assert.deepEqual(start, {
		portalOpacity: 1,
		imageOpacity: 1,
		maskStartPercent: 100,
	});
	assert.equal(middle.imageOpacity, 0.5);
	assert.equal(middle.maskStartPercent, 64);
	assert.deepEqual(end, {
		portalOpacity: 0,
		imageOpacity: 0,
		maskStartPercent: 28,
	});
	assert.ok(quarter.imageOpacity > 0.75);
	assert.ok(threeQuarter.imageOpacity < 0.25);
	assert.deepEqual(getHomeAfterglowFrame(-1), start);
	assert.deepEqual(getHomeAfterglowFrame(2), end);
});
