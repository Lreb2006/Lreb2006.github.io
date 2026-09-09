import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import {
	DeleteObjectCommand,
	ListObjectsV2Command,
	S3Client,
} from "@aws-sdk/client-s3";

loadEnvFile(".env");
const manifest = JSON.parse(
	await readFile("src/data/image-manifest.json", "utf8"),
);
const publicOrigin = new URL(process.env.R2_PUBLIC_URL).origin;
const keyOfOptimizedUrl = (url) => {
	const parsed = new URL(url);
	if (
		parsed.origin !== publicOrigin ||
		!/^\/images\/optimized\/(?:[a-z0-9-]+\/)?[a-f0-9]{64}\.(webp|png|jpg)$/.test(
			parsed.pathname,
		)
	)
		return null;
	return decodeURIComponent(parsed.pathname.slice(1));
};
const activeKeys = new Set(
	Object.values(manifest)
		.map((item) => keyOfOptimizedUrl(item.url))
		.filter(Boolean),
);
const client = new S3Client({
	region: "auto",
	endpoint: process.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
	},
});
try {
	const targets = [];
	let token;
	do {
		const page = await client.send(
			new ListObjectsV2Command({
				Bucket: process.env.R2_BUCKET,
				Prefix: "images/optimized/",
				ContinuationToken: token,
			}),
		);
		for (const object of page.Contents ?? []) {
			if (!keyOfOptimizedUrl(`${publicOrigin}/${object.Key}`))
				throw new Error(
					`Unexpected object under optimized prefix: ${object.Key}`,
				);
			if (!activeKeys.has(object.Key)) targets.push(object.Key);
		}
		token = page.IsTruncated ? page.NextContinuationToken : undefined;
	} while (token);
	console.log(`Unreferenced optimized objects: ${targets.length}`);
	if (process.argv.includes("--delete")) {
		for (const key of targets) {
			await client.send(
				new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
			);
		}
		console.log(`Deleted unreferenced optimized objects: ${targets.length}`);
	}
} finally {
	client.destroy();
}
