import assert from "node:assert/strict";
import test from "node:test";
import * as navbarUtils from "./navbar-i18n";

test("article detail and paginated article routes keep the Articles nav item active", () => {
	const isNavbarLinkActive = (
		navbarUtils as typeof navbarUtils & {
			isNavbarLinkActive?: (currentPath: string, linkPath: string) => boolean;
		}
	).isNavbarLinkActive;

	assert.equal(typeof isNavbarLinkActive, "function");
	if (!isNavbarLinkActive) return;

	assert.equal(isNavbarLinkActive("/posts/firefly-test/", "/articles/"), true);
	assert.equal(isNavbarLinkActive("/articles/2/", "/articles/"), true);
	assert.equal(isNavbarLinkActive("/posts/firefly-test/", "/"), false);
	assert.equal(isNavbarLinkActive("/archive/", "/archive/"), true);
	assert.equal(isNavbarLinkActive("/about/", "/articles/"), false);
});
