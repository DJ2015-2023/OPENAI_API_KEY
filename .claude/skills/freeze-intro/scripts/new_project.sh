#!/usr/bin/env bash
# Create a freeze-intro project from the template.  Usage: new_project.sh <project_dir>
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DST="$1"
mkdir -p "$DST"
cp -r "$SKILL/template/." "$DST/"
mkdir -p "$DST/public/gen" "$DST/public/audio" "$DST/work"
echo '{"fps":30,"total":30,"hold":78,"intro":16,"outro":9,"characters":[]}' > "$DST/src/timeline.json"
# reuse an installed Remotion 4.0.537 if one exists in the repo (hard links, no download), else npm install
DONOR="$(ls -d "$SKILL"/../../../*/node_modules/remotion 2>/dev/null | head -1 || true)"
if [ -n "$DONOR" ] && [ ! -e "$DST/node_modules" ]; then
  cp -al "$(dirname "$DONOR")" "$DST/node_modules"
else
  (cd "$DST" && npm install --no-audit --no-fund)
fi
if [ ! -f "$DST/project.json" ]; then
cat > "$DST/project.json" <<'JSON'
{
  "music": "/abs/path/to/song.mp3",
  "characters": [
    {"video": "/abs/path/to/clip1.mp4", "freeze": 2.4, "name": "RUBY JANE", "tag": "DESCRIPTION", "accent": "#E5512A"}
  ]
}
JSON
fi
echo "project ready: $DST  — edit project.json, then: python3 $SKILL/scripts/prepare.py $DST"
