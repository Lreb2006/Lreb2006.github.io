import type { SiteConfig } from "../types/siteConfig";

export type ArticleTranslation = {
	postId: string;
	locale: SiteConfig["lang"];
	source: string[];
	translated: string[];
};

export const untranslatedTags: ReadonlySet<string> = new Set([
	"code",
	"pre",
	"script",
	"style",
	"template",
	"svg",
	"math",
	"iframe",
	"input",
	"select",
	"textarea",
	"button",
]);

export const untranslatedClasses: ReadonlySet<string> = new Set([
	"anchor",
	"katex",
	"katex-display",
	"expressive-code",
	"mermaid",
]);

export function skipArticleElement(
	tag: string,
	classes: Iterable<string>,
): boolean {
	return (
		untranslatedTags.has(tag) ||
		Array.from(classes).some((name) => untranslatedClasses.has(name))
	);
}

export function isArticleText(value: string): boolean {
	return /\p{L}/u.test(value);
}
