"""Lays out the narration (ElevenLabs "Liam" clips in narration/), builds an upbeat
house music bed + playful SFX, and writes the timing map.

Outputs:
  src/timing.json               scene + word timings (frames, relative to the Remotion part)
  hyperframes/intro/timing.json intro timings (seconds) for the HyperFrames opener
  public/audio/mix.wav          full stereo mix for the whole film
"""
import json
import os

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
FPS = 30
BPM = 122
BEAT = 60 / BPM

# (clip id, scene, gap after in seconds)
CLIPS = [
    ("s01", "intro", 0.55),
    ("s02", "question", 0.45),
    ("s03", "instant", 0.5),
    ("s04", "platforms", 0.5),
    ("s05", "features", 0.25),
    ("s06", "features", 0.55),
    ("s07", "industries", 0.5),
    ("s08", "mission", 0.5),
    ("s09", "custom", 0.55),
    ("s10", "cta", 0.2),
    ("s11", "cta", 1.8),
]
LEAD_IN = 0.7
rng = np.random.default_rng(11)


# ------------------------------------------------------------------ narration
def load(pid):
    sr, x = wavfile.read(os.path.join(ROOT, "narration", f"{pid}.wav"))
    x = x.astype(np.float32) / (32768.0 if x.dtype == np.int16 else 1.0)
    if x.ndim > 1:
        x = x.mean(axis=1)
    x = signal.resample_poly(x, SR, sr).astype(np.float32)
    idx = np.where(np.abs(x) > 0.004)[0]
    head = max(0, idx[0] - int(0.06 * SR))
    x = x[head: idx[-1] + int(0.08 * SR)]
    return x, head / SR  # head offset keeps ASR word times aligned


def polish(x):
    b, a = signal.butter(2, 80 / (SR / 2), "high")
    x = signal.lfilter(b, a, x)
    return (x / (np.abs(x).max() + 1e-9) * 0.9).astype(np.float32)


# ------------------------------------------------------------------ sfx
def t_axis(d):
    return np.arange(int(d * SR)) / SR


def bubble_pop(f0=600):
    t = t_axis(0.16)
    f = f0 * (1 + 2.5 * np.exp(-t * 40))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * 0.7).astype(np.float32)


def marimba(freq, d=0.5):
    t = t_axis(d)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t * 9) + 0.35 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t * 30)
    return (x * 0.5).astype(np.float32)


def card_flip():
    t = t_axis(0.12)
    n = rng.standard_normal(len(t))
    b, a = signal.butter(2, [1500 / (SR / 2), 7000 / (SR / 2)], "band")
    return (signal.lfilter(b, a, n) * np.exp(-t * 35) * 0.8).astype(np.float32)


def swipe(d=0.35, up=True):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    f = np.linspace(500, 5000, len(t)) if up else np.linspace(5000, 500, len(t))
    for i in range(0, len(n), 512):
        fc = f[i]
        b, a = signal.butter(2, [fc * 0.6 / (SR / 2), min(0.99, fc * 1.5 / (SR / 2))], "band")
        out[i:i + 512] = signal.lfilter(b, a, n[i:i + 512])
    return (out * np.sin(np.linspace(0, np.pi, len(t))) ** 2 * 0.8).astype(np.float32)


def typing(d=1.2):
    out = np.zeros(int(d * SR), np.float32)
    tt = 0.0
    while tt < d - 0.05:
        c = card_flip()[: int(0.03 * SR)] * (0.3 + rng.random() * 0.3)
        i = int(tt * SR)
        out[i:i + len(c)] += c[: len(out) - i]
        tt += 0.06 + rng.random() * 0.07
    return out


def sent():
    return (swipe(0.3, True) * 0.6 + np.pad(marimba(1568, 0.3), (int(0.12 * SR), 0))[: int(0.3 * SR)]).astype(np.float32)


def coin():
    a = marimba(1975, 0.35)
    b = marimba(2637, 0.5)
    out = np.zeros(int(0.6 * SR), np.float32)
    out[: len(a)] += a
    out[int(0.08 * SR): int(0.08 * SR) + len(b)] += b
    return out


def boom():
    t = t_axis(1.0)
    f = 90 * np.exp(-t * 6) + 40
    return (np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * 1.5) * 0.8).astype(np.float32)


def strike():
    """Marker scribble for the strikethrough."""
    t = t_axis(0.45)
    n = rng.standard_normal(len(t))
    b, a = signal.butter(2, [2500 / (SR / 2), 9000 / (SR / 2)], "band")
    env = np.clip(np.sin(np.linspace(0, np.pi, len(t))), 0, 1) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * t))
    return (signal.lfilter(b, a, n) * env * 0.5).astype(np.float32)


def tick():
    t = t_axis(0.03)
    return (np.sin(2 * np.pi * 3000 * t) * np.exp(-t * 200) * 0.4).astype(np.float32)


# ------------------------------------------------------------------ music
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)  # midi -> Hz
# I – V – vi – IV in C major (bright, optimistic)
PROG = [[48, 52, 55, 60], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]]


def kick():
    t = t_axis(0.3)
    f = 150 * np.exp(-t * 35) + 48
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)).astype(np.float32)


def clap():
    t = t_axis(0.2)
    n = rng.standard_normal(len(t))
    b, a = signal.butter(2, [900 / (SR / 2), 4000 / (SR / 2)], "band")
    env = np.exp(-t * 25) * (1 + 0.6 * (np.floor(t * 120) % 2 == 0) * (t < 0.03))
    return (signal.lfilter(b, a, n) * env * 0.7).astype(np.float32)


def shaker():
    t = t_axis(0.05)
    n = rng.standard_normal(len(t))
    b, a = signal.butter(2, 8000 / (SR / 2), "high")
    return (signal.lfilter(b, a, n) * np.exp(-t * 80) * 0.35).astype(np.float32)


def music(total, intensity):
    """intensity(t) -> 0..1 controls how many layers play (arrangement)."""
    n = int(total * SR)
    L = np.zeros(n, np.float32)
    R = np.zeros(n, np.float32)
    bar = BEAT * 4
    nbeats = int(total / BEAT) + 1
    for bi in range(nbeats):
        t0 = bi * BEAT
        lvl = intensity(t0)
        chord = PROG[(bi // 4) % 4]
        i0 = int(t0 * SR)

        def put(x, g=1.0, pan=0.0, at=i0):
            e = min(n, at + len(x))
            if at >= n or e <= at:
                return
            L[at:e] += x[: e - at] * g * (1 - max(0, pan))
            R[at:e] += x[: e - at] * g * (1 + min(0, pan))

        if lvl > 0.25:
            put(kick(), 0.8)
        if lvl > 0.5 and bi % 2 == 1:
            put(clap(), 0.5)
        if lvl > 0.15:
            for k in range(2):
                put(shaker(), 0.5 * lvl, pan=0.4 if k else -0.4, at=i0 + int((k * 0.5 + 0.25) * BEAT * SR))
        # offbeat bass bounce (octave)
        root = NOTE(chord[0] - 12)
        tb = t_axis(BEAT / 2)
        bass = np.sin(2 * np.pi * root * (2 if bi % 2 else 1) * tb) * np.exp(-tb * 5)
        if lvl > 0.1:
            put(bass.astype(np.float32), 0.45, at=i0 + int(0.5 * BEAT * SR))
        # plucky chord arp (16ths)
        for s in range(4):
            note = chord[(bi * 4 + s) % 4] + 12 + (12 if s == 3 else 0)
            tp = t_axis(0.22)
            fr = NOTE(note)
            pl = (np.sin(2 * np.pi * fr * tp + 1.2 * np.sin(2 * np.pi * fr * 2 * tp) * np.exp(-tp * 20)) * np.exp(-tp * 14)).astype(np.float32)
            put(pl, 0.12 * (0.4 + 0.6 * lvl), pan=(-0.5 if s % 2 else 0.5), at=i0 + int(s * BEAT / 4 * SR))
        # warm pad, once per bar
        if bi % 4 == 0:
            tpad = t_axis(bar)
            pad = sum(signal.sawtooth(2 * np.pi * NOTE(m) * tpad * (1 + d)) for m in chord for d in (-0.002, 0.002)) * 0.02
            b, a = signal.butter(2, 1800 / (SR / 2))
            pad = signal.lfilter(b, a, pad) * np.minimum(1, tpad * 4) * np.minimum(1, (bar - tpad) * 4)
            put(pad.astype(np.float32), 0.5 + 0.3 * lvl)
    # sidechain pump
    ph = (np.arange(n) / SR % BEAT) / BEAT
    pump = 0.55 + 0.45 * np.clip(ph * 3.5, 0, 1)
    return np.stack([L * pump, R * pump], 1)


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
    clips = {}
    t = LEAD_IN
    starts, scenes, prev = {}, {}, None
    for pid, scene, gap in CLIPS:
        x, head = load(pid)
        clips[pid] = polish(x)
        if scene != prev:
            if prev:
                scenes[prev]["end"] = t - 0.2
            scenes[scene] = {"start": t - (0.35 if prev else LEAD_IN)}
            prev = scene
        starts[pid] = (t, head)
        t += len(x) / SR + gap
    scenes[prev]["end"] = t
    total = t

    # Remotion covers everything after the HyperFrames intro (hard cut on a colour wipe).
    off = scenes["question"]["start"]
    fr = lambda s: int(round((s - off) * FPS))
    word_map = {}
    for pid, (st, head) in starts.items():
        word_map[pid] = [[w, fr(st + max(0.0, tm - head))] for w, tm in words[pid]["words"]]
    rem = {
        "fps": FPS,
        "total": fr(total),
        "scenes": {k: {"from": fr(v["start"]), "dur": fr(v["end"]) - fr(v["start"]) + 10} for k, v in scenes.items() if k != "intro"},
        "clips": {pid: {"from": fr(st), "dur": int(round(len(clips[pid]) / SR * FPS))} for pid, (st, _) in starts.items() if pid != "s01"},
        "words": {k: v for k, v in word_map.items() if k != "s01"},
        "beat": BEAT * FPS,
    }
    rem["scenes"]["cta"]["dur"] = rem["total"] - rem["scenes"]["cta"]["from"]
    with open(os.path.join(ROOT, "src/timing.json"), "w") as f:
        json.dump(rem, f, ensure_ascii=False, indent=1)

    s01, h1 = starts["s01"]
    iw = {w: round(s01 + max(0.0, tm - h1), 3) for w, tm in words["s01"]["words"]}
    intro = {"duration": round(off, 3), "start": round(s01, 3), "words": iw, "end": round(s01 + len(clips["s01"]) / SR, 3)}
    os.makedirs(os.path.join(ROOT, "hyperframes/intro"), exist_ok=True)
    with open(os.path.join(ROOT, "hyperframes/intro/timing.json"), "w") as f:
        json.dump(intro, f, ensure_ascii=False, indent=1)

    # ------------------------------------------------ mix
    n = int((total + 0.3) * SR)
    vo = np.zeros((n, 2), np.float32)
    for pid, (st, _) in starts.items():
        place(vo, clips[pid], st)

    S = scenes
    def intensity(tt):
        if tt < S["question"]["start"]:
            return 0.35  # intro: groove teased
        if tt < S["instant"]["start"]:
            return 0.12  # question: tension, stripped back
        if tt < S["features"]["start"]:
            return 0.6
        if tt < S["mission"]["start"]:
            return 1.0
        if tt < S["custom"]["start"]:
            return 0.45
        return 1.0

    mus = music(total + 0.3, intensity)
    fx = np.zeros((n, 2), np.float32)
    W = lambda pid, i: starts[pid][0] + max(0.0, words[pid]["words"][i][1] - starts[pid][1])

    # intro
    place(fx, boom(), S["intro"]["start"] + 0.3, 0.8)
    for i in range(len(words["s01"]["words"])):
        place(fx, bubble_pop(500 + 60 * i), W("s01", i), 0.35)
    place(fx, swipe(0.4), S["question"]["start"] - 0.25, 0.9)
    # question: ticking + typing that never arrives
    for k in range(int((S["question"]["end"] - S["question"]["start"]) / 0.5)):
        place(fx, tick(), S["question"]["start"] + 0.3 + k * 0.5, 0.6)
    place(fx, typing(1.6), S["question"]["start"] + 0.8, 0.5)
    place(fx, swipe(0.5, False), S["instant"]["start"] - 0.2, 0.8)
    # instant: robot pop + sent + three moods
    place(fx, bubble_pop(400), S["instant"]["start"] + 0.2, 0.9)
    place(fx, sent(), W("s03", 2), 0.8)
    for i, note in zip((6, 7, 9), (784, 988, 1175)):
        place(fx, marimba(note), W("s03", i), 0.7)
    place(fx, swipe(0.4), S["platforms"]["start"] - 0.2, 0.8)
    # platforms: card deals
    for i in (8, 9, 10):
        place(fx, card_flip(), W("s04", i), 1.0)
    place(fx, card_flip(), W("s04", 12) + 0.25, 1.0)
    place(fx, swipe(0.4), S["features"]["start"] - 0.2, 0.8)
    # features: a flip per tile
    for pid, idxs in (("s05", (0, 3, 6, 10)), ("s06", (0, 3, 6, 9))):
        for k, i in enumerate(idxs):
            place(fx, card_flip(), W(pid, i) - 0.05, 1.0)
            place(fx, marimba(NOTE(72 + [0, 4, 7, 12][k])), W(pid, i), 0.45)
    place(fx, coin(), W("s06", 11) + 0.2, 0.7)
    place(fx, swipe(0.45, False), S["industries"]["start"] - 0.2, 0.8)
    # industries: pop per tag
    for i in range(2, len(words["s07"]["words"]) - 2):
        place(fx, bubble_pop(700 + 40 * (i % 6)), W("s07", i), 0.4)
    place(fx, swipe(0.4), S["mission"]["start"] - 0.2, 0.8)
    # mission: strike + three ideas + conversion coin
    place(fx, strike(), W("s08", 5), 0.9)
    for i in (9, 12, 15):
        place(fx, boom() * 0.5, W("s08", i), 0.6)
        place(fx, marimba(1046), W("s08", i), 0.4)
    place(fx, coin(), W("s08", 18), 0.8)
    place(fx, swipe(0.4), S["custom"]["start"] - 0.2, 0.8)
    # custom: level-up arps
    for k in range(6):
        place(fx, marimba(NOTE(67 + [0, 2, 4, 7, 9, 12][k]), 0.3), W("s09", 7) + k * 0.12, 0.4)
    place(fx, boom(), W("s09", 9), 0.7)
    place(fx, swipe(0.5), S["cta"]["start"] - 0.25, 0.9)
    # cta: typing + send
    place(fx, typing(1.0), S["cta"]["start"] + 0.3, 0.6)
    place(fx, sent(), W("s11", 0), 1.0)
    place(fx, boom(), W("s11", 3), 0.7)
    place(fx, coin(), starts["s11"][0] + len(clips["s11"]) / SR + 0.2, 0.6)

    venv = np.abs(vo[:, 0])
    b, a = signal.butter(1, 6 / (SR / 2))
    venv = signal.filtfilt(b, a, venv)
    duck = 1 - np.clip(venv * 5, 0, 0.5)
    mus *= duck[:, None]
    mix = vo * 1.0 + mus * 0.5 + fx * 0.5
    mix = np.tanh(mix / np.abs(mix).max() * 1.5) / np.tanh(1.5) * 0.95
    fade = int(0.8 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    print(json.dumps({"total": round(total, 2), "remotion_offset": round(off, 2), "scenes": {k: [round(v["start"], 2), round(v["end"], 2)] for k, v in scenes.items()}}, indent=1))


if __name__ == "__main__":
    main()
