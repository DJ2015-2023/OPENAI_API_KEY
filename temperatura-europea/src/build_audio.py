"""Deterministic 12 s soundtrack: cinematic bachata bed + SFX on every visual entrance.

Run: python3 -I src/build_audio.py  -> assets/audio/soundtrack.wav
"""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "audio")
os.makedirs(OUT, exist_ok=True)
SFX_DIR = "/root/.claude/skills/media-use/audio/assets/sfx"

SR = 48000
DUR = 12.0
N = int(SR * DUR)
BPM = 120.0  # one bar = 2 s, so chord changes land on the 2 s scene grid
BEAT = 60.0 / BPM
rng = np.random.default_rng(2027)  # fixed seed -> identical file every build


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def add(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_curve(t0, t1, v0, v1):
    """Piecewise-linear automation helper over the whole timeline."""
    t = np.arange(N) / SR
    return np.interp(t, [0, t0, t1, DUR], [v0, v0, v1, v1])


# ---------------------------------------------------------------- instruments
def pad_note(f, sec):
    t = t_axis(sec)
    s = np.zeros_like(t)
    for d in (-0.11, -0.04, 0.0, 0.05, 0.12):  # detuned saw stack
        ph = (t * f * (1 + d / 100) + rng.random()) % 1.0
        s += 2 * ph - 1
    s = lp(s / 5, 1400)
    att, rel = 0.6, 0.9
    e = np.minimum(1, t / att) * np.minimum(1, (sec - t) / rel).clip(0, 1)
    return s * e


def bass_note(f, sec):
    t = t_axis(sec)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)
    s = np.tanh(1.6 * s)
    e = np.exp(-t * 3.2) * np.minimum(1, t / 0.006)
    return lp(s * e, 900)


def bongo(f, sec=0.22, accent=1.0):
    t = t_axis(sec)
    pitch = f * (1 + 0.35 * np.exp(-t * 60))
    s = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * np.exp(-t * 26)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 300) * 0.25
    return (s + click) * accent


def conga(f=196, sec=0.4):
    t = t_axis(sec)
    pitch = f * (1 + 0.2 * np.exp(-t * 40))
    return np.sin(2 * np.pi * np.cumsum(pitch) / SR) * np.exp(-t * 11)


def guira(sec, accent=1.0):
    t = t_axis(sec)
    n = bp(rng.standard_normal(len(t)), 5500, 11000)
    e = np.minimum(1, t / 0.004) * np.exp(-t * (6 / sec))
    return n * e * accent


def pluck(f, sec=0.9, bright=0.5):
    """Karplus-Strong nylon-ish pluck (requinto lines)."""
    n = int(SR / f)
    buf = rng.uniform(-1, 1, n)
    buf = lp(buf, 1500 + 5000 * bright)
    out = np.zeros(int(sec * SR))
    for i in range(len(out)):
        k = i % n
        out[i] = buf[k]
        buf[k] = 0.996 * 0.5 * (buf[k] + buf[(k + 1) % n])
    return out * np.minimum(1, np.arange(len(out)) / (SR * 0.002))


def load_sfx(name):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", os.path.join(SFX_DIR, name + ".mp3"),
         "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


# ---------------------------------------------------------------- arrangement
music = np.zeros(N)
pads = np.zeros(N)
perc = np.zeros(N)
gtr = np.zeros(N)

# Am - F - C - G (two beats... one bar each), final chord Am(add9) held.
BAR = 4 * BEAT
chords = [(57, 60, 64), (53, 57, 60), (48, 55, 64), (55, 59, 62)]
roots = [45, 41, 48, 43]

# Pads: drone on A from 0 s, chords from 2 s, sustain Am from 9 s.
add(pads, pad_note(midi(45), 2.4) + pad_note(midi(52), 2.4) * 0.6, 0.0, 0.55)
t = 2.0
ci = 0
while t < 9.0:
    sec = min(BAR, 9.0 - t) + 0.6
    for n in chords[ci % 4]:
        add(pads, pad_note(midi(n), sec), t, 0.32)
    t += BAR
    ci += 1
for n in (57, 60, 64, 71):
    add(pads, pad_note(midi(n), 3.0), 9.0, 0.3)

# Bass (from 4 s): bachata pattern 1, 2&, 3, 4& per bar.
t = 4.0
ci = 0
while t < 9.0:
    r = midi(roots[(ci + 1) % 4])
    for off, mul in ((0, 1.0), (1.5, 0.7), (2, 0.85), (3.5, 0.6)):
        add(music, bass_note(r * (1.5 if off == 3.5 else 1.0), 0.6), t + off * BEAT, 0.5 * mul)
    t += BAR
    ci += 1
add(music, bass_note(midi(33), 2.6), 9.0, 0.6)

# Bongo martillo (eighths) 2-9 s, softer in the first section.
step = BEAT / 2
for k in range(int((9.0 - 2.0) / step)):
    at = 2.0 + k * step
    lvl = 0.35 if at < 4.0 else 0.6
    f = 520 if k % 2 == 0 else 360
    acc = 1.0 if k % 4 == 0 else 0.65
    add(perc, bongo(f, accent=acc), at, lvl)
# Conga on beat 4 from 4 s.
for k in range(int((9.0 - 4.0) / BEAT)):
    if k % 4 == 3:
        add(perc, conga(), 4.0 + k * BEAT, 0.55)
# Güira: long-short-short on each beat, 1 s fade-in from 2 s.
for k in range(int((9.5 - 1.0) / BEAT)):
    at = 1.0 + k * BEAT
    lvl = min(1.0, max(0.0, (at - 1.0) / 3.0)) * 0.12
    add(perc, guira(BEAT * 0.45), at, lvl * 1.2)
    add(perc, guira(BEAT * 0.18), at + BEAT * 0.5, lvl * 0.8)
    add(perc, guira(BEAT * 0.18), at + BEAT * 0.75, lvl * 0.8)

# Requinto guitar arpeggios from 4 s (sixteenths, chord tones up an octave).
t = 4.0
ci = 0
patt = [0, 1, 2, 1, 2, 0, 1, 2]
while t < 8.9:
    tones = [n + 12 for n in chords[(ci + 1) % 4]]
    for i, p in enumerate(patt * 2):
        at = t + i * BEAT / 4
        if at >= 8.9:
            break
        add(gtr, pluck(midi(tones[p]), 0.6, bright=0.4 + 0.1 * (i % 2)), at, 0.16)
    t += BAR
    ci += 1
# Final strum on the hold.
for i, n in enumerate((57, 64, 69, 72, 76)):
    add(gtr, pluck(midi(n), 2.8, 0.55), 9.0 + i * 0.025, 0.2)

# Simple stereo-free reverb (exponential noise IR) for space.
ir_t = t_axis(2.2)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.6)
ir = lp(ir, 5000) / np.sqrt(np.sum(ir ** 2))


def verb(x, wet):
    return x + fftconvolve(x, ir)[:N] * wet


bed = verb(pads, 0.35) + verb(perc, 0.18) + verb(gtr, 0.28) + verb(music, 0.08)
# Section dynamics: reveal from darkness, groove, then settle for the hold.
bed *= env_curve(0.0, 1.6, 0.15, 1.0)
bed *= np.interp(np.arange(N) / SR, [0, 10.6, 11.92, DUR], [1, 1, 0, 0])

# ---------------------------------------------------------------- SFX, synced
sfx = np.zeros(N)
cues = [
    ("whoosh-cinematic", 1.85, 0.45),  # flags unfurl
    ("riser", 2.6, 0.0),               # placeholder (trimmed below)
    ("impact-bass-1", 4.05, 0.55),     # TEMPERATURA lands
    ("whoosh", 4.75, 0.35),            # EUROPEA brush stroke
    ("sparkle", 5.6, 0.4),             # edge flash
    ("chime", 6.0, 0.3),               # artists appear
    ("sparkle", 7.05, 0.45),           # logo glint
    ("whoosh-short", 8.0, 0.22),       # info lines
    ("whoosh-short", 8.25, 0.2),
    ("whoosh-short", 8.5, 0.18),
    ("whoosh-short", 8.72, 0.2),
    ("impact-bass-2", 9.0, 0.35),      # full poster settles
]
for name, at, g in cues:
    if g <= 0:
        continue
    s = load_sfx(name)
    s = s[: int((DUR - at) * SR)]
    fade = np.minimum(1, (len(s) - np.arange(len(s))) / (SR * 0.3))
    add(sfx, s * fade, at, g)
# Riser into the title: last 1.4 s of the bundled riser, ending on the hit.
r = load_sfx("riser")
r = r[-int(1.45 * SR):] * np.linspace(0, 1, int(1.45 * SR)) ** 1.5
add(sfx, r, 4.05 - 1.45, 0.3)
sfx *= np.interp(np.arange(N) / SR, [0, 11.3, 11.95, DUR], [1, 1, 0, 0])

mix = bed * 0.9 + sfx
mix = hp(mix, 30)
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.15) * 0.89  # gentle limiter, ~-1 dBFS peak

pcm = (mix * 32767).astype("<i2")
path = os.path.join(OUT, "soundtrack.wav")
import wave

with wave.open(path, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", path, f"{len(pcm) / SR:.3f}s")
