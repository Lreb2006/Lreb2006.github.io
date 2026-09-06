import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const postCardUrl = new URL("./PostCard.astro", import.meta.url);
const navbarUrl = new URL("./Navbar.astro", import.meta.url);
const compactSearchUrl = new URL("../controls/Search.svelte", import.meta.url);
const advancedSearchUrl = new URL(
	"../pages/AdvancedSearch.svelte",
	import.meta.url,
);
const searchPageUrl = new URL("../../pages/search.astro", import.meta.url);

test("the post card lift moves a neutral wrapper instead of the glass layer", async () => {
	const source = await readFile(postCardUrl, "utf8");
	const hoverBlock = source.match(
		/\.post-card-motion:hover\s*\{(?<body>[^}]*)\}/,
	)?.groups?.body;
	const itemShell = source.indexOf('"post-card-item-shell"');
	const motionWrapper = source.indexOf('"post-card-motion"');
	const glassLayer = source.indexOf('"post-card-wrapper"', motionWrapper);

	assert.ok(
		itemShell >= 0,
		"layout and entrance state must stay on an outer shell",
	);
	assert.ok(
		motionWrapper > itemShell,
		"post card must expose a neutral motion wrapper",
	);
	assert.ok(
		glassLayer > motionWrapper,
		"glass layer must be nested in the wrapper",
	);
	assert.ok(hoverBlock, "motion wrapper hover rule must exist");
	assert.match(hoverBlock, /top:\s*-4px/);
	assert.doesNotMatch(hoverBlock, /transform:/);
	assert.doesNotMatch(
		source,
		/\.post-card-wrapper:hover\s*\{[^}]*\b(?:top|transform):/s,
	);
	assert.doesNotMatch(
		source,
		/\.post-card-item-shell\s*\{[^}]*animation-fill-mode:\s*backwards/s,
		"the card shell must not return to the global opacity: 0 state after its entrance animation",
	);
});

test("development search uses real post metadata instead of template fake results", async () => {
	const [navbar, compactSearch, advancedSearch, searchPage] = await Promise.all(
		[
			readFile(navbarUrl, "utf8"),
			readFile(compactSearchUrl, "utf8"),
			readFile(advancedSearchUrl, "utf8"),
			readFile(searchPageUrl, "utf8"),
		],
	);

	for (const source of [compactSearch, advancedSearch]) {
		assert.doesNotMatch(
			source,
			/fakeResult|Fake Search Result|Dev Mode Search Result/,
		);
		assert.match(source, /searchLocalPosts/);
		assert.match(source, /localEntries/);
	}
	assert.match(navbar, /localSearchEntries/);
	assert.match(navbar, /<Search[\s\S]*?localEntries=\{localSearchEntries\}/);
	assert.match(searchPage, /localSearchEntries/);
	assert.match(
		searchPage,
		/<AdvancedSearch[\s\S]*?localEntries=\{localSearchEntries\}/,
	);
});
