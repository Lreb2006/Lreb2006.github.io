import { AsyncLocalStorage } from "node:async_hooks";
import type { MiddlewareHandler } from "astro";
import { defineMiddleware } from "astro:middleware";
import { localeFromPath, setRequestLocaleReader } from "./i18n/locale-routes";
import type { SiteConfig } from "./types/siteConfig";

const locale = new AsyncLocalStorage<SiteConfig["lang"] | undefined>();
setRequestLocaleReader(() => locale.getStore());

export const onRequest: MiddlewareHandler = defineMiddleware((context, next) =>
	locale.run(localeFromPath(context.url.pathname), () => next()),
);
