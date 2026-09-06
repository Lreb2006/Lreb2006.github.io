import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { dev } from "astro";

const projectRoot = new URL("../../../", import.meta.url);
let server;
let baseUrl;

before(async () => {
	server = await dev({
		root: projectRoot,
		logLevel: "silent",
		server: { host: "127.0.0.1", port: 0 },
	});
	baseUrl = `http://127.0.0.1:${server.address.port}`;
});

after(async () => {
	await server?.stop();
});

const getHtml = async (pathname) => {
	const response = await fetch(`${baseUrl}${pathname}`);
	assert.equal(response.status, 200);
	return response.text();
};

const withoutTemplateContents = (html) =>
	html.replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, "");

const getWidthDescriptors = (value) =>
	[...value.matchAll(/(?:^|,\s*)[^,]+?\s+(\d+)w(?=,|$)/g)].map((match) =>
		Number(match[1]),
	);

test("mobile markup keeps desktop-only homepage originals inside inert templates", async () => {
	const html = withoutTemplateContents(await getHtml("/"));
	const rawImageTags = html.match(/<img\b[^>]*\bsrc="\/@fs\/[^>]+>/gi) ?? [];
	const rawSources = rawImageTags.join("\n");

	for (const filename of [
		"home-aquarium.webp",
		"home-starlight-dark-wide.png",
		"home-story-final-wide.png",
		"home-story-final-dark.png",
	]) {
		assert.doesNotMatch(rawSources, new RegExp(filename.replace(".", "\\.")));
	}
});

test("post covers offer several concrete widths instead of a single 828px candidate", async () => {
	const html = await getHtml("/");
	const coverSource = html.match(
		/<source\b[^>]*srcset="([^"]*cover\.png[^"]*)"[^>]*type="image\/webp"[^>]*>/i,
	)?.[1];

	assert.ok(coverSource, "homepage cover should emit a WebP source set");
	assert.deepEqual(getWidthDescriptors(coverSource), [320, 480, 640, 828]);
});

test("markdown images include a phone-sized source candidate", async () => {
	const html = await getHtml("/posts/firefly-full-feature-test/");
	const imageTag = html.match(
		/<img\b[^>]*alt="雨窗旁摆着钢笔、蕨叶与键盘的书桌"[^>]*>/i,
	)?.[0];

	assert.ok(imageTag, "test article image should be rendered");
	const srcset = imageTag.match(/\bsrcset="([^"]+)"/i)?.[1];
	assert.ok(srcset, "markdown image should emit a source set");
	const widths = getWidthDescriptors(srcset);
	assert.ok(widths.some((width) => width <= 480));
	assert.ok(widths.some((width) => width >= 828));
});

test("mobile homepage artwork uses responsive image markup with load-complete reveal", async () => {
	const html = await getHtml("/");
	const imageContainer = html.match(
		/<div\b[^>]*class="[^"]*mobile-home-art-image[^"]*"[^>]*>[\s\S]{0,3000}?<img\b[^>]*>/i,
	)?.[0];

	assert.ok(imageContainer, "mobile artwork container should be rendered");
	const imageTag = imageContainer.match(/<img\b[^>]*>/i)?.[0];
	assert.ok(imageTag, "mobile artwork should use an img element");
	assert.match(imageTag, /\bloading="lazy"/i);
	assert.match(imageTag, /\bfetchpriority="high"/i);
	assert.match(imageTag, /\bopacity-0\b/i);
	const srcset = imageTag.match(/\bsrcset="([^"]+)"/i)?.[1];
	assert.ok(srcset, "mobile artwork should emit a source set");
	const widths = getWidthDescriptors(srcset);
	assert.ok(widths.some((width) => width <= 480));

	const smallestCandidate = srcset
		.split(", ")[0]
		.replace(/\s+\d+w$/, "")
		.replaceAll("&amp;", "&");
	const imageResponse = await fetch(`${baseUrl}${smallestCandidate}`);
	assert.equal(imageResponse.status, 200);
	assert.equal(imageResponse.headers.get("content-type"), "image/webp");
	assert.ok((await imageResponse.arrayBuffer()).byteLength < 100 * 1024);
});
