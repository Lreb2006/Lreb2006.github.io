export type HomeSceneFrame = {
	sceneProgress: number;
	aquariumX: number;
	finalX: number;
	aquariumOpacity: number;
	finalOpacity: number;
	cardRotateZ: number;
	portalProgress: number;
};

export type HomeAfterglowFrame = {
	portalOpacity: number;
	imageOpacity: number;
	maskStartPercent: number;
};

const clamp = (value: number, min = 0, max = 1): number =>
	Math.min(max, Math.max(min, value));

const rangeProgress = (value: number, start: number, end: number): number =>
	clamp((value - start) / (end - start));

const basename = (path: string): string => path.split(/[\\/]/).at(-1) ?? path;

const leadingOrder = (path: string): number => {
	const match = basename(path).match(/^(\d+)/);
	return match ? Number.parseInt(match[1], 10) : Number.POSITIVE_INFINITY;
};

export function getAquariumOwner(
	_shrinkProgress: number,
	scenePhaseStarted: boolean,
): "hero" | "portal" | "scene" {
	return scenePhaseStarted ? "scene" : "hero";
}

export function getHomeHeroBrandOpacity(shrinkProgress: number): 0 | 1 {
	return shrinkProgress > 0.01 ? 0 : 1;
}

export function getHomeForegroundTransform(options: {
	sourceLeft: number;
	sourceTop: number;
	sourceWidth: number;
	sourceHeight: number;
	targetMaxWidth: number;
	targetMaxHeight: number;
	viewportWidth: number;
	viewportHeight: number;
}): {
	x: number;
	y: number;
	scale: number;
	renderedWidth: number;
	renderedHeight: number;
} {
	const {
		sourceLeft,
		sourceTop,
		sourceWidth,
		sourceHeight,
		targetMaxWidth,
		targetMaxHeight,
		viewportWidth,
		viewportHeight,
	} = options;
	const scale = Math.min(
		targetMaxWidth / sourceWidth,
		targetMaxHeight / sourceHeight,
	);
	const renderedWidth = sourceWidth * scale;
	const renderedHeight = sourceHeight * scale;

	return {
		x: viewportWidth / 2 - (sourceLeft + sourceWidth / 2),
		y: viewportHeight / 2 - (sourceTop + sourceHeight / 2),
		scale,
		renderedWidth,
		renderedHeight,
	};
}

export function getHomeStorySceneGeometry(options: {
	heroWidth: number;
	heroHeight: number;
	viewportWidth: number;
	viewportHeight: number;
}): {
	aspect: number;
	width: number;
	height: number;
	gap: number;
	stride: number;
} {
	const safeHeroWidth = Math.max(options.heroWidth, 1);
	const safeHeroHeight = Math.max(options.heroHeight, 1);
	const aspect = safeHeroWidth / safeHeroHeight;
	const width = Math.min(
		options.viewportWidth * 0.56,
		992,
		Math.max(options.viewportHeight - 144, 1) * aspect,
	);
	const height = width / aspect;
	const gap = Math.max(150, options.viewportWidth * 0.16);

	return {
		aspect,
		width,
		height,
		gap,
		stride: width + gap,
	};
}

export function getSmoothedHomeTilt(
	current: number,
	target: number,
	deltaMs: number,
	idleMs: number,
): number {
	const safeDelta = Math.max(0, Math.min(deltaMs, 34));
	const released = idleMs > 64;
	const desired = released ? 0 : target;
	const blend = 1 - Math.exp(-safeDelta / 72);
	const next = current + (desired - current) * blend;
	return Math.abs(next) < 0.0005 ? 0 : next;
}

export function getSmoothedHomeFinaleProgress(
	current: number,
	target: number,
	deltaMs: number,
): number {
	const normalizedCurrent = clamp(current);
	const normalizedTarget = clamp(target);
	if (Math.abs(normalizedTarget - normalizedCurrent) < 0.0005) {
		return normalizedTarget;
	}

	const safeDelta = Math.max(0, Math.min(deltaMs, 34));
	const blend = 1 - Math.exp(-safeDelta / 96);
	const next =
		normalizedCurrent + (normalizedTarget - normalizedCurrent) * blend;

	return Math.abs(normalizedTarget - next) < 0.0005
		? normalizedTarget
		: clamp(next);
}

export function getHomeFinaleOwner(
	targetProgress: number,
	renderedProgress: number,
): "portal" | "scene" {
	return clamp(targetProgress) > 0 || clamp(renderedProgress) > 0
		? "portal"
		: "scene";
}

export function getHomeFinaleHandoffFrame(renderedProgress: number): {
	portalOpacity: number;
	sceneOpacity: number;
} {
	const portalOpacity = clamp(renderedProgress / 0.018);
	return {
		portalOpacity,
		sceneOpacity: 1 - portalOpacity,
	};
}

export function getHomeAfterglowFrame(progress: number): HomeAfterglowFrame {
	const normalized = clamp(progress);
	const eased = normalized * normalized * (3 - 2 * normalized);

	return {
		portalOpacity: normalized >= 1 ? 0 : 1,
		imageOpacity: 1 - eased,
		maskStartPercent: 100 - 72 * eased,
	};
}

export function getHomeStoryDistance(viewportHeight: number): number {
	return Math.max(1600, viewportHeight * 1.8);
}

export function sortHomeCarouselPaths(paths: string[]): string[] {
	return [...paths].sort((left, right) => {
		const orderDifference = leadingOrder(left) - leadingOrder(right);
		if (Number.isFinite(orderDifference) && orderDifference !== 0) {
			return orderDifference;
		}
		if (leadingOrder(left) !== leadingOrder(right)) {
			return leadingOrder(left) - leadingOrder(right);
		}
		return basename(left).localeCompare(basename(right), "en", {
			numeric: true,
			sensitivity: "base",
		});
	});
}

export function getHomeSceneFrame(
	progress: number,
	velocity = 0,
): HomeSceneFrame {
	const normalized = clamp(progress);
	const sceneProgress = rangeProgress(normalized, 0, 0.7);
	const portalProgress = rangeProgress(normalized, 0.7, 1);
	const velocityTilt = velocity === 0 ? 0 : clamp(-velocity / 750, -2.6, 2.6);

	return {
		sceneProgress,
		aquariumX: sceneProgress === 0 ? 0 : -sceneProgress,
		finalX: 1 - sceneProgress,
		aquariumOpacity: 1 - portalProgress,
		finalOpacity: portalProgress > 0 ? 0 : 1,
		cardRotateZ: velocityTilt * (1 - portalProgress),
		portalProgress,
	};
}
