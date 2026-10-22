#!/usr/bin/env bash
# Hard-cuts the HyperFrames intro into the Remotion main part (the colour stripes hide the cut)
# and lays the narration/music/SFX mix on top.
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -y -loglevel error -i out/intro.mp4 -i out/main.mp4 -i public/audio/mix.wav \
  -filter_complex "[0:v]fps=30,format=yuv420p,setsar=1[a];[1:v]fps=30,format=yuv420p,setsar=1[b];[a][b]concat=n=2:v=1:a=0[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out/video_final.mp4
ffprobe -v error -show_entries format=duration:stream=width,height,codec_name -of compact out/video_final.mp4
