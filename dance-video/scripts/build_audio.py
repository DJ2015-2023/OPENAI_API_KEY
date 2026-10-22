"""Lays out the narration (ElevenLabs "Liam" clips in narration/), synthesises a salsa groove
(3-2 son clave, piano montuno, conga tumbao, bass tumbao) with elegant SFX, and writes timings.

Outputs:
  src/timing.json                scene + word timings in frames (whole film; Remotion renders all of it)
  hyperframes/offer/timing.json  timings (seconds, relative to the insert) for the HyperFrames gift insert
  public/audio/mix.wav           full stereo mix
"""
import json
import os

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
FPS = 30
BPM = 190
BEAT = 60 / BPM
CLAVE = [0, 1.5, 3, 5, 6]  # 3-2 son clave, in beats over a two-bar (8-beat) cycle

CLIPS = [
    ("s01", "intro", 0.6),
    ("s02", "styles", 0.55),
    ("s03", "creator", 0.55),
    ("s04", "featuresA", 0.35),
    ("s05", "featuresB", 0.6),
    ("s06", "platform", 0.5),
    ("s07", "more", 0.6),
    ("s08", "offer", 0.6),
    ("s09", "cta", 2.4),
]
LEAD_IN = 0.9
rng = np.random.default_rng(31)


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


NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ instruments
def claves():
    t = t_axis(0.12)
    x = np.sin(2 * np.pi * 2500 * t) * np.exp(-t * 60) + 0.3 * np.sin(2 * np.pi * 3800 * t) * np.exp(-t * 90)
    return (x * 0.5).astype(np.float32)


def conga(kind):
    t = t_axis(0.3)
    if kind == "open":
        f = 330 * (1 + 0.15 * np.exp(-t * 40))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    elif kind == "slap":
        n = rng.standard_normal(len(t))
        b, a = signal.butter(2, [800 / (SR / 2), 5000 / (SR / 2)], "band")
        x = signal.lfilter(b, a, n) * np.exp(-t * 45) * 0.9 + np.sin(2 * np.pi * 420 * t) * np.exp(-t * 30) * 0.4
    else:  # heel / tip, soft
        x = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 35) * 0.5
    return (x * 0.55).astype(np.float32)


def cowbell():
    t = t_axis(0.25)
    x = (signal.square(2 * np.pi * 560 * t) * 0.5 + signal.square(2 * np.pi * 845 * t) * 0.5)
    b, a = signal.butter(2, [500 / (SR / 2), 3000 / (SR / 2)], "band")
    return (signal.lfilter(b, a, x) * np.exp(-t * 18) * 0.25).astype(np.float32)


def piano(note, d=0.32):
    t = t_axis(d)
    fr = NOTE(note)
    x = sum((1 / k) * np.sin(2 * np.pi * fr * k * t) * np.exp(-t * (3 + 2.5 * k)) for k in range(1, 6))
    x *= np.minimum(1, t * 400)
    return (x * 0.18).astype(np.float32)


def bass(note, d=0.5):
    t = t_axis(d)
    fr = NOTE(note)
    x = np.sin(2 * np.pi * fr * t) + 0.3 * np.sin(2 * np.pi * fr * 2 * t) * np.exp(-t * 6)
    x *= np.exp(-t * 2.5) * np.minimum(1, t * 300)
    return (x * 0.45).astype(np.float32)


# ------------------------------------------------------------------ sfx
def silk(d=0.6, up=True):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    f = np.linspace(600, 4500, len(t)) if up else np.linspace(4500, 600, len(t))
    for i in range(0, len(n), 512):
        fc = f[i]
        b, a = signal.butter(1, [fc * 0.7 / (SR / 2), min(0.99, fc * 1.3 / (SR / 2))], "band")
        out[i:i + 512] = signal.lfilter(b, a, n[i:i + 512])
    return (out * np.sin(np.linspace(0, np.pi, len(t))) ** 3 * 0.6).astype(np.float32)


def shimmer(n=6, base=1568):
    out = np.zeros(int((0.5 + n * 0.05) * SR), np.float32)
    for k in range(n):
        t = t_axis(0.5)
        x = np.sin(2 * np.pi * base * 2 ** (k * 2 / 12) * t) * np.exp(-t * 8) * 0.18
        i = int(k * 0.05 * SR)
        out[i:i + len(x)] += x.astype(np.float32)
    return out


def tap():
    t = t_axis(0.05)
    return (np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 120) * 0.4).astype(np.float32)


def check():
    a = piano(84, 0.25)
    b = piano(91, 0.35)
    out = np.zeros(int(0.45 * SR), np.float32)
    out[: len(a)] += a * 1.6
    out[int(0.06 * SR): int(0.06 * SR) + len(b)] += b * 1.6
    return out


def boom():
    t = t_axis(1.6)
    f = 60 * np.exp(-t * 2) + 38
    return (np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 1.6) * np.exp(-t * 2.2) * 0.8).astype(np.float32)


def applause(d=1.6):
    out = np.zeros(int(d * SR), np.float32)
    for _ in range(int(d * 60)):
        c = conga("slap")[: int(0.03 * SR)] * (0.2 + rng.random() * 0.3)
        i = int(rng.random() * (d - 0.05) * SR)
        out[i:i + len(c)] += c
    env = np.minimum(1, np.linspace(0, 4, len(out))) * np.minimum(1, np.linspace(4, 0, len(out)))
    return out * env


# ------------------------------------------------------------------ music
# Cm – Fm – G7 – Cm (one chord per bar), montuno voicings
CHORDS = [[60, 63, 67], [60, 65, 68], [59, 62, 65, 67], [60, 63, 67]]
BASS = [36, 41, 43, 36]


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
        ch = CHORDS[b % 4]
        # clave (two-bar cycle)
        for c in CLAVE:
            if (b % 2 == 0 and c < 4) or (b % 2 == 1 and c >= 4):
                put(claves(), t0 + (c - (4 if c >= 4 else 0)) * BEAT, 0.55, pan=0.25)
        # piano montuno: syncopated 8ths, chord tones alternating with octave
        if lvl > 0.05:
            pat = [0, 1, 0, 2, 1, 0, 2, 1]
            for s in range(8):
                if s in (2, 5):  # syncopation gaps
                    continue
                note = ch[pat[s] % len(ch)] + (12 if s % 2 else 0)
                put(piano(note) + piano(note - 12) * 0.6, t0 + s * BEAT / 2, 0.8 * (0.5 + 0.5 * lvl), pan=-0.3)
        # bass tumbao: "and of 2" + 4
        if lvl > 0.3:
            put(bass(BASS[b % 4]), t0 + 1.5 * BEAT, 0.9)
            put(bass(BASS[(b + 1) % 4]), t0 + 3 * BEAT, 0.9)
        # congas tumbao
        if lvl > 0.45:
            put(conga("heel"), t0, 0.7, pan=0.4)
            put(conga("slap"), t0 + BEAT, 0.7, pan=0.4)
            put(conga("heel"), t0 + 2 * BEAT, 0.7, pan=0.4)
            put(conga("open"), t0 + 3 * BEAT, 0.8, pan=0.4)
            put(conga("open"), t0 + 3.5 * BEAT, 0.8, pan=0.4)
        if lvl > 0.75:
            for s in range(4):
                put(cowbell(), t0 + s * BEAT, 0.6 if s % 2 == 0 else 0.4, pan=-0.4)
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
        "beat": BEAT * FPS,
        "scenes": {k: {"from": fr(v["start"]), "dur": fr(v["end"]) - fr(v["start"]) + 10} for k, v in scenes.items()},
        "clips": {pid: {"from": fr(st), "dur": int(round(len(clips[pid]) / SR * FPS))} for pid, (st, _) in starts.items()},
        "words": {pid: [[w, fr(W(pid, i))] for i, (w, _) in enumerate(words[pid]["words"])] for pid in starts},
    }
    rem["scenes"]["cta"]["dur"] = rem["total"] - rem["scenes"]["cta"]["from"]
    rem["insert"] = {"from": rem["scenes"]["offer"]["from"], "to": rem["scenes"]["cta"]["from"]}
    with open(os.path.join(ROOT, "src/timing.json"), "w") as f:
        json.dump(rem, f, ensure_ascii=False, indent=1)

    ins0 = rem["insert"]["from"] / FPS
    ins = {
        "duration": round((rem["insert"]["to"] - rem["insert"]["from"]) / FPS, 3),
        "beat": BEAT,
        "words": [[w, round(W("s08", i) - ins0, 3)] for i, (w, _) in enumerate(words["s08"]["words"])],
    }
    os.makedirs(os.path.join(ROOT, "hyperframes/offer"), exist_ok=True)
    with open(os.path.join(ROOT, "hyperframes/offer/timing.json"), "w") as f:
        json.dump(ins, f, ensure_ascii=False, indent=1)

    # ------------------------------------------------ mix
    n = int((total + 0.3) * SR)
    vo = np.zeros((n, 2), np.float32)
    for pid, (st, _) in starts.items():
        place(vo, clips[pid], st)
    S = scenes

    def intensity(tt):
        if tt < S["styles"]["start"]:
            return 0.25
        if tt < S["creator"]["start"]:
            return 0.6
        if tt < S["platform"]["start"]:
            return 0.85
        if tt < S["more"]["start"]:
            return 0.5
        if tt < S["offer"]["start"]:
            return 1.0
        if tt < S["cta"]["start"]:
            return 0.6
        return 1.0

    mus = music(total + 0.3, intensity)
    fx = np.zeros((n, 2), np.float32)
    # intro: disco ball descends, 24/7 sparkle
    place(fx, boom(), S["intro"]["start"] + 0.25, 0.7)
    place(fx, silk(1.2, False), S["intro"]["start"] + 0.2, 0.6)
    place(fx, shimmer(8), W("s01", 11), 0.9)
    place(fx, silk(0.6), S["styles"]["start"] - 0.25, 0.8)
    # styles: a clave accent per dance name
    for i in (3, 4, 5, 6, 7):
        place(fx, claves(), W("s02", i), 1.0)
        place(fx, silk(0.35), W("s02", i) - 0.15, 0.4)
    place(fx, shimmer(), W("s02", 20), 0.7)
    for k in range(6):
        place(fx, tap(), W("s02", 24) + k * 0.12, 0.6, pan=(k % 2 - 0.5))
    place(fx, silk(0.6, False), S["creator"]["start"] - 0.25, 0.8)
    # creator: laptop opens, palette swaps
    place(fx, tap(), W("s03", 1), 0.8)
    for k in range(4):
        place(fx, tap(), W("s03", 8) + k * 0.18, 0.6)
    place(fx, shimmer(5, 1318), W("s03", 15), 0.6)
    place(fx, silk(0.6), S["featuresA"]["start"] - 0.25, 0.8)
    # features: a check chime per item
    for pid, idxs in (("s04", (2, 8, 14, 17, 23)), ("s05", (0, 7, 13, 19))):
        for i in idxs:
            place(fx, check(), W(pid, i), 0.9)
    place(fx, silk(0.6, False), S["platform"]["start"] - 0.25, 0.8)
    # platform: card flip + build
    place(fx, silk(0.4), W("s06", 7) - 0.1, 0.9)
    place(fx, boom(), W("s06", 9), 0.6)
    place(fx, silk(0.6), S["more"]["start"] - 0.25, 0.8)
    # more: three hits + applause on freedom
    for i in (0, 2, 4):
        place(fx, boom() * 0.6, W("s07", i), 0.7)
        place(fx, claves(), W("s07", i), 0.9)
    place(fx, applause(), W("s07", 5), 0.6)
    place(fx, silk(0.6, False), S["offer"]["start"] - 0.25, 0.8)
    # offer (HyperFrames): gift opens
    place(fx, shimmer(10, 1046), W("s08", 1), 0.9)
    place(fx, boom(), W("s08", 1), 0.5)
    place(fx, check(), W("s08", 11), 0.8)
    place(fx, check(), W("s08", 18), 0.8)
    place(fx, silk(0.6), S["cta"]["start"] - 0.25, 0.9)
    # cta
    place(fx, boom(), W("s09", 0), 0.8)
    place(fx, shimmer(8), W("s09", 3), 0.8)

    venv = np.abs(vo[:, 0])
    b, a = signal.butter(1, 6 / (SR / 2))
    venv = signal.filtfilt(b, a, venv)
    mus *= (1 - np.clip(venv * 5, 0, 0.5))[:, None]
    mix = vo * 1.0 + mus * 0.55 + fx * 0.45
    mix = np.tanh(mix / np.abs(mix).max() * 1.5) / np.tanh(1.5) * 0.95
    fade = int(1.0 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    print(json.dumps({"total": round(total, 2), "scenes": {k: [round(v["start"], 2), round(v["end"], 2)] for k, v in scenes.items()}, "insert": rem["insert"]}, indent=1))


if __name__ == "__main__":
    main()
