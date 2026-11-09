import { readdirSync } from "node:fs";
import { languages, localizedPath } from "../i18n/locale-routes.ts";

export function localePages(defaultLanguage) {
	return {
		name: "charlore-locale-pages",
		hooks: {
			"astro:config:setup": ({ config, injectRoute }) => {
				for (const file of readdirSync(new URL("src/pages/", config.root), {
					recursive: true,
				})) {
					if (!file.endsWith(".astro")) continue;
					const route = file
						.replaceAll("\\", "/")
						.replace(/\.astro$/, "")
						.replace(/(^|\/)index$/, "");
					for (const language of languages) {
						if (language === defaultLanguage) continue;
						injectRoute({
							pattern: localizedPath(`/${route}`, language, defaultLanguage),
							entrypoint: new URL(
								`src/pages/${file.replaceAll("\\", "/")}`,
								config.root,
							),
						});
					}
				}
			},
		},
	};
}
