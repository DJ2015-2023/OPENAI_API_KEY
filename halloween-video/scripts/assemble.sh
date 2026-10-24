#!/usr/bin/env bash
# Pipeline: build_audio.py -> make_assets.py -> make_info.py -> hyperframes render (public/hf/info.mp4)
# -> remotion render (out/main.mp4, already carries the mix) -> final x264/AAC encode.
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -y -loglevel error -i out/main.mp4 -i public/audio/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out/video_final.mp4
ffprobe -v error -show_entries format=duration:stream=width,height,codec_name -of compact out/video_final.mp4
