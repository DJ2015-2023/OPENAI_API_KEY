"""15-second cut of the «Сегодня тот самый день» party-day promo: the user's orchestral Halloween track + female voiceover + CC0 SFX.

The track's opening orchestral stabs (song 0–10.6 s) cut straight into the tail of its hush, so the
post-silence drop (song 66.10 s) lands on the poster reveal at 11.4 s.
Outputs src/timing.json and public/audio/mix.wav.
"""
import json
import os
import subprocess

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX = "/home/user/Barty-Bart/motion-graphics/skills/sound-effects/sfx"
SONG = "/root/.claude/uploads/a159dcea-d751-5472-b97a-718a775da2cc/ae576d7a-Halloween_Orchestra_Creepy_by_Infraction_No_Copyright_Music___Halloween_Night_320k.mp3"
SR = 48000
FPS = 24
BEAT, PHASE = 0.5, 0.1
SPLICE, JUMP = 10.6, 65.3  # cut from the opening stabs straight into the end of the hush before the drop
DROP = SPLICE + (66.10 - JUMP)
HITS = [0.09, 0.6, 1.6, 2.11, 2.6, 3.6, 4.11, 4.62, 5.62, 6.62]  # orchestral stabs in the intro
TOTAL = 15.0
SCENES = [
    ("hook", 0.0, 3.6),
    ("home", 3.6, 7.4),
    ("tickets", 7.4, DROP),
    ("final", DROP, TOTAL),
]
VO = {"n1": 1.0, "n7": 3.75, "n8": 7.45, "n11": 11.75}
TRIM = {"n8": 0.9}  # start n8 at «сегодня», dropping «важно»
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
    x = x[int(TRIM.get(pid, 0) * SR):]
    idx = np.where(np.abs(x) > 0.004)[0]
    x = x[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.08 * SR)]
    x = filt(x, "high", 90)
    return (x / (np.abs(x).max() + 1e-9) * 0.9).astype(np.float32)


def music():
    xf = int(0.05 * SR)
    a = decode(SONG, 0.0, SPLICE + 0.05)
    b = decode(SONG, JUMP, TOTAL - SPLICE)
    out = np.zeros((N, 2), np.float32)
    n = int(SPLICE * SR)
    out[:n] = a[:n]
    ramp = np.linspace(0, 1, xf)[:, None]
    out[n: n + xf] = a[n: n + xf] * (1 - ramp) + b[:xf] * ramp
    out[n + xf: n + len(b)] = b[xf: N - n]
    return out / (np.abs(out).max() + 1e-9)


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
        "beat": BEAT * FPS,
        "phase": PHASE * FPS,
        "hits": [fr(h) for h in HITS],
        "silence": [fr(SPLICE), fr(DROP)],
        "scenes": {k: {"from": fr(a), "dur": fr(b) - fr(a)} for k, a, b in SCENES},
        "words": {pid: [[w, fr(VO[pid] + t - TRIM.get(pid, 0) + 0.03)] for w, t in words[pid]["words"] if t >= TRIM.get(pid, 0) - 0.05] for pid in VO},
    }
    json.dump(timing, open(os.path.join(ROOT, "src/timing.json"), "w"), ensure_ascii=False, indent=1)

    mus = music()
    fx = np.zeros((N, 2), np.float32)
    S = {k: a for k, a, _ in SCENES}
    put(fx, sfx("impact/fs-222517-dramatic-hit.ogg"), HITS[0], 0.45)
    put(fx, sfx("whoosh/fs-169867-swoosh.ogg"), S["home"] - 0.2, 0.45)
    put(fx, sfx("impact/fs-347561-micheal-bay-hit.ogg"), S["tickets"], 0.4)
    for t in [VO["n8"] + t - TRIM["n8"] for t in (1.64, 3.24, 3.64)]:
        put(fx, sfx("pop/fs-824189-pop-in-sfx.ogg"), t, 0.3)
    put(fx, sfx("impact/fs-177242-cinematic-impact.ogg"), DROP, 0.8)
    put(fx, sfx("ding/fs-349504-triangle-open-04.ogg"), DROP + 1.0, 0.3)

    venv = signal.filtfilt(*signal.butter(1, 4 / (SR / 2)), np.abs(vo[:, 0]))
    vmask = np.clip(venv * 12, 0, 1)
    mid = np.stack([signal.filtfilt(*signal.butter(2, [200 / (SR / 2), 5000 / (SR / 2)], "band"), mus[:, c]) for c in (0, 1)], 1)
    mus = mus - mid * (0.7 * vmask)[:, None]
    mus *= (1 - 0.55 * vmask)[:, None]
    mix = vo * 1.0 + mus * 0.55 + fx * 0.4
    mix = np.tanh(mix / np.abs(mix).max() * 1.2) / np.tanh(1.2) * 0.95
    mix[-int(1.0 * SR):] *= np.linspace(1, 0, int(1.0 * SR))[:, None]
    os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))


if __name__ == "__main__":
    main()
