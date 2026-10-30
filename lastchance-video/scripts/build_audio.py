"""«Last chance» ticket promo: the user's RAVE track + female voiceover + CC0 SFX.

The track's drop (16.06 s) lands on «850 ₽». Outputs src/timing.json and public/audio/mix.wav.
"""
import json
import os
import subprocess

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX = "/home/user/Barty-Bart/motion-graphics/skills/sound-effects/sfx"
SONG = "/root/.claude/uploads/a159dcea-d751-5472-b97a-718a775da2cc/f5caa6f5-Dxrk_____-_RAVE_Official_Audio_1.mp3"
SR = 48000
FPS = 24
SONG_DROP = 16.06
SONG_BEAT = 0.5
DROP = 12.0
TOTAL = 45.0
SCENES = [
    ("hook", 0.0, 4.0),
    ("logo", 4.0, 8.6),
    ("today", 8.6, DROP),
    ("price", DROP, 14.4),
    ("ladder", 14.4, 22.0),
    ("why", 22.0, 23.8),
    ("vibes", 23.8, 29.8),
    ("info", 29.8, 35.6),
    ("cta", 35.6, 40.4),
    ("final", 40.4, TOTAL),
]
VO = {"n1": 0.3, "n2": 4.25, "n3": 8.8, "n4": 12.05, "n5": 14.55, "n6": 22.15, "n7": 24.05, "n8": 30.0, "n9": 35.8, "n10": 40.9}
STOP = (11.62, DROP)  # music cuts out on «…всего» and slams back on the drop
N = int(TOTAL * SR)


def filt(x, kind, f):
    return signal.lfilter(*signal.butter(2, np.array(f) / (SR / 2), kind), x).astype(np.float32)


def put(buf, x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    e = min(len(buf), i + len(x))
    if e <= i:
        return
    if x.ndim == 1:
        x = np.stack([x * (1 - max(0, pan)), x * (1 + min(0, pan))], 1)
    buf[i:e] += x[: e - i] * g


def decode(path, start=0.0, dur=None, ch=2):
    cmd = ["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + ["-i", path, "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()
    return x.reshape(-1, ch) if ch == 2 else x


def sfx(name, gain=1.0):
    x = decode(os.path.join(SFX, name), ch=1)
    return x / (np.abs(x).max() + 1e-9) * gain


def load(pid):
    sr, x = wavfile.read(os.path.join(ROOT, "narration", f"{pid}.wav"))
    x = x.astype(np.float32) / (32768.0 if x.dtype == np.int16 else 1.0)
    idx = np.where(np.abs(x) > 0.004)[0]
    x = x[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.08 * SR)]
    x = filt(x, "high", 90)
    return (x / (np.abs(x).max() + 1e-9) * 0.9).astype(np.float32)


def main():
    words = json.load(open(os.path.join(ROOT, "narration/words.json")))
    vo = np.zeros((N, 2), np.float32)
    for pid, at in VO.items():
        put(vo, load(pid), at)
    fr = lambda s: int(round(s * FPS))
    timing = {
        "fps": FPS,
        "total": fr(TOTAL),
        "drop": fr(DROP),
        "beat": SONG_BEAT * FPS,
        "phase": DROP * FPS,
        "stop": [fr(STOP[0]), fr(STOP[1])],
        "scenes": {k: {"from": fr(a), "dur": fr(b) - fr(a)} for k, a, b in SCENES},
        "words": {pid: [[w, fr(VO[pid] + t)] for w, t in words[pid]["words"]] for pid in VO},
    }
    json.dump(timing, open(os.path.join(ROOT, "src/timing.json"), "w"), ensure_ascii=False, indent=1)

    mus = np.zeros((N, 2), np.float32)
    x = decode(SONG, SONG_DROP - DROP, TOTAL)[:N]
    mus[: len(x)] = x
    env = np.ones(N, np.float32)
    env[int(STOP[0] * SR): int(STOP[1] * SR)] = 0.0
    env = signal.filtfilt(*signal.butter(1, 40 / (SR / 2)), env)
    mus *= np.clip(env, 0, 1)[:, None]
    fade = int(0.6 * SR)
    mus[:fade] *= np.linspace(0, 1, fade)[:, None]
    mus /= np.abs(mus).max() + 1e-9

    fx = np.zeros((N, 2), np.float32)
    S = {k: a for k, a, _ in SCENES}
    put(fx, sfx("impact/fs-222517-dramatic-hit.ogg"), 0.25, 0.6)  # «ВНИМАНИЕ!»
    put(fx, sfx("whoosh/fs-169867-swoosh.ogg"), S["logo"] - 0.2, 0.5)
    put(fx, sfx("transition/fs-702773-swipe-wav.ogg"), S["today"] - 0.2, 0.5)
    for k in range(6):  # clock ticking into the stop
        put(fx, sfx("tick/fs384187.ogg"), S["today"] + 0.4 + k * 0.5, 0.25)
    put(fx, sfx("riser/fs-685256-riser-sound-effect-short-wav.ogg")[: int(1.6 * SR)], DROP - 1.6, 0.35)
    put(fx, sfx("impact/fs-177242-cinematic-impact.ogg"), DROP, 0.9)
    put(fx, sfx("ding/kenney-interface-confirmation-002.ogg"), DROP + 0.15, 0.35)
    for t in (14.55, 16.5, 18.38, 20.62):  # one pop per price row
        put(fx, sfx("pop/fs-824189-pop-in-sfx.ogg"), t, 0.35)
    put(fx, sfx("glitch/" + sorted(os.listdir(os.path.join(SFX, "glitch")))[0]), S["why"], 0.3)
    put(fx, sfx("whoosh/fs-683101-quick-woosh.ogg"), S["vibes"] - 0.2, 0.5, pan=-0.3)
    put(fx, sfx("whoosh/fs-169867-swoosh.ogg"), S["info"] - 0.2, 0.5, pan=0.3)
    put(fx, sfx("transition/fs-702773-swipe-wav.ogg"), S["cta"] - 0.2, 0.5)
    put(fx, sfx("impact/fs-347561-micheal-bay-hit.ogg"), S["final"] + 0.05, 0.5)
    put(fx, sfx("ding/fs-349504-triangle-open-04.ogg"), S["final"] + 1.0, 0.3)

    venv = signal.filtfilt(*signal.butter(1, 4 / (SR / 2)), np.abs(vo[:, 0]))
    vmask = np.clip(venv * 12, 0, 1)
    mid = np.stack([signal.filtfilt(*signal.butter(2, [200 / (SR / 2), 5000 / (SR / 2)], "band"), mus[:, c]) for c in (0, 1)], 1)
    mus = mus - mid * (0.7 * vmask)[:, None]
    mus *= (1 - 0.6 * vmask)[:, None]
    mix = vo * 1.0 + mus * 0.5 + fx * 0.4
    mix = np.tanh(mix / np.abs(mix).max() * 1.2) / np.tanh(1.2) * 0.95
    mix[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None]
    os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))


if __name__ == "__main__":
    main()
