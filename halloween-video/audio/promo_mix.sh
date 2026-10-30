#!/usr/bin/env bash
# 15s window of the user's track (29.86s–44.86s): drop lands at 2.0s of the promo.
set -euo pipefail
cd "$(dirname "$0")/../public"
ffmpeg -v error -y -ss 29.86 -t 15 -i promo/phonk.wav \
  -af "afade=t=in:d=0.05,volume=-1.5dB,alimiter=limit=0.9,afade=t=out:st=14.2:d=0.8" -ar 48000 -ac 2 promo/promo_mix.wav
echo done
