import type { ImageMetadata } from "astro";
import { resolveImageUrl } from "./image-manifest";

const R2_BASE_URL = "https://assets.charlore.cn";

export function r2Asset(key: string): string {
	return resolveImageUrl(
		`${R2_BASE_URL}/${key.split("/").map(encodeURIComponent).join("/")}`,
	);
}

// Keep local dimensions while resolving optimized R2 images.
export function r2Image(image: ImageMetadata, filename: string): ImageMetadata {
	const src = r2Asset(`images/charlore/${filename}`);
	return {
		...image,
		src,
		format: src.endsWith(".webp") ? "webp" : image.format,
	};
}
