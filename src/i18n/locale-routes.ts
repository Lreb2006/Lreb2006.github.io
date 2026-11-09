import type { SiteConfig } from "../types/siteConfig";
import { normalizeSiteLang } from "../utils/site-config-utils";

type Language = SiteConfig["lang"];

export const languageNames: Record<Language, string> = {
	zh_CN: "简体中文",
	zh_TW: "繁體中文",
	en: "English",
	ru: "Русский",
	fr: "Français",
	es: "Español",
	de: "Deutsch",
	ja: "日本語",
	ko: "한국어",
};

export const languages: Language[] = Object.keys(languageNames) as Language[];

export function localeFromPath(path: string): Language | undefined {
	return normalizeSiteLang(path.match(/^\/lang\/([\w-]+)(?:\/|$)/)?.[1]);
}

export function stripLocale(path: string): string {
	return localeFromPath(path)
		? path.replace(/^\/lang\/[\w-]+/, "") || "/"
		: path;
}

export function localizedPath(
	path: string,
	lang: Language,
	defaultLang: Language,
): string {
	const original = stripLocale(path);
	return lang === defaultLang
		? original
		: `/lang/${lang.replace("_", "-").toLowerCase()}${original}`;
}

let requestLocale: () => Language | undefined = () => undefined;

export function setRequestLocaleReader(read: () => Language | undefined): void {
	requestLocale = read;
}

export function activeLocale(defaultLang: Language): Language {
	const pathname =
		typeof window !== "undefined" ? window.location?.pathname : undefined;
	return (pathname ? localeFromPath(pathname) : requestLocale()) ?? defaultLang;
}

const pagePath =
	/^\/?(?:404|about|archive|articles(?:\/\d+)?|bangumi|bilibili|booknav|categories|dynamic(?:\/comments)?|friends|gallery(?:\/[^/.]+)?|guestbook|myanimelist|posts(?:\/.+)?|rss|search|series|sponsor|tags|vndb)?\/?$/;

export function isLocalizablePage(path: string): boolean {
	const pathname = path.split(/[?#]/, 1)[0].replace(/\/$/, "");
	return pagePath.test(pathname) && !/\.[a-z0-9]+$/i.test(pathname);
}
