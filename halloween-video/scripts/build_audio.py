"""Lays the ElevenLabs "Liam" narration (narration/s01..s10.wav) over the user's track
KORDHELL - Murder In My Mind (music/murder_in_my_mind.mp3, 120 BPM phonk), adds horror SFX
and writes the timing map for Remotion.

The song plays from its first bar; every clip has a fixed start chosen so the key words land on
the track's structure: intro (0-15 s), break (15-17), DROP 1 at 17.13 s ("в эту ночь Темпл Бар"),
break 31-33, DROP 3 at 49.1 s ("ты встретишь кого-то особенного"), DROP 4 at 65.1 s (tagline).

Outputs:
  src/timing.json        scene / clip / word timings in frames + beat grid
  public/audio/mix.wav   48 kHz stereo mix
"""
import json
import os
import subprocess

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
FPS = 30
BEAT = 0.49925  # 120.18 BPM, measured from the kick onsets
PHASE = 0.152  # first kick of the grid (s)
DROPS = [17.13, 33.12, 49.1, 65.1]
TOTAL = 80.0

# clip -> absolute start of speech (s)
CLIPS = {"s01": 1.2, "s02": 6.1, "s03": 10.6, "s04": 15.0, "s05": 26.3, "s06": 30.0, "s07": 43.0, "s08": 52.0, "s09": 60.6, "s10": 65.15}
# scene -> (start, end) in seconds; consecutive scenes overlap by 10 frames for the transitions
SCENES = [
    ("hook", 0.0, 5.75),
    ("night", 5.75, 10.25),
    ("city", 10.25, 14.6),
    ("forget", 14.6, 17.13),
    ("temple", 17.13, 26.0),
    ("title", 26.0, 29.75),
    ("vibes", 29.75, 42.6),
    ("come", 42.6, 51.6),
    ("info", 51.6, 60.3),
    ("book", 60.3, 65.1),
    ("finale", 65.1, 72.0),
    ("end", 72.0, TOTAL),
]
rng = np.random.default_rng(1031)


def load(pid):
    sr, x = wavfile.read(os.path.join(ROOT, "narration", f"{pid}.wav"))
    x = x.astype(np.float32) / (32768.0 if x.dtype == np.int16 else 1.0)
    if x.ndim > 1:
        x = x.mean(axis=1)
    x = signal.resample_poly(x, SR, sr).astype(np.float32)
    idx = np.where(np.abs(x) > 0.004)[0]
    head = max(0, idx[0] - int(0.04 * SR))
    x = x[head: idx[-1] + int(0.08 * SR)]
    b, a = signal.butter(2, 80 / (SR / 2), "high")
    x = signal.lfilter(b, a, x)
    # gentle compression so whispers sit as present as the full voice
    env = signal.filtfilt(*signal.butter(1, 8 / (SR / 2)), np.abs(x))
    x = x / np.maximum(env / (env.max() + 1e-9), 0.25) ** 0.35
    return (x / (np.abs(x).max() + 1e-9) * 0.9).astype(np.float32), head / SR


def song():
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", os.path.join(ROOT, "music/murder_in_my_mind.mp3"),
                          "-t", str(TOTAL + 0.5), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.standard_normal(int(d * SR)).astype(np.float32)


def lp(x, fc, order=2):
    return signal.lfilter(*signal.butter(order, fc / (SR / 2)), x).astype(np.float32)


def bp(x, lo, hi):
    return signal.lfilter(*signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], "band"), x).astype(np.float32)


# ------------------------------------------------------------------ sfx
def thunder(d=3.2):
    t = t_axis(d)
    crack = bp(noise(d), 1500, 7000) * np.exp(-t * 18) * 0.9
    rumble = lp(noise(d), 160, 4) * 9
    rumble *= (np.minimum(1, t * 6) * np.exp(-t * 1.1)) * (1 + 0.6 * np.sin(2 * np.pi * 3.3 * t) * np.exp(-t))
    return np.tanh(crack + rumble).astype(np.float32) * 0.8


def boom():
    t = t_axis(1.6)
    f = 70 * np.exp(-t * 3) + 32
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    hit = lp(noise(1.6), 900) * np.exp(-t * 25) * 2
    return np.tanh((body + hit) * 1.6).astype(np.float32) * 0.85


def whoosh(d=0.6, up=True):
    t = t_axis(d)
    n = noise(d)
    out = np.zeros_like(n)
    f = np.geomspace(300, 5000, len(t)) if up else np.geomspace(5000, 300, len(t))
    for i in range(0, len(n), 512):
        out[i:i + 512] = bp(n[i:i + 512], f[i] * 0.6, min(SR / 2 * 0.98, f[i] * 1.6))
    return (out * np.sin(np.linspace(0, np.pi, len(t))) ** 2 * 0.8).astype(np.float32)


def riser(d=2.0):
    t = t_axis(d)
    n = noise(d)
    out = np.zeros_like(n)
    f = np.geomspace(200, 9000, len(t))
    for i in range(0, len(n), 512):
        out[i:i + 512] = bp(n[i:i + 512], f[i] * 0.7, min(SR / 2 * 0.98, f[i] * 1.4))
    tone = np.sin(2 * np.pi * np.cumsum(np.geomspace(110, 880, len(t))) / SR) * 0.25
    return ((out + tone) * (t / d) ** 2 * 0.7).astype(np.float32)


def heartbeat():
    out = np.zeros(int(1.0 * SR), np.float32)
    for at, g in ((0.0, 1.0), (0.24, 0.7)):
        t = t_axis(0.3)
        f = 55 * np.exp(-t * 8) + 35
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * g
        out[int(at * SR): int(at * SR) + len(x)] += x.astype(np.float32)
    return np.tanh(out * 2.2) * 0.9


def bell(f0=196.0, d=4.0):
    t = t_axis(d)
    partials = ((1, 1.0, 0.7), (2.0, 0.6, 1.0), (2.4, 0.45, 1.3), (3.0, 0.3, 1.8), (4.2, 0.2, 2.5), (5.4, 0.12, 3.2))
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * k) for r, a, k in partials)
    return (x * 0.35).astype(np.float32)


def neon_buzz(d=0.9):
    t = t_axis(d)
    hum = signal.sawtooth(2 * np.pi * 100 * t) * 0.25 + bp(noise(d), 2000, 6000) * 0.4
    flick = (np.sin(2 * np.pi * 9 * t) > -0.2) | (t > d * 0.55)
    return (hum * flick * np.minimum(1, (d - t) * 8) * 0.35).astype(np.float32)


def bats(d=1.3):
    t = t_axis(d)
    flap = (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) ** 3
    chirp = sum(np.sin(2 * np.pi * (5500 + 600 * k) * t) * ((t * 7 + k * 0.37) % 1 < 0.05) for k in range(3)) * 0.12
    return ((bp(noise(d), 500, 2500) * flap * 0.6 + chirp) * np.sin(np.pi * t / d)).astype(np.float32)


def stamp():
    t = t_axis(0.45)
    thud = np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t * 20) + 60) / SR) * np.exp(-t * 18)
    clack = bp(noise(0.45), 800, 4000) * np.exp(-t * 60) * 1.2
    return np.tanh((thud + clack) * 1.5).astype(np.float32) * 0.8


def tear():
    d = 0.5
    t = t_axis(d)
    crackle = bp(noise(d), 1500, 8000) * (rng.random(len(t)) < 0.08) * 3
    return (lp(crackle, 9000) * np.sin(np.pi * t / d) * 0.7).astype(np.float32)


def glitch(d=0.35):
    t = t_axis(d)
    sq = signal.square(2 * np.pi * np.repeat(rng.choice([180, 420, 960, 2400], 12), int(len(t) / 12) + 1)[: len(t)] * t)
    return (sq * 0.18 * (rng.random(len(t)) > 0.3)).astype(np.float32)


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
    clips, starts = {}, {}
    for pid, at in CLIPS.items():
        x, head = load(pid)
        clips[pid] = x
        starts[pid] = (at, head)
    W = lambda pid, i: starts[pid][0] + max(0.0, words[pid]["words"][i][1] - starts[pid][1])

    fr = lambda s: int(round(s * FPS))
    rem = {
        "fps": FPS,
        "total": fr(TOTAL),
        "beat": BEAT * FPS,
        "phase": PHASE * FPS,
        "drops": [fr(d) for d in DROPS],
        "scenes": {k: {"from": fr(a), "dur": fr(b) - fr(a) + (10 if k != "end" else 0)} for k, a, b in SCENES},
        "clips": {pid: {"from": fr(st), "dur": int(round(len(clips[pid]) / SR * FPS))} for pid, (st, _) in starts.items()},
        "words": {pid: [[w, fr(W(pid, i))] for i, (w, _) in enumerate(words[pid]["words"])] for pid in starts},
    }
    with open(os.path.join(ROOT, "src/timing.json"), "w") as f:
        json.dump(rem, f, ensure_ascii=False, indent=1)

    # ------------------------------------------------ mix
    n = int(TOTAL * SR)
    vo = np.zeros((n, 2), np.float32)
    for pid, (st, head) in starts.items():
        place(vo, clips[pid], st - 0.04)
    mus = song()[:n]
    mus = np.pad(mus, ((0, n - len(mus)), (0, 0)))

    S = {k: a for k, a, _ in SCENES}
    fx = np.zeros((n, 2), np.float32)
    place(fx, thunder(), 0.15, 1.0)
    place(fx, thunder(2.6), W("s01", 6) - 0.1, 0.55, pan=0.3)  # "дома": window goes dark
    place(fx, whoosh(0.6), S["night"] - 0.3, 0.7)
    for i in (1, 3, 5):  # ночь / атмосфера / эмоций slams
        place(fx, boom(), W("s02", i), 0.45)
    place(fx, whoosh(0.6, False), S["city"] - 0.3, 0.7)
    place(fx, bell(), W("s03", 0), 0.7)  # midnight bell on "31"
    place(fx, bats(), W("s03", 3), 0.5, pan=-0.4)
    place(fx, glitch(), W("s04", 0), 0.6)
    place(fx, glitch(0.25), W("s04", 3), 0.6)
    place(fx, riser(2.2), DROPS[0] - 2.2, 0.55)
    place(fx, boom(), DROPS[0], 0.9)
    place(fx, neon_buzz(), DROPS[0] + 0.15, 0.5)
    for i in (14, 15, 18):  # страсть / музыка / магия
        place(fx, whoosh(0.35), W("s04", i) - 0.15, 0.4)
    place(fx, whoosh(0.7), S["title"] - 0.35, 0.8)
    place(fx, boom(), W("s05", 0), 0.8)
    place(fx, thunder(2.0), W("s05", 3), 0.45)
    for i in (0, 3, 7, 12):  # tarot cards flip
        place(fx, whoosh(0.3), W("s06", i) - 0.12, 0.55, pan=0.2)
    place(fx, whoosh(0.6, False), S["come"] - 0.3, 0.7)
    for k in range(3):
        place(fx, heartbeat(), W("s07", 9) + k * 0.82, 0.8)
    place(fx, boom(), DROPS[2], 0.6)
    place(fx, whoosh(0.6), S["info"] - 0.3, 0.7)
    for i in (0, 4, 11):
        place(fx, stamp(), W("s08", i), 0.5)
    place(fx, whoosh(0.5, False), S["book"] - 0.25, 0.7)
    place(fx, tear(), W("s09", 0), 0.7)
    place(fx, stamp(), W("s09", 2), 0.7)
    place(fx, riser(1.6), DROPS[3] - 1.6, 0.4)
    place(fx, boom(), DROPS[3], 0.8)
    place(fx, thunder(), W("s10", 7), 0.5)
    place(fx, bell(147.0, 5.0), S["end"] + 0.1, 0.55)

    # speech mask from the clip spans (pre-roll 0.2 s so the music is already down on the first syllable)
    vmask = np.zeros(n, np.float32)
    for pid, (st, _) in starts.items():
        vmask[int((st - 0.2) * SR): int((st + len(clips[pid]) / SR + 0.25) * SR)] = 1
    vmask = signal.filtfilt(*signal.butter(1, 4 / (SR / 2)), vmask).clip(0, 1)
    # spectral carve: remove most of the song's vocal range while the narrator speaks
    mid = np.stack([signal.filtfilt(*signal.butter(2, [200 / (SR / 2), 5000 / (SR / 2)], "band"), mus[:, c]) for c in (0, 1)], 1)
    mus = mus - mid * (0.85 * vmask)[:, None]
    duck = 1 - 0.8 * vmask  # about -14 dB under the voice (plus the carve)
    # the whispered line ("возможно, именно этой ночью...") needs extra room
    w0, w1 = int((W("s07", 9) - 0.25) * SR), int((starts["s07"][0] + len(clips["s07"]) / SR) * SR)
    ramp = np.zeros(n, np.float32)
    ramp[w0:w1] = 1
    ramp = signal.filtfilt(*signal.butter(1, 2 / (SR / 2)), ramp)
    duck *= 1 - 0.5 * ramp
    vo *= (1 + 0.4 * ramp)[:, None]
    mus *= duck[:, None]
    mix = vo * 1.0 + mus * 0.45 + fx * 0.35
    mix = np.tanh(mix / np.abs(mix).max() * 1.15) / np.tanh(1.15) * 0.95
    # report voice-over-music ratio while speaking
    sp = vmask > 0.9
    rv = np.sqrt(np.mean(vo[sp] ** 2))
    rm = np.sqrt(np.mean((mus[sp] * 0.45) ** 2))
    print("voice/music during speech: %.1f dB" % (20 * np.log10(rv / rm)))
    fade = int(2.4 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    end = {pid: round(st + len(clips[pid]) / SR, 2) for pid, (st, _) in starts.items()}
    print(json.dumps({"clip_end": end}, indent=0))


if __name__ == "__main__":
    main()
