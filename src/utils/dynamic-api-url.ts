import { dynamicConfig, siteConfig } from "@/config";
import { activeLocale } from "@/i18n/locale-routes";
import { url } from "./url-utils";

export function getDynamicApiUrl(): string {
	const configured = dynamicConfig.apiUrl || "/api/dynamic.json";
	return configured === "/api/dynamic.json"
		? url(`/api/dynamic/${activeLocale(siteConfig.lang)}.json`)
		: url(configured);
}
