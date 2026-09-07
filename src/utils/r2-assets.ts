import type { ImageMetadata } from "astro";

const R2_BASE_URL = "https://assets.charlore.cn";

export function r2Asset(key: string): string {
	return `${R2_BASE_URL}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

// Keep local dimensions while serving the unchanged original from R2.
export function r2Image(image: ImageMetadata, filename: string): ImageMetadata {
	return { ...image, src: r2Asset(`images/charlore/${filename}`) };
}
