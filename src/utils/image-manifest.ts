import manifest from "../data/image-manifest.json";

export function resolveImageUrl(url: string): string {
	return (manifest as Record<string, { url: string }>)[url]?.url ?? url;
}
