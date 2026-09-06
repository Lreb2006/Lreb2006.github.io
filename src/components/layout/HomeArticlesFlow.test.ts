import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import * as layoutUtils from "../../utils/layout-utils";
import * as urlUtils from "../../utils/url-utils";

const homepageUrl = new URL("../../pages/index.astro", import.meta.url);
const articlePageUrl = new URL(
	"../../pages/articles/[...page].astro",
	import.meta.url,
);
const legacyRootFeedUrl = new URL(
	"../../pages/[...page].astro",
	import.meta.url,
);

test("homepage and the complete article feed have separate routes", () => {
	assert.equal(existsSync(homepageUrl), true);
	assert.equal(existsSync(articlePageUrl), true);
	assert.equal(existsSync(legacyRootFeedUrl), false);
});

test("homepage recent posts keep source order and stop at five entries", () => {
	const selectRecentItems = (
		layoutUtils as typeof layoutUtils & {
			selectRecentItems?: <T>(items: T[], limit?: number) => T[];
		}
	).selectRecentItems;

	assert.equal(typeof selectRecentItems, "function");
	if (!selectRecentItems) return;

	assert.deepEqual(selectRecentItems([1, 2, 3, 4, 5, 6, 7]), [1, 2, 3, 4, 5]);
	assert.deepEqual(selectRecentItems([1, 2], 5), [1, 2]);
});

test("article pagination keeps every page below the article route", () => {
	const getPaginationPath = (
		urlUtils as typeof urlUtils & {
			getPaginationPath?: (basePath: string, page: number) => string;
		}
	).getPaginationPath;

	assert.equal(typeof getPaginationPath, "function");
	if (!getPaginationPath) return;

	assert.equal(getPaginationPath("/articles/", 1), "/articles/");
	assert.equal(getPaginationPath("/articles/", 2), "/articles/2/");
	assert.equal(getPaginationPath("/", 2), "/2/");
});
