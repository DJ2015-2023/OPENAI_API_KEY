#!/usr/bin/env bash
# Mix intro audio + score + SFX + Russian VO (with music ducking) into public/audio/final_mix.wav.
# VO offsets/tempos mirror SUBS in src/timeline.ts.
set -euo pipefail
cd "$(dirname "$0")/../public"
ffmpeg -v error -y \
  -i intro.mp4 -i audio/music.wav -i audio/sfx.wav \
  -i vo/t1.wav -i vo/t2.wav -i vo/t3.wav -i vo/t4.wav -i vo/t5.wav -i vo/t6.wav \
  -filter_complex "
  [0:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=out:st=5.4:d=0.6,volume=0.8[intro];
  [3:a]aresample=48000,adelay=6350|6350[v1];
  [4:a]aresample=48000,atempo=1.08,adelay=9100|9100[v2];
  [5:a]aresample=48000,atempo=1.05,adelay=12150|12150[v3];
  [6:a]aresample=48000,atempo=1.2,adelay=14900|14900[v4];
  [7:a]aresample=48000,atempo=1.15,adelay=18500|18500[v5];
  [8:a]aresample=48000,atempo=1.12,adelay=22950|22950[v6];
  [v1][v2][v3][v4][v5][v6]amix=inputs=6:normalize=0,aformat=channel_layouts=stereo,
    highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,
    equalizer=f=3500:t=q:w=1:g=3,volume=1.9,asplit=2[vo][vokey];
  [1:a]aformat=channel_layouts=stereo,volume=0.8[mus];
  [mus][vokey]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[musd];
  [2:a]aformat=channel_layouts=stereo,volume=0.7[sfx];
  [intro][musd][sfx][vo]amix=inputs=4:normalize=0:duration=longest,
    volume=1.35,alimiter=limit=0.93,atrim=0:28.417,afade=t=out:st=27.6:d=0.8[out]" \
  -map "[out]" -ar 48000 -ac 2 audio/final_mix.wav
echo done
