#!/usr/bin/env bash
# Composites the transparent HyperFrames karaoke-captions overlay (ProRes 4444 with alpha)
# over the Remotion render and lays the full audio mix on top.
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -y -loglevel error -i out/main.mp4 -i out/captions.mov -i public/audio/mix.wav \
  -filter_complex "[0:v]fps=30,format=yuv420p,setsar=1[base];[1:v]fps=30,format=yuva420p[cap];[base][cap]overlay=0:0:format=auto,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out/video_final.mp4
ffprobe -v error -show_entries format=duration:stream=width,height,codec_name -of compact out/video_final.mp4
