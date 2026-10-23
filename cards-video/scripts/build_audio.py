"""Lays out the narration (ElevenLabs "Liam" clips in narration/), synthesises a nu-funk bed
(slap bass, clav stabs, claps, swung hats, brass hits) with e-commerce SFX, writes the timing map
and the word-level karaoke captions (original script text aligned to the spoken audio).

Outputs:
  src/timing.json                      scene + word timings in frames for Remotion
  hyperframes/captions/captions.json   caption lines with per-word start times (seconds)
  public/audio/mix.wav                 full stereo mix
"""
import difflib
import json
import os
import re

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
FPS = 30
BPM = 112
BEAT = 60 / BPM

CLIPS = [
    ("s01", "hook", 0.55),
    ("s02", "seconds", 0.55),
    ("s03", "build", 0.6),
    ("s04", "includesA", 0.35),
    ("s05", "includesB", 0.6),
    ("s06", "platforms", 0.6),
    ("s07", "goal", 2.6),
]
SCRIPT = {
    "s01": "Ваш товар заслуживает продавать больше!",
    "s02": "На маркетплейсах покупатель принимает решение всего за несколько секунд. Именно поэтому профессионально оформленная карточка товара становится вашим главным инструментом продаж.",
    "s03": "Я создаю современные, стильные и продающие карточки товаров, которые помогают выделиться среди конкурентов, увеличить CTR, повысить конверсию и привлечь больше покупателей.",
    "s04": "Что входит в работу? Продающий дизайн карточек. Профессиональная инфографика. Анализ конкурентов. Выделение преимуществ товара.",
    "s05": "Современный Premium-дизайн. Адаптация под требования маркетплейсов. Высокое качество изображений. Индивидуальный стиль вашего бренда.",
    "s06": "Работаю с Wildberries, Ozon, Lamoda, Яндекс Маркет, Авито, а также с интернет-магазинами и офлайн-бизнесом.",
    "s07": "Моя цель — не просто сделать красивый дизайн, а создать карточку, которая увеличивает продажи и помогает вашему товару попасть в центр внимания покупателей.",
}
# how the spoken form maps back to script words for alignment
SPOKEN_ALIAS = {"ctr": "сети", "wildberries": "свайлдберрис", "ozon": "озон", "lamoda": "ламода", "premium-дизайн": "премиум"}
KEYWORDS = {"больше", "секунд", "карточка", "продаж", "ctr", "конверсию", "покупателей", "инфографика", "premium-дизайн", "бренда", "wildberries", "ozon", "lamoda", "продажи", "внимания"}
LEAD_IN = 0.8
rng = np.random.default_rng(41)


def load(pid):
    sr, x = wavfile.read(os.path.join(ROOT, "narration", f"{pid}.wav"))
    x = x.astype(np.float32) / (32768.0 if x.dtype == np.int16 else 1.0)
    if x.ndim > 1:
        x = x.mean(axis=1)
    x = signal.resample_poly(x, SR, sr).astype(np.float32)
    idx = np.where(np.abs(x) > 0.004)[0]
    head = max(0, idx[0] - int(0.06 * SR))
    x = x[head: idx[-1] + int(0.08 * SR)]
    b, a = signal.butter(2, 80 / (SR / 2), "high")
    x = signal.lfilter(b, a, x)
    return (x / (np.abs(x).max() + 1e-9) * 0.9).astype(np.float32), head / SR


def norm(w):
    return re.sub(r"[^\w-]", "", w.lower()).replace("ё", "е")


def align(script_words, asr_words, clip_start, clip_end):
    """Map every script word to a start time.

    Exact matches come from difflib; an unmatched word may only fuzzy-match an ASR word lying
    between its matched neighbours (keeps order), otherwise it is interpolated between them.
    """
    a = [SPOKEN_ALIAS.get(norm(w), norm(w)) for w in script_words]
    b = [norm(w) for w, _ in asr_words]
    idx = [None] * len(a)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            idx[blk.a + k] = blk.b + k
    for i in range(len(a)):
        if idx[i] is not None:
            continue
        lo = max([idx[k] for k in range(i) if idx[k] is not None], default=-1) + 1
        hi = min([idx[k] for k in range(i + 1, len(a)) if idx[k] is not None], default=len(b))
        cands = [j for j in range(lo, hi) if j not in idx]
        if cands:
            j = max(cands, key=lambda j: difflib.SequenceMatcher(a=a[i], b=b[j]).ratio())
            if difflib.SequenceMatcher(a=a[i], b=b[j]).ratio() > 0.6:
                idx[i] = j
    times = [asr_words[j][1] if j is not None else None for j in idx]
    out = []
    for i in range(len(a)):
        if times[i] is not None:
            out.append(times[i])
            continue
        pi = max([k for k in range(i) if times[k] is not None], default=None)
        ni = min([k for k in range(i + 1, len(a)) if times[k] is not None], default=None)
        pt, pk = (times[pi], pi) if pi is not None else (clip_start, -1)
        nt, nk = (times[ni], ni) if ni is not None else (clip_end, len(a))
        out.append(pt + (nt - pt) * (i - pk) / (nk - pk))
    for i in range(1, len(out)):
        out[i] = max(out[i], out[i - 1] + 0.05)
    return out


def t_axis(d):
    return np.arange(int(d * SR)) / SR


NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ instruments
def kick():
    t = t_axis(0.35)
    f = 130 * np.exp(-t * 30) + 50
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)).astype(np.float32)


def clap():
    t = t_axis(0.22)
    n = rng.standard_normal(len(t))
    b, a = signal.butter(2, [1000 / (SR / 2), 5000 / (SR / 2)], "band")
    env = np.exp(-t * 22)
    for k in (0.008, 0.017):
        env += np.exp(-np.maximum(0, t - k) * 60) * (t >= k) * 0.6
    return (signal.lfilter(b, a, n) * env * 0.5).astype(np.float32)


def hat():
    t = t_axis(0.04)
    n = rng.standard_normal(len(t))
    b, a = signal.butter(2, 8500 / (SR / 2), "high")
    return (signal.lfilter(b, a, n) * np.exp(-t * 110) * 0.3).astype(np.float32)


def slap(note, pop=False):
    t = t_axis(0.3 if not pop else 0.18)
    fr = NOTE(note + (12 if pop else 0))
    x = signal.sawtooth(2 * np.pi * fr * t, 0.5) * 0.6 + np.sin(2 * np.pi * fr * t)
    b, a = signal.butter(2, (2500 if pop else 900) / (SR / 2))
    x = signal.lfilter(b, a, x) * np.exp(-t * (14 if pop else 7))
    return (x * 0.5).astype(np.float32)


def clav(notes):
    t = t_axis(0.16)
    x = sum(signal.square(2 * np.pi * NOTE(n) * t, 0.25) for n in notes)
    b, a = signal.butter(2, [600 / (SR / 2), 4000 / (SR / 2)], "band")
    return (signal.lfilter(b, a, x) * np.exp(-t * 22) * 0.07).astype(np.float32)


def brass(notes, d=0.5):
    t = t_axis(d)
    x = sum(signal.sawtooth(2 * np.pi * NOTE(n) * t * (1 + dt)) for n in notes for dt in (-0.003, 0.003))
    b, a = signal.butter(2, 2200 / (SR / 2))
    env = np.minimum(1, t * 40) * np.exp(-t * 4)
    return (signal.lfilter(b, a, x) * env * 0.06).astype(np.float32)


# ------------------------------------------------------------------ sfx
def beep(f0=1760, d=0.12):
    t = t_axis(d)
    return (np.sin(2 * np.pi * f0 * t) * (t < d * 0.8) * 0.3).astype(np.float32)


def shutter():
    out = np.zeros(int(0.2 * SR), np.float32)
    for k, at in enumerate((0.0, 0.07)):
        t = t_axis(0.05)
        n = rng.standard_normal(len(t))
        b, a = signal.butter(2, [1200 / (SR / 2), 6000 / (SR / 2)], "band")
        c = signal.lfilter(b, a, n) * np.exp(-t * 90) * (0.9 if k == 0 else 0.6)
        out[int(at * SR): int(at * SR) + len(c)] += c.astype(np.float32)
    return out


def swish(d=0.35, up=True):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    f = np.linspace(500, 6000, len(t)) if up else np.linspace(6000, 500, len(t))
    for i in range(0, len(n), 512):
        fc = f[i]
        b, a = signal.butter(2, [fc * 0.6 / (SR / 2), min(0.99, fc * 1.5 / (SR / 2))], "band")
        out[i:i + 512] = signal.lfilter(b, a, n[i:i + 512])
    return (out * np.sin(np.linspace(0, np.pi, len(t))) ** 2 * 0.7).astype(np.float32)


def tick():
    t = t_axis(0.04)
    return (np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 150) * 0.5).astype(np.float32)


def cart():
    a = beep(1318, 0.09)
    b = beep(1976, 0.14)
    out = np.zeros(int(0.3 * SR), np.float32)
    out[: len(a)] += a
    out[int(0.1 * SR): int(0.1 * SR) + len(b)] += b
    return out


def cash():
    t = t_axis(0.9)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((2093, 6), (2637, 5), (3136, 7))) * 0.2
    n = rng.standard_normal(int(0.08 * SR)) * np.exp(-t_axis(0.08) * 50) * 0.3
    x[: len(n)] += n
    return x.astype(np.float32)


def thump():
    t = t_axis(0.8)
    f = 80 * np.exp(-t * 4) + 40
    return (np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 1.5) * np.exp(-t * 4) * 0.8).astype(np.float32)


# ------------------------------------------------------------------ music
ROOTS = [40, 43, 45, 38]  # E – G – A – D  (E dorian funk)
CLAVS = [[64, 67, 71, 74], [62, 67, 71], [64, 69, 72], [62, 66, 69, 72]]


def music(total, intensity, hits):
    n = int(total * SR)
    L = np.zeros(n, np.float32)
    R = np.zeros(n, np.float32)

    def put(x, at, g=1.0, pan=0.0):
        i = int(at * SR)
        e = min(n, i + len(x))
        if i >= n or e <= i:
            return
        L[i:e] += x[: e - i] * g * (1 - max(0, pan))
        R[i:e] += x[: e - i] * g * (1 + min(0, pan))

    six = BEAT / 4
    swing = six * 0.18
    bar = BEAT * 4
    for b in range(int(total / bar) + 1):
        t0 = b * bar
        lvl = intensity(t0)
        root = ROOTS[b % 4]
        if lvl > 0.2:
            for pos in (0, 1.5, 2.5):  # funky kick
                put(kick(), t0 + pos * BEAT, 0.75)
        if lvl > 0.35:
            put(clap(), t0 + BEAT, 0.6)
            put(clap(), t0 + 3 * BEAT, 0.6)
        if lvl > 0.1:
            for s in range(16):
                put(hat(), t0 + s * six + (swing if s % 2 else 0), 0.45 if s % 4 else 0.7, pan=0.3)
        # slap bass line: thumb on root, pops on octave
        if lvl > 0.15:
            pat = [(0, 0, False), (0.75, 0, False), (1.25, 0, True), (2, 7, False), (2.5, 0, False), (3, 12, True), (3.5, 10, False)]
            for pos, iv, pop in pat:
                put(slap(root + iv - 12, pop), t0 + pos * BEAT + (swing if (pos * 4) % 2 else 0), 0.9)
        # clav stabs on offbeat 16ths
        if lvl > 0.3:
            for s in (2, 3, 6, 10, 11, 14):
                put(clav(CLAVS[b % 4]), t0 + s * six + (swing if s % 2 else 0), 1.0, pan=-0.35)
    for at in hits:
        put(brass([64, 68, 71, 76]), at, 1.0)
    return np.stack([L, R], 1)


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
    clips, starts, scenes = {}, {}, {}
    t, prev = LEAD_IN, None
    for pid, scene, gap in CLIPS:
        x, head = load(pid)
        clips[pid] = x
        if scene != prev:
            if prev:
                scenes[prev]["end"] = t - 0.2
            scenes[scene] = {"start": t - (0.35 if prev else LEAD_IN)}
            prev = scene
        starts[pid] = (t, head)
        t += len(x) / SR + gap
    scenes[prev]["end"] = t
    total = t
    W = lambda pid, i: starts[pid][0] + max(0.0, words[pid]["words"][i][1] - starts[pid][1])

    fr = lambda s: int(round(s * FPS))
    rem = {
        "fps": FPS,
        "total": fr(total),
        "beat": BEAT * FPS,
        "scenes": {k: {"from": fr(v["start"]), "dur": fr(v["end"]) - fr(v["start"]) + 10} for k, v in scenes.items()},
        "clips": {pid: {"from": fr(st), "dur": int(round(len(clips[pid]) / SR * FPS))} for pid, (st, _) in starts.items()},
        "words": {pid: [[w, fr(W(pid, i))] for i, (w, _) in enumerate(words[pid]["words"])] for pid in starts},
    }
    rem["scenes"]["goal"]["dur"] = rem["total"] - rem["scenes"]["goal"]["from"]
    with open(os.path.join(ROOT, "src/timing.json"), "w") as f:
        json.dump(rem, f, ensure_ascii=False, indent=1)

    # ------------------------------------------------ karaoke captions (script text, spoken timing)
    lines = []
    for pid, _, _ in CLIPS:
        sw = SCRIPT[pid].split()
        asr = [(w, starts[pid][0] + max(0.0, tm - starts[pid][1])) for w, tm in words[pid]["words"]]
        times = align(sw, asr, starts[pid][0], starts[pid][0] + len(clips[pid]) / SR)
        # chunk into short lines (<= 4 words or <= 22 chars) for vertical video
        cur = []
        for w, tm in zip(sw, times):
            cur.append({"w": w, "t": round(tm, 3), "hl": norm(w) in KEYWORDS})
            joined = " ".join(c["w"] for c in cur)
            if len(cur) >= 4 or len(joined) >= 22 or w.endswith((".", "!", "?", ",", "—")):
                lines.append(cur)
                cur = []
        if cur:
            lines.append(cur)
        # line end = next line start (or clip end)
    caps = []
    for i, ln in enumerate(lines):
        start = ln[0]["t"] - 0.08
        nxt = lines[i + 1][0]["t"] - 0.08 if i + 1 < len(lines) else total
        end = min(nxt, ln[-1]["t"] + 1.4)
        caps.append({"start": round(start, 3), "end": round(end, 3), "words": ln})
    os.makedirs(os.path.join(ROOT, "hyperframes/captions"), exist_ok=True)
    with open(os.path.join(ROOT, "hyperframes/captions/captions.json"), "w") as f:
        json.dump({"duration": round(total, 3), "lines": caps}, f, ensure_ascii=False, indent=1)

    # ------------------------------------------------ mix
    n = int((total + 0.3) * SR)
    vo = np.zeros((n, 2), np.float32)
    for pid, (st, _) in starts.items():
        place(vo, clips[pid], st)
    S = scenes

    def intensity(tt):
        if tt < S["seconds"]["start"]:
            return 0.4
        if tt < S["build"]["start"]:
            return 0.25
        if tt < S["platforms"]["start"]:
            return 1.0
        if tt < S["goal"]["start"]:
            return 0.7
        return 1.0

    hits = [S["hook"]["start"] + 0.3, S["build"]["start"] + 0.2, S["includesA"]["start"] + 0.2, S["goal"]["start"] + 0.2]
    mus = music(total + 0.3, intensity, hits)
    fx = np.zeros((n, 2), np.float32)
    # hook: spotlight + turntable
    place(fx, thump(), S["hook"]["start"] + 0.3, 0.8)
    place(fx, cart(), W("s01", 4), 0.7)
    place(fx, swish(0.4), S["seconds"]["start"] - 0.2, 0.8)
    # seconds: fast scroll ticks + countdown beeps + our card pops
    for k in range(18):
        place(fx, tick(), S["seconds"]["start"] + 0.3 + k * 0.11, 0.35)
    for k in range(3):
        place(fx, beep(1046 + k * 200, 0.1), W("s02", 6) + k * 0.3, 0.6)
    place(fx, shutter(), W("s02", 12), 0.9)
    place(fx, thump(), W("s02", 12), 0.6)
    place(fx, swish(0.4, False), S["build"]["start"] - 0.2, 0.8)
    # build: layers snapping in + metrics
    for i in (2, 3, 5, 6):
        place(fx, swish(0.25), W("s03", i) - 0.1, 0.5)
        place(fx, tick(), W("s03", i), 0.8)
    for i in (13, 16):
        place(fx, beep(1568, 0.09), W("s03", i), 0.6)
    place(fx, cash(), W("s03", 21), 0.6)
    place(fx, swish(0.4), S["includesA"]["start"] - 0.2, 0.8)
    # includes: callout pings
    for pid, idxs in (("s04", (4, 7, 9, 11)), ("s05", (0, 3, 7, 10))):
        for i in idxs:
            place(fx, beep(1318, 0.07), W(pid, i), 0.55)
            place(fx, swish(0.22), W(pid, i) - 0.08, 0.35)
    place(fx, swish(0.45, False), S["platforms"]["start"] - 0.2, 0.8)
    # platforms: add-to-cart per marketplace
    for i in (1, 2, 3, 4, 6, 10, 12):
        place(fx, cart(), W("s06", i), 0.6)
    place(fx, swish(0.45), S["goal"]["start"] - 0.2, 0.9)
    # goal: spotlight + cash
    place(fx, thump(), W("s07", 8), 0.7)
    place(fx, cash(), W("s07", 12), 0.7)
    place(fx, shutter(), W("s07", 19), 0.8)

    venv = np.abs(vo[:, 0])
    b, a = signal.butter(1, 6 / (SR / 2))
    venv = signal.filtfilt(b, a, venv)
    mus *= (1 - np.clip(venv * 5, 0, 0.5))[:, None]
    mix = vo * 1.0 + mus * 0.55 + fx * 0.45
    mix = np.tanh(mix / np.abs(mix).max() * 1.5) / np.tanh(1.5) * 0.95
    fade = int(1.0 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    print(json.dumps({"total": round(total, 2), "scenes": {k: [round(v["start"], 2), round(v["end"], 2)] for k, v in scenes.items()}, "caption_lines": len(caps)}, indent=1))


if __name__ == "__main__":
    main()
