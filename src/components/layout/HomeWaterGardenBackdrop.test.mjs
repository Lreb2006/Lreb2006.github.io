import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL(
	"./HomeWaterGardenBackdrop.astro",
	import.meta.url,
);
const wallpaperConfigUrl = new URL(
	"../../config/backgroundWallpaper.ts",
	import.meta.url,
);
const layoutStylesUrl = new URL(
	"../../styles/layout-styles.css",
	import.meta.url,
);
const themeVariablesUrl = new URL(
	"../../styles/variables.styl",
	import.meta.url,
);

test("mobile homepage uses theme-specific artwork as the full background", async () => {
	const source = await readFile(componentUrl, "utf8");

	assert.match(source, /mobile-home-art-light/);
	assert.match(source, /mobile-home-art-dark/);
	assert.match(source, /import ImageWrapper/);
	assert.match(source, /widths=\{\[320, 480, 640, 828\]\}/);
	assert.match(source, /loading="lazy"/);
	assert.match(source, /fetchpriority="high"/);
	assert.match(source, /object-fit:\s*cover/);
	assert.doesNotMatch(source, /background-image:\s*url/);
	assert.doesNotMatch(source, /<img[\s\S]*?mobile-home-art-image/);
	assert.match(
		source,
		/@media \(max-width:\s*900px\)[\s\S]*?\.home-tilt-card-shell[\s\S]*?display:\s*none/,
	);
	assert.match(
		source,
		/:global\(html\.dark\)[\s\S]*?\.mobile-home-art-light[\s\S]*?display:\s*none/,
	);
	assert.match(
		source,
		/:global\(html\.dark\)[\s\S]*?\.mobile-home-art-dark[\s\S]*?display:\s*block/,
	);
	assert.match(
		source,
		/@media \(max-width:\s*900px\)[\s\S]*?\.garden-celestial-field,[\s\S]*?\.dark-starlight-layer,[\s\S]*?\.garden-editorial-layer[\s\S]*?display:\s*none/,
	);

	await access(
		new URL(
			"../../assets/images/charlore/mobile-home-light.webp",
			import.meta.url,
		),
	);
	await access(
		new URL(
			"../../assets/images/charlore/mobile-home-dark.webp",
			import.meta.url,
		),
	);
});

test("mobile title stays viewport-centered while the jellyfish sits to its left", async () => {
	const source = await readFile(componentUrl, "utf8");

	assert.match(
		source,
		/import TypewriterText from "@\/components\/features\/TypewriterText\.astro"/,
	);
	assert.match(source, /class="mobile-home-quote"/);
	assert.match(source, /<TypewriterText/);
	assert.match(source, /text=\{mobileQuotes\}/);
	assert.match(source, /top:\s*50%/);
	assert.match(source, /grid-template-columns:\s*1fr auto 1fr/);
	assert.match(source, /\.garden-pool[\s\S]*?grid-column:\s*1/);
	assert.match(source, /\.garden-wordmark[\s\S]*?grid-column:\s*2/);
});

test("jellyfish is fully opaque on every viewport", async () => {
	const source = await readFile(componentUrl, "utf8");

	assert.match(source, /\.garden-jellyfish\s*\{[^}]*opacity:\s*1\s*;/);
});

test("mobile title offset layers overlap more closely in both themes", async () => {
	const source = await readFile(componentUrl, "utf8");

	assert.match(
		source,
		/@media \(max-width:\s*900px\)[\s\S]*?\.home-water-garden-name::before\s*\{[^}]*transform:\s*translate\(3px, -3px\)/,
	);
	assert.match(
		source,
		/@media \(max-width:\s*900px\)[\s\S]*?\.home-water-garden-name::after\s*\{[^}]*transform:\s*translate\(-2px, 3px\)[^}]*opacity:\s*0\.56/,
	);
});

test("mobile light title keeps its foreground with layered pink shadows and hollow offsets", async () => {
	const source = await readFile(componentUrl, "utf8");
	const mobileLightTitle =
		source.match(
			/:global\(html:not\(\.dark\)\) \.home-water-garden-name\s*\{([^}]*)\}/,
		)?.[1] ?? "";
	const mobileLightOffsets =
		source.match(
			/:global\(html:not\(\.dark\)\) \.home-water-garden-name::before,[\s\S]*?:global\(html:not\(\.dark\)\) \.home-water-garden-name::after\s*\{([^}]*)\}/,
		)?.[1] ?? "";

	assert.match(
		source,
		/\.home-water-garden-name\s*\{[^}]*color:\s*rgba\(244, 247, 241, 0\.95\)/,
	);
	assert.doesNotMatch(
		source,
		/@media \(max-width:\s*900px\)[\s\S]*?:global\(html:not\(\.dark\)\) \.home-water-garden-name\s*\{[^}]*color:/,
	);
	assert.match(
		mobileLightTitle,
		/-webkit-text-stroke:\s*0\.55px rgba\(222, 126, 166, 0\.66\)/,
	);
	assert.match(mobileLightTitle, /rgba\(211, 103, 151, 0\.58\)/);
	assert.match(mobileLightTitle, /rgba\(173, 71, 126, 0\.36\)/);
	assert.doesNotMatch(
		mobileLightTitle,
		/rgba\((?:62, 103, 119|117, 186, 188|15, 52, 77)/,
	);
	assert.match(mobileLightOffsets, /color:\s*transparent/);
	assert.match(
		mobileLightOffsets,
		/-webkit-text-stroke:\s*1px rgba\(243, 185, 210, 0\.88\)/,
	);
	assert.match(mobileLightOffsets, /mix-blend-mode:\s*normal/);
	assert.match(
		source,
		/:global\(html:not\(\.dark\)\) \.home-water-garden-name span\s*\{[^}]*filter:\s*drop-shadow\(0 0 3px rgba\(243, 185, 210, 0\.6\)\)/,
	);
	assert.match(
		source,
		/:global\(html:not\(\.dark\)\) \.home-water-garden-name::after\s*\{[^}]*mix-blend-mode:\s*screen[^}]*opacity:\s*0\.56/,
	);
	assert.doesNotMatch(
		source,
		/:global\(html:not\(\.dark\)\) \.home-water-garden-name::after\s*\{[^}]*filter:/,
	);
});

test("light page background and its waves use sakura pink", async () => {
	const source = await readFile(themeVariablesUrl, "utf8");

	assert.match(source, /:root[\s\S]*?--page-bg:\s*#FEDFE1/);
	assert.match(source, /:root\.dark[\s\S]*?--page-bg:\s*#0d1b2b/);
});

test("Firefly waves render on the mobile fullscreen homepage", async () => {
	const [configSource, stylesSource] = await Promise.all([
		readFile(wallpaperConfigUrl, "utf8"),
		readFile(layoutStylesUrl, "utf8"),
	]);

	assert.match(
		configSource,
		/waves:\s*\{[\s\S]*?desktop:\s*false,[\s\S]*?mobile:\s*true/,
	);
	assert.match(
		stylesSource,
		/@media \(max-width:\s*900px\)[\s\S]*?body\.is-home[\s\S]*?#header-waves\.waves[\s\S]*?display:\s*block\s*!important/,
	);
	assert.match(
		stylesSource,
		/@media \(max-width:\s*900px\)[\s\S]*?body\.is-home\s+#wallpaper-wrapper\s*\{[\s\S]*?position:\s*absolute\s*!important[\s\S]*?height:\s*100vh\s*!important/,
	);
	assert.match(
		stylesSource,
		/#header-waves\.waves\s*\{[\s\S]*?bottom:\s*-1px\s*!important[\s\S]*?height:\s*13vh\s*!important[\s\S]*?min-height:\s*100px\s*!important[\s\S]*?max-height:\s*176px\s*!important/,
	);
});
