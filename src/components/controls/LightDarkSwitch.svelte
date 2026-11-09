<script lang="ts">
import { onMount } from "svelte";
import Icon from "@/components/common/Icon.svelte";
import { DARK_MODE, LIGHT_MODE } from "@/constants/constants";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import type { LIGHT_DARK_MODE } from "@/types/config.ts";
import { getStoredTheme, setTheme } from "@/utils/setting-utils";

let mode: LIGHT_DARK_MODE = $state(LIGHT_MODE);

function syncModeFromDocument() {
	mode = document.documentElement.classList.contains("dark")
		? DARK_MODE
		: LIGHT_MODE;
}

function toggleScheme() {
	const nextMode = mode === DARK_MODE ? LIGHT_MODE : DARK_MODE;
	mode = nextMode;
	setTheme(nextMode);
}

onMount(() => {
	const storedTheme = getStoredTheme();
	if (storedTheme === DARK_MODE || storedTheme === LIGHT_MODE) {
		mode = storedTheme;
	} else {
		syncModeFromDocument();
		setTheme(mode);
	}

	window.addEventListener("theme-change", syncModeFromDocument);
	return () => window.removeEventListener("theme-change", syncModeFromDocument);
});
</script>

<button
	aria-label={i18n(mode === DARK_MODE ? I18nKey.lightMode : I18nKey.darkMode)}
	aria-pressed={mode === DARK_MODE}
	class="relative btn-plain scale-animation rounded-lg h-9 w-9 md:h-11 md:w-11 active:scale-90"
	id="scheme-switch"
	onclick={toggleScheme}
	title={i18n(mode === DARK_MODE ? I18nKey.lightMode : I18nKey.darkMode)}
>
	<div class="absolute inset-0 flex items-center justify-center" class:opacity-0={mode !== LIGHT_MODE}>
		<Icon icon="material-symbols:wb-sunny-outline-rounded" class="text-[1.25rem]"></Icon>
	</div>
	<div class="absolute inset-0 flex items-center justify-center" class:opacity-0={mode !== DARK_MODE}>
		<Icon icon="material-symbols:dark-mode-outline-rounded" class="text-[1.25rem]"></Icon>
	</div>
</button>
