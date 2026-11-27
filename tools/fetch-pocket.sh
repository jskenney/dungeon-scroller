#!/usr/bin/env bash
# Download what the Pocket TTS voice needs, so the game loads it from this site instead of
# cdn.jsdelivr.net and huggingface.co. Adapted from the EPUB reader's fetch-pocket.sh; the folder it
# fills has the same layout, so the two can share one.
#
#   tools/fetch-pocket.sh                      the 8-bit English model (about 170 MB) into ./pocket/
#   tools/fetch-pocket.sh --full               the full-precision model as well (about 430 MB more)
#   tools/fetch-pocket.sh --cloning            also the voice encoder, needed only if a character's
#                                              voice in the catalogs is a recording ("clip")
#   tools/fetch-pocket.sh --dest /srv/reader/pocket    into another folder, for example the reader's
#
# Then set speech.pocket.files in dungeon.json to that folder if it is not ./pocket/.
# Safe to re-run: finished files are skipped and interrupted downloads resume. Files are checked
# against checksums/pocket.sha256; any that do not match are removed (run it again).
# The game uses each part (lib/, ort/, model/) from here only when all of its files are present,
# and takes the rest from the CDNs if speech.pocket.allowCdn is true.
set -euo pipefail
cd "$(dirname "$0")/.."

POCKET_JS=0.1.0                                         # must match POCKET.lib in js/speech/pocket.js
ORT=1.20.0                                              # must match POCKET.ort
REPO=vlapky/pocket-tts-onnx
REV=c469236dbc5f68287fa2fbf175b66de3b80123af            # must match POCKET.model
BUNDLE=english_2026-04                                  # must match POCKET.bundle
DEST=pocket
SUMS=checksums/pocket.sha256

JSD=https://cdn.jsdelivr.net/npm
HF=https://huggingface.co/$REPO/resolve/$REV/onnx

command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }

FULL=0 CLONING=0 VERIFY=1
while [ $# -gt 0 ]; do
  case "$1" in
    --full) FULL=1 ;;
    --cloning) CLONING=1 ;;
    --no-verify) VERIFY=0 ;;
    --dest) shift; [ $# -gt 0 ] || { echo "--dest needs a folder" >&2; exit 2; }; DEST=${1%/} ;;
    *) echo "Unknown option: $1 (options: --full, --cloning, --dest DIR, --no-verify)" >&2; exit 2 ;;
  esac
  shift
done

get() {   # get URL PATH-UNDER-DEST
  local url=$1 out=$DEST/$2
  if [ -s "$out" ]; then echo "  have   $2"; return; fi
  mkdir -p "$(dirname "$out")"
  echo "  fetch  $2"
  if [ -f "$out.part" ] && [ "$(cat "$out.part.url" 2>/dev/null)" != "$url" ]; then rm -f "$out.part"; fi
  printf '%s\n' "$url" > "$out.part.url"
  local rc=0
  curl -fL --retry 3 --retry-delay 2 -C - --progress-bar -o "$out.part" "$url" || rc=$?
  if [ "$rc" = 33 ]; then rm -f "$out.part"; rc=0; curl -fL --retry 3 --retry-delay 2 --progress-bar -o "$out.part" "$url" || rc=$?; fi
  [ "$rc" = 0 ] || { echo "  failed $2 (curl exit $rc; run the script again to resume)" >&2; exit 1; }
  mv "$out.part" "$out"; rm -f "$out.part.url"
}

echo "Library (pocket-tts-js $POCKET_JS)"
for f in worker.js binary.js tokenizer.js; do get "$JSD/pocket-tts-js@$POCKET_JS/src/$f" "lib/$f"; done

echo "ONNX Runtime Web $ORT"
for f in ort.min.mjs ort-wasm-simd-threaded.mjs ort-wasm-simd-threaded.wasm; do get "$JSD/onnxruntime-web@$ORT/dist/$f" "ort/$f"; done

echo "Model: $BUNDLE"
for f in bundle.json tokenizer.model voices.bin; do get "$HF/$BUNDLE/$f" "model/$BUNDLE/$f"; done
suffixes=(_int8); [ "$FULL" = 1 ] && suffixes+=("")
for s in "${suffixes[@]}"; do
  for f in text_conditioner flow_lm_main flow_lm_flow mimi_decoder; do get "$HF/$BUNDLE/$f$s.onnx" "model/$BUNDLE/$f$s.onnx"; done
  if [ "$CLONING" = 1 ]; then get "$HF/$BUNDLE/mimi_encoder$s.onnx" "model/$BUNDLE/mimi_encoder$s.onnx"; fi
done
# (The encoder's companion file is named in bundle.json; its usual name is tried.)
if [ "$CLONING" = 1 ]; then get "$HF/$BUNDLE/bos_before_voice.npy" "model/$BUNDLE/bos_before_voice.npy"; fi

echo "Licences"
get "$JSD/pocket-tts-js@$POCKET_JS/LICENSE"  LICENSES/pocket-tts-js.txt
get "$HF/LICENSE"                            LICENSES/pocket-tts-model-LICENSE.txt
get "https://huggingface.co/$REPO/resolve/$REV/README.md" LICENSES/pocket-tts-onnx-model-card.md

if [ "$VERIFY" = 0 ]; then echo "Checksums not checked (--no-verify)."
else
  if command -v sha256sum >/dev/null; then tool=(sha256sum); elif command -v shasum >/dev/null; then tool=(shasum -a 256)
  else echo "Neither sha256sum nor shasum is installed, so the downloads can't be checked (or use --no-verify)." >&2; exit 1; fi
  echo "Checking files against $SUMS"
  bad=0
  while read -r hash path; do
    [ -f "$DEST/$path" ] || continue
    if [ "$("${tool[@]}" "$DEST/$path" | cut -d' ' -f1)" != "$hash" ]; then echo "  BAD    $path (removed)"; rm -f "$DEST/$path"; bad=1; fi
  done < "$SUMS"
  [ "$bad" = 0 ] || { echo "Some files didn't match their checksums and were removed; run this script again." >&2; exit 1; }
  echo "All listed files match their checksums."
  if [ "$CLONING" = 1 ]; then echo "  note   the voice encoder files have no pinned checksum and were not checked"; fi
fi

if [ ! -f "$DEST/LICENSES/NOTICE.txt" ]; then cat > "$DEST/LICENSES/NOTICE.txt" <<NOTICE
Self-hosted copies of the files the Pocket TTS voice uses, fetched by fetch-pocket.sh.

pocket-tts-js $POCKET_JS (lib/)         MIT          https://github.com/vlapky/pocket-tts-js
ONNX Runtime Web $ORT (ort/)        MIT          https://github.com/microsoft/onnxruntime
Pocket TTS ONNX export (model/)       CC-BY-4.0    https://huggingface.co/$REPO (revision $REV)
  Pocket TTS by Kyutai                CC-BY-4.0    https://huggingface.co/kyutai/pocket-tts
Attribution: "Pocket TTS" by Kyutai, licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
NOTICE
fi

echo
du -sh "$DEST" | awk '{print "Done: " $1 " in " $2 "/"}'
