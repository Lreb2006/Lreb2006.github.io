import type { SearchResult } from "@/global";

export interface LocalSearchEntry {
	url: string;
	title: string;
	description: string;
	category: string;
	tags: string[];
}

const escapeHtml = (value: string): string =>
	value.replace(
		/[&<>"']/g,
		(character) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[character] ?? character,
	);

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlight = (value: string, terms: string[]): string => {
	const escaped = escapeHtml(value);
	if (terms.length === 0) return escaped;
	const pattern = terms.map(escapeRegExp).join("|");
	return escaped.replace(new RegExp(`(${pattern})`, "giu"), "<mark>$1</mark>");
};

export function searchLocalPosts(
	entries: LocalSearchEntry[],
	keyword: string,
): SearchResult[] {
	const terms = keyword
		.trim()
		.toLocaleLowerCase()
		.split(/\s+/u)
		.filter(Boolean);
	if (terms.length === 0) return [];

	return entries
		.map((entry) => {
			const title = entry.title.toLocaleLowerCase();
			const description = entry.description.toLocaleLowerCase();
			const category = entry.category.toLocaleLowerCase();
			const tags = entry.tags.map((tag) => tag.toLocaleLowerCase());
			const matches = terms.every(
				(term) =>
					title.includes(term) ||
					description.includes(term) ||
					category.includes(term) ||
					tags.some((tag) => tag.includes(term)),
			);
			if (!matches) return null;

			const score = terms.reduce((total, term) => {
				if (title.includes(term)) return total + 4;
				if (category.includes(term) || tags.some((tag) => tag.includes(term))) {
					return total + 2;
				}
				return total + 1;
			}, 0);
			const summary =
				entry.description ||
				[entry.category, ...entry.tags].filter(Boolean).join(" · ");

			return {
				score,
				result: {
					url: entry.url,
					meta: { title: highlight(entry.title, terms) },
					excerpt: highlight(summary, terms),
				} satisfies SearchResult,
			};
		})
		.filter(
			(item): item is { score: number; result: SearchResult } => item !== null,
		)
		.sort((a, b) => b.score - a.score)
		.map(({ result }) => result);
}

export function shouldShowNoResults(
	keyword: string,
	resultCount: number,
	isSearching: boolean,
): boolean {
	return !isSearching && keyword.trim().length > 0 && resultCount === 0;
}
