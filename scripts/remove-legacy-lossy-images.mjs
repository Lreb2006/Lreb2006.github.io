// Explicit one-time cleanup of only the lossy objects recorded in this commit.
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { createHash } from "node:crypto";
import {
	S3Client,
	GetObjectCommand,
	HeadObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";

loadEnvFile(".env");
const baseline = JSON.parse(
	execFileSync("git", ["show", "175e0c7:src/data/image-manifest.json"], {
		encoding: "utf8",
	}),
);
const current = JSON.parse(
	await readFile("src/data/image-manifest.json", "utf8"),
);
const base = new URL(process.env.R2_PUBLIC_URL);
const bucket = process.env.R2_BUCKET;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const keyOf = (url) => {
	const parsed = new URL(url);
	if (
		parsed.origin !== base.origin ||
		!/^\/images\/optimized\/[a-f0-9]{64}\.webp$/.test(parsed.pathname)
	)
		throw new Error("Unexpected deletion target");
	return parsed.pathname.slice(1);
};
const client = new S3Client({
	region: "auto",
	endpoint: process.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
	},
	maxAttempts: 3,
	requestHandler: { connectionTimeout: 15000, requestTimeout: 120000 },
});
try {
	const active = new Set(Object.values(current).map((x) => x.url));
	const targets = new Map();
	for (const old of JSON.parse(
		await readFile(
			new URL("./oversized-webp-cleanup.json", import.meta.url),
			"utf8",
		),
	)) {
		if (active.has(old.url)) throw new Error("Oversized WebP still referenced");
		targets.set(keyOf(old.url), old.sha256);
	}
	for (const [source, old] of Object.entries(baseline)) {
		const replacement = current[source];
		if (
			!replacement?.lossless ||
			replacement.policy !== "lossless-if-smaller-v1" ||
			!replacement.pixelVerified ||
			replacement.url === old.url
		)
			throw new Error("Lossless migration incomplete");
		const newKey =
			replacement.url === source
				? decodeURIComponent(new URL(source).pathname.slice(1))
				: keyOf(replacement.url);
		await client.send(new HeadObjectCommand({ Bucket: bucket, Key: newKey }));
		if (active.has(old.url)) throw new Error("Old object still referenced");
		targets.set(keyOf(old.url), old.sha256);
	}
	// Validate all exact targets before deleting any of them.
	const deletions = [];
	for (const [key, digest] of targets) {
		try {
			const object = await client.send(
				new GetObjectCommand({ Bucket: bucket, Key: key }),
			);
			if (hash(await object.Body.transformToByteArray()) !== digest)
				throw new Error("Old object hash changed; refusing deletion");
			deletions.push(key);
		} catch (error) {
			if (error.$metadata?.httpStatusCode !== 404) throw error;
		}
	}
	console.log(`Verified exact legacy lossy targets: ${deletions.length}`);
	if (process.argv.includes("--delete")) {
		for (const key of deletions) {
			await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
			try {
				await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
				throw new Error("Deleted object still exists");
			} catch (error) {
				if (error.$metadata?.httpStatusCode !== 404) throw error;
			}
		}
		console.log(
			`Deleted and verified absent: ${deletions.length}; original JPG/PNG preserved`,
		);
	}
} catch (error) {
	console.error(
		`Cleanup failed: ${error.name}; HTTP ${error.$metadata?.httpStatusCode ?? ""}; ${error.name === "Error" ? error.message : "R2 request failed"}`,
	);
	process.exitCode = 1;
} finally {
	client.destroy();
}
