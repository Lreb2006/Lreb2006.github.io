import { getCollection } from "astro:content";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { dynamicSearchText, dynamicSlug, sortDynamics } from "./dynamic-utils";

export type DynamicEntryData = {
	id: string;
	published: number;
	html: string;
	lang: string;
	images: Array<{ alt: string; src: string; title?: string }>;
	searchText: string;
	pinned: boolean;
	location: string;
	machine?: boolean;
};

const markdownImagePattern = /!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g;

export async function getDynamicData(): Promise<DynamicEntryData[]> {
	const processor = await createMarkdownProcessor();
	const dynamics = sortDynamics(await getCollection("dynamic"));
	return Promise.all(
		dynamics.map(async (entry) => {
			const images: DynamicEntryData["images"] = [];
			const markdown = (entry.body || "").replace(
				markdownImagePattern,
				(_match, alt: string, src: string, title?: string) => {
					images.push({ alt, src, ...(title ? { title } : {}) });
					return "";
				},
			);
			const rendered = await processor.render(markdown);
			return {
				id: dynamicSlug(entry.id),
				published: entry.data.published.getTime(),
				html: rendered.code,
				lang: (entry.data.lang || "zh-CN").replace("_", "-"),
				images,
				searchText: dynamicSearchText(entry),
				pinned: entry.data.pinned || false,
				location: entry.data.location.trim(),
			};
		}),
	);
}
