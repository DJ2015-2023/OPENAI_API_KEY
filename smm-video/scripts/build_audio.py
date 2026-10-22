"""Lays out the narration (ElevenLabs "Liam" clips in narration/), builds a half-time trap
bed (808 + rolling hats) with social-media SFX, and writes the timing map.

Outputs:
  src/timing.json                   scene + word timings in frames (whole film; Remotion renders all of it)
  hyperframes/platforms/timing.json  timings (seconds, relative to the insert) for the HyperFrames platforms insert
  public/audio/mix.wav              full stereo mix
"""
import json
import os

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
FPS = 30
BPM = 140
BEAT = 60 / BPM

# (clip id, scene, gap after in seconds)
CLIPS = [
    ("s01", "hook", 0.5),
    ("s02", "pro", 0.5),
    ("s03", "services", 0.55),
    ("s04", "platforms", 0.55),
    ("s05", "system", 0.55),
    ("s06", "cta", 2.0),
]
LEAD_IN = 0.8
rng = np.random.default_rng(23)


def load(pid):
    sr, x = wavfile.read(os.path.join(ROOT, "narration", f"{pid}.wav"))
    x = x.astype(np.float32) / (32768.0 if x.dtype == np.int16 else 1.0)
    if x.ndim > 1:
        x = x.mean(axis=1)
    x = signal.resample_poly(x, SR, sr).astype(np.float32)
    idx = np.where(np.abs(x) > 0.004)[0]
    head = max(0, idx[0] - int(0.06 * SR))
    x = x[head: idx[-1] + int(0.08 * SR)]
    b, a = signal.butter(2, 80 / (SR / 2), "high")
    x = signal.lfilter(b, a, x)
    return (x / (np.abs(x).max() + 1e-9) * 0.9).astype(np.float32), head / SR


def t_axis(d):
    return np.arange(int(d * SR)) / SR


# ------------------------------------------------------------------ sfx
def like_pop():
    t = t_axis(0.22)
    f = 900 * (1 + 1.5 * np.exp(-t * 30))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)
    sparkle = np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 35) * 0.3
    return ((body + sparkle) * 0.6).astype(np.float32)


def shutter():
    out = np.zeros(int(0.18 * SR), np.float32)
    for k, at in enumerate((0.0, 0.07)):
        t = t_axis(0.05)
        n = rng.standard_normal(len(t))
        b, a = signal.butter(2, [1200 / (SR / 2), 6000 / (SR / 2)], "band")
        c = signal.lfilter(b, a, n) * np.exp(-t * 90) * (0.9 if k == 0 else 0.6)
        i = int(at * SR)
        out[i:i + len(c)] += c.astype(np.float32)
    return out


def ding(f0=1318):
    t = t_axis(0.8)
    x = (np.sin(2 * np.pi * f0 * t) + 0.5 * np.sin(2 * np.pi * f0 * 2.01 * t) + 0.2 * np.sin(2 * np.pi * f0 * 3.02 * t)) * np.exp(-t * 6)
    return (x * 0.35).astype(np.float32)


def whoosh(d=0.45, up=True):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    f = np.linspace(400, 7000, len(t)) if up else np.linspace(7000, 400, len(t))
    for i in range(0, len(n), 512):
        fc = f[i]
        b, a = signal.butter(2, [fc * 0.6 / (SR / 2), min(0.99, fc * 1.5 / (SR / 2))], "band")
        out[i:i + 512] = signal.lfilter(b, a, n[i:i + 512])
    return (out * np.sin(np.linspace(0, np.pi, len(t))) ** 2 * 0.8).astype(np.float32)


def riser(d=1.5):
    t = t_axis(d)
    f = 300 * 2 ** (t / d * 2.5)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2
    return ((tone + whoosh(d) * 0.7) * (t / d) ** 2).astype(np.float32)


def sub_drop():
    t = t_axis(1.4)
    f = 70 * np.exp(-t * 1.5) + 30
    return (np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 2) * np.exp(-t * 2) * 0.9).astype(np.float32)


def cash():
    a, b = ding(2093), ding(2637)
    out = np.zeros(int(0.9 * SR), np.float32)
    out[: len(a)] += a
    out[int(0.07 * SR): int(0.07 * SR) + len(b)] += b[: len(out) - int(0.07 * SR)]
    return out


def rocket():
    t = t_axis(2.2)
    n = rng.standard_normal(len(t))
    b, a = signal.butter(2, 900 / (SR / 2))
    rumble = signal.lfilter(b, a, n) * np.minimum(1, t * 3) * np.exp(-np.maximum(0, t - 1.4) * 3)
    return (rumble * 0.9 + whoosh(2.2) * 0.5).astype(np.float32)


# ------------------------------------------------------------------ music
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)
ROOTS = [45, 41, 43, 40]  # Am – F – G – Em (one per bar)
PENT = [57, 60, 62, 64, 67, 69, 72]  # A minor pentatonic


def kick808(note):
    t = t_axis(0.9)
    f = NOTE(note) * (1 + 3 * np.exp(-t * 40))
    return (np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 1.8) * np.exp(-t * 2.6)).astype(np.float32)


def snare():
    t = t_axis(0.25)
    n = rng.standard_normal(len(t))
    b, a = signal.butter(2, [1500 / (SR / 2), 8000 / (SR / 2)], "band")
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return ((signal.lfilter(b, a, n) * np.exp(-t * 18) * 0.8 + tone * 0.4) * 0.8).astype(np.float32)


def hat(open_=False):
    t = t_axis(0.18 if open_ else 0.04)
    n = rng.standard_normal(len(t))
    b, a = signal.butter(2, 9000 / (SR / 2), "high")
    return (signal.lfilter(b, a, n) * np.exp(-t * (14 if open_ else 110)) * 0.35).astype(np.float32)


def bell(note):
    t = t_axis(0.6)
    fr = NOTE(note)
    x = np.sin(2 * np.pi * fr * t + 1.6 * np.sin(2 * np.pi * fr * 3.5 * t) * np.exp(-t * 8)) * np.exp(-t * 5)
    return (x * 0.25).astype(np.float32)


def music(total, intensity):
    n = int(total * SR)
    L = np.zeros(n, np.float32)
    R = np.zeros(n, np.float32)

    def put(x, at, g=1.0, pan=0.0):
        i = int(at * SR)
        e = min(n, i + len(x))
        if i >= n or e <= i:
            return
        L[i:e] += x[: e - i] * g * (1 - max(0, pan))
        R[i:e] += x[: e - i] * g * (1 + min(0, pan))

    bar = BEAT * 4
    for b in range(int(total / bar) + 1):
        t0 = b * bar
        lvl = intensity(t0)
        root = ROOTS[b % 4]
        # 808 pattern (half-time): 1, a-of-2, 3+
        if lvl > 0.2:
            for pos in (0, 1.75, 2.5):
                put(kick808(root - 12), t0 + pos * BEAT, 0.55)
        if lvl > 0.45:
            put(snare(), t0 + 2 * BEAT, 0.6)  # half-time snare on 3
        if lvl > 0.1:
            for s in range(8):
                put(hat(), t0 + s * BEAT / 2, 0.6, pan=0.3)
            if lvl > 0.6 and b % 2 == 1:  # hat roll
                for s in range(6):
                    put(hat(), t0 + 3 * BEAT + s * BEAT / 6, 0.45, pan=-0.3)
            put(hat(True), t0 + 3.5 * BEAT, 0.35)
        # bell melody (deterministic pentatonic walk)
        for s in range(8):
            if rng.random() < 0.55:
                note = PENT[int(rng.integers(0, len(PENT)))] + 12
                put(bell(note), t0 + s * BEAT / 2, 0.55 * (0.4 + 0.6 * lvl), pan=(0.5 if s % 2 else -0.5))
        # airy pad
        tpad = t_axis(bar)
        pad = sum(np.sin(2 * np.pi * NOTE(root + iv + 24) * tpad) for iv in (0, 7, 12, 15)) * 0.03
        pad *= np.minimum(1, tpad * 3) * np.minimum(1, (bar - tpad) * 3)
        put(pad.astype(np.float32), t0, 0.8)
    return np.stack([L, R], 1)


def place(buf, clip, at, gain=1.0, pan=0.0):
    i0 = int(at * SR)
    if i0 < 0:
        clip, i0 = clip[-i0:], 0
    e = min(len(buf), i0 + len(clip))
    if e <= i0:
        return
    c = clip[: e - i0] * gain
    buf[i0:e, 0] += c * (1 - max(0, pan))
    buf[i0:e, 1] += c * (1 + min(0, pan))


def main():
    words = json.load(open(os.path.join(ROOT, "narration/words.json")))
    clips, starts, scenes = {}, {}, {}
    t, prev = LEAD_IN, None
    for pid, scene, gap in CLIPS:
        x, head = load(pid)
        clips[pid] = x
        if scene != prev:
            if prev:
                scenes[prev]["end"] = t - 0.2
            scenes[scene] = {"start": t - (0.35 if prev else LEAD_IN)}
            prev = scene
        starts[pid] = (t, head)
        t += len(x) / SR + gap
    scenes[prev]["end"] = t
    total = t
    W = lambda pid, i: starts[pid][0] + max(0.0, words[pid]["words"][i][1] - starts[pid][1])

    fr = lambda s: int(round(s * FPS))
    rem = {
        "fps": FPS,
        "total": fr(total),
        "scenes": {k: {"from": fr(v["start"]), "dur": fr(v["end"]) - fr(v["start"]) + 10} for k, v in scenes.items()},
        "clips": {pid: {"from": fr(st), "dur": int(round(len(clips[pid]) / SR * FPS))} for pid, (st, _) in starts.items()},
        "words": {pid: [[w, fr(W(pid, i))] for i, (w, _) in enumerate(words[pid]["words"])] for pid in starts},
    }
    rem["scenes"]["cta"]["dur"] = rem["total"] - rem["scenes"]["cta"]["from"]
    # the HyperFrames insert replaces exactly [platforms.from, system.from)
    rem["insert"] = {"from": rem["scenes"]["platforms"]["from"], "to": rem["scenes"]["system"]["from"]}
    with open(os.path.join(ROOT, "src/timing.json"), "w") as f:
        json.dump(rem, f, ensure_ascii=False, indent=1)

    ins0 = rem["insert"]["from"] / FPS
    ins = {
        "duration": round((rem["insert"]["to"] - rem["insert"]["from"]) / FPS, 3),
        "words": [[w, round(W("s04", i) - ins0, 3)] for i, (w, _) in enumerate(words["s04"]["words"])],
    }
    os.makedirs(os.path.join(ROOT, "hyperframes/platforms"), exist_ok=True)
    with open(os.path.join(ROOT, "hyperframes/platforms/timing.json"), "w") as f:
        json.dump(ins, f, ensure_ascii=False, indent=1)

    # ------------------------------------------------ mix
    n = int((total + 0.3) * SR)
    vo = np.zeros((n, 2), np.float32)
    for pid, (st, _) in starts.items():
        place(vo, clips[pid], st)

    S = scenes

    def intensity(tt):
        if tt < S["pro"]["start"]:
            return 0.5
        if tt < S["services"]["start"]:
            return 0.3
        if tt < S["system"]["start"]:
            return 1.0
        if tt < S["cta"]["start"]:
            return 0.75
        return 1.0

    mus = music(total + 0.3, intensity)
    fx = np.zeros((n, 2), np.float32)
    # hook
    place(fx, sub_drop(), S["hook"]["start"] + 0.2, 0.8)
    for i in (10, 13, 16):
        place(fx, like_pop(), W("s01", i), 0.8)
        place(fx, ding(1568), W("s01", i) + 0.05, 0.3)
    for k in range(10):
        place(fx, like_pop() * 0.4, S["hook"]["start"] + 0.6 + k * 0.7, 0.5, pan=(k % 2 - 0.5))
    place(fx, whoosh(0.45), S["pro"]["start"] - 0.25, 0.8)
    # pro: profile + follow tap
    place(fx, shutter(), W("s02", 3), 0.9)
    place(fx, like_pop(), W("s02", 5) + 0.2, 0.8)
    place(fx, ding(), W("s02", 5) + 0.35, 0.6)
    place(fx, whoosh(0.4, False), S["services"]["start"] - 0.2, 0.8)
    # services: a swipe per story
    for i in (2, 6, 10, 12, 14, 18):
        place(fx, whoosh(0.3), W("s03", i) - 0.15, 0.6)
        place(fx, like_pop() * 0.6, W("s03", i), 0.5)
    place(fx, riser(1.2), W("s03", 21) - 0.6, 0.6)
    place(fx, whoosh(0.5), S["platforms"]["start"] - 0.2, 0.9)
    # platforms (HyperFrames insert): pop per app
    for i in (2, 3, 4, 6, 7, 8):
        place(fx, like_pop(), W("s04", i), 0.7)
    place(fx, whoosh(0.5, False), S["system"]["start"] - 0.2, 0.9)
    # system: posts shutter, then KPI dings
    place(fx, shutter(), W("s05", 4), 0.8)
    place(fx, sub_drop(), W("s05", 8), 0.7)
    for i, note in zip((13, 14, 17, 20), (1046, 1175, 1318, 1568)):
        place(fx, ding(note), W("s05", i), 0.6)
    place(fx, whoosh(0.5), S["cta"]["start"] - 0.25, 0.9)
    # cta: notification, rocket launch, cash
    place(fx, ding(1760), W("s06", 0), 0.7)
    place(fx, rocket(), W("s06", 8) - 0.3, 0.8)
    place(fx, sub_drop(), W("s06", 21), 0.8)
    place(fx, cash(), W("s06", 28), 0.7)

    venv = np.abs(vo[:, 0])
    b, a = signal.butter(1, 6 / (SR / 2))
    venv = signal.filtfilt(b, a, venv)
    mus *= (1 - np.clip(venv * 5, 0, 0.5))[:, None]
    mix = vo * 1.0 + mus * 0.5 + fx * 0.5
    mix = np.tanh(mix / np.abs(mix).max() * 1.5) / np.tanh(1.5) * 0.95
    fade = int(0.8 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    print(json.dumps({"total": round(total, 2), "scenes": {k: [round(v["start"], 2), round(v["end"], 2)] for k, v in scenes.items()}, "insert": rem["insert"]}, indent=1))


if __name__ == "__main__":
    main()
