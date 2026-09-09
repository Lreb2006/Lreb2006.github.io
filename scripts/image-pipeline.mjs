import { loadEnvFile } from "node:process";
import { readFile, writeFile, rename, mkdir, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	S3Client,
	ListObjectsV2Command,
	GetObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";

const manifestPath = "src/data/image-manifest.json";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const args = new Set(process.argv.slice(2));
const mode = [...args][0];
if (!["--check", "--existing", "--staged", "--all"].includes(mode)) {
	throw new Error("Use --check, --existing, --staged or --all");
}
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
let client;
let base;
function connect() {
	if (client) return;
	loadEnvFile(".env");
	for (const name of [
		"R2_ENDPOINT",
		"R2_ACCESS_KEY_ID",
		"R2_SECRET_ACCESS_KEY",
		"R2_BUCKET",
		"R2_PUBLIC_URL",
	]) {
		if (!process.env[name]?.trim()) throw new Error(`Missing ${name} in .env`);
	}
	base = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
	const endpoint = new URL(process.env.R2_ENDPOINT);
	if (
		!/^[a-f0-9]{32}(\.(eu|fedramp))?\.r2\.cloudflarestorage\.com$/.test(
			endpoint.hostname,
		) ||
		endpoint.protocol !== "https:" ||
		endpoint.pathname !== "/"
	)
		throw new Error(
			"R2_ENDPOINT must be the S3 endpoint copied from R2 (with your 32-character account ID)",
		);
	if (
		!/^[a-f0-9]{32}$/i.test(process.env.R2_ACCESS_KEY_ID) ||
		!/^[a-f0-9]{64}$/i.test(process.env.R2_SECRET_ACCESS_KEY)
	)
		throw new Error(
			"Use the R2 S3 Access Key ID and 64-character Secret Access Key, not the API token value",
		);
	client = new S3Client({
		region: "auto",
		endpoint: process.env.R2_ENDPOINT,
		credentials: {
			accessKeyId: process.env.R2_ACCESS_KEY_ID,
			secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
		},
		maxAttempts: 3,
		requestHandler: { connectionTimeout: 15000, requestTimeout: 120000 },
	});
}
const publicUrl = (key) =>
	`${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
async function save() {
	await mkdir("src/data", { recursive: true });
	await writeFile(
		`${manifestPath}.tmp`,
		`${JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`,
	);
	await rename(`${manifestPath}.tmp`, manifestPath);
}
async function migrate(source, bytes, etag) {
	const metadata = await sharp(bytes, { animated: true }).metadata();
	if (!["jpeg", "png", "webp"].includes(metadata.format))
		throw new Error("Only JPEG, PNG and WebP supported");
	const output = await sharp(bytes, { animated: true })
		.rotate()
		.keepIccProfile()
		.webp({ lossless: true, effort: 5 })
		.toBuffer();
	const originalPixels = await sharp(bytes, { animated: true })
		.rotate()
		.ensureAlpha()
		.raw()
		.toBuffer();
	const convertedPixels = await sharp(output, { animated: true })
		.ensureAlpha()
		.raw()
		.toBuffer();
	if (!originalPixels.equals(convertedPixels))
		throw new Error("Lossless pixel verification failed");
	const useWebp = output.length < bytes.length;
	const selected = useWebp ? output : bytes;
	const digest = hash(selected);
	const format = useWebp ? "webp" : metadata.format;
	const key = `images/optimized/${digest}.${format === "jpeg" ? "jpg" : format}`;
	const retainR2Original = !useWebp && source.startsWith(`${base}/`);
	if (!retainR2Original) {
		await client.send(
			new PutObjectCommand({
				Bucket: process.env.R2_BUCKET,
				Key: key,
				Body: selected,
				ContentType: `image/${format}`,
				CacheControl: "public, max-age=31536000, immutable",
			}),
		);
	}
	const url = retainR2Original ? source : publicUrl(key);
	const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
	if (
		!response.ok ||
		hash(Buffer.from(await response.arrayBuffer())) !== digest
	)
		throw new Error("Public URL verification failed");
	manifest[source] = {
		url,
		sha256: digest,
		sourceSha256: hash(bytes),
		sourceEtag: etag,
		originalBytes: bytes.length,
		bytes: selected.length,
		width: metadata.autoOrient?.width ?? metadata.width,
		height: metadata.autoOrient?.height ?? metadata.height,
		format,
		lossless: true,
		pixelVerified: true,
		policy: "lossless-if-smaller-v1",
	};
	await save();
	console.log(
		`${useWebp ? "Lossless WebP" : "Kept original"}: ${bytes.length} -> ${selected.length} bytes`,
	);
}
function extract(text) {
	const parsed = matter(text);
	const urls = new Set();
	if (typeof parsed.data.image === "string") urls.add(parsed.data.image);
	const tree = unified().use(remarkParse).parse(parsed.content);
	const definitions = new Map();
	visit(tree, "definition", (n) => definitions.set(n.identifier, n.url));
	visit(tree, (n) => {
		if (n.type === "image") urls.add(n.url);
		if (n.type === "imageReference" && definitions.has(n.identifier))
			urls.add(definitions.get(n.identifier));
		if (n.type === "html")
			for (const match of n.value.matchAll(
				/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
			))
				urls.add(match[1]);
	});
	return [...urls].filter((url) =>
		/^https:\/\/raw\.githubusercontent\.com\//.test(url),
	);
}
async function main() {
	if (mode === "--check" || mode === "--existing") {
		connect();
		let token;
		let count = 0;
		do {
			const page = await client.send(
				new ListObjectsV2Command({
					Bucket: process.env.R2_BUCKET,
					ContinuationToken: token,
				}),
			);
			for (const object of page.Contents ?? []) {
				if (!/\.(jpe?g|png)$/i.test(object.Key)) continue;
				count++;
				if (mode === "--check") continue;
				const source = publicUrl(object.Key);
				if (
					manifest[source]?.sourceEtag === object.ETag &&
					manifest[source]?.policy === "lossless-if-smaller-v1"
				)
					continue;
				const file = await client.send(
					new GetObjectCommand({
						Bucket: process.env.R2_BUCKET,
						Key: object.Key,
					}),
				);
				await migrate(
					source,
					Buffer.from(await file.Body.transformToByteArray()),
					object.ETag,
				);
			}
			token = page.IsTruncated ? page.NextContinuationToken : undefined;
		} while (token);
		console.log(`R2 accessible; JPEG/PNG objects: ${count}`);
		return;
	}
	let files;
	if (mode === "--staged") {
		files = git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z")
			.split("\0")
			.filter((p) => /^src\/content\/.*\.mdx?$/.test(p));
	} else {
		files = (await readdir("src/content", { recursive: true }))
			.filter((p) => /\.mdx?$/.test(p))
			.map((p) => `src/content/${p.replaceAll("\\", "/")}`);
	}
	const urls = new Set();
	for (const file of files) {
		const text =
			mode === "--staged"
				? git("show", `:${file}`)
				: await readFile(file, "utf8");
		for (const url of extract(text)) urls.add(url);
	}
	const pending = [...urls].filter(
		(url) => manifest[url]?.policy !== "lossless-if-smaller-v1",
	);
	// A working-tree mapping must not suppress upload when it is missing from
	// the actual commit (including a retry after a partially failed migration).
	if (mode === "--staged" && urls.size) {
		let stagedManifest = {};
		try {
			stagedManifest = JSON.parse(git("show", `:${manifestPath}`));
		} catch {}
		const missing = [...urls].some(
			(url) =>
				manifest[url] &&
				JSON.stringify(manifest[url]) !== JSON.stringify(stagedManifest[url]),
		);
		if (missing)
			throw new Error(
				"请先审阅并暂存 src/data/image-manifest.json，再重新提交",
			);
	}
	if (!pending.length) {
		console.log("No new GitHub images.");
		return;
	}
	// Do not stage a user's unrelated manifest edits or accidentally omit prior mappings.
	if (
		mode === "--staged" &&
		git("diff", "--name-only", "--", manifestPath).trim()
	)
		throw new Error("Stage manifest changes before adding new images");
	connect();
	for (const url of pending) {
		const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
		if (!response.ok)
			throw new Error(`GitHub image download HTTP ${response.status}`);
		await migrate(url, Buffer.from(await response.arrayBuffer()));
	}
	if (mode === "--staged") git("add", "--", manifestPath);
}
try {
	await main();
} catch (error) {
	// Never print SDK request objects or credentials.
	console.error(
		`Image pipeline failed: ${error.name}; ${error.$metadata?.httpStatusCode ?? ""} ${error.name === "Error" ? error.message : "Check R2 credentials/network/permissions"}`,
	);
	process.exitCode = 1;
} finally {
	client?.destroy();
}
