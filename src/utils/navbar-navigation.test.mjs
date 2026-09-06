import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import {
	replaceNavbarCompactHandler,
	resolveNavbarCompactState,
} from "./navbar-compact-state.ts";

// Execute the production component, settings entry and registered Swup hooks.
// Only the DOM geometry, browser scrolling and unrelated page widgets are doubles.
function runSource(context, source) {
	const file = ts.createSourceFile("fixture.ts", source, ts.ScriptTarget.Latest);
	const printer = ts.createPrinter();
	const withoutImports = file.statements
		.filter((node) => !ts.isImportDeclaration(node))
		.map((node) => printer.printNode(ts.EmitHint.Unspecified, node, file))
		.join("\n");
	vm.runInContext(
		ts.transpileModule(withoutImports, {
			compilerOptions: { module: ts.ModuleKind.CommonJS },
		}).outputText,
		context,
	);
}

function classes(...initial) {
	const values = new Set(initial);
	return {
		contains: (value) => values.has(value),
		add: (...items) => items.forEach((item) => values.add(item)),
		remove: (...items) => items.forEach((item) => values.delete(item)),
		toggle(value, force = !values.has(value)) {
			force ? values.add(value) : values.delete(value);
			return force;
		},
	};
}

function fixture() {
	const listeners = new Map();
	const hooks = {
		on(name, callback) {
			const entry = listeners.get(name) ?? { before: [], after: [] };
			entry.after.push(callback);
			listeners.set(name, entry);
		},
		before(name, callback) {
			const entry = listeners.get(name) ?? { before: [], after: [] };
			entry.before.push(callback);
			listeners.set(name, entry);
		},
		callSync(name, visit, args, action = () => {}) {
			const entry = listeners.get(name);
			for (const callback of entry?.before ?? []) callback(visit, args);
			const result = action(visit, args);
			for (const callback of entry?.after ?? []) callback(visit, args);
			return result;
		},
	};
	const root = {
		classList: classes(),
		style: { setProperty() {} },
		getAttribute: (name) => name === "data-wallpaper-mode" ? "fullscreen" : null,
		setAttribute() {},
		hasAttribute: () => false,
		scrollTop: 600,
	};
	const body = { classList: classes() };
	const left = { dataset: { expandedWidth: "160" }, style: {} };
	const right = { dataset: { expandedWidth: "140" }, style: {} };
	const parts = {
		".charlore-nav-shell": { getBoundingClientRect: () => ({ left: 0, width: 1200 }) },
		".charlore-nav-menu": { getBoundingClientRect: () => ({ left: 300, right: 900 }) },
		".charlore-nav-brand": left,
		".charlore-nav-actions": right,
	};
	const attributes = new Map([["data-transparent-mode", "none"]]);
	const navbar = {
		classList: classes(),
		style: { setProperty() {} },
		dataset: {},
		getAttribute: (name) => attributes.get(name),
		setAttribute: (name, value) => attributes.set(name, value),
		querySelector: (selector) => parts[selector],
	};
	const document = Object.assign(new EventTarget(), {
		documentElement: root,
		body,
		readyState: "complete",
		getElementById: (id) => id === "navbar" ? navbar : null,
		querySelector: (selector) => selector === "body" ? body : null,
	});
	const window = Object.assign(new EventTarget(), {
		location: { pathname: "/posts/firefly-full-feature-test/" },
		innerWidth: 1440,
		innerHeight: 900,
		pageYOffset: 600,
		matchMedia: () => ({ matches: false }),
		swup: { hooks },
	});
	let pendingSmoothScroll = false;
	window.scrollTo = (options) => {
		// CSSOM behavior: auto follows the computed scroll-behavior: smooth.
		if (options.behavior === "instant") {
			window.pageYOffset = root.scrollTop = options.top;
			pendingSmoothScroll = false;
		} else {
			pendingSmoothScroll = true;
		}
	};
	const frames = [];
	const context = vm.createContext({
		exports: {}, window, document, Event,
		replaceNavbarCompactHandler, resolveNavbarCompactState,
		requestAnimationFrame: (callback) => frames.push(callback),
		getComputedStyle: () => ({ fontSize: "16px" }),
		setTimeout: () => {},
		localStorage: { getItem: () => "light" },
		siteConfig: { navbar: {}, themeColor: {} },
		expressiveCodeConfig: { lightTheme: undefined },
		backgroundWallpaper: { fullscreen: { navbar: { dynamicTransparent: true } } },
		WALLPAPER_FULLSCREEN: "fullscreen", WALLPAPER_BANNER: "banner",
		WALLPAPER_NONE: "none", WALLPAPER_OVERLAY: "overlay",
		checkIsHomePage: (path) => path === "/",
		pathsEqual: (a, b) => a === b,
		url: (path) => path,
		isBannerMode: () => false,
		initializeFloatingPanels() {}, scheduleContentOverflowEnhancements() {},
		updateMainGridCols() {}, updateSidebarComponentsVisibility() {},
		updateFullscreenTitleParallax() {}, syncFullscreenOverlays() {},
		syncFullscreenBlur() {}, syncBannerHomeTextVisibility() {}, scrollFunction() {},
	});
	const component = readFileSync(new URL("../components/layout/Navbar.astro", import.meta.url), "utf8");
	const componentStart = component.indexOf("function updateCharloreCompactLayout(");
	runSource(context, component.slice(componentStart, component.indexOf("</script>", componentStart)));
	const settings = readFileSync(new URL("./setting-utils.ts", import.meta.url), "utf8");
	const settingsStart = settings.indexOf("export function updateNavbarTransparency(");
	const settingsEnd = settings.indexOf("\nexport ", settingsStart + 1);
	runSource(context, settings.slice(settingsStart, settingsEnd < 0 ? undefined : settingsEnd));
	runSource(context, readFileSync(new URL("./swup-transitions.ts", import.meta.url), "utf8"));
	context.exports.setupSwupTransitions();
	runSource(context, readFileSync(new URL("../../node_modules/.pnpm/swup@4.9.2/node_modules/swup/src/modules/scrollToContent.ts", import.meta.url), "utf8"));
	return {
		context, window, root, navbar, left, right, hooks,
		pendingSmoothScroll: () => pendingSmoothScroll,
		flush: () => { while (frames.length) frames.shift()(); },
	};
}

test("the actual article entry shrinks capsules despite transparent mode none", () => {
	const f = fixture();
	f.context.exports.updateNavbarTransparency("fullscreen");
	assert.equal(f.navbar.getAttribute("data-transparent-mode"), "none");
	assert.equal(f.navbar.classList.contains("scrolled"), true);
	assert.ok(Math.abs(Number.parseFloat(f.left.style.left) - 250.4) < 0.001);
	assert.equal(f.right.style.left, "908px");
	f.window.pageYOffset = f.root.scrollTop = 0;
	f.window.dispatchEvent(new Event("scroll"));
	f.flush();
	assert.equal(f.navbar.classList.contains("scrolled"), false);
	assert.equal(f.left.style.left, "0px");
});

test("article to home finishes Swup scrolling before starting the home story", () => {
	const f = fixture();
	let storyStartedAt;
	f.window.__charloreHomeStoryDeactivate = () => {};
	f.window.__charloreHomeStoryActivate = () => { storyStartedAt = f.window.pageYOffset; };
	f.root.classList.add("is-page-transitioning");
	const visit = { to: { url: "/", hash: "" }, scroll: { reset: true } };
	f.hooks.callSync("visit:start", visit);
	f.window.location.pathname = "/";
	f.context.exports.scrollToContent.call({ hooks: f.hooks }, visit);
	f.hooks.callSync("page:view", visit);
	f.hooks.callSync("visit:end", visit);
	f.flush();
	assert.equal(f.pendingSmoothScroll(), false, "route reset must not leave a smooth scroll running");
	assert.equal(storyStartedAt, 0, "home story must receive the new page's scroll position");
	assert.equal(f.navbar.classList.contains("scrolled"), false);
	assert.equal(f.left.style.left, "0px");
	assert.equal(f.right.style.left, "1060px");
});
