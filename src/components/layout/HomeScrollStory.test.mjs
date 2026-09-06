import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("./HomeScrollStory.astro", import.meta.url);
const carouselUrl = new URL(
	"../../assets/images/home-scroll-carousel/",
	import.meta.url,
);
const finalImageUrl = new URL(
	"../../assets/images/charlore/home-story-final.jpg",
	import.meta.url,
);
const darkWideImageUrl = new URL(
	"../../assets/images/charlore/home-starlight-dark-wide.png",
	import.meta.url,
);
const finalWideImageUrl = new URL(
	"../../assets/images/charlore/home-story-final-wide.png",
	import.meta.url,
);
const layoutUrl = new URL(
	"../../layouts/MainGridLayout.astro",
	import.meta.url,
);
const layoutStyleUrl = new URL("../../styles/layout-base.css", import.meta.url);
const sidebarConfigUrl = new URL(
	"../../config/sidebarConfig.ts",
	import.meta.url,
);
const wallpaperUtilsUrl = new URL(
	"../../utils/fullscreen-wallpaper-utils.ts",
	import.meta.url,
);
const scrollIndicatorUrl = new URL(
	"../controls/ScrollDownIndicator.astro",
	import.meta.url,
);
const navbarUrl = new URL("./Navbar.astro", import.meta.url);
const navbarCompactStateUrl = new URL(
	"../../utils/navbar-compact-state.ts",
	import.meta.url,
);
const tiltCardUrl = new URL("./HomeTiltImageCard.astro", import.meta.url);
const mainStyleUrl = new URL("../../styles/main.css", import.meta.url);
const navbarStyleUrl = new URL("../../styles/navbar.css", import.meta.url);
const variablesStyleUrl = new URL(
	"../../styles/variables.styl",
	import.meta.url,
);

const readPngDimensions = async (url) => {
	const bytes = await readFile(url);
	assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
	return {
		width: bytes.readUInt32BE(16),
		height: bytes.readUInt32BE(20),
	};
};

test("story assets keep the final frame separate from the ordered carousel folder", async () => {
	const files = (await readdir(carouselUrl)).filter((file) =>
		/\.(?:jpe?g|png|webp|avif)$/i.test(file),
	);

	assert.ok(files.length > 0);
	assert.deepEqual(
		files.map((file) => file.match(/^(\d+)/)?.[1]),
		files
			.map((file) => file.match(/^(\d+)/)?.[1])
			.toSorted((left, right) => Number(left) - Number(right)),
	);
	assert.equal(
		files.some((file) => file.includes("56562834")),
		false,
	);
	await access(finalImageUrl);
});

test("foreground derivatives use a stable wide canvas while original art stays available", async () => {
	const [darkSize, finalSize] = await Promise.all([
		readPngDimensions(darkWideImageUrl),
		readPngDimensions(finalWideImageUrl),
	]);

	for (const size of [darkSize, finalSize]) {
		assert.ok(size.width >= 1200);
		assert.ok(size.width / size.height >= 1.9);
		assert.ok(size.width / size.height <= 2.05);
	}
	await access(
		new URL(
			"../../assets/images/charlore/home-starlight-dark.png",
			import.meta.url,
		),
	);
	await access(finalImageUrl);
});

test("desktop story keeps the homepage card separate and gives both story cards one component", async () => {
	const source = await readFile(componentUrl, "utf8");

	assert.match(source, /import HomeTiltImageCard/);
	assert.match(source, /import\.meta\.glob/);
	assert.match(source, /sortHomeCarouselPaths/);
	assert.match(source, /data-home-scroll-story/);
	assert.match(source, /data-story-cycle-track/);
	assert.match(source, /\[carouselImages, carouselImages\]/);
	assert.match(source, /data-story-scene="aquarium"/);
	assert.match(source, /data-story-scene="final"/);
	assert.match(source, /data-story-final-frame/);
	assert.match(source, /data-story-next-indicator/);
	assert.match(source, /keyboard-arrow-right-rounded/);
	assert.match(source, /home-story-final-wide\.png/);
	assert.match(source, /#wallpaper-wrapper \.home-tilt-card-shell/);
	assert.doesNotMatch(source, /root\.append\(heroShell\)/);
	assert.doesNotMatch(source, /is-story-foreground/);
	assert.equal(source.match(/<HomeTiltImageCard/g)?.length, 2);
	assert.equal(source.match(/variant="story"/g)?.length, 2);
	assert.doesNotMatch(source, /story-copy/);
	assert.match(source, /gap:\s*0/);
	assert.match(source, /object-fit:\s*cover/);
	assert.match(source, /\.story-cycle-cell\s*\{[^}]*border-radius:\s*0/s);
	assert.match(source, /--story-band-inset:/);
	assert.match(
		source,
		/\.story-cycle\s*\{[^}]*top:\s*var\(--story-band-inset\)[^}]*bottom:\s*var\(--story-band-inset\)/s,
	);
	assert.doesNotMatch(source, /\.story-cycle\s*\{[^}]*inset:\s*0/s);
	assert.doesNotMatch(source, /data-story-frame-shell/);
	assert.doesNotMatch(source, /data-story-finale-gradient/);
	assert.doesNotMatch(source, /filter:\s*blur/);
	assert.match(source, /@media \(max-width:\s*900px\)/);
});

test("story controller follows the reference GSAP ScrollTrigger lifecycle", async () => {
	const source = await readFile(componentUrl, "utf8");

	assert.match(source, /import\("gsap"\)/);
	assert.match(source, /import\("gsap\/ScrollTrigger"\)/);
	assert.match(source, /registerPlugin\(ScrollTrigger\)/);
	assert.match(source, /id:\s*"charlore-story-shrink"/);
	assert.match(source, /scrub:\s*0\.4/);
	assert.match(source, /id:\s*"charlore-story-scenes-pin"/);
	assert.match(source, /pin:\s*true/);
	assert.match(source, /pinSpacing:\s*false/);
	assert.match(source, /anticipatePin:\s*1/);
	assert.match(source, /invalidateOnRefresh:\s*true/);
	assert.match(source, /repeat:\s*-1,\s*paused:\s*true/);
	assert.match(source, /xPercent:\s*-50/);
	assert.match(source, /setCycleStanding/);
	assert.match(
		source,
		/gsap\.to\(cycleLayer,\s*\{[^}]*rotationX:\s*0[^}]*onComplete:/s,
	);
	assert.doesNotMatch(
		source,
		/gsap\.set\(cycleLayer,\s*\{[^}]*rotationX:\s*0/s,
	);
	assert.match(source, /const aquariumScene/);
	assert.match(source, /quickSetter/);
	assert.match(source, /gsap\.ticker\.add/);
	assert.match(source, /gsap\.ticker\.remove/);
	assert.match(source, /getSmoothedHomeTilt/);
	assert.doesNotMatch(source, /quickTo/);
	assert.doesNotMatch(source, /tiltResetTimer/);
	assert.match(source, /getHomeSceneFrame/);
	assert.match(source, /getHomeStoryDistance/);
	assert.match(source, /getHomeAfterglowFrame/);
	assert.match(source, /getAquariumOwner/);
	assert.match(source, /scenePhaseStarted/);
	assert.match(
		source,
		/onToggle:[\s\S]*?renderScenes\(self\.progress,[^)]*\)[\s\S]*?gsap\.set\(viewport,\s*\{\s*autoAlpha:\s*1\s*\}\)/,
	);
	assert.match(source, /const finaleBounds =/);
	assert.match(
		source,
		/gsap\.set\(finalePortal,\s*\{[^}]*width:\s*finale\.width/s,
	);
	assert.doesNotMatch(source, /clipPath/);
	assert.match(source, /data-story-final-frame/);
	assert.match(source, /window\.scrollTo/);
	assert.match(
		source,
		/guideScrollTo\(pinTrigger\.end\s*\+\s*window\.innerHeight,\s*1\.1\)/,
	);
	assert.match(
		source,
		/document\.documentElement\.style\.scrollBehavior\s*=\s*"auto"/,
	);
	assert.match(source, /restoreGuidedScrollBehavior/);
	assert.match(source, /onComplete:\s*restoreGuidedScrollBehavior/);
	assert.match(source, /onInterrupt:\s*restoreGuidedScrollBehavior/);
	assert.match(source, /pinTrigger\.end\s*\+\s*window\.innerHeight/);
	assert.match(source, /AbortController/);
	assert.match(source, /\.kill\(\)/);
	assert.doesNotMatch(source, /astro:page-load/);
	assert.doesNotMatch(source, /swup:contentReplaced/);
	assert.match(source, /__charloreHomeStoryActivate/);
	assert.match(
		source,
		/else\s*\{\s*scenePhaseStarted\s*=\s*true;[\s\S]*?setCycleStanding\(false\);[\s\S]*?syncForegroundOwnership\(1,\s*true\);[\s\S]*?gsap\.set\(viewport,\s*\{\s*autoAlpha:\s*0\s*\}\);[\s\S]*?renderScenes\(1,\s*0\);/,
	);
	assert.match(
		source,
		/gsap\.set\(finaleImage,\s*\{\s*autoAlpha:\s*afterglow\.imageOpacity/s,
	);
	assert.match(source, /--story-finale-mask-start/);
	assert.match(source, /afterglow\.maskStartPercent/);
	assert.match(
		source,
		/if\s*\(!standing\)[\s\S]*gsap\.to\(cycleLayer,[\s\S]*yPercent:\s*-12[\s\S]*autoAlpha:\s*0[\s\S]*duration:\s*0\.22[\s\S]*onComplete:/,
	);
	assert.doesNotMatch(
		source,
		/if\s*\(!standing\)[\s\S]*gsap\.to\(cycleLayer,[\s\S]*rotationX:\s*88[\s\S]*duration:\s*0\.38/,
	);
	assert.match(
		source,
		/\.story-finale-portal\s*\{[^}]*background:\s*transparent/s,
	);
	assert.doesNotMatch(
		source,
		/\.story-finale-portal\s*\{[^}]*background:\s*var\(--page-bg\)/s,
	);
	assert.match(
		source,
		/mask-image:\s*linear-gradient\([^;]*--story-finale-mask-start/s,
	);
});

test("homepage down arrow hands desktop story control to its shrink endpoint", async () => {
	const source = await readFile(scrollIndicatorUrl, "utf8");

	assert.match(source, /data-home-scroll-story/);
	assert.match(source, /window\.innerWidth\s*>\s*900/);
	assert.match(
		source,
		/window\.scrollY\s*\+\s*story\.getBoundingClientRect\(\)\.top\s*\+\s*1/,
	);
	assert.doesNotMatch(source, /story\.scrollIntoView/);
	assert.match(source, /main-grid/);
});

test("desktop story keeps the deepest wallpaper sharp while it owns the scroll", async () => {
	const source = await readFile(wallpaperUtilsUrl, "utf8");

	assert.match(
		source,
		/document\.querySelector\("\[data-home-scroll-story\]"\)/,
	);
	assert.match(source, /isHome[^\n]*hasHomeScrollStory/s);
	assert.match(source, /setBlurIfChanged\(wrapper,\s*"0px"\)/);
});

test("desktop homepage places normal Firefly content after the story", async () => {
	const [layout, layoutStyle, sidebarConfig] = await Promise.all([
		readFile(layoutUrl, "utf8"),
		readFile(layoutStyleUrl, "utf8"),
		readFile(sidebarConfigUrl, "utf8"),
	]);

	assert.match(layout, /import HomeScrollStory/);
	assert.match(layout, /<HomeScrollStory\s*\/>/);
	assert.doesNotMatch(layout, /isHomePageCheck\s*&&\s*<HomeScrollStory\s*\/>/);
	assert.match(
		layoutStyle,
		/--content-top:\s*calc\(100vh\s*\+\s*var\(--home-story-height,\s*0px\)\)/,
	);
	assert.match(sidebarConfig, /enable:\s*true/);
});

test("the first wheel motion shrinks the original card with one transform scale", async () => {
	const source = await readFile(componentUrl, "utf8");

	assert.match(
		source,
		/id:\s*"charlore-story-shrink"[\s\S]*?start:\s*"top bottom"/,
	);
	assert.match(
		source,
		/\.fromTo\(\s*heroShell,[\s\S]*?x:\s*\(\)\s*=>\s*foregroundTransform\(\)\.x,[\s\S]*?y:\s*\(\)\s*=>\s*foregroundTransform\(\)\.y,[\s\S]*?scale:\s*\(\)\s*=>\s*foregroundTransform\(\)\.scale,[\s\S]*?ease:\s*"power3\.out"/,
	);
	assert.match(source, /getHomeForegroundTransform/);
	assert.match(
		source,
		/id:\s*"charlore-story-scenes-pin"[\s\S]*?start:\s*"top 1px"/,
	);
	assert.match(source, /getHomeStorySceneGeometry/);
	assert.match(source, /--home-story-scene-width/);
});

test("homepage labels stay above the unreparented hero while both story cards share hover tilt", async () => {
	const [story, backdrop, tiltCard, indicator] = await Promise.all([
		readFile(componentUrl, "utf8"),
		readFile(
			new URL("./HomeWaterGardenBackdrop.astro", import.meta.url),
			"utf8",
		),
		readFile(tiltCardUrl, "utf8"),
		readFile(scrollIndicatorUrl, "utf8"),
	]);

	assert.doesNotMatch(story, /root\.append\(heroShell\)/);
	assert.match(backdrop, /\.garden-character\s*\{[^}]*z-index:\s*4/s);
	assert.match(tiltCard, /\.home-tilt-card-shell\s*\{[^}]*z-index:\s*2/s);
	assert.match(indicator, /id="scroll-down-indicator"/);
	assert.match(
		tiltCard,
		/querySelectorAll<HTMLElement>\("\[data-home-tilt-card\]"\)/,
	);
	assert.match(tiltCard, /card\.addEventListener\("pointermove"/);
	assert.match(tiltCard, /\.home-tilt-card-shell--story\s*\{[^}]*inset:\s*0/s);
});

test("desktop-only template mounting initializes tilt behavior after insertion", async () => {
	const [story, tiltCard] = await Promise.all([
		readFile(componentUrl, "utf8"),
		readFile(tiltCardUrl, "utf8"),
	]);

	assert.match(story, /charlore:home-tilt-mounted/);
	assert.match(tiltCard, /charlore:home-tilt-mounted/);
});

test("the final portal overtakes the first story card during expansion", async () => {
	const source = await readFile(componentUrl, "utf8");

	assert.match(source, /\.story-scene-aquarium\s*\{[^}]*z-index:\s*3/s);
	assert.match(source, /\.story-scene-final\s*\{[^}]*z-index:\s*4/s);
	assert.match(source, /\.story-finale-portal\s*\{[^}]*z-index:\s*30/s);
});

test("guided completion moves at constant speed and the reverse stand stays fixed in the viewport", async () => {
	const source = await readFile(componentUrl, "utf8");

	assert.match(
		source,
		/const guideScrollTo[\s\S]*?gsap\.to\(scrollPosition,[\s\S]*?ease:\s*"none"/,
	);
	assert.match(
		source,
		/guideScrollTo\(pinTrigger\.end\s*\+\s*window\.innerHeight,\s*1\.1\)/,
	);
	assert.match(source, /is-cycle-exit-locked/);
	assert.match(
		source,
		/\.story-scenes-viewport\.is-cycle-exit-locked\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0/s,
	);
});

test("reverse exit keeps the foreground until the carousel finishes fading upward", async () => {
	const source = await readFile(componentUrl, "utf8");
	const reverseStart = source.indexOf("} else if (self.progress <= 0) {");
	const reverseEnd = source.indexOf("\n\t\t\t\t} else {", reverseStart);
	const reverseBranch = source.slice(reverseStart, reverseEnd);
	const exitCall = reverseBranch.indexOf("setCycleStanding(false, true");

	assert.ok(reverseStart >= 0, "reverse pin-exit branch should exist");
	assert.ok(
		reverseEnd > reverseStart,
		"reverse pin-exit branch should be bounded",
	);
	assert.ok(exitCall >= 0, "reverse exit should animate the carousel fade");
	assert.ok(
		reverseBranch.indexOf("scenePhaseStarted = false") > exitCall,
		"scene phase must stay active until the fade callback",
	);
	assert.ok(
		reverseBranch.indexOf("syncForegroundOwnership(1, false)") > exitCall,
		"foreground ownership must switch only after the fade callback",
	);
});

test("returning home at the top clears stale hero shrink before the story is shown", async () => {
	const source = await readFile(componentUrl, "utf8");
	const refreshIndex = source.indexOf("ScrollTrigger.refresh();");
	const topResetIndex = source.indexOf(
		"if (window.scrollY <= 1)",
		refreshIndex,
	);

	assert.ok(refreshIndex >= 0, "story should refresh its scroll geometry");
	assert.ok(topResetIndex > refreshIndex, "top reset must run after refresh");
	assert.match(
		source.slice(topResetIndex, topResetIndex + 500),
		/shrinkTimeline\.progress\(0\)[\s\S]*?x:\s*0[\s\S]*?y:\s*0[\s\S]*?scale:\s*1[\s\S]*?autoAlpha:\s*1/,
	);
});

test("the finale expands both navbar capsules and restores scroll control on reverse", async () => {
	const [story, navbar, compactState] = await Promise.all([
		readFile(componentUrl, "utf8"),
		readFile(navbarUrl, "utf8"),
		readFile(navbarCompactStateUrl, "utf8"),
	]);

	assert.match(story, /data-home-story-nav-expanded/);
	assert.match(story, /charlore:home-story-nav-state/);
	assert.match(story, /finaleProgressCurrent\s*>=\s*0\.98/);
	assert.match(navbar, /data-home-story-nav-expanded/);
	assert.match(navbar, /replaceNavbarCompactHandler/);
	assert.match(compactState, /charlore:home-story-nav-state/);
});

test("dark homepage and story foreground use the same card crop contract", async () => {
	const [story, tiltCard, variables] = await Promise.all([
		readFile(componentUrl, "utf8"),
		readFile(tiltCardUrl, "utf8"),
		readFile(variablesStyleUrl, "utf8"),
	]);

	assert.match(story, /<HomeTiltImageCard variant="story"/);
	assert.doesNotMatch(story, /story-theme-image-dark/);
	assert.doesNotMatch(story, /home-story-dark-image-position/);
	assert.doesNotMatch(story, /getStableCoverObjectPosition/);
	assert.match(tiltCard, /home-starlight-dark-wide\.png/);
	assert.match(
		tiltCard,
		/\.home-tilt-card-image-dark\s*\{[^}]*object-position:\s*center top\s*!important/s,
	);
	assert.doesNotMatch(variables, /--home-dark-image-position:/);
	assert.match(variables, /--home-image-frame-inset:/);
	assert.match(
		tiltCard,
		/\.home-tilt-card-frame\s*\{[^}]*inset:\s*var\(--home-image-frame-inset\)/s,
	);
	assert.doesNotMatch(tiltCard, /\.home-tilt-card-shell\.is-story-foreground/);
});

test("the final foreground keeps its top focal area and both story frames stay visually light", async () => {
	const [story, tiltCard] = await Promise.all([
		readFile(componentUrl, "utf8"),
		readFile(tiltCardUrl, "utf8"),
	]);

	assert.match(story, /home-story-final-wide\.png/);
	assert.match(story, /imagePosition="center top"/);
	assert.match(
		tiltCard,
		/\.home-tilt-card-image-single\s*\{[^}]*object-position:\s*var\(--home-card-image-position, center\)\s*!important/s,
	);
	assert.match(
		tiltCard,
		/\.home-tilt-card-shell--story\s*\{[^}]*--home-image-frame-inset:\s*clamp\(0\.22rem, 0\.35vw, 0\.38rem\)/s,
	);
	assert.match(
		tiltCard,
		/\.home-tilt-card-shell--story\s*\{[^}]*--home-card-shadow:/s,
	);
});

test("shared component surfaces inherit the complete navbar palette and UI font tokens", async () => {
	const [mainStyle, navbarStyle] = await Promise.all([
		readFile(mainStyleUrl, "utf8"),
		readFile(navbarStyleUrl, "utf8"),
	]);

	assert.match(navbarStyle, /--charlore-ui-glass-background:/);
	assert.match(navbarStyle, /--charlore-ui-glass-filter:/);
	assert.match(navbarStyle, /--charlore-ui-font:/);
	assert.match(
		mainStyle,
		/:is\(\.card-base,\s*\.card-base-transparent,\s*\.float-panel\)[\s\S]*?var\(--charlore-ui-glass-background\)/,
	);
	assert.match(mainStyle, /font-family:\s*var\(--charlore-ui-font\)/);
	assert.match(
		mainStyle,
		/html\[data-wallpaper-mode="fullscreen"\][\s\S]*?--primary:\s*var\(--charlore-nav-text\)/,
	);
	assert.match(mainStyle, /--btn-content:\s*var\(--charlore-nav-text\)/);
	assert.match(mainStyle, /--btn-regular-bg:\s*var\(--charlore-nav-slider\)/);
	assert.match(
		mainStyle,
		/:is\(\.card-base,\s*\.card-base-transparent,\s*\.float-panel\)[\s\S]*?color:\s*var\(--charlore-nav-text\)/,
	);
});
