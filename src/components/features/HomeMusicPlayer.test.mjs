import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, readFile } from "node:fs/promises";
import test, { after, before } from "node:test";

let devServer;
const origin = "http://127.0.0.1:4321";

async function waitForServer(url) {
	const deadline = Date.now() + 30_000;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(url);
			if (response.ok) return;
		} catch {
			// The development server is still starting.
		}
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	throw new Error(`Timed out waiting for ${url}`);
}

before(async () => {
	try {
		const response = await fetch(origin);
		if (response.ok) return;
	} catch {
		// Start the project's development server when one is not already running.
	}

	devServer = spawn(
		process.execPath,
		["node_modules/astro/bin/astro.mjs", "dev", "--host", "127.0.0.1"],
		{
			cwd: process.cwd(),
			stdio: "ignore",
		},
	);
	await waitForServer(origin);
});

after(async () => {
	if (!devServer || devServer.killed) return;
	devServer.kill();
	await Promise.race([
		once(devServer, "exit"),
		new Promise((resolve) => setTimeout(resolve, 2_000)),
	]);
});

test("the homepage renders a collapsed glass music player", async () => {
	const response = await fetch(origin);
	const html = await response.text();

	assert.equal(response.status, 200);
	assert.match(html, /data-home-music-player/);
	assert.match(html, /data-home-music-trigger[^>]+aria-expanded="false"/);
	assert.match(html, /data-home-music-panel[^>]+aria-hidden="true"/);
	assert.match(html, /class="[^"]*float-panel[^"]*home-music-trigger/);
	assert.match(html, /class="[^"]*music-player-widget/);
	assert.match(html, /id="playlist-item-template"/);
	assert.ok(
		html.indexOf("data-home-music-player") >
			html.indexOf('<div class="floating-controls-container"'),
		"fixed player must render outside the transformed content wrapper",
	);
});

test("non-home pages render the same collapsed floating music player", async () => {
	const response = await fetch(`${origin}/about/`);
	const html = await response.text();

	assert.equal(response.status, 200);
	assert.match(html, /data-home-music-player/);
	assert.match(html, /data-home-music-trigger[^>]+aria-expanded="false"/);
	assert.match(html, /data-home-music-panel[^>]+aria-hidden="true"/);
	assert.match(html, /id="playlist-item-template"/);
});

test("the homepage player reuses the Charlore navbar palette", async () => {
	const source = await readFile(
		new URL("./HomeMusicPlayer.astro", import.meta.url),
		"utf8",
	);
	const playerSource = await readFile(
		new URL("./MusicPlayer.astro", import.meta.url),
		"utf8",
	);

	assert.match(source, /--primary:\s*var\(--home-music-ink\)/);
	assert.match(source, /--btn-regular-bg:\s*var\(--charlore-nav-slider\)/);
	assert.match(
		source,
		/\.home-music-panel\.float-panel[\s\S]*?var\(--charlore-nav-surface\)/,
	);
	assert.match(source, /--home-music-ink:\s*#294b59/);
	assert.match(source, /:global\(\.music-artist\)/);
	assert.match(source, /:global\(\.item-title\)/);
	assert.match(source, /:global\(\.item-artist\)/);
	assert.match(source, /:global\(\.btn-repeat\)/);
	assert.match(
		source,
		/:global\(:root\.dark[^)]*\)\s*\.home-music-player\s+\.home-music-panel\.float-panel\s*\{/,
	);
	assert.match(
		source,
		/:global\(\.btn-play\)[\s\S]*?background:\s*var\(--home-music-play-bg\)/,
	);
	assert.match(source, /width:\s*min\(24rem,/);
	assert.match(
		source,
		/:global\(\.music-cover-shell\)[\s\S]*?width:\s*4\.25rem/,
	);
	assert.match(playerSource, /class="music-cover-shell/);
});

test("mobile light mode applies one deep red foreground palette to the whole player", async () => {
	const source = await readFile(
		new URL("./HomeMusicPlayer.astro", import.meta.url),
		"utf8",
	);

	assert.match(
		source,
		/@media \(max-width:\s*768px\)[\s\S]*?:global\(html:not\(\.dark\)\[data-wallpaper-mode="fullscreen"\]\[data-has-wallpaper\]\)\s*\.home-music-player\s*\{[^}]*--home-music-ink:\s*#7A3E35[^}]*--home-music-strong:\s*#7A3E35/,
	);
	assert.match(
		source,
		/:global\(:root\.dark[^)]*\)\s*\.home-music-player\s*\{[^}]*--home-music-ink:\s*#edf6fb[^}]*--home-music-strong:\s*#ffffff/,
	);
});

test("the local playlist references every converted audio file", async () => {
	const configSource = await readFile(
		new URL("../../config/musicConfig.ts", import.meta.url),
		"utf8",
	);
	const audioUrls = [
		"/assets/music/audio/let-me-stay-with-you.mp3",
		"/assets/music/audio/suki-igai-no-kotoba-de.mp3",
		"/assets/music/audio/infinite-times.mp3",
		"/assets/music/audio/you-he-bu-ke.mp3",
		"/assets/music/audio/shut-up-and-dance-acoustic.mp3",
		"/assets/music/audio/tsuki-no-ondo.mp3",
		"/assets/music/audio/sleep-tight.mp3",
	];

	for (const audioUrl of audioUrls) {
		const missingUploads = [
			"suki-igai-no-kotoba-de",
			"you-he-bu-ke",
			"tsuki-no-ondo",
		];
		const playbackUrl = missingUploads.some((name) =>
			audioUrl.endsWith(`${name}.mp3`),
		)
			? audioUrl
			: audioUrl.replace(
					"/assets/music/audio/",
					"https://assets.charlore.cn/music/audio/",
				);
		assert.ok(configSource.includes(`url: "${playbackUrl}"`));
		await access(new URL(`../../../public${audioUrl}`, import.meta.url));
	}

	const replacementCovers = [
		"/assets/music/covers/suki-igai-no-kotoba-de.jpg",
		"/assets/music/covers/infinite-times.jpg",
	];
	for (const coverUrl of replacementCovers) {
		const playbackCover = coverUrl.replace(
			"/assets/music/covers/",
			"https://assets.charlore.cn/music/cover/",
		);
		assert.ok(
			configSource.replace(/\s+/g, " ").includes(`cover: "${playbackCover}"`),
		);
		await access(new URL(`../../../public${coverUrl}`, import.meta.url));
	}
});
