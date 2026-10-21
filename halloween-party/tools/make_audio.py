"""Procedural score + SFX for the Halloween Latin Fusion promo -> public/mix.wav (48 kHz stereo).

Dark latin groove at 120 BPM (dembow kick/snare, güiro, tresillo bass, plucked
Karplus-Strong guitar) in D minor, gothic organ/choir pad, and sound design
locked to the scene cuts in src/timeline.ts.
"""
import pathlib, subprocess
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
TOTAL = 40.0
N = int(TOTAL * SR)
rng = np.random.default_rng(1031)
BEAT = 0.5
BAR = 2.0
DROP = 4.0  # beat enters with the title

def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(sec): return np.arange(int(sec * SR)) / SR

def place(buf, sig, at, gain=1.0):
    i = int(round(at * SR))
    if i < 0:
        sig, i = sig[-i:], 0
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    buf[i : i + len(sig)] += sig * gain

def reverb(x, sec=2.5, decay=3.0, mix=0.3):
    n = int(sec * SR)
    ir = lp(rng.standard_normal(n), 5000) * np.exp(-decay * 3 * np.arange(n) / n)
    ir /= np.sqrt((ir ** 2).sum())
    return x * (1 - mix) + fftconvolve(x, ir)[: len(x)] * mix * 2

def norm(x, peak=1.0): return x / (np.abs(x).max() + 1e-9) * peak

# ---------------- Instruments ----------------
def kick(g=1.0):
    t = tt(0.45)
    f = 45 + 110 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * g

def snare(g=1.0):
    t = tt(0.25)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    noise = bp(rng.standard_normal(len(t)), 1500, 9000) * np.exp(-t * 22)
    return (body * 0.5 + noise) * g

def guiro(g=1.0):
    t = tt(0.12)
    scrape = bp(rng.standard_normal(len(t)), 3000, 9000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 90 * t)))
    return scrape * np.exp(-t * 25) * g

def pluck(freq, sec=1.2, damp=0.996):
    # Karplus–Strong string
    n = int(sec * SR)
    period = int(SR / freq)
    buf = rng.uniform(-1, 1, period)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = damp * 0.5 * (buf[i % period] + buf[(i + 1) % period])
    return lp(out, 5000)

def bass_note(freq, sec):
    t = tt(sec)
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t)
    return np.tanh(x * 1.6) * np.minimum(1, t / 0.01) * np.exp(-t * 2.5)

def organ(freqs, sec):
    t = tt(sec)
    x = sum(sum(a * np.sin(2 * np.pi * f * h * t) for h, a in ((0.5, 0.5), (1, 1), (2, 0.6), (3, 0.3), (4, 0.25))) for f in freqs)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 6 * t)
    env = np.minimum(1, t / 0.4) * np.minimum(1, (sec - t) / 0.4)
    return x * trem * env

def choir(freqs, sec):
    t = tt(sec)
    saw = sum(2 * ((t * f * (1 + d) + rng.random()) % 1) - 1 for f in freqs for d in (-0.003, 0, 0.004))
    # "aah" formants
    v = bp(saw, 650, 1100) + 0.6 * bp(saw, 1000, 1400) + 0.3 * bp(saw, 2400, 2800)
    env = np.minimum(1, t / 0.8) * np.minimum(1, (sec - t) / 0.8)
    return v * env

# D minor, Andalusian cadence Dm – C – Bb – A
PROG = [(50, [62, 65, 69]), (48, [60, 64, 67]), (46, [58, 62, 65]), (45, [57, 61, 64])]

drums = np.zeros(N); bass = np.zeros(N); gtr = np.zeros(N); pad = np.zeros(N); chor = np.zeros(N)
END = 38.5  # final hit; ring out over the poster
bar = 0
pluck_cache = {}
start = DROP
while start < END - 0.01:
    root, triad = PROG[bar % 4]
    # Dembow: kick every beat, snare on the "3-3-2" offbeats
    for b in range(4):
        place(drums, kick(), start + b * BEAT, 0.9)
    for off in (0.375, 0.5 + 0.25, 1.375, 1.75):
        place(drums, snare(), start + off, 0.45)
    for k in range(16):
        place(drums, guiro(), start + k * 0.125, 0.18 if k % 2 else 0.28)
    # Tresillo bass
    for off, dur in ((0, 0.75), (0.75, 0.75), (1.5, 0.5)):
        place(bass, bass_note(midi(root - 12), dur), start + off, 0.8)
    # Requinto-style 16th arpeggio
    pattern = [triad[0] + 12, triad[1] + 12, triad[2] + 12, triad[1] + 12, triad[2] + 12, triad[0] + 24, triad[2] + 12, triad[1] + 12]
    for k in range(16):
        m = pattern[k % 8]
        if m not in pluck_cache:
            pluck_cache[m] = pluck(midi(m))
        place(gtr, pluck_cache[m], start + k * 0.125, 0.35 if k % 4 else 0.5)
    place(pad, organ([midi(n - 12) for n in triad], BAR + 0.4), start - 0.2, 0.15)
    place(chor, choir([midi(n) for n in triad], BAR + 0.6), start - 0.3, 0.3)
    start += BAR
    bar += 1

# Intro: dark organ drone + choir before the drop
place(pad, organ([midi(38), midi(50), midi(57)], 4.2), 0.0, 0.22)
place(chor, choir([midi(62), midi(65), midi(69)], 4.2), 0.0, 0.35)
# Breakdown under the poster: sustained final chord
place(pad, organ([midi(50), midi(57), midi(62), midi(65)], 6), END - 0.2, 0.25)
place(chor, choir([midi(62), midi(65), midi(69), midi(74)], 6), END - 0.2, 0.4)

# Drop-out for a breath before the poster reveal (32.0–32.5)
gate = np.ones(N)
t_all = np.arange(N) / SR
gate[(t_all > 32.0) & (t_all < 32.5)] = 0.15
gate = lp(gate, 30)
groove = norm(drums, 1) * 0.9 + norm(bass, 1) * 0.55 + norm(reverb(gtr, 1.5, 4, 0.25), 1) * 0.42
groove *= gate
atmos = norm(reverb(pad + chor * 0.8, 3, 2.5, 0.45), 1) * 0.45
music = groove + atmos
music *= np.clip(t_all / 0.6, 0, 1) * np.clip((TOTAL - t_all) / 2.0, 0, 1)

# ---------------- SFX ----------------
sfx = np.zeros(N)

def thunder(at, g=1.0):
    t = tt(3.5)
    crack = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 18)
    rumble = lp(rng.standard_normal(len(t)), 120, 4) * 8 * np.exp(-t * 1.2) * (1 + 0.5 * np.sin(2 * np.pi * 3 * t))
    place(sfx, (crack * 0.8 + rumble) * g, at)

def bell(at, g=1.0, f0=110):
    t = tt(5)
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * d) for r, a, d in
            ((0.5, 0.6, 0.6), (1, 1, 0.9), (1.19, 0.5, 1.2), (1.56, 0.4, 1.5), (2.0, 0.35, 1.8), (2.74, 0.25, 2.4), (3.76, 0.15, 3)))
    place(sfx, x * g, at)

def impact(at, g=1.0):
    t = tt(2.2)
    boom = np.sin(2 * np.pi * np.cumsum(32 + 70 * np.exp(-t * 14)) / SR) * np.exp(-t * 2.4)
    snap = lp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 20) * 0.6
    place(sfx, (boom + snap) * g, at)

def whoosh(at, length=0.8, g=0.5, reverse=False):
    n = int(length * SR)
    u = np.linspace(0, 1, n)
    x = np.zeros(n)
    for k, fc in enumerate(np.geomspace(250, 7000, 6)):
        c = 0.25 + 0.5 * k / 5
        x += bp(rng.standard_normal(n), fc * 0.7, min(fc * 1.4, 23000)) * np.exp(-((u - c) / 0.18) ** 2)
    env = np.sin(np.pi * u) ** 2
    if reverse:
        x, env = x, u ** 3
    place(sfx, x * env * g, at - length * (1.0 if reverse else 0.6))

def riser(at, length=2.0, g=0.4):
    t = tt(length)
    noise = hp(rng.standard_normal(len(t)), 2000)
    tone = np.sin(2 * np.pi * np.cumsum(150 + 1600 * (t / length) ** 2) / SR)
    place(sfx, (noise * 0.6 + tone * 0.3) * (t / length) ** 2.5 * g, at - length)

def flutter(at, length=1.6, g=0.35):
    t = tt(length)
    wings = bp(rng.standard_normal(len(t)), 200, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 16 * t)) ** 3
    squeak = sum(np.sin(2 * np.pi * (4200 + 600 * np.sin(2 * np.pi * 9 * t)) * t) * np.exp(-((t - c) / 0.03) ** 2) for c in (0.2, 0.55, 0.9))
    env = np.sin(np.pi * t / length)
    place(sfx, (wings + squeak * 0.25) * env * g, at)

def glitch(at, g=0.4):
    t = tt(0.45)
    sq = np.sign(np.sin(2 * np.pi * (300 + 2500 * rng.random(len(t)) ** 8) * t))
    crush = np.round(sq * (0.5 + 0.5 * np.sin(2 * np.pi * 37 * t)) * 4) / 4
    place(sfx, crush * (rng.random(len(t)) > 0.3) * np.exp(-t * 5) * g, at - 0.1)

def tick(at, g=0.35):
    t = tt(0.05)
    place(sfx, bp(rng.standard_normal(len(t)), 2500, 6000) * np.exp(-t * 120) * g, at)

def ding(at, g=0.25, f=1568):
    t = tt(1.2)
    place(sfx, (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 4) * g, at)

def thud(at, g=0.6):
    t = tt(0.5)
    place(sfx, np.sin(2 * np.pi * np.cumsum(60 + 140 * np.exp(-t * 30)) / SR) * np.exp(-t * 10) * g, at)

def wind(at, length, g=0.25):
    t = tt(length)
    x = lp(rng.standard_normal(len(t)), 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t))
    x = bp(x, 200, 900) * np.sin(np.pi * t / length)
    place(sfx, x * g, at)

def laugh(at, g=0.18):
    # Synthetic cackle: pitched "ha" bursts with vibrato
    for k in range(6):
        t = tt(0.16)
        f = 520 - k * 25
        v = np.sin(2 * np.pi * f * t + 3 * np.sin(2 * np.pi * 30 * t))
        v = bp(v + 0.3 * rng.standard_normal(len(t)), 400, 3000)
        place(sfx, v * np.sin(np.pi * t / 0.16) * g, at + k * 0.15)

# Intro (HyperFrames section)
wind(0, 4.2, 0.35)
thunder(0.15, 1.0)
bell(0.6, 0.35, 98)
flutter(0.4, 2.0, 0.45)
thunder(1.55, 0.8)
impact(1.55, 0.6)
laugh(2.4, 0.2)
riser(DROP, 2.2, 0.5)
# Title drop
impact(4.0, 1.0); bell(4.0, 0.25, 147)
whoosh(4.0, 0.9, 0.4)
impact(5.5, 0.6)   # HALLOWEEN slam
impact(6.0, 0.4)   # Party
# Passion slams
glitch(9.0, 0.5)
for h in (9.75, 10.5, 11.25, 12.0):
    impact(h, 0.55); whoosh(h, 0.5, 0.25)
# Date
whoosh(13.0, 0.9, 0.45); impact(13.4, 0.6)
for k in range(10):
    tick(15.0 + k * 0.25, 0.3)
ding(15.2, 0.15, 1046)
ding(15.8, 0.15, 1046)
# Dress — bat swarm cut
flutter(17.3, 1.6, 0.6); whoosh(18.0, 1.0, 0.4)
for k in range(3):
    whoosh(19.0 + k * 0.5, 0.5, 0.25)
# Prices — card flip + ticket dings
whoosh(22.5, 0.7, 0.45)
for k in range(4):
    whoosh(23.5 + k * 0.5, 0.35, 0.2)
    ding(23.6 + k * 0.5, 0.18, [1568, 1760, 1976, 2349][k])
# Location — zoom through + pin drop
whoosh(28.0, 1.0, 0.5, reverse=True)
thud(28.85, 0.7); ding(28.9, 0.15, 880)
# Poster reveal
riser(32.5, 1.6, 0.4)
impact(32.5, 1.0); bell(32.5, 0.45, 73); thunder(32.6, 0.4)
impact(END, 0.7); bell(END, 0.3, 147)
sfx = reverb(sfx, 2.2, 3.0, 0.25)

mix = norm(music, 0.8) + norm(sfx, 0.75)
L = mix + 0.15 * np.concatenate([np.zeros(240), music[:-240]])
R = mix + 0.15 * np.concatenate([np.zeros(360), music[:-360]])
st = np.tanh(np.stack([L, R], 1) * 1.05) / np.tanh(1.05)
tmp = ROOT / "public/mix_raw.wav"
sf.write(tmp, st.astype(np.float32), SR)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af", "loudnorm=I=-14:TP=-1.2:LRA=11", "-ar", str(SR),
                str(ROOT / "public/mix.wav")], check=True)
tmp.unlink()
print("ok")
