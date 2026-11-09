#!/bin/sh
set -eu

cache_dir="$PWD/node_modules/.cache/charlore-translations"
mkdir -p "$cache_dir"

# Restore the translated text saved by the last successful build.
for kind in post dynamic; do
	name="$kind-translations"
	if [ -d "$cache_dir/$name" ]; then
		mkdir -p "src/data/$name"
		cp -R "$cache_dir/$name/." "src/data/$name/"
	fi
done

if command -v python3.12 >/dev/null 2>&1; then
	TRANSLATION_PYTHON="$(command -v python3.12)"
else
	if [ ! -x "$cache_dir/uv" ]; then
		curl -fsSL https://astral.sh/uv/0.8.12/install.sh -o "$cache_dir/install-uv.sh"
		UV_UNMANAGED_INSTALL="$cache_dir" sh "$cache_dir/install-uv.sh"
	fi
	export UV_PYTHON_INSTALL_DIR="$cache_dir/python"
	"$cache_dir/uv" python install 3.12
	TRANSLATION_PYTHON="$("$cache_dir/uv" python find 3.12)"
fi
export TRANSLATION_PYTHON

pnpm astro build --outDir cache/translation-source
pnpm translate:post cache/translation-source all --offline --setup
pnpm build

for kind in post dynamic; do
	name="$kind-translations"
	if [ -d "src/data/$name" ]; then
		mkdir -p "$cache_dir/$name"
		cp -R "src/data/$name/." "$cache_dir/$name/"
	fi
done
