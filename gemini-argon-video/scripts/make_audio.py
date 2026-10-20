"""Synthesize the soundtrack: 120 BPM score, SFX and ducked voiceover, all driven by src/timeline.json.

Run from the project root: python3 scripts/make_audio.py
Writes public/mix.wav (48 kHz stereo); loudness is normalized afterwards with ffmpeg.
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
TL = json.loads((ROOT / "src/timeline.json").read_text())
DUR = TL["duration"]
N = int(SR * DUR)
BEAT = 60 / TL["bpm"]
rng = np.random.default_rng(7)


# ---------- helpers ----------
def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100) / (SR / 2), "low", output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f / (SR / 2), "high", output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x)


def sweep_lp(x, f0, f1):
    """Time-varying low-pass via block processing (cheap filter sweep)."""
    out = np.zeros_like(x)
    blocks = 64
    edges = np.linspace(0, len(x), blocks + 1).astype(int)
    for i in range(blocks):
        a, b = edges[i], edges[i + 1]
        f = f0 * (f1 / f0) ** (i / (blocks - 1))
        pad = min(a, 2048)
        out[a:b] = lp(x[a - pad:b], f)[pad:]
    return out


def saw(freq, t):
    ph = np.cumsum(np.broadcast_to(freq, t.shape) / SR)
    return 2 * (ph % 1.0) - 1


def env_ad(n, a, d, curve=4.0):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    tail = np.arange(n - na) / SR
    e[na:] = np.exp(-curve * tail / max(d, 1e-3))
    return e


def reverb_ir(sec=2.2, decay=3.0, seed=1):
    r = np.random.default_rng(seed)
    t = t_axis(sec)
    ir = r.standard_normal((2, len(t))) * np.exp(-decay * t / sec * 2.2)
    ir[:, : int(0.012 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True)) * 0.6


IR_BIG = reverb_ir(2.6, 2.6, 1)
IR_SMALL = reverb_ir(0.9, 3.5, 2)


def add(buf, sig, at, gain=1.0, pan=0.0):
    """Mix a mono or stereo signal into buf at time `at` seconds."""
    i = int(at * SR)
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414])
    n = min(sig.shape[1], buf.shape[1] - i)
    if n > 0:
        buf[:, i:i + n] += sig[:, :n] * gain


def wet(sig, ir, mix):
    st = np.stack([fftconvolve(sig, ir[0]), fftconvolve(sig, ir[1])])
    dry = np.zeros_like(st)
    dry[:, : len(sig)] = sig
    return dry + st * mix


def read_wav(path):
    with wave.open(str(path)) as w:
        sr, ch = w.getframerate(), w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    if sr != SR:
        x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    return x


# ---------- instruments ----------
def kick(gain=1.0):
    t = t_axis(0.45)
    f = 45 + 110 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300) * 0.4
    return np.tanh((body + click) * 1.6) * gain


def clap():
    t = t_axis(0.35)
    n = bp(rng.standard_normal(len(t)), 900, 5000)
    e = np.zeros(len(t))
    for d in (0, 0.011, 0.022):
        e += np.where(t >= d, np.exp(-(t - d) * 60), 0)
    e += np.exp(-t * 14) * 0.5
    return n * e * 0.5


def hat(open_=False):
    t = t_axis(0.25 if open_ else 0.06)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t * (14 if open_ else 70)) * 0.18


def pluck(freq, length=0.22):
    t = t_axis(length)
    x = saw(freq, t) + 0.5 * saw(freq * 1.005, t)
    return lp(x, 2600) * np.exp(-t * 16) * 0.16


def pad_chord(freqs, sec):
    t = t_axis(sec)
    x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            x += saw(f * 2 ** (det / 12), t)
    x = lp(x / (len(freqs) * 3), 1400)
    a = np.minimum(1, t / 0.6) * np.minimum(1, (sec - t) / 0.5)
    return x * a * 0.22


# ---------- sfx ----------
def sfx_impact(size=1.0):
    t = t_axis(2.6)
    f = 32 + 70 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    crack = lp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 22)
    thud = lp(rng.standard_normal(len(t)), 300) * np.exp(-t * 6) * 1.5
    x = np.tanh((boom * 1.4 + crack * 0.7 + thud) * 1.3)
    return wet(x * size * 0.9, IR_BIG, 0.55)


def sfx_hit():
    t = t_axis(0.6)
    f = 60 + 220 * np.exp(-t * 40)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    snap = bp(rng.standard_normal(len(t)), 1200, 8000) * np.exp(-t * 45)
    return wet(np.tanh((body + snap * 0.6) * 1.5) * 0.55, IR_SMALL, 0.4)


def sfx_slam():
    t = t_axis(1.8)
    f = 38 + 140 * np.exp(-t * 16)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3)
    metal = sum(np.sin(2 * np.pi * fr * t) for fr in (443, 657, 1210, 1893)) * np.exp(-t * 7) * 0.12
    noise = bp(rng.standard_normal(len(t)), 200, 6000) * np.exp(-t * 18)
    return wet(np.tanh((boom * 1.4 + metal + noise * 0.8) * 1.4) * 0.8, IR_BIG, 0.5)


def sfx_whoosh(sec):
    t = t_axis(sec + 0.3)
    n = rng.standard_normal(len(t))
    x = sweep_lp(n, 300, 9000)
    pos = t / (sec + 0.3)
    e = np.sin(np.pi * np.clip(pos, 0, 1)) ** 2.5
    x = x * e * 0.5
    st = np.stack([x * (1 - pos) * 1.4, x * pos * 1.4])  # pans left to right
    return st


def sfx_riser(sec):
    t = t_axis(sec)
    p = t / sec
    noise = hp(rng.standard_normal(len(t)), 800) * p ** 2.2 * 0.35
    tone = saw(110 * 2 ** (p * 3), t) * p ** 2 * 0.12
    return sweep_lp(noise + tone, 600, 12000)


def sfx_drone(sec):
    t = t_axis(sec)
    x = saw(36.7, t) + saw(36.9, t) + 0.5 * np.sin(2 * np.pi * 55 * t)
    x = lp(x, 180) * np.minimum(1, t / 0.8) * np.minimum(1, (sec - t) / 0.2) * 0.45
    return x


def sfx_zap():
    t = t_axis(0.18)
    f = 3200 * np.exp(-t * 30) + 400
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * 0.14


def sfx_glitch():
    t = t_axis(0.42)
    out = np.zeros(len(t))
    pos = 0
    while pos < len(t):
        seg = int(rng.uniform(0.012, 0.045) * SR)
        kind = rng.integers(0, 3)
        tt = np.arange(seg) / SR
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * rng.uniform(300, 2400) * tt))
        elif kind == 1:
            s = rng.standard_normal(seg)
        else:
            s = np.zeros(seg)
        out[pos:pos + seg] = s[: len(out) - pos] * rng.uniform(0.3, 1)
        pos += seg
    crushed = np.round(out * 6) / 6
    return hp(crushed, 250) * np.exp(-t * 4) * 0.22


def sfx_blip(freq=None):
    freq = freq or rng.choice([1320, 1760, 2093, 2637])
    t = t_axis(0.16)
    x = np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 1.5 * t)
    return wet(x * np.exp(-t * 30) * 0.13, IR_SMALL, 0.35)


def sfx_chime():
    t = t_axis(2.2)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((1046.5, 2.5), (1568, 3), (2093, 3.5), (3136, 5)))
    shimmer = 1 + 0.25 * np.sin(2 * np.pi * 9 * t)
    return wet(x * shimmer * np.minimum(1, t / 0.01) * 0.09, IR_BIG, 0.7)


def sfx_shimmer(sec):
    t = t_axis(sec)
    x = np.zeros(len(t))
    for _ in range(14):
        f = rng.uniform(2000, 7000)
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(4, 13) * t))
    e = np.sin(np.pi * t / sec)
    return wet(x / 14 * e * 0.12, IR_BIG, 0.6)


def sfx_swell(sec):
    t = t_axis(sec)
    x = sweep_lp(rng.standard_normal(len(t)), 200, 3000) * (t / sec) ** 1.5 * 0.3
    return x


def sfx_rush(sec):
    t = t_axis(sec)
    n = bp(rng.standard_normal(len(t)), 150, 2500)
    wob = 0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t) * np.sin(2 * np.pi * 0.23 * t)
    e = np.minimum(1, t / 0.6) * np.minimum(1, (sec - t) / 0.8)
    return n * wob * e * 0.16


def sfx_pulse():
    t = t_axis(1.6)
    f = 70 + 30 * np.exp(-t * 4)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    sub = sweep_lp(rng.standard_normal(len(t)), 4000, 200) * np.exp(-t * 3) * 0.25
    return wet((x + sub) * 0.6, IR_BIG, 0.5)


def sfx_data(sec):
    out = np.zeros(int(sec * SR))
    t = 0.0
    while t < sec - 0.1:
        b = sfx_blip(rng.uniform(1800, 4200))[0][: int(0.08 * SR)] * 0.35
        i = int(t * SR)
        out[i:i + len(b)] += b[: len(out) - i]
        t += rng.uniform(0.06, 0.22)
    return out


# ---------- score ----------
music = np.zeros((2, N))
# D minor progression, one chord per bar (2 s): Dm Bb F C
CHORDS = [[146.83, 174.61, 220.0], [116.54, 146.83, 174.61], [174.61, 220.0, 261.63], [130.81, 164.81, 196.0]]
ROOTS = [73.42, 58.27, 87.31, 65.41]

def section(t):
    """Arrangement intensity per instrument at time t."""
    s = {"kick": 0, "clap": 0, "hat": 0, "bass": 0, "arp": 0, "pad": 0}
    if 2.25 <= t < 6 or 8.0 <= t < 14 or 14 <= t < 23 or 24.4 <= t < 32 or 40 <= t < 46.4:
        s.update(kick=1, clap=1, hat=1, bass=1)
    if 32 <= t < 40:
        s.update(kick=1, hat=0.6, bass=0.7)
    if 6 <= t < 8.0 or 23 <= t < 24.4:
        s.update(pad=1)
    if t >= 2.25:
        s["pad"] = 1
    if 14 <= t < 23 or 32 <= t < 40 or 24.4 <= t < 32:
        s["arp"] = 1
    return s

kick_s, clap_s = kick(), clap()
step = BEAT / 4
pump = np.ones(N)
n_steps = int(DUR / step)
for k in range(n_steps):
    t = k * step
    s = section(t)
    bar = int(t // (BEAT * 4)) % 4
    pos16 = k % 16
    if s["kick"] and pos16 % 4 == 0:
        add(music, kick_s, t, 0.9 * s["kick"])
        i = int(t * SR)
        e = 1 - 0.75 * np.exp(-np.arange(int(BEAT * SR)) / SR * 9)  # sidechain pump
        pump[i:i + len(e)] = np.minimum(pump[i:i + len(e)], e[: max(0, N - i)])
    if s["clap"] and pos16 in (4, 12):
        add(music, wet(clap_s, IR_SMALL, 0.5), t, 0.55)
    if s["hat"] and pos16 % 2 == 0:
        add(music, hat(pos16 % 4 == 2), t, 0.9 * s["hat"], pan=0.3 if pos16 % 4 else -0.3)
    if s["arp"]:
        notes = CHORDS[bar] + [CHORDS[bar][0] * 2]
        f = notes[[0, 1, 2, 3, 2, 1, 3, 2][pos16 % 8]] * 2
        add(music, pluck(f), t, 0.9, pan=0.5 if pos16 % 2 else -0.5)

# bass: off-beat 8ths with sidechain feel
bass = np.zeros(N)
tt = np.arange(N) / SR
for b in range(int(DUR / (BEAT * 4)) + 1):
    t0 = b * BEAT * 4
    root = ROOTS[b % 4]
    for e8 in range(8):
        t = t0 + e8 * BEAT / 2
        s = section(t)
        if not s["bass"]:
            continue
        seg = t_axis(BEAT / 2 * 0.9)
        x = lp(saw(root, seg) + 0.6 * np.sin(2 * np.pi * root / 2 * seg), 420) * np.exp(-seg * 5)
        i = int(t * SR)
        n = min(len(x), N - i)
        if n > 0:
            bass[i:i + n] += x[:n] * 0.5 * s["bass"]
music += np.stack([bass, bass])

# pads, chord per bar
for b in range(int(DUR / (BEAT * 4))):
    t0 = b * BEAT * 4
    if section(t0 + 0.1)["pad"]:
        add(music, pad_chord(CHORDS[b % 4], BEAT * 4 + 0.5), t0, 1.0)

music *= pump  # whole bed breathes with the kick
music = np.stack([wet(music[0], IR_SMALL, 0.15)[0][:N], wet(music[1], IR_SMALL, 0.15)[1][:N]])

# ---------- voiceover + ducking ----------
vo = np.zeros(N)
for v in TL["vo"]:
    x = read_wav(ROOT / "audio-src/vo" / v["file"])
    x = hp(x, 90)
    # light compression + presence
    x = np.tanh(x * 2.2) / np.tanh(2.2)
    x = x + 0.25 * bp(x, 2500, 6000)
    i = int(v["at"] * SR)
    vo[i:i + len(x)] += x[: N - i]
vo_st = wet(vo, IR_SMALL, 0.08)[:, :N] * 0.95

env = np.abs(vo)
win = int(0.05 * SR)
env = np.convolve(env, np.ones(win) / win, mode="same")
active = (env > 0.01).astype(float)
smooth = np.convolve(active, np.hanning(int(0.35 * SR)) / (np.hanning(int(0.35 * SR)).sum()), mode="same")
duck = 1 - 0.55 * np.clip(smooth * 1.5, 0, 1)  # about -7 dB under narration

# ---------- sfx ----------
fx = np.zeros((2, N))
for e in TL["sfx"]:
    k, at = e["type"], e["at"]
    if k == "impact":
        add(fx, sfx_impact(e.get("size", 1)), at, 1.0)
    elif k == "hit":
        add(fx, sfx_hit(), at, 0.9)
    elif k == "slam":
        add(fx, sfx_slam(), at, 1.0)
    elif k == "whoosh":
        add(fx, sfx_whoosh(e["len"]), at, 1.0)
    elif k == "riser":
        add(fx, sfx_riser(e["len"]), at, 0.9)
    elif k == "drone":
        add(fx, sfx_drone(e["len"]), at, 1.0)
    elif k == "zap":
        add(fx, sfx_zap(), at, 1.0, pan=rng.uniform(-0.7, 0.7))
    elif k == "glitch":
        add(fx, sfx_glitch(), at, 1.0, pan=rng.uniform(-0.4, 0.4))
    elif k == "blip":
        add(fx, sfx_blip(), at, 1.0, pan=rng.uniform(-0.6, 0.6))
    elif k == "chime":
        add(fx, sfx_chime(), at, 1.0)
    elif k == "shimmer":
        add(fx, sfx_shimmer(e["len"]), at, 1.0)
    elif k == "swell":
        add(fx, sfx_swell(e["len"]), at, 0.8)
    elif k == "rush":
        add(fx, sfx_rush(e["len"]), at, 1.0)
    elif k == "pulse":
        add(fx, sfx_pulse(), at, 1.0)
    elif k == "data":
        add(fx, sfx_data(e["len"]), at, 0.8, pan=0.2)

mix = music * 0.42 * duck + fx * 0.62 * (0.75 + 0.25 * duck) + vo_st * 1.0

# master: fade-out tail and soft clip
fade = np.ones(N)
fs = int(47.0 * SR)
fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
mix = mix * fade
mix = np.tanh(mix * 1.1) / 1.1
mix /= np.abs(mix).max() / 0.95

out = ROOT / "public/mix_raw.wav"
out.parent.mkdir(exist_ok=True)
with wave.open(str(out), "w") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print("wrote", out)
