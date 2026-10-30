"""20 s teaser score + voiceover mix.

Original modern bachata synthesised here (128 BPM): mysterious intro (pad, requinto plucks, soft güira),
a dead stop on «А ТЫ?», a riser, then the drop with 808 bass, kick, bongo martillo and güira.
Female voiceover (ElevenLabs "Charlotte", narration/v1..v6.wav) sits on top with ducking.
CC0 SFX from the motion-graphics `sound-effects` skill.

Outputs src/timing.json and public/audio/mix.wav.
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
FPS = 24
BPM = 128
B = 60 / BPM
BAR = 4 * B
INTRO = 6.8  # the user's LATIN FUSION logo animation opens the video
DROP = INTRO + 13.4
TOTAL = INTRO + 22.2
VO = {k: INTRO + v for k, v in {"v1": 0.35, "v2": 3.3, "v3": 6.25, "v4": 9.0, "v5": 13.55, "v6": 16.95}.items()}
SCENES = [("intro", 0.0, INTRO)] + [(k, INTRO + a, INTRO + b) for k, a, b in [("mirror", 0.0, 3.0), ("lipstick", 3.0, 6.0), ("friends", 6.0, 9.0), ("phone", 9.0, 13.4), ("party", 13.4, 16.75), ("poster", 16.75, 22.2)]]
PAUSE = (INTRO + 9.55, INTRO + 10.5)  # music drops out under «А ты…»
# The user's track: "Montagem Coral" phonk (slowed + reverb). Its drop hits at 31.72 s; we line it up with ours.
SONG = "/root/.claude/uploads/a159dcea-d751-5472-b97a-718a775da2cc/6928d9ae-MONTAGEM_CORAL_PHONK_Slowed__Reverb.mp3"
SONG_DROP = 31.72
SONG_BEAT = 0.438
INTRO_CLIP = "/root/.claude/uploads/a159dcea-d751-5472-b97a-718a775da2cc/3bad9304-IMG_0767.MP4"
INTRO_SRC, INTRO_SPEED = 1.4, 1.25
B = SONG_BEAT
PHASE = DROP
rng = np.random.default_rng(31)
N = int(TOTAL * SR)


def t_(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.standard_normal(int(d * SR)).astype(np.float32)


def filt(x, kind, f):
    return signal.lfilter(*signal.butter(2, np.array(f) / (SR / 2), kind), x).astype(np.float32)


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


def pluck(note, d=0.8, bright=0.6):
    f = NOTE(note)
    p = int(SR / f)
    buf = filt(noise(p / SR + 0.001), "low", 2500 + 5000 * bright)[:p].copy()
    out = np.zeros(int(d * SR), np.float32)
    for i in range(len(out)):
        v = buf[i % p]
        out[i] = v
        buf[i % p] = 0.5 * (v + buf[(i + 1) % p]) * 0.996
    return out * 0.6


def pad(chord, d):
    t = t_(d)
    x = sum(signal.sawtooth(2 * np.pi * NOTE(n) * t * (1 + dt)) for n in chord for dt in (-0.005, 0.0, 0.005))
    x = filt(x, "low", 1200)
    env = np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.5)
    return (x * env * 0.03).astype(np.float32)


def kick():
    t = t_(0.45)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t * 28) + 45) / SR) * np.exp(-t * 7) * 1.5).astype(np.float32)


def b808(note, d):
    t = t_(d)
    x = np.sin(2 * np.pi * np.cumsum(NOTE(note) * (1 + 0.5 * np.exp(-t * 35))) / SR)
    return (np.tanh(x * 1.6) * np.minimum(1, t * 200) * np.exp(-t * 1.5) * 0.8).astype(np.float32)


def guira(acc=False):
    d = 0.16 if acc else 0.08
    t = t_(d)
    return (filt(noise(d), "high", 6500) * np.exp(-t * (22 if acc else 45)) * (0.32 if acc else 0.2)).astype(np.float32)


def bongo(hi=True):
    t = t_(0.25)
    f = (390 if hi else 265) * (1 + 0.4 * np.exp(-t * 60))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (26 if hi else 18)) * 0.5).astype(np.float32)


def snap():
    t = t_(0.18)
    return (filt(noise(0.18), "band", [1200, 7000]) * np.exp(-t * 30) * 0.5).astype(np.float32)


def riser(d):
    t = t_(d)
    n = noise(d)
    out = np.zeros_like(n)
    f = np.geomspace(250, 9000, len(t))
    for i in range(0, len(n), 480):
        out[i:i + 480] = filt(n[i:i + 480], "band", [f[i] * 0.7, min(SR / 2 * 0.95, f[i] * 1.4)])
    tone = np.sin(2 * np.pi * np.cumsum(np.geomspace(80, 640, len(t))) / SR) * 0.3
    return ((out * 0.6 + tone) * (t / d) ** 2.2).astype(np.float32)


def sfx(name, gain=1.0):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", os.path.join(SFX, name), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    return x / (np.abs(x).max() + 1e-9) * gain


def load(pid):
    sr, x = wavfile.read(os.path.join(ROOT, "narration", f"{pid}.wav"))
    x = x.astype(np.float32) / (32768.0 if x.dtype == np.int16 else 1.0)
    if x.ndim > 1:
        x = x.mean(axis=1)
    x = signal.resample_poly(x, SR, sr).astype(np.float32)
    idx = np.where(np.abs(x) > 0.004)[0]
    head = max(0, idx[0] - int(0.03 * SR))
    x = x[head: idx[-1] + int(0.08 * SR)]
    x = filt(x, "high", 90)
    return (x / (np.abs(x).max() + 1e-9) * 0.9).astype(np.float32), head / SR


PROG = [(45, [57, 60, 64], [69, 72, 76, 72]), (41, [57, 60, 65], [69, 72, 77, 72]), (43, [55, 59, 62], [67, 71, 74, 71]), (40, [56, 59, 64], [68, 71, 76, 71])]


def decode(path, start=0.0, dur=None, speed=1.0):
    cmd = ["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", str(start)] + (["-t", str(dur * speed)] if dur else []) + ["-i", path]
    if speed != 1.0:
        cmd += ["-af", f"atempo={speed}"]
    raw = subprocess.run(cmd + ["-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def music():
    out = np.zeros((N, 2), np.float32)
    x = decode(SONG, SONG_DROP - DROP, TOTAL)[:N]
    out[: len(x)] = x
    fade = int(1.2 * SR)
    out[:fade] *= np.linspace(0, 1, fade)[:, None] ** 2
    # dead stop under «А ты…», then rebuild into the drop
    env = np.ones(N, np.float32)
    a, b_ = int(PAUSE[0] * SR), int(PAUSE[1] * SR)
    env[a:b_] = 0.0
    env[b_:int(DROP * SR)] = np.linspace(0.25, 0.8, int(DROP * SR) - b_)
    env = signal.filtfilt(*signal.butter(1, 30 / (SR / 2)), env)
    out *= np.clip(env, 0, 1)[:, None]
    out /= np.abs(out).max() + 1e-9
    # the logo animation's own whooshes and shimmer ride on top of the intro
    lg = decode(INTRO_CLIP, INTRO_SRC, INTRO, INTRO_SPEED)[: int(INTRO * SR)]
    lg[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))[:, None]
    out[: len(lg)] += lg / (np.abs(lg).max() + 1e-9) * 0.6
    put(out, riser(DROP - PAUSE[1]), PAUSE[1], 0.3)
    return out


def main():
    words = json.load(open(os.path.join(ROOT, "narration/words.json")))
    vo = np.zeros((N, 2), np.float32)
    starts = {}
    for pid, at in VO.items():
        x, head = load(pid)
        put(vo, x, at)
        starts[pid] = (at, head, len(x) / SR)
    fr = lambda s: int(round(s * FPS))
    W = lambda pid, i: starts[pid][0] + max(0.0, words[pid]["words"][i][1] - starts[pid][1])
    timing = {
        "fps": FPS,
        "total": fr(TOTAL),
        "drop": fr(DROP),
        "beat": B * FPS,
        "intro": {"src": INTRO_SRC, "speed": INTRO_SPEED},
        "phase": PHASE * FPS,
        "pause": [fr(PAUSE[0]), fr(PAUSE[1])],
        "scenes": {k: {"from": fr(a), "dur": fr(b) - fr(a)} for k, a, b in SCENES},
        "vo": {pid: {"from": fr(st), "dur": fr(d)} for pid, (st, _, d) in starts.items()},
        "words": {pid: [[w, fr(W(pid, i))] for i, (w, _) in enumerate(words[pid]["words"])] for pid in starts},
    }
    json.dump(timing, open(os.path.join(ROOT, "src/timing.json"), "w"), ensure_ascii=False, indent=1)

    mus = music()
    fx = np.zeros((N, 2), np.float32)
    S = {k: a for k, a, _ in SCENES}
    put(fx, sfx("transition/fs-702773-swipe-wav.ogg"), S["mirror"] - 0.25, 0.5)
    put(fx, sfx("whoosh/fs-169867-swoosh.ogg"), S["lipstick"] - 0.2, 0.5, pan=0.3)
    put(fx, sfx("whoosh/fs-683101-quick-woosh.ogg"), S["friends"] - 0.2, 0.5, pan=-0.3)
    put(fx, sfx("transition/fs-702773-swipe-wav.ogg"), S["phone"] - 0.2, 0.5)
    put(fx, sfx("impact/fs-222517-dramatic-hit.ogg"), PAUSE[0], 0.55)  # «А ТЫ?»
    put(fx, sfx("ui-blip/kenney-digital-pepsound1.ogg"), S["phone"] + 0.25, 0.3)  # phone notification
    put(fx, sfx("impact/fs-177242-cinematic-impact.ogg"), DROP, 0.8)
    put(fx, sfx("whoosh/fs-169867-swoosh.ogg"), S["poster"] - 0.2, 0.55)
    put(fx, sfx("impact/fs-347561-micheal-bay-hit.ogg"), S["poster"] + 0.05, 0.45)
    put(fx, sfx("ding/fs-349504-triangle-open-04.ogg"), S["poster"] + 1.2, 0.3)

    venv = signal.filtfilt(*signal.butter(1, 4 / (SR / 2)), np.abs(vo[:, 0]))
    vmask = np.clip(venv * 12, 0, 1)
    mid = np.stack([signal.filtfilt(*signal.butter(2, [200 / (SR / 2), 5000 / (SR / 2)], "band"), mus[:, c]) for c in (0, 1)], 1)
    mus = mus - mid * (0.65 * vmask)[:, None]
    mus *= (1 - 0.55 * vmask)[:, None]
    mix = vo * 1.0 + mus * 0.55 + fx * 0.4
    mix = np.tanh(mix / np.abs(mix).max() * 1.2) / np.tanh(1.2) * 0.95
    mix[-int(0.8 * SR):] *= np.linspace(1, 0, int(0.8 * SR))[:, None]
    os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    print({pid: (round(a, 2), round(a + d, 2)) for pid, (a, _, d) in starts.items()})


if __name__ == "__main__":
    main()
