import { siteConfig } from "../config/siteConfig";
import { normalizeSiteLang } from "../utils/site-config-utils";
import {
	activeLocale,
	isLocalizablePage,
	localeFromPath,
	localizedPath,
} from "./locale-routes";

const preferenceKey = "charlore-language";

function savedLanguage() {
	try {
		return normalizeSiteLang(localStorage.getItem(preferenceKey) ?? undefined);
	} catch {
		return undefined;
	}
}

// Used only for countries with a clear default among the available languages.
const countryLanguages: Record<string, string> = {
	AT: "de",
	AU: "en",
	CN: "zh_CN",
	DE: "de",
	ES: "es",
	FR: "fr",
	GB: "en",
	HK: "zh_TW",
	IE: "en",
	JP: "ja",
	KR: "ko",
	MO: "zh_TW",
	MX: "es",
	NZ: "en",
	RU: "ru",
	TW: "zh_TW",
	US: "en",
	AR: "es",
	BO: "es",
	CL: "es",
	CO: "es",
	CR: "es",
	CU: "es",
	DO: "es",
	EC: "es",
	GT: "es",
	HN: "es",
	NI: "es",
	PA: "es",
	PE: "es",
	PY: "es",
	SV: "es",
	UY: "es",
	VE: "es",
};

async function languageFromCountry() {
	const endpoint = import.meta.env.PUBLIC_COUNTRY_LOOKUP_URL;
	if (!endpoint) return undefined;
	try {
		const response = await fetch(endpoint, {
			cache: "no-store",
			credentials: "omit",
			redirect: "error",
			signal: AbortSignal.timeout(1200),
		});
		if (!response.ok) return undefined;
		const text = await response.text();
		const country = text.match(/^loc=([A-Z]{2})$/m)?.[1] ?? text.trim();
		return normalizeSiteLang(countryLanguages[country.toUpperCase()]);
	} catch {
		return undefined;
	}
}

document.addEventListener("click", (event) => {
	if (!(event.target instanceof Element)) return;
	const link = event.target.closest<HTMLAnchorElement>("a[data-site-language]");
	const menu = document.querySelector<HTMLDetailsElement>(
		"details[data-language-menu][open]",
	);
	if (!link) {
		if (menu && !menu.contains(event.target)) menu.open = false;
		return;
	}
	const language = normalizeSiteLang(link.dataset.siteLanguage);
	if (!language) return;
	const { pathname, search, hash } = window.location;
	link.href =
		localizedPath(pathname, language, siteConfig.lang) + search + hash;
	try {
		localStorage.setItem(preferenceKey, language);
	} catch {
		// The link works even if the browser blocks storage.
	}
});

document.addEventListener("keydown", (event) => {
	if (event.key !== "Escape") return;
	const menu = document.querySelector<HTMLDetailsElement>(
		"details[data-language-menu][open]",
	);
	if (!menu) return;
	menu.open = false;
	menu.querySelector("summary")?.focus();
});

async function applyLanguagePreference() {
	const { pathname, search, hash } = window.location;
	if (localeFromPath(pathname) || !isLocalizablePage(pathname)) return;
	const saved = savedLanguage();
	const suggestion = saved ?? (await languageFromCountry());
	const language =
		suggestion ?? navigator.languages.map(normalizeSiteLang).find(Boolean);
	if (!language || language === activeLocale(siteConfig.lang)) return;
	if (window.location.pathname !== pathname || savedLanguage() !== saved) return;
	window.location.replace(
		localizedPath(pathname, language, siteConfig.lang) + search + hash,
	);
}

void applyLanguagePreference();
