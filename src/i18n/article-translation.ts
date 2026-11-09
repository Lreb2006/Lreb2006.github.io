import type { SiteConfig } from "../types/siteConfig";

export type ArticleTranslation = {
	postId: string;
	locale: SiteConfig["lang"];
	originalLocale?: SiteConfig["lang"];
	source: string[];
	translated: string[];
	machine?: boolean;
};

export const machineTranslationLabels: Record<SiteConfig["lang"], string> = {
	zh_CN: "机器翻译",
	zh_TW: "機器翻譯",
	en: "Machine translation",
	ru: "Машинный перевод",
	fr: "Traduction automatique",
	es: "Traducción automática",
	de: "Maschinelle Übersetzung",
	ja: "機械翻訳",
	ko: "기계 번역",
};

export function replaceTextValue(original: string, translated: string): string {
	return original.replace(/\S[\s\S]*\S|\S/, () => translated);
}
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
