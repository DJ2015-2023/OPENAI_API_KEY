"""User's track + sound design for the Halloween Latin Fusion promo -> public/mix.wav (48 kHz stereo).

The song section and beat grid come from tools/analyze_song.py (src/timeline.json);
SFX are placed on the same beats. Usage: python3 tools/make_audio.py <song.mp3>
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

# ---------------- Music: the user's track ----------------
import json, sys
TL = json.loads((ROOT / "src/timeline.json").read_text())
SONG = sys.argv[1]
B = TL["beat"]
CUT = TL["cuts"]
END = TL["musicEnd"]  # the track breaks down here; let the poster ring out after it
raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(TL["songOffset"]), "-t", str(TOTAL), "-i", SONG,
                      "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
music = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
music = np.vstack([music, np.zeros((max(0, N - len(music)), 2))])[:N]
t_all = np.arange(N) / SR
env = np.clip(t_all / 0.3, 0, 1) * np.clip((TOTAL - t_all) / 1.8, 0, 1)
music *= env[:, None]

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

# Intro (HyperFrames section) — kept light so the song's riser carries it
thunder(0.15, 0.9)
bell(0.6, 0.25, 98)
flutter(0.4, 2.0, 0.35)
thunder(1.55, 0.6)
laugh(2.4, 0.15)
# Title: the drop
impact(CUT["title"], 0.9); whoosh(CUT["title"], 0.9, 0.3)
impact(CUT["title"] + 3 * B, 0.5)   # HALLOWEEN slam
# Passion: word slams on the beat
glitch(CUT["passion"], 0.45)
for k in (1, 2, 3, 5):
    impact(CUT["passion"] + k * B, 0.45)
# Date
whoosh(CUT["date"], 0.9, 0.35); impact(CUT["date"] + 0.4, 0.45)
for k in range(8):
    tick(CUT["date"] + 4 * B + k * B / 2, 0.22)
# Dress — bat swarm cut
flutter(CUT["dress"] - 0.7, 1.6, 0.5); whoosh(CUT["dress"], 1.0, 0.3)
# Prices — card flip + ticket dings on beats
whoosh(CUT["prices"], 0.7, 0.35)
for k in range(4):
    ding(CUT["prices"] + (2 + k) * B + 0.08, 0.13, [1568, 1760, 1976, 2349][k])
# Location — zoom through + pin drop
whoosh(CUT["location"], 1.0, 0.4, reverse=True)
thud(CUT["location"] + 2 * B, 0.55); ding(CUT["location"] + 2 * B + 0.05, 0.12, 880)
# Poster reveal and ending
impact(CUT["poster"], 0.9); bell(CUT["poster"], 0.35, 73)
impact(END, 0.6); bell(END, 0.3, 147); thunder(END + 0.1, 0.35)
sfx = reverb(sfx, 2.2, 3.0, 0.25)

mix = music / (np.abs(music).max() + 1e-9) * 0.85 + (norm(sfx, 0.5))[:, None]
st = np.tanh(mix * 1.05) / np.tanh(1.05)
tmp = ROOT / "public/mix_raw.wav"
sf.write(tmp, st.astype(np.float32), SR)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af", "loudnorm=I=-14:TP=-1.2:LRA=11", "-ar", str(SR),
                str(ROOT / "public/mix.wav")], check=True)
tmp.unlink()
print("ok")
