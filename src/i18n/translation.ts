import { siteConfig } from "../config";
import type { SiteConfig } from "../types/siteConfig";
import { normalizeSiteLang } from "../utils/site-config-utils";
import type I18nKey from "./i18nKey";
import { activeLocale } from "./locale-routes";
import { de } from "./languages/de";
import { en } from "./languages/en";
import { es } from "./languages/es";
import { fr } from "./languages/fr";
import { ja } from "./languages/ja";
import { ko } from "./languages/ko";
import { ru } from "./languages/ru";
import { zh_CN } from "./languages/zh_CN";
import { zh_TW } from "./languages/zh_TW";

export type Translation = {
	[K in I18nKey]: string;
};

const defaultTranslation = en;

const map: Record<SiteConfig["lang"], Translation> = {
	de,
	en,
	es,
	fr,
	ja,
	ko,
	ru,
	zh_CN,
	zh_TW,
};

export function getTranslation(lang: string): Translation {
	const language = normalizeSiteLang(lang);
	return language ? map[language] : defaultTranslation;
}

export function i18n(key: I18nKey): string {
	const lang = activeLocale(siteConfig.lang);
	const currentLang = getTranslation(lang);
	const value = currentLang[key];

	// 如果当前语言没有翻译（或为空），则使用中文作为备选
	if (!value && lang.toLowerCase() !== "zh_cn") {
		const chineseValue = zh_CN[key];
		if (chineseValue) {
			return chineseValue;
		}
	}

	return value || defaultTranslation[key];
}
