import type { SiteConfig } from "@/types/siteConfig";

// 站点语言的环境变量覆盖工具
// 把「读取 PUBLIC_SITE_LANG 环境变量并规整为合法语言」的逻辑收敛在这里，
// 让 siteConfig.ts 保持纯配置，不掺杂判断代码

// 读取站点语言环境变量（Vite/Astro 走 import.meta.env，构建脚本回退 process.env）
function readSiteLangEnv(): string | undefined {
	try {
		const raw = (import.meta.env as Record<string, unknown>).PUBLIC_SITE_LANG;
		return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
	} catch {
		return typeof process === "undefined"
			? undefined
			: process.env.PUBLIC_SITE_LANG;
	}
}

// 规整成 SiteConfig.lang 的合法取值，无法识别时返回 undefined（回退到默认值）
export function normalizeSiteLang(
	value: string | undefined,
): SiteConfig["lang"] | undefined {
	if (!value) return undefined;
	const code = value.trim().toLowerCase().replaceAll("_", "-");
	if (["zh", "zh-cn", "zh-hans", "zh-sg"].includes(code)) return "zh_CN";
	if (["zh-tw", "zh-hant", "zh-hk", "zh-mo"].includes(code)) return "zh_TW";
	const language = code.match(/^([a-z]{2})(?:-[a-z]{2})?$/)?.[1];
	switch (language) {
		case "de":
		case "en":
		case "es":
		case "fr":
		case "ja":
		case "ko":
		case "ru":
			return language;
	}
}

// 站点语言，环境变量 PUBLIC_SITE_LANG 优先，未设置或无法识别时使用默认值
// 例如在部署平台设置 PUBLIC_SITE_LANG=en 即可让站点以英文构建，无需修改配置文件
export function resolveSiteLang(
	defaultLang: SiteConfig["lang"],
): SiteConfig["lang"] {
	return normalizeSiteLang(readSiteLangEnv()) ?? defaultLang;
}
