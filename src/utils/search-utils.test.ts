import assert from "node:assert/strict";
import test from "node:test";

type SearchModule = typeof import("./search-utils");
let searchModule: Partial<SearchModule> = {};

try {
	searchModule = await import("./search-utils");
} catch {
	// The first RED run intentionally reaches this branch before the module exists.
}

const entries = [
	{
		url: "/posts/firefly-test/",
		title: "Firefly 全功能测试",
		description: "检验排版、图片与代码组件",
		category: "功能测试",
		tags: ["Firefly", "MDX"],
	},
	{
		url: "/posts/reading-notes/",
		title: "读书笔记",
		description: "普通阅读记录",
		category: "阅读",
		tags: ["随笔"],
	},
];

test("local development search returns matching real posts only", () => {
	const searchLocalPosts = searchModule.searchLocalPosts;
	assert.equal(typeof searchLocalPosts, "function");
	if (!searchLocalPosts) return;

	assert.deepEqual(
		searchLocalPosts(entries, "Firefly").map((item) => item.url),
		["/posts/firefly-test/"],
	);
	assert.deepEqual(
		searchLocalPosts(entries, "阅读").map((item) => item.url),
		["/posts/reading-notes/"],
	);
	assert.deepEqual(searchLocalPosts(entries, "不存在"), []);
	assert.deepEqual(searchLocalPosts(entries, "   "), []);
});

test("the compact search only shows no-results after a non-empty query", () => {
	const shouldShowNoResults = searchModule.shouldShowNoResults;
	assert.equal(typeof shouldShowNoResults, "function");
	if (!shouldShowNoResults) return;

	assert.equal(shouldShowNoResults("", 0, false), false);
	assert.equal(shouldShowNoResults("   ", 0, false), false);
	assert.equal(shouldShowNoResults("文章", 0, false), true);
	assert.equal(shouldShowNoResults("文章", 1, false), false);
	assert.equal(shouldShowNoResults("文章", 0, true), false);
});
