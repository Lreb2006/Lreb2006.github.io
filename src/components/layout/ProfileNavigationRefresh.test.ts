import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { dynamicConfig } from "../../config/dynamicConfig";
import { fontConfig } from "../../config/fontConfig";
import { navBarConfig } from "../../config/navBarConfig";
import { profileConfig } from "../../config/profileConfig";
import { sidebarLayoutConfig } from "../../config/sidebarConfig";
import { siteConfig } from "../../config/siteConfig";

const layoutUrl = new URL(
	"../../layouts/MainGridLayout.astro",
	import.meta.url,
);
const profileUrl = new URL("../widget/Profile.astro", import.meta.url);
const variablesUrl = new URL("../../styles/variables.styl", import.meta.url);
const navbarStyleUrl = new URL("../../styles/navbar.css", import.meta.url);

test("sidebar omits the retired widgets on desktop and mobile", () => {
	const retiredTypes = new Set([
		"announcement",
		"categories",
		"tags",
		"stats",
		"siteInfo",
		"calendar",
	]);
	const configuredComponents = [
		...sidebarLayoutConfig.leftComponents,
		...sidebarLayoutConfig.rightComponents,
		...sidebarLayoutConfig.mobileBottomComponents,
	];

	assert.equal(
		configuredComponents.some(
			(component) => component.enable && retiredTypes.has(component.type),
		),
		false,
	);
	assert.equal(
		configuredComponents.some(
			(component) => component.enable && component.type === "profile",
		),
		false,
	);
});

test("navbar exposes flat article archive and musings destinations in order", () => {
	assert.equal(siteConfig.pages.dynamic, true);
	assert.equal(dynamicConfig.title, "碎碎念");
	assert.deepEqual(
		navBarConfig.links.map(({ name, url, children }) => ({
			name,
			url,
			hasChildren: Boolean(children?.length),
		})),
		[
			{ name: "主页", url: "/", hasChildren: false },
			{ name: "文章", url: "/articles/", hasChildren: false },
			{ name: "归档", url: "/archive/", hasChildren: false },
			{ name: "碎碎念", url: "/dynamic/", hasChildren: false },
			{ name: "关于我", url: "/about/", hasChildren: false },
		],
	);
});

test("round sans font is selected for the body and named interface regions", () => {
	assert.deepEqual(fontConfig.selected, ["--font-zen-maru-gothic"]);
	assert.equal(fontConfig.bannerTitleFont, "--font-zen-maru-gothic");
	assert.equal(fontConfig.bannerSubtitleFont, "--font-zen-maru-gothic");
	assert.equal(fontConfig.navbarTitleFont, "--font-zen-maru-gothic");
});

test("fullscreen glass interface inherits the same rounded font", async () => {
	const [variablesSource, navbarStyleSource] = await Promise.all([
		readFile(variablesUrl, "utf8"),
		readFile(navbarStyleUrl, "utf8"),
	]);
	const roundedFontAlias =
		/--charlore-ui-font:\s*var\(--font-zen-maru-gothic,\s*var\(--font-sans\)\)/;

	assert.match(variablesSource, roundedFontAlias);
	assert.match(navbarStyleSource, roundedFontAlias);
});

test("homepage renders one centered profile card with two external destinations", async () => {
	const [layoutSource, profileSource] = await Promise.all([
		readFile(layoutUrl, "utf8"),
		readFile(profileUrl, "utf8"),
	]);

	assert.deepEqual(
		profileConfig.links.map(({ name, icon, url }) => ({ name, icon, url })),
		[
			{
				name: "GitHub",
				icon: "fa7-brands:github",
				url: "https://github.com/",
			},
			{
				name: "Bilibili",
				icon: "fa7-brands:bilibili",
				url: "https://www.bilibili.com/",
			},
		],
	);
	assert.match(layoutSource, /isHomePageCheck\s*&&\s*<Profile/);
	assert.equal(layoutSource.match(/<Profile\b/g)?.length, 1);
	assert.match(profileSource, /data-profile-card/);
	assert.match(profileSource, /data-profile-avatar/);
	assert.match(profileSource, /data-profile-links/);
	assert.match(profileSource, /border-radius:\s*9999px/);
});

test("homepage profile lives inside the swup region so article navigation removes it", async () => {
	const layoutSource = await readFile(layoutUrl, "utf8");
	const swupStart = layoutSource.indexOf('id="swup-container"');
	const profilePosition = layoutSource.indexOf(
		'isHomePageCheck && <Profile class="onload-animation mb-4" />',
	);
	const swupEnd = layoutSource.indexOf("</main>", swupStart);

	assert.ok(swupStart >= 0);
	assert.ok(profilePosition > swupStart);
	assert.ok(profilePosition < swupEnd);
});
