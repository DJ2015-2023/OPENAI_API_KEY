"""Pick the song section and snap the scene cuts to its beats -> src/timeline.json.

The drop at ~11:07 of the playlist (bass enters after a 4 s riser) is placed on the
title reveal at 4.0 s; every later cut lands on a detected beat near the original plan.
Usage: python3 tools/analyze_song.py <song.mp3>
"""
import json, pathlib, subprocess, sys, tempfile
import numpy as np, librosa

ROOT = pathlib.Path(__file__).resolve().parent.parent
SONG = sys.argv[1]
WIN_START, WIN_LEN = 655.0, 60.0
DROP_IN_VIDEO = 4.0

with tempfile.TemporaryDirectory() as d:
    wav = f"{d}/seg.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(WIN_START), "-t", str(WIN_LEN), "-i", SONG, "-ac", "1", "-ar", "22050", wav], check=True)
    y, sr = librosa.load(wav, sr=None)

tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
beats = beats + WIN_START
# Drop = sharpest rise of low-frequency energy in the window.
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
bass = S[freqs < 150].sum(0)
bass_db = librosa.amplitude_to_db(bass + 1e-6)
times = librosa.frames_to_time(np.arange(len(bass)), sr=sr, hop_length=512) + WIN_START
jump = np.full(len(bass_db), -np.inf)
for i in range(40, len(bass_db) - 20):
    jump[i] = bass_db[i : i + 20].mean() - bass_db[i - 40 : i].mean()
drop_raw = times[np.argmax(jump)]
drop = drop_raw  # bass entry is the downbeat; librosa's beats wobble around it
beat = float(np.median(np.diff(beats)))
offset = drop - DROP_IN_VIDEO
# Regular beat grid anchored on the drop (the track is quantised, so this stays locked).
vb = DROP_IN_VIDEO + beat * np.arange(-8, 70)

planned = {"title": 4.0, "passion": 8.5, "date": 13.0, "dress": 17.4, "prices": 21.9, "location": 27.4, "poster": 31.9}
cuts = {k: round(float(vb[np.argmin(np.abs(vb - v))]), 3) for k, v in planned.items()}
# Where the drop section ends (energy collapses) on the video clock.
rms = librosa.feature.rms(y=y, hop_length=512)[0]
rdb = librosa.amplitude_to_db(rms)
after = (times > drop + 10)
fall_idx = np.where(after & (rdb < rdb[after].max() - 15))[0]
music_end = float(times[fall_idx[0]] - offset) if len(fall_idx) else 40.0

out = {"songOffset": round(float(offset), 3), "bpm": round(60 / beat, 2), "beat": round(beat, 4),
       "dropRaw": round(float(drop_raw), 2), "cuts": cuts, "musicEnd": round(music_end, 2),
       "beatsVideo": [round(float(b), 3) for b in vb if 0 <= b <= 40]}
(ROOT / "src/timeline.json").write_text(json.dumps(out, indent=1))
print({k: out[k] for k in ("songOffset", "bpm", "beat", "dropRaw", "cuts", "musicEnd")})
