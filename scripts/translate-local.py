import argparse
from concurrent.futures import ThreadPoolExecutor
from contextlib import redirect_stdout
import json
from importlib.util import find_spec
from itertools import chain
import os
from pathlib import Path
import subprocess
import sys
import venv


LANGUAGES = ("zh_CN", "zh_TW", "en", "ru", "fr", "es", "de", "ja", "ko")
CACHE = Path(__file__).resolve().parents[1] / "cache" / "offline-translation"
VENV = CACHE / "venv"
PYTHON = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
os.environ.update(
    XDG_DATA_HOME=str(CACHE / "data"),
    XDG_CACHE_HOME=str(CACHE / "cache"),
    XDG_CONFIG_HOME=str(CACHE / "config"),
    ARGOS_PACKAGES_DIR=str(CACHE / "models"),
    ARGOS_MODEL_PROVIDER="OPENNMT",
    ARGOS_DEVICE_TYPE="cpu",
    ARGOS_CHUNK_TYPE="MINISBD",
)
os.environ.setdefault("ARGOS_INTRA_THREADS", "2")
os.environ.setdefault("ARGOS_BATCH_SIZE", "512")


def model_code(language):
    return "zh" if language in ("zh_CN", "zh_TW") else language


def translate_batch(translator, segments, english=None):
    import ctranslate2
    from argostranslate import settings
    from argostranslate.translate import CachedTranslation, CompositeTranslation, PackageTranslation
    from minisbd import SBDetect

    if isinstance(translator, CompositeTranslation):
        if english and all(english) and translator.t1.to_lang.code == "en":
            pivot = english
        else:
            pivot = translate_batch(translator.t1, segments)
        return translate_batch(translator.t2, pivot)
    if isinstance(translator, CachedTranslation):
        translator = translator.underlying
    if not isinstance(translator, PackageTranslation):
        return [translator.translate(segment) for segment in segments]

    package = translator.pkg
    if translator.translator is None:
        translator.translator = ctranslate2.Translator(
            str(package.package_path / "model"),
            device=settings.device,
            inter_threads=settings.inter_threads,
            intra_threads=settings.intra_threads,
            compute_type=settings.compute_type,
        )
        sentencizer = translator.sentencizer
        sentencizer.detector = SBDetect(sentencizer.lang, use_gpu=False, max_threads=1)

    # Run the same model and tokenizer as Argos, sharing one inference batch
    # across segments and keeping each segment's paragraph boundaries.
    groups = [
        [
            [package.tokenizer.encode(sentence) for sentence in translator.sentencizer.split_sentences(paragraph)]
            for paragraph in translator.split_into_paragraphs(segment)
        ]
        for segment in segments
    ]
    tokens = list(chain.from_iterable(chain.from_iterable(groups)))
    predictions = iter(translator.translator.translate_batch(
        tokens,
        target_prefix=[[package.target_prefix]] * len(tokens) if package.target_prefix else None,
        replace_unknowns=True,
        max_batch_size=settings.batch_size,
        batch_type="tokens",
        beam_size=settings.beam_size,
        length_penalty=0.2,
    ))
    results = []
    for original, paragraphs in zip(segments, groups, strict=True):
        translated = []
        for sentences in paragraphs:
            predicted = chain.from_iterable(next(predictions).hypotheses[0] for _ in sentences)
            text = package.tokenizer.decode(list(predicted))
            translated.append(text.removeprefix(package.target_prefix).strip())
        results.append("\n".join(translated).strip() or original)
    return results


def translate_segments(segments, source, target, english=None):
    from opencc import OpenCC

    if source == target:
        return segments

    if source == "zh_TW":
        converter = OpenCC("t2s")
        segments = [converter.convert(segment) for segment in segments]

    from_code, to_code = model_code(source), model_code(target)
    if from_code != to_code:
        from argostranslate.translate import get_language_from_code

        source_model = get_language_from_code(from_code)
        target_model = get_language_from_code(to_code)
        translator = (
            source_model.get_translation(target_model)
            if source_model is not None and target_model is not None
            else None
        )
        if translator is None:
            raise RuntimeError(
                f"Install the {source} to {target} language packs first with "
                f"python scripts/translate-local.py install {source} {target}."
            )
        segments = translate_batch(translator, segments, english)

    if target == "zh_TW":
        converter = OpenCC("s2tw")
        segments = [converter.convert(segment) for segment in segments]
    return segments


def install_models(source, targets):
    from argostranslate import package

    source_code = model_code(source)
    target_codes = {model_code(target) for target in targets} - {source_code}
    if not target_codes:
        return

    installed = {
        (model.from_code, model.to_code) for model in package.get_installed_packages()
    }
    target_codes = {
        target for target in target_codes
        if (source_code, target) not in installed
        and not {(source_code, "en"), ("en", target)} <= installed
    }
    available = {}
    if target_codes:
        package.update_package_index()
        available = {
            (model.from_code, model.to_code): model
            for model in package.get_available_packages()
            if model.type == "translate"
        }

    required = set()
    for target in target_codes:
        direct = (source_code, target)
        if direct in available or direct in installed:
            required.add(direct)
        else:
            required.update(((source_code, "en"), ("en", target)))
    required = sorted(required - installed)

    def download(pair):
        if pair not in available:
            raise RuntimeError(f"No Argos language pack for {pair[0]} to {pair[1]}.")
        print(f"Downloading {pair[0]} to {pair[1]}", file=sys.stderr)
        return available[pair].download()

    with ThreadPoolExecutor(max_workers=4) as workers:
        for archive in workers.map(download, required):
            package.install_from_path(archive)

    # Fetch sentence splitters during setup so regular translation can run offline.
    for target in targets:
        translate_segments(["测试。" if source_code == "zh" else "Test."], source, target)


def main():
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="mode", required=True)
    install = commands.add_parser("install", help="Download the required language packs")
    install.add_argument("source", choices=LANGUAGES)
    install.add_argument("targets", nargs="+", choices=LANGUAGES)
    batch = commands.add_parser("batch", help="Translate a JSON array of text segments")
    batch.add_argument("source", choices=LANGUAGES)
    batch.add_argument("target", choices=LANGUAGES)
    args = parser.parse_args()

    if args.mode == "install":
        if Path(sys.prefix).resolve() != VENV.resolve():
            if sys.version_info[:2] not in ((3, 11), (3, 12)):
                parser.error("Use Python 3.11 or 3.12 to install offline translation.")
            if not PYTHON.is_file():
                venv.EnvBuilder(system_site_packages=True, with_pip=True).create(VENV)
            if sys.platform == "linux" and find_spec("torch") is None:
                subprocess.run(
                    [str(PYTHON), "-m", "pip", "install", "--index-url",
                     "https://download.pytorch.org/whl/cpu", "torch"],
                    check=True,
                )
            subprocess.run(
                [
                    str(PYTHON), "-m", "pip", "install", "--disable-pip-version-check", "--quiet",
                    "argostranslate==1.11.0", "opencc-python-reimplemented>=0.1.7,<0.2",
                ],
                check=True,
            )
            subprocess.run([str(PYTHON), __file__, *sys.argv[1:]], check=True)
            return
        install_models(args.source, args.targets)
        return

    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    data = json.load(sys.stdin)
    segments = data if isinstance(data, list) else data["segments"]
    english = data.get("english") if isinstance(data, dict) else None
    with redirect_stdout(sys.stderr):
        translated = translate_segments(segments, args.source, args.target, english)
    print(json.dumps(translated, ensure_ascii=False))


if __name__ == "__main__":
    main()
