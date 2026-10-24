"""Synthesises the 14 s trailer score: dark stage drone, metallic impacts on each reveal, rising string
tension into the title hit, then a bachata groove (requinto guitar arpeggios, bass, bongo, güira)
and a refined final hit. Writes public/audio/mix.wav (48 kHz stereo).

Cue times (s) match src/timeline.ts.
"""
import os

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
TOTAL = 14.0
BPM = 128
B = 60 / BPM
rng = np.random.default_rng(26)
N = int(TOTAL * SR)
L = np.zeros((N, 2), np.float32)

CUE = {"logo": 2.0, "akai": 3.0, "live": 3.75, "date": 4.4, "artist": 5.0, "flash": 7.0, "temp": 7.25, "euro": 7.95,
       "moskva": 8.8, "dates": 9.4, "inv1": 10.0, "inv2": 10.5, "inv3": 11.0, "inv4": 11.5, "final": 12.0}


def t_(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.standard_normal(int(d * SR)).astype(np.float32)


def filt(x, kind, f):
    return signal.lfilter(*signal.butter(2, np.array(f) / (SR / 2), kind), x).astype(np.float32)


def put(x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    e = min(N, i + len(x))
    if e <= i:
        return
    L[i:e, 0] += x[: e - i] * g * (1 - max(0, pan))
    L[i:e, 1] += x[: e - i] * g * (1 + min(0, pan))


NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)


def impact(size=1.0):
    t = t_(2.5)
    sub = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-t * 3) + 30) / SR) * np.exp(-t * 1.6)
    body = filt(noise(2.5), "low", 600) * np.exp(-t * 9) * 2.5
    return np.tanh((sub + body) * 1.4 * size).astype(np.float32) * 0.9


def metal(f0=420.0, d=2.2):
    t = t_(d)
    parts = ((1, 1.0, 2.2), (2.76, 0.6, 3.0), (5.4, 0.45, 4.0), (8.93, 0.3, 5.5), (13.3, 0.2, 7.0))
    x = sum(a * np.sin(2 * np.pi * f0 * r * t + r) * np.exp(-t * k) for r, a, k in parts)
    click = filt(noise(d), "high", 3000) * np.exp(-t * 80)
    return ((x * 0.35 + click * 0.5)).astype(np.float32)


def shimmer(d=1.6):
    t = t_(d)
    x = sum(np.sin(2 * np.pi * NOTE(n) * t) * np.exp(-t * 2.2) * (t > k * 0.05) for k, n in enumerate([88, 91, 95, 100, 103, 107]))
    return (x * 0.08).astype(np.float32)


def whoosh(d=0.7, up=True):
    t = t_(d)
    n = noise(d)
    f = np.geomspace(250, 6000, len(t)) if up else np.geomspace(6000, 250, len(t))
    out = np.zeros_like(n)
    for i in range(0, len(n), 480):
        out[i:i + 480] = filt(n[i:i + 480], "band", [f[i] * 0.6, min(SR / 2 * 0.95, f[i] * 1.5)])
    return (out * np.sin(np.linspace(0, np.pi, len(t))) ** 2 * 0.8).astype(np.float32)


def strings(chord, d, rise=True):
    t = t_(d)
    x = sum(signal.sawtooth(2 * np.pi * NOTE(n) * t * (1 + dt) + dt * 50) for n in chord for dt in (-0.004, 0.0, 0.005))
    x = filt(x, "low", 2400)
    env = (t / d) ** 1.6 if rise else np.minimum(1, t * 2) * np.exp(-t * 0.6)
    return (x * env * 0.035).astype(np.float32)


def drone(d):
    t = t_(d)
    x = sum(np.sin(2 * np.pi * NOTE(n) * t * (1 + 0.002 * np.sin(t * 0.7 + k))) for k, n in enumerate([28, 35, 40]))
    return (x * np.minimum(1, t / 1.5) * 0.18).astype(np.float32)


def pluck(note, d=0.9, bright=0.6):
    """Karplus-Strong nylon/steel requinto pluck."""
    f = NOTE(note)
    p = int(SR / f)
    buf = filt(noise(p / SR + 0.001), "low", 3000 + 5000 * bright)[:p]
    out = np.zeros(int(d * SR), np.float32)
    for i in range(len(out)):
        v = buf[i % p]
        out[i] = v
        buf[i % p] = 0.5 * (v + buf[(i + 1) % p]) * 0.996
    return out * 0.6


def bongo(hi=True):
    t = t_(0.25)
    f = (380 if hi else 260) * (1 + 0.4 * np.exp(-t * 60))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (28 if hi else 20)) * 0.5).astype(np.float32)


def guira(acc=False):
    d = 0.09 if not acc else 0.16
    t = t_(d)
    return (filt(noise(d), "high", 6000) * np.exp(-t * (40 if not acc else 20)) * (0.22 if not acc else 0.3)).astype(np.float32)


def kick():
    t = t_(0.4)
    return (np.sin(2 * np.pi * np.cumsum(110 * np.exp(-t * 25) + 45) / SR) * np.exp(-t * 8)).astype(np.float32) * 0.9


def bass(note, d):
    t = t_(d)
    x = np.sin(2 * np.pi * NOTE(note) * t) + 0.3 * np.sin(4 * np.pi * NOTE(note) * t)
    return (x * np.minimum(1, t * 80) * np.exp(-t * 2.5) * 0.35).astype(np.float32)


def reverb(x, secs=2.2, wet=0.25):
    ir_t = t_(secs)
    ir = np.stack([noise(secs) * np.exp(-ir_t * 3.2), noise(secs) * np.exp(-ir_t * 3.2)], 1)
    ir[:, 0] = filt(ir[:, 0], "low", 6000)
    ir[:, 1] = filt(ir[:, 1], "low", 6000)
    out = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in (0, 1)], 1)
    out /= np.abs(out).max() + 1e-9
    return x * (1 - wet) + out * wet * np.abs(x).max()


def main():
    # --- 0-2 s: stage awakens
    put(drone(7.2), 0.0, 1.0)
    put(whoosh(1.8), 0.1, 0.5)
    put(impact(0.6), 0.35, 0.5)
    put(metal(180, 2.5), 0.6, 0.25, pan=-0.5)  # red lights ignite
    put(metal(240, 2.5), 0.9, 0.25, pan=0.5)  # blue lights
    put(whoosh(0.9), 1.1, 0.45, pan=0.3)  # gold spot sweep
    # --- emblem
    put(impact(0.7), CUE["logo"], 0.6)
    put(shimmer(), CUE["logo"] + 0.05, 1.0)
    # --- announcement: metallic impacts, each line
    for k, key in enumerate(["akai", "live", "date"]):
        put(whoosh(0.4), CUE[key] - 0.32, 0.5, pan=-0.4 + 0.4 * k)
        put(metal(300 + 90 * k), CUE[key], 0.65 if key == "live" else 0.45)
        put(impact(0.8 if key == "live" else 0.5), CUE[key], 0.6 if key == "live" else 0.35)
    # --- artist: rising strings + requinto arpeggio, riser into the hit
    put(strings([52, 55, 59, 64], 2.0), CUE["artist"], 1.0)
    for k, n in enumerate([64, 67, 71, 76, 71, 67, 64, 67, 71, 76, 79, 76]):
        put(pluck(n, 0.8, 0.5), CUE["artist"] + 0.1 + k * B / 2, 0.5, pan=0.25)
    put(whoosh(1.4), CUE["flash"] - 1.4, 0.7)
    t = t_(1.2)
    put((noise(1.2) * (t / 1.2) ** 3 * 0.25).astype(np.float32), CUE["flash"] - 1.2, 0.6)
    # --- TITLE HIT + bachata groove
    put(impact(1.3), CUE["flash"], 1.0)
    put(metal(110, 3.0), CUE["flash"], 0.6)
    put(strings([40, 47, 52, 55, 59], 3.5, rise=False), CUE["flash"], 1.0)
    put(metal(520), CUE["temp"], 0.45)
    put(whoosh(0.5, False), CUE["euro"] - 0.2, 0.6, pan=0.4)
    put(metal(660), CUE["euro"], 0.45, pan=0.2)
    prog = [(40, [64, 67, 71]), (45, [64, 69, 72]), (47, [66, 71, 75]), (40, [64, 67, 71])]  # Em - Am - B - Em
    start = CUE["flash"] + 0.02
    bars = int((CUE["final"] - start) / (4 * B)) + 1
    for bar in range(bars):
        t0 = start + bar * 4 * B
        root, ch = prog[bar % 4]
        for beat in range(4):
            tb = t0 + beat * B
            if tb >= CUE["final"]:
                break
            if beat in (0, 2):
                put(kick(), tb, 0.55)
            put(bass(root + (7 if beat == 2 else 0), B * 0.9), tb, 0.8)
            put(guira(beat % 2 == 0), tb, 1.0, pan=0.35)
            put(guira(), tb + B / 2, 1.0, pan=0.35)
            put(bongo(True), tb + B / 2, 0.55, pan=-0.3)
            if beat == 3:
                put(bongo(False), tb + 3 * B / 4, 0.5, pan=-0.3)
            # requinto: broken chord in 8ths, syncopated top note
            for s, n in enumerate([ch[0] + 12, ch[1] + 12]):
                put(pluck(n, 0.6, 0.7), tb + s * B / 2, 0.38, pan=0.2)
    for key in ("moskva", "dates", "inv1", "inv2", "inv4"):
        put(shimmer(1.0), CUE[key], 0.6)
    put(whoosh(0.4), CUE["inv3"] - 0.25, 0.4)
    put(metal(400), CUE["inv3"], 0.4)
    # --- final refined hit + tail
    put(impact(1.1), CUE["final"], 0.9)
    put(metal(330, 3.0), CUE["final"], 0.5)
    put(strings([40, 52, 56, 59, 64], 2.0, rise=False), CUE["final"], 1.0)
    for k, n in enumerate([64, 68, 71, 76]):
        put(pluck(n, 1.6, 0.4), CUE["final"] + 0.05 + k * 0.07, 0.45)

    mix = reverb(L, 2.4, 0.28)
    mix = np.tanh(mix / np.abs(mix).max() * 1.3) / np.tanh(1.3) * 0.93
    fi, fo = int(0.05 * SR), int(1.2 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
    os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    print("ok", mix.shape)


if __name__ == "__main__":
    main()
