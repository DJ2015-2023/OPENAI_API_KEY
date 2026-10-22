#!/usr/bin/env bash
# Splices the HyperFrames platforms insert into the Remotion render at [insert.from, insert.to)
# (a colour panel / yellow iris hides both cuts) and lays the full audio mix on top.
set -euo pipefail
cd "$(dirname "$0")/.."
read FROM TO < <(python3 -c "import json;t=json.load(open('src/timing.json'))['insert'];print(t['from'],t['to'])")
N=$((TO - FROM))
ffmpeg -y -loglevel error -i out/main.mp4 -i out/platforms.mp4 -i public/audio/mix.wav \
  -filter_complex "[0:v]fps=30,format=yuv420p,setsar=1,split[m1][m2];\
[m1]trim=end_frame=${FROM},setpts=PTS-STARTPTS[a];\
[1:v]fps=30,format=yuv420p,setsar=1,tpad=stop_mode=clone:stop=30,trim=end_frame=${N},setpts=PTS-STARTPTS[b];\
[m2]trim=start_frame=${TO},setpts=PTS-STARTPTS[c];\
[a][b][c]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out/video_final.mp4
ffprobe -v error -show_entries format=duration:stream=width,height,codec_name -of compact out/video_final.mp4
