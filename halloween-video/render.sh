#!/usr/bin/env bash
# Full pipeline: score → HyperFrames scene 4 → Remotion picture → audio mix → final MP4.
set -euo pipefail
cd "$(dirname "$0")"
CH=${CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
python3 audio/music.py public/audio
(cd hf-scene4 && npx hyperframes render -o ../public/scene4.mp4 --fps 24 --quiet)
npx remotion render src/index.tsx LatinFusionHalloween out/picture.mp4 --browser-executable="$CH" --muted --codec=h264 --crf=16 --concurrency=4 --log=error
./audio/mix.sh
ffmpeg -v error -y -i out/picture.mp4 -i public/audio/final_mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out/latin_fusion_halloween_9x16.mp4
echo "→ out/latin_fusion_halloween_9x16.mp4"
