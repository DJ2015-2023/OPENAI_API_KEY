"""Narration (ElevenLabs "Liam", narration/s01..s06.wav) + an original dark dembow beat synthesised
here + CC0 sound effects from the motion-graphics `sound-effects` skill library (Kenney / Freesound CC0).

Outputs:
  src/timing.json        scenes / clips / word frames + beat grid
  public/audio/mix.wav   48 kHz stereo
"""
import json
import os
import subprocess

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX = "/home/user/Barty-Bart/motion-graphics/skills/sound-effects/sfx"
SR = 48000
FPS = 30
BPM = 96
B = 60 / BPM
TOTAL = 42.0
rng = np.random.default_rng(750)

CLIPS = {"s01": 0.8, "s02": 5.0, "s03": 10.8, "s04": 14.0, "s05": 23.4, "s06": 32.3}
SCENES = [
    ("alert", 0.0, 4.75),
    ("price", 4.75, 10.5),
    ("hurry", 10.5, 13.7),
    ("party", 13.7, 23.1),
    ("venue", 23.1, 31.9),
    ("poster", 31.9, TOTAL),
]
N = int(TOTAL * SR)


def load(pid):
    sr, x = wavfile.read(os.path.join(ROOT, "narration", f"{pid}.wav"))
    x = x.astype(np.float32) / (32768.0 if x.dtype == np.int16 else 1.0)
    if x.ndim > 1:
        x = x.mean(axis=1)
    x = signal.resample_poly(x, SR, sr).astype(np.float32)
    idx = np.where(np.abs(x) > 0.004)[0]
    head = max(0, idx[0] - int(0.04 * SR))
    x = x[head: idx[-1] + int(0.08 * SR)]
    x = signal.lfilter(*signal.butter(2, 80 / (SR / 2), "high"), x)
    return (x / (np.abs(x).max() + 1e-9) * 0.9).astype(np.float32), head / SR


def sfx(name, gain=1.0):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", os.path.join(SFX, name), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    return x / (np.abs(x).max() + 1e-9) * gain


def t_(d):
    return np.arange(int(d * SR)) / SR


def put(buf, x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i < 0:
        x, i = x[-i:], 0
    e = min(len(buf), i + len(x))
    if e <= i:
        return
    buf[i:e, 0] += x[: e - i] * g * (1 - max(0, pan))
    buf[i:e, 1] += x[: e - i] * g * (1 + min(0, pan))


NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ dark dembow instruments
def kick():
    t = t_(0.5)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(140 * np.exp(-t * 30) + 42) / SR) * np.exp(-t * 7) * 1.6).astype(np.float32)


def snare():
    t = t_(0.25)
    n = signal.lfilter(*signal.butter(2, [1500 / (SR / 2), 8000 / (SR / 2)], "band"), rng.standard_normal(len(t)))
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return ((n * np.exp(-t * 18) * 0.7 + body * 0.5)).astype(np.float32)


def hat(open_=False):
    d = 0.18 if open_ else 0.05
    t = t_(d)
    n = signal.lfilter(*signal.butter(2, 8000 / (SR / 2), "high"), rng.standard_normal(len(t)))
    return (n * np.exp(-t * (18 if open_ else 90)) * 0.3).astype(np.float32)


def bass808(note, d):
    t = t_(d)
    f = NOTE(note) * (1 + 0.6 * np.exp(-t * 40))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return (np.tanh(x * 1.8) * np.minimum(1, t * 200) * np.exp(-t * 1.2) * 0.75).astype(np.float32)


def pad(chord, d):
    t = t_(d)
    x = sum(signal.sawtooth(2 * np.pi * NOTE(n) * t * (1 + dt)) for n in chord for dt in (-0.004, 0.004))
    x = signal.lfilter(*signal.butter(2, 1400 / (SR / 2)), x)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.4)
    return (x * env * 0.035).astype(np.float32)


def bell(note, d=1.2):
    t = t_(d)
    x = sum(a * np.sin(2 * np.pi * NOTE(note) * r * t) * np.exp(-t * k) for r, a, k in ((1, 1, 3), (2.76, 0.4, 5), (5.4, 0.2, 8)))
    return (x * 0.12).astype(np.float32)


PROG = [(45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62]), (40, [56, 59, 64])]  # Am - F - G - E (harmonic minor)
MELODY = [76, 72, 69, 71, 72, 71, 68, 69]


def music(intensity):
    out = np.zeros((N, 2), np.float32)
    bar = 4 * B
    for b in range(int(TOTAL / bar) + 1):
        t0 = b * bar
        lvl = intensity(t0)
        root, ch = PROG[b % 4]
        put(out, pad(ch, bar + 0.3), t0, 1.0)
        if lvl >= 1:
            # dembow: kick on 1 and 3, snare on the "a" of 1 and the "and" of 2 (3+3+2 feel)
            for beat in range(4):
                put(out, kick(), t0 + beat * B, 0.75)
            for pos in (0.75, 1.5, 2.75, 3.5):
                put(out, snare(), t0 + pos * B, 0.55, pan=0.05)
            for s in range(8):
                put(out, hat(s == 7), t0 + s * B / 2, 0.6, pan=0.3)
        if lvl >= 0.5:
            put(out, bass808(root - 12, bar * 0.95), t0, 0.8)
        if lvl >= 1.5:
            for k, n in enumerate(MELODY):
                put(out, bell(n), t0 + k * B / 2, 0.8, pan=-0.3)
    return out


def main():
    words = json.load(open(os.path.join(ROOT, "narration/words.json")))
    clips, starts = {}, {}
    for pid, at in CLIPS.items():
        clips[pid], head = load(pid)
        starts[pid] = (at, head)
    W = lambda pid, i: starts[pid][0] + max(0.0, words[pid]["words"][i][1] - starts[pid][1])
    fr = lambda s: int(round(s * FPS))
    rem = {
        "fps": FPS,
        "total": fr(TOTAL),
        "beat": B * FPS,
        "scenes": {k: {"from": fr(a), "dur": fr(b) - fr(a) + (10 if k != "poster" else 0)} for k, a, b in SCENES},
        "clips": {pid: {"from": fr(st), "dur": int(round(len(clips[pid]) / SR * FPS))} for pid, (st, _) in starts.items()},
        "words": {pid: [[w, fr(W(pid, i))] for i, (w, _) in enumerate(words[pid]["words"])] for pid in starts},
    }
    json.dump(rem, open(os.path.join(ROOT, "src/timing.json"), "w"), ensure_ascii=False, indent=1)

    vo = np.zeros((N, 2), np.float32)
    for pid, (st, _) in starts.items():
        put(vo, clips[pid], st - 0.04)
    S = {k: a for k, a, _ in SCENES}

    def intensity(t):
        if t < S["price"]:
            return 0.5
        if t < S["party"]:
            return 1.0
        return 1.5

    mus = music(intensity)
    fx = np.zeros((N, 2), np.float32)
    put(fx, sfx("glitch/kenney-interface-glitch-002.ogg"), 0.3, 0.5)
    put(fx, sfx("impact/fs-222517-dramatic-hit.ogg"), W("s01", 0), 0.7)
    put(fx, sfx("riser/fs-685256-riser-sound-effect-short-wav.ogg"), W("s01", 3) - 0.9, 0.35)
    put(fx, sfx("impact/fs-177242-cinematic-impact.ogg"), W("s01", 3), 0.6)
    put(fx, sfx("transition/fs-786514-swoosh-v2.ogg"), S["price"] - 0.25, 0.6)
    put(fx, sfx("ding/kenney-interface-confirmation-001.ogg"), W("s02", 2), 0.5)
    put(fx, sfx("whoosh/fs-683101-quick-woosh.ogg"), W("s02", 5) - 0.1, 0.5, pan=0.3)
    for k in range(8):  # price counter ticking 750 -> 850
        put(fx, sfx("tick/fs384187.ogg"), W("s02", 8) + k * 0.07, 0.35)
    put(fx, sfx("impact/fs-347561-micheal-bay-hit.ogg"), W("s02", 8) + 0.6, 0.55)
    put(fx, sfx("transition/fs-702773-swipe-wav.ogg"), S["hurry"] - 0.2, 0.6)
    for k in range(6):  # hourglass clock
        put(fx, sfx("tick/fs721514.ogg"), S["hurry"] + 0.2 + k * B, 0.4)
    put(fx, sfx("riser/fs-396161-scary-hits-risers-001.ogg"), S["party"] - 1.2, 0.35)
    put(fx, sfx("impact/fs-177242-cinematic-impact.ogg"), S["party"], 0.8)
    put(fx, sfx("ding/kenney-interface-bong-001.ogg"), W("s04", 4), 0.45)
    put(fx, sfx("whoosh/fs-169867-swoosh.ogg"), W("s04", 8) - 0.1, 0.5)
    put(fx, sfx("transition/fs-856168-cyberpunk-glitch-hologram-tran.ogg"), S["venue"] - 0.2, 0.5)
    put(fx, sfx("pop/fs-824189-pop-in-sfx.ogg"), W("s05", 0), 0.5)
    put(fx, sfx("ui-blip/kenney-digital-threetone1.ogg"), W("s05", 2), 0.4)
    put(fx, sfx("typing/fs-511418-data-reveal-sound.ogg"), W("s05", 4), 0.4)
    put(fx, sfx("riser/fs-464250-echo-chromatic-riser-wav.ogg"), S["poster"] - 1.4, 0.35)
    put(fx, sfx("impact/fs-222517-dramatic-hit.ogg"), S["poster"], 0.8)
    put(fx, sfx("ding/fs-349504-triangle-open-04.ogg"), S["poster"] + 3.6, 0.4)

    vmask = np.zeros(N, np.float32)
    for pid, (st, _) in starts.items():
        vmask[int((st - 0.2) * SR): int((st + len(clips[pid]) / SR + 0.25) * SR)] = 1
    vmask = signal.filtfilt(*signal.butter(1, 4 / (SR / 2)), vmask).clip(0, 1)
    mid = np.stack([signal.filtfilt(*signal.butter(2, [200 / (SR / 2), 5000 / (SR / 2)], "band"), mus[:, c]) for c in (0, 1)], 1)
    mus = mus - mid * (0.75 * vmask)[:, None]
    mus *= (1 - 0.7 * vmask)[:, None]
    mix = vo * 1.0 + mus * 0.55 + fx * 0.4
    mix = np.tanh(mix / np.abs(mix).max() * 1.2) / np.tanh(1.2) * 0.95
    fade = int(2.0 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    mix[: int(0.03 * SR)] *= np.linspace(0, 1, int(0.03 * SR))[:, None]
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    print({pid: round(st + len(clips[pid]) / SR, 2) for pid, (st, _) in starts.items()})


if __name__ == "__main__":
    main()
