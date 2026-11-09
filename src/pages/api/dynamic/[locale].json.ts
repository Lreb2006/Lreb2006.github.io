import type { APIRoute, GetStaticPaths } from "astro";
import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";
import {
	type ArticleTranslation,
	replaceTextValue,
} from "@/i18n/article-translation";
import { languages } from "@/i18n/locale-routes";
import { collectHtmlTextNodes } from "@/i18n/translation-html";
import { getDynamicData } from "@/utils/dynamic-data";
import { normalizeSiteLang } from "@/utils/site-config-utils";

const translations = Object.values(
	import.meta.glob<ArticleTranslation>(
		"/src/data/dynamic-translations/*.json",
		{ eager: true, import: "default" },
	),
);

export const getStaticPaths: GetStaticPaths = () =>
	languages.map((locale) => ({ params: { locale } }));

export const GET: APIRoute = async ({ params }) => {
	const localized = new Map(
		translations
			.filter(({ locale }) => locale === params.locale)
			.map((translation) => [translation.postId, translation]),
	);
	const entries = (await getDynamicData()).map((entry) => {
		const translation = localized.get(entry.id);
		const originalLocale = normalizeSiteLang(entry.lang);
		if (
			!translation ||
			originalLocale === params.locale ||
			(translation.originalLocale ?? "zh_CN") !== originalLocale
		)
			return entry;
		const fragment = fromHtml(entry.html, { fragment: true });
		const nodes = collectHtmlTextNodes(fragment);
		if (
			translation.source.length !== nodes.length ||
			translation.translated.length !== nodes.length ||
			!nodes.every(
				(node, index) => node.value.trim() === translation.source[index],
			)
		)
			return entry;
		for (const [index, node] of nodes.entries()) {
			node.value = replaceTextValue(node.value, translation.translated[index]);
		}
		return {
			...entry,
			html: toHtml(fragment),
			lang: translation.locale.replace("_", "-"),
			machine: translation.machine,
			searchText: `${entry.searchText} ${translation.translated.join(" ").toLowerCase()}`,
		};
	});
	return Response.json(entries);
};
