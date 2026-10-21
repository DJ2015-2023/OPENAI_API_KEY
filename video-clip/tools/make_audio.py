"""Synthesize the cinematic score + SFX and mix it under the voice-over.

Reads src/timeline.json and public/vo/*.wav, writes public/mix.wav (48 kHz stereo).
Everything is generated procedurally, so there are no licensing concerns.
"""
import json, pathlib, subprocess
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
tl = json.loads((ROOT / "src/timeline.json").read_text())
TOTAL = tl["total"]
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(11)
t_all = np.arange(N) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    buf[i : i + len(sig)] += sig * gain


def reverb(x, seconds=2.8, decay=3.2, mix=0.35):
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-decay * np.arange(n) / n * 3)
    ir = lp(ir, 6000)
    ir /= np.sqrt((ir**2).sum())
    wet = fftconvolve(x, ir)[: len(x)]
    return x * (1 - mix) + wet * mix * 2.2


# ---------------- Musical structure ----------------
BPM = 84
BEAT = 60 / BPM
BAR = BEAT * 4
# A minor: Am – F – C – G  (MIDI roots)
PROG = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [55, 60, 64]), (55, [55, 59, 62])]

scene = {s["id"]: s for s in tl["scenes"]}
intro_end = scene["hook"]["start"]
build_from = scene["how"]["start"]
peak_from = scene["why"]["start"]
cta_at = scene["cta"]["start"]
outro_at = scene["outro"]["start"]

# Section intensity curve 0..1 driving layers.
def intensity(t):
    pts = [(0, 0.25), (intro_end, 0.5), (build_from, 0.65), (scene["s3"]["start"], 0.75),
           (peak_from, 0.9), (cta_at, 1.0), (outro_at, 0.85), (TOTAL - 2.5, 0.5), (TOTAL + 1, 0.0)]
    xs, ys = zip(*pts)
    return np.interp(t, xs, ys)


inten = intensity(t_all)
music_start = 0.0
n_bars = int(np.ceil((TOTAL - music_start) / BAR)) + 1

pad = np.zeros(N)
sub = np.zeros(N)
keys = np.zeros(N)
pulse = np.zeros(N)
strings = np.zeros(N)

for b in range(n_bars):
    bs = music_start + b * BAR
    root, triad = PROG[b % 4]
    if b == n_bars - 1 or bs > TOTAL - BAR * 0.8:
        root, triad = PROG[0]  # resolve home
    ln = int(BAR * SR * 1.25)
    tt = np.arange(ln) / SR
    env = np.minimum(1, tt / 0.6) * np.exp(-np.maximum(0, tt - BAR) * 3)
    # Pad: detuned saws, soft low-pass
    p = np.zeros(ln)
    for m in triad + [triad[0] + 12]:
        for d in (-0.11, -0.04, 0.0, 0.05, 0.12):
            f = midi(m) * 2 ** (d / 12)
            ph = rng.random()
            p += 2 * ((tt * f + ph) % 1) - 1
    p = lp(p, 1400, 2) * env / 20
    place(pad, p, bs)
    # Sub bass
    s = np.sin(2 * np.pi * midi(root - 12) * tt) * env
    place(sub, s * 0.5, bs)
    # Strings swell (higher voicing) for the emotional peak
    st = np.zeros(ln)
    for m in (triad[1] + 12, triad[2] + 12, triad[0] + 24):
        f = midi(m)
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * tt)
        st += np.sin(2 * np.pi * f * np.cumsum(vib) / SR) + 0.35 * np.sin(4 * np.pi * f * np.cumsum(vib) / SR)
    st *= np.sin(np.pi * np.clip(tt / (BAR * 1.2), 0, 1)) ** 1.5
    place(strings, st / 6, bs)
    # Piano-like arpeggio in 8ths
    arp = [triad[0] + 12, triad[1] + 12, triad[2] + 12, triad[1] + 24, triad[2] + 12, triad[1] + 12, triad[0] + 24, triad[2] + 12]
    for k, m in enumerate(arp):
        nt = np.arange(int(1.6 * SR)) / SR
        f = midi(m)
        tone = sum(np.sin(2 * np.pi * f * h * nt) * a * np.exp(-nt * (2.2 + h)) for h, a in ((1, 1), (2, 0.45), (3, 0.2), (4, 0.1)))
        tone *= np.minimum(1, nt / 0.004)
        vel = 0.75 if k % 2 else 1.0
        place(keys, tone * vel / 5, bs + k * BEAT / 2)
    # Heartbeat pulse (lub-dub) on beats 1 and 3
    for beat in (0, 2):
        for off, g in ((0, 1.0), (0.22, 0.65)):
            kt = np.arange(int(0.5 * SR)) / SR
            f = 45 + 75 * np.exp(-kt * 30)
            k = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-kt * 9)
            place(pulse, k * g, bs + beat * BEAT + off)

# Layer gating by section
keys_gain = np.clip((t_all - intro_end + 0.5) / 2, 0, 1) * (0.55 + 0.45 * inten)
pulse_gain = np.clip((t_all - build_from) / 3, 0, 1) * np.clip((TOTAL - 2.5 - t_all) / 2, 0, 1)
strings_gain = np.clip((t_all - peak_from + 2) / 6, 0, 1) * np.clip((TOTAL - t_all) / 3, 0, 1)
music = (
    pad * (0.35 + 0.45 * inten)
    + sub * 0.35 * inten
    + keys * keys_gain
    + pulse * 0.55 * pulse_gain
    + strings * 0.45 * strings_gain
)
music = reverb(music, 3.0, 3.0, 0.32)
fade_in = np.clip(t_all / 1.2, 0, 1)
fade_out = np.clip((TOTAL - t_all) / 2.5, 0, 1)
music *= fade_in * fade_out

# ---------------- SFX ----------------
sfx = np.zeros(N)


def whoosh(at, length=0.9, lo=300, hi=6000, gain=0.35):
    # Sweep illusion: noise bands from low to high, each peaking a little later.
    n = int(length * SR)
    u = np.linspace(0, 1, n)
    out = np.zeros(n)
    bands = np.geomspace(lo, hi, 6)
    for k, fc in enumerate(bands):
        centre = 0.25 + 0.5 * k / (len(bands) - 1)
        out += bp(rng.standard_normal(n), fc * 0.7, min(fc * 1.4, SR / 2 - 100)) * np.exp(-((u - centre) / 0.18) ** 2)
    env = np.sin(np.pi * u) ** 2
    place(sfx, out * env * gain, at - length * 0.7)


def riser(at, length=2.0, gain=0.25):
    n = int(length * SR)
    tt = np.arange(n) / SR
    noise = hp(rng.standard_normal(n), 1500)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1400 * (tt / length) ** 2) / SR) * 0.3
    env = (tt / length) ** 2.5
    place(sfx, (noise * 0.6 + tone) * env * gain, at - length)


def impact(at, gain=0.9):
    n = int(2.5 * SR)
    tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-tt * 12)) / SR) * np.exp(-tt * 2.2)
    crack = lp(rng.standard_normal(n), 3000) * np.exp(-tt * 18) * 0.5
    place(sfx, (boom + crack) * gain, at)


def shimmer(at, gain=0.12):
    # Bright chime cluster for "magic" moments.
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * midi(m) * tt) * np.exp(-tt * 2.5) for m in (88, 93, 96, 100))
    place(sfx, x * gain, at)


riser(intro_end, 2.4, 0.28)
impact(0.35, 0.5)
impact(intro_end, 0.85)
shimmer(1.0, 0.1)
for s in tl["scenes"][2:]:
    whoosh(s["start"], 0.9, gain=0.32)
# Accent hits on key words (estimated position within the line)
def cue(sid, phrase):
    s = scene[sid]
    return s["voiceAt"] + s["voiceDur"] * max(0, s["text"].find(phrase)) / len(s["text"])

impact(cue("hook", "ты?"), 0.55)
shimmer(cue("hook", "ты?"), 0.1)
for sid in ("s1", "s2", "s3", "s4", "s5"):
    shimmer(scene[sid]["start"] + 0.15, 0.06)
impact(cue("s3", "шесть"), 0.35)
impact(cue("s4", "от одного"), 0.35)
for ph in ("своя песня", "Своя хореография", "Своя уникальная", "И свой"):
    shimmer(cue("why", ph), 0.05)
riser(cta_at, 2.0, 0.2)
impact(cta_at, 0.7)
shimmer(cue("cta", "Пиши"), 0.09)
riser(outro_at, 1.8, 0.2)
impact(outro_at, 0.8)
impact(cue("outro", "Твоя история") + 0.6, 0.5)
sfx = reverb(sfx, 2.0, 3.5, 0.25)

# ---------------- Voice ----------------
voice = np.zeros(N)
for s in tl["scenes"][1:]:
    x, sr = sf.read(ROOT / f"public/vo/{s['id']}.wav")
    x = resample_poly(x, SR, sr)
    place(voice, x, s["voiceAt"])
# Warmth + presence, gentle compression, small room
voice = hp(voice, 75)
voice = voice + 0.25 * bp(voice, 2500, 5000) + 0.15 * bp(voice, 120, 250)
env = np.sqrt(np.maximum(lp(voice**2, 15), 0))
thr = 0.12
gain = np.where(env > thr, (thr + (env - thr) / 3) / (env + 1e-9), 1.0)
voice = voice * gain
voice = reverb(voice, 0.9, 6.0, 0.12)

# Duck music + sfx under the voice
venv = np.sqrt(np.maximum(lp(voice**2, 6), 0))
duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25 + 1e-9), 0, 1)
duck = lp(duck, 4)

def norm(x, peak):
    return x / (np.abs(x).max() + 1e-9) * peak

mix = norm(voice, 0.9) * 1.0 + norm(music, 0.5) * duck + norm(sfx, 0.55) * (0.6 + 0.4 * duck)
mix = mix[: int(TOTAL * SR)]
# Stereo: slight width on music via Haas, voice centered
music_l = mix
music_r = np.concatenate([np.zeros(12), mix[:-12]])
stereo = np.stack([0.5 * mix + 0.5 * music_l, 0.5 * mix + 0.5 * music_r], axis=1)
stereo = np.tanh(stereo * 1.1) / np.tanh(1.1)
tmp = ROOT / "public/mix_raw.wav"
sf.write(tmp, stereo.astype(np.float32), SR)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af", "loudnorm=I=-14:TP=-1.2:LRA=11", "-ar", str(SR),
                str(ROOT / "public/mix.wav")], check=True)
tmp.unlink()
print("mix written", TOTAL, "s")
