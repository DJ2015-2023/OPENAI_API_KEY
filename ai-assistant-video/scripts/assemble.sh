#!/usr/bin/env bash
# Joins the Remotion part and the HyperFrames CTA with a 0.5s circle-open transition,
# then lays the full narration/music/SFX mix on top.
set -euo pipefail
cd "$(dirname "$0")/.."
REM=out/remotion_part.mp4
CTA=out/cta.mp4
XF=0.5
OFF=$(python3 -c "import subprocess;d=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','$REM']));print(round(d-$XF,3))")
ffmpeg -y -loglevel error -i "$REM" -i "$CTA" -i public/audio/mix.wav \
  -filter_complex "[0:v]fps=30,format=yuv420p,setsar=1[a];[1:v]fps=30,format=yuv420p,setsar=1[b];[a][b]xfade=transition=circleopen:duration=$XF:offset=$OFF[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out/video_final.mp4
ffprobe -v error -show_entries format=duration:stream=width,height,codec_name -of compact out/video_final.mp4
