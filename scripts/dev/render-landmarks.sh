#!/usr/bin/env bash
# Renders every landmark in the gallery to PNGs (day, dusk, night; far and near) with headless Chrome, so drawings
# can be checked as real pictures. Needs the dev server on :3100. Usage: scripts/dev/render-landmarks.sh <out-dir> [kind...]
set -u
OUT="${1:?out dir}"; shift
KINDS="${*:-fuji pyramids everest matterhorn kilimanjaro volcano niagara}"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
mkdir -p "$OUT"
PROFILE="$(mktemp -d)"
for k in $KINDS; do
  for tod in day dusk night; do
    for d in far:70 near:28; do
      name="${d%%:*}"; km="${d##*:}"
      url="http://localhost:3100/dev/landmarks-world?one=$k&tod=$tod&freeze=1&ahead=$km"
      timeout 40 "$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$PROFILE" \
        --window-size=1280,760 --run-all-compositor-stages-before-draw --virtual-time-budget=15000 --screenshot="$(cygpath -w "$OUT/$k-$tod-$name.png")" "$url" >/dev/null 2>&1
      echo "$k $tod $name: $([ -s "$OUT/$k-$tod-$name.png" ] && echo ok || echo MISSING)"
    done
  done
done
rm -rf "${PROFILE:?}"
