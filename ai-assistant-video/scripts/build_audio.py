"""Builds narration (RHVoice), synthesized cinematic music + SFX, and the timing map.

Outputs:
  src/timing.json          scene/phrase frame timings consumed by Remotion
  hyperframes/cta/timing.json  CTA timings consumed by the HyperFrames composition
  public/audio/mix.wav     final stereo mix for the whole film
"""
import json
import os
import subprocess
import tempfile

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
FPS = 30
VOICE = "aleksandr-hq"
XFADE = 0.5  # Remotion -> HyperFrames crossfade (seconds)

# (id, scene, text spoken, gap after in seconds)
PHRASES = [
    ("h1", "hook", "Ваш бизнес теряет клиентов из-за сообщений,", 0.08),
    ("h2", "hook", "на которые никто не успевает ответить?", 0.55),
    ("i1", "imagine", "Представьте ИИ-ассистента,", 0.1),
    ("i2", "imagine", "который работает двадцать четыре часа в сутки, семь дней в неделю!", 0.5),
    ("c1", "channels", "Он объединяет Ватсап, Телеграм, Инстаграм, ВКонтакте и ваш сайт", 0.05),
    ("c2", "channels", "в единую систему,", 0.35),
    ("f1", "features", "мгновенно отвечает клиентам,", 0.1),
    ("f2", "features", "принимает заявки,", 0.1),
    ("f3", "features", "автоматизирует запись", 0.08),
    ("f4", "features", "и помогает увеличивать продажи.", 0.5),
    ("r1", "result", "Ни одного пропущенного обращения!", 0.3),
    ("r2", "result", "Больше клиентов,", 0.1),
    ("r3", "result", "меньше рутины", 0.1),
    ("r4", "result", "и больше прибыли!", 0.6),
    ("t1", "cta", "Хотите такого ИИ-ассистента для своего бизнеса?", 0.25),
    ("t2", "cta", "Напишите мне в личные сообщения!", 1.6),
]
LEAD_IN = 0.45


def tts(text):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        path = tmp.name
    subprocess.run(
        ["RHVoice-test", "-p", VOICE, "-q", "max", "-r", "112", "-t", "104", "-R", str(SR), "-o", path],
        input=text.encode(), check=True, capture_output=True,
    )
    sr, x = wavfile.read(path)
    os.unlink(path)
    x = x.astype(np.float32) / 32768.0
    if sr != SR:
        x = signal.resample_poly(x, SR, sr).astype(np.float32)
    # trim silence
    env = np.abs(x) > 0.01
    idx = np.where(env)[0]
    x = x[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.06 * SR)]
    return x


def voice_fx(x):
    """Young, punchy ad-read polish: HPF, presence lift, air, compression, short room."""
    b, a = signal.butter(2, 90 / (SR / 2), "high")
    x = signal.lfilter(b, a, x)
    # presence peak ~3.2k
    b, a = peaking(3200, 4.0, 1.0)
    x = signal.lfilter(b, a, x)
    b, a = peaking(180, 2.5, 0.8)  # chest warmth
    x = signal.lfilter(b, a, x)
    b, a = shelf_high(9000, 3.0)
    x = signal.lfilter(b, a, x)
    x = compress(x, thresh=0.18, ratio=3.5)
    x = x / (np.abs(x).max() + 1e-9) * 0.92
    # subtle room
    ir = np.random.default_rng(3).standard_normal(int(0.35 * SR)) * np.exp(-np.linspace(0, 9, int(0.35 * SR)))
    wet = signal.fftconvolve(x, ir)[: len(x)]
    wet = wet / (np.abs(wet).max() + 1e-9)
    return (x + 0.06 * wet).astype(np.float32)


def peaking(f0, gain_db, q):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A]
    a = [1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A]
    return np.array(b) / a[0], np.array(a) / a[0]


def shelf_high(f0, gain_db):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / 2 * np.sqrt(2)
    cw = np.cos(w0)
    b = [A * ((A + 1) + (A - 1) * cw + 2 * np.sqrt(A) * alpha), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - 2 * np.sqrt(A) * alpha)]
    a = [(A + 1) - (A - 1) * cw + 2 * np.sqrt(A) * alpha, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - 2 * np.sqrt(A) * alpha]
    return np.array(b) / a[0], np.array(a) / a[0]


def compress(x, thresh, ratio):
    env = np.abs(x)
    b, a = signal.butter(1, 30 / (SR / 2))
    env = signal.filtfilt(b, a, env)
    gain = np.ones_like(env)
    over = env > thresh
    gain[over] = (thresh + (env[over] - thresh) / ratio) / env[over]
    return x * gain


# ---------------------------------------------------------------- SFX
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def adsr(n, a=0.005, r=0.2):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def whoosh(d=0.7, up=True):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    f = np.linspace(300, 6000, len(t)) if up else np.linspace(6000, 250, len(t))
    out = np.zeros_like(n)
    # time-varying bandpass via chunked filtering
    ch = 1024
    for i in range(0, len(n), ch):
        fc = f[min(i, len(f) - 1)]
        b, a = signal.butter(2, [max(40, fc * 0.5) / (SR / 2), min(SR / 2 - 100, fc * 1.6) / (SR / 2)], "band")
        out[i:i + ch] = signal.lfilter(b, a, n[i:i + ch])
    env = np.sin(np.linspace(0, np.pi, len(t))) ** 1.6
    return (out * env * 0.9).astype(np.float32)


def impact(d=2.2, pitch=48):
    t = t_axis(d)
    f = pitch * np.exp(-t * 3) + 28
    ph = 2 * np.pi * np.cumsum(f) / SR
    boom = np.sin(ph) * np.exp(-t * 2.2)
    click = rng.standard_normal(len(t)) * np.exp(-t * 60) * 0.6
    b, a = signal.butter(2, 3500 / (SR / 2))
    click = signal.lfilter(b, a, click)
    tail = rng.standard_normal(len(t)) * np.exp(-t * 3.5) * 0.12
    b, a = signal.butter(2, 900 / (SR / 2))
    tail = signal.lfilter(b, a, tail)
    return np.tanh((boom * 1.4 + click + tail) * 1.3).astype(np.float32) * 0.9


def riser(d=1.6):
    t = t_axis(d)
    f = 200 * (2 ** (t / d * 3))
    tone = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * 0.25
    noise = whoosh(d, True) * 0.8
    env = (t / d) ** 2
    return ((tone + noise[: len(t)]) * env).astype(np.float32)


def ping(freq=1320, d=0.35):
    t = t_axis(d)
    x = (np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 1.5 * t)) * np.exp(-t * 14)
    return (x * 0.5).astype(np.float32)


def notif(d=0.32):
    a = ping(1046, 0.18)
    b = ping(1568, 0.26)
    out = np.zeros(int(d * SR) + len(b))
    out[: len(a)] += a
    out[int(0.08 * SR): int(0.08 * SR) + len(b)] += b
    return out.astype(np.float32) * 0.8


def glitch(d=0.35):
    t = t_axis(d)
    sq = signal.square(2 * np.pi * (rng.integers(80, 400)) * t) * 0.3
    n = rng.standard_normal(len(t)) * 0.4
    gate = (np.floor(t * 40) % 2 == 0).astype(float)
    crush = np.round((sq + n) * 4) / 4
    return (crush * gate * np.exp(-t * 4)).astype(np.float32) * 0.6


def swoosh_tick():
    t = t_axis(0.06)
    return (rng.standard_normal(len(t)) * np.exp(-t * 90) * 0.5).astype(np.float32)


def pop_sfx():
    t = t_axis(0.18)
    f = 900 * np.exp(-t * 25) + 200
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) * 0.6).astype(np.float32)


def heartbeat():
    t = t_axis(0.5)
    one = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 18)
    out = np.zeros(int(0.9 * SR))
    out[: len(one)] += one
    out[int(0.22 * SR): int(0.22 * SR) + len(one)] += one * 0.7
    return out.astype(np.float32)


def cash():
    a = ping(2093, 0.4)
    b = ping(2637, 0.5)
    out = np.zeros(int(0.6 * SR))
    out[: len(a)] += a
    out[int(0.07 * SR): int(0.07 * SR) + len(b)] += b
    return out.astype(np.float32)


# ---------------------------------------------------------------- music
def music(total, sections):
    """Dark pulse bed that evolves: tense (hook) -> wonder (imagine) -> drive (features/result) -> lift (cta)."""
    n = int(total * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2), np.float32)
    bpm = 118
    beat = 60 / bpm
    # chord roots (Hz) per section
    prog = {
        "hook": [(55.0, [0, 3, 7])],
        "imagine": [(49.0, [0, 4, 7, 11]), (55.0, [0, 3, 7, 10])],
        "channels": [(43.65, [0, 4, 7, 11]), (49.0, [0, 4, 7])],
        "features": [(55.0, [0, 3, 7]), (43.65, [0, 4, 7]), (65.4, [0, 4, 7]), (49.0, [0, 4, 7])],
        "result": [(55.0, [0, 3, 7]), (43.65, [0, 4, 7]), (65.4, [0, 4, 7]), (49.0, [0, 4, 7])],
        "cta": [(43.65, [0, 4, 7, 11]), (49.0, [0, 4, 7, 14])],
    }
    for name, (s0, s1) in sections.items():
        chords = prog[name]
        i0, i1 = int(s0 * SR), min(n, int(s1 * SR))
        seg_t = t[i0:i1] - s0
        bar = beat * 4
        idx = (seg_t // (bar * (2 if name in ("imagine", "channels", "cta") else 1))).astype(int) % len(chords)
        pad = np.zeros(i1 - i0)
        bass = np.zeros(i1 - i0)
        for ci, (root, ints) in enumerate(chords):
            m = idx == ci
            for k, iv in enumerate(ints):
                fr = root * 4 * 2 ** (iv / 12)
                for det in (-0.12, 0.12):
                    pad[m] += signal.sawtooth(2 * np.pi * fr * (1 + det / 100) * seg_t[m]) * 0.035
            bass[m] += np.sin(2 * np.pi * root * seg_t[m]) * 0.35
        # pumping sidechain
        ph = (seg_t % beat) / beat
        pump = 0.35 + 0.65 * np.clip(ph * 3, 0, 1)
        if name == "hook":
            pump = np.ones_like(ph) * 0.8
            bass *= 0.6 + 0.4 * (np.sin(2 * np.pi * seg_t / (beat * 2)) > 0)
        b, a = signal.butter(2, (1400 if name != "hook" else 700) / (SR / 2))
        pad = signal.lfilter(b, a, pad)
        layer = pad * pump + bass * pump
        # drums
        if name in ("features", "result", "channels", "cta"):
            kick = np.zeros_like(seg_t)
            for bt in np.arange(0, seg_t[-1], beat):
                k0 = int(bt * SR)
                kk = impact_kick()
                e = min(len(kick), k0 + len(kk))
                kick[k0:e] += kk[: e - k0]
            hat = np.zeros_like(seg_t)
            for bt in np.arange(beat / 2, seg_t[-1], beat):
                h0 = int(bt * SR)
                hh = hat_s()
                e = min(len(hat), h0 + len(hh))
                hat[h0:e] += hh[: e - h0]
            amt = 0.55 if name == "channels" else 0.85
            layer = layer + (kick * 0.7 + hat * 0.25) * amt
        if name == "hook":
            # ticking clock tension
            tick = np.zeros_like(seg_t)
            for bt in np.arange(0, seg_t[-1], beat / 2):
                h0 = int(bt * SR)
                hh = swoosh_tick()
                e = min(len(tick), h0 + len(hh))
                tick[h0:e] += hh[: e - h0]
            layer = layer + tick * 0.35
        # section fade edges
        fade = np.ones_like(seg_t)
        fl = int(0.25 * SR)
        fade[:fl] = np.linspace(0, 1, fl)
        fade[-fl:] = np.linspace(1, 0, fl)
        layer *= fade
        out[i0:i1, 0] += layer.astype(np.float32)
        out[i0:i1, 1] += np.roll(layer, int(0.012 * SR)).astype(np.float32)
    return out


def impact_kick():
    t = t_axis(0.35)
    f = 120 * np.exp(-t * 30) + 45
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)).astype(np.float32)


def hat_s():
    t = t_axis(0.07)
    n = rng.standard_normal(len(t))
    b, a = signal.butter(2, 7000 / (SR / 2), "high")
    return (signal.lfilter(b, a, n) * np.exp(-t * 60) * 0.5).astype(np.float32)


def place(buf, clip, at, gain=1.0, pan=0.0):
    i0 = int(at * SR)
    if i0 >= len(buf) or i0 + len(clip) <= 0:
        return
    if i0 < 0:
        clip = clip[-i0:]
        i0 = 0
    e = min(len(buf), i0 + len(clip))
    c = clip[: e - i0] * gain
    buf[i0:e, 0] += c * (1 - max(0, pan))
    buf[i0:e, 1] += c * (1 + min(0, pan))


def main():
    voices = {}
    for pid, scene, text, gap in PHRASES:
        voices[pid] = voice_fx(tts(text))

    # sequential layout
    t = LEAD_IN
    phrases = {}
    scenes = {}
    prev_scene = None
    for pid, scene, text, gap in PHRASES:
        if scene != prev_scene:
            if prev_scene is not None:
                scenes[prev_scene]["end"] = t - 0.15
            scenes[scene] = {"start": t - (0.3 if prev_scene else LEAD_IN)}
            prev_scene = scene
        d = len(voices[pid]) / SR
        phrases[pid] = {"start": t, "dur": d, "text": text}
        t += d + gap
    scenes[prev_scene]["end"] = t
    total = t

    # Remotion part covers everything before CTA, plus crossfade overlap
    cta_start = scenes["cta"]["start"]
    remotion_total = cta_start + XFADE

    fr = lambda s: int(round(s * FPS))
    rem_scenes = {k: {"from": fr(v["start"]), "dur": fr(v["end"] - v["start"]) + 12} for k, v in scenes.items() if k != "cta"}
    # result scene runs into the crossfade
    rem_scenes["result"]["dur"] = fr(remotion_total) - rem_scenes["result"]["from"]
    rem_phr = {k: {"from": fr(v["start"]), "dur": fr(v["dur"]), "text": v["text"]} for k, v in phrases.items() if not k.startswith("t")}

    # channel name hits inside c1 (proportional by character position)
    c1 = phrases["c1"]
    txt = c1["text"]
    hits = []
    for word in ["Ватсап", "Телеграм", "Инстаграм", "ВКонтакте", "сайт"]:
        pos = txt.index(word)
        hits.append(fr(c1["start"] + c1["dur"] * (pos / len(txt)) - 0.05))

    with open(os.path.join(ROOT, "src/timing.json"), "w") as f:
        json.dump({"fps": FPS, "total": fr(remotion_total), "scenes": rem_scenes, "phrases": rem_phr, "channelHits": hits}, f, indent=1, ensure_ascii=False)

    cta_off = cta_start - XFADE  # HyperFrames clip starts at this film time
    cta = {
        "duration": round(total - cta_off, 3),
        "t1": round(phrases["t1"]["start"] - cta_off, 3),
        "t1dur": round(phrases["t1"]["dur"], 3),
        "t2": round(phrases["t2"]["start"] - cta_off, 3),
        "t2dur": round(phrases["t2"]["dur"], 3),
    }
    with open(os.path.join(ROOT, "hyperframes/cta/timing.json"), "w") as f:
        json.dump(cta, f, indent=1)

    # ------------------------------------------------ mix
    n = int((total + 0.5) * SR)
    vo = np.zeros((n, 2), np.float32)
    for pid, p in phrases.items():
        place(vo, voices[pid], p["start"], 1.0)

    secs = {k: (v["start"], v["end"] + (0.4 if k != "cta" else 0.5)) for k, v in scenes.items()}
    mus = music(total + 0.5, secs)

    fx = np.zeros((n, 2), np.float32)
    S = scenes
    P = phrases
    # HOOK: notification storm, heartbeat, glitches
    place(fx, impact(1.8, 40), 0.0, 0.7)
    for i in range(14):
        tt = 0.25 + i * (S["hook"]["end"] - 0.6) / 14
        place(fx, notif(), tt, 0.35 + 0.02 * i, pan=(rng.random() - 0.5) * 0.8)
    place(fx, heartbeat(), P["h2"]["start"] - 0.2, 0.8)
    place(fx, heartbeat(), P["h2"]["start"] + 0.75, 0.9)
    place(fx, glitch(), P["h1"]["start"] + 0.9, 0.5)
    place(fx, glitch(), S["hook"]["end"] - 0.35, 0.8)
    place(fx, riser(1.2), S["hook"]["end"] - 1.2, 0.5)
    # -> IMAGINE: white flash impact + wonder
    place(fx, impact(2.5, 55), S["imagine"]["start"] + 0.25, 1.0)
    place(fx, whoosh(0.9, False), S["imagine"]["start"] + 0.1, 0.6)
    place(fx, pop_sfx(), P["i2"]["start"] + 0.6, 0.6)
    place(fx, ping(880, 0.6), P["i2"]["start"] + P["i2"]["dur"] * 0.55, 0.5)
    place(fx, whoosh(0.6, True), S["imagine"]["end"] - 0.3, 0.8)
    # CHANNELS: pop per icon, beams zap
    for h in hits:
        place(fx, pop_sfx(), h / FPS, 0.7)
        place(fx, whoosh(0.35, True), h / FPS - 0.15, 0.35)
    place(fx, impact(1.6, 70), P["c2"]["start"], 0.7)
    place(fx, riser(0.8), S["channels"]["end"] - 0.6, 0.5)
    place(fx, whoosh(0.5, False), S["channels"]["end"] - 0.1, 0.9)
    # FEATURES: each card slams
    for pid in ("f1", "f2", "f3", "f4"):
        place(fx, whoosh(0.4, True), P[pid]["start"] - 0.25, 0.5)
        place(fx, impact_kick() * 1.0, P[pid]["start"], 0.6)
        place(fx, ping(1568, 0.3), P[pid]["start"] + 0.1, 0.25)
    place(fx, notif(), P["f1"]["start"] + 0.3, 0.4)
    place(fx, cash(), P["f4"]["start"] + 0.8, 0.5)
    place(fx, riser(1.0), S["features"]["end"] - 0.9, 0.6)
    # RESULT: big drop
    place(fx, impact(3.0, 60), P["r1"]["start"] - 0.05, 1.1)
    place(fx, whoosh(0.8, False), P["r1"]["start"] - 0.1, 0.6)
    for pid in ("r2", "r3", "r4"):
        place(fx, pop_sfx(), P[pid]["start"], 0.6)
        place(fx, whoosh(0.3, True), P[pid]["start"] - 0.15, 0.4)
    place(fx, cash(), P["r4"]["start"] + 0.4, 0.6)
    place(fx, riser(1.0), S["cta"]["start"] - 0.9, 0.6)
    # CTA
    place(fx, whoosh(0.9, True), S["cta"]["start"] - 0.2, 0.7)
    place(fx, impact(2.0, 65), P["t2"]["start"] - 0.05, 0.9)
    place(fx, notif(), P["t2"]["start"] + P["t2"]["dur"] * 0.8, 0.6)
    place(fx, whoosh(1.2, True), P["t2"]["start"] + P["t2"]["dur"] + 0.15, 0.7)

    # duck music under voice
    venv = np.abs(vo[:, 0])
    b, a = signal.butter(1, 6 / (SR / 2))
    venv = signal.filtfilt(b, a, venv)
    duck = 1 - np.clip(venv * 6, 0, 0.55)
    mus *= duck[:, None]

    mix = vo * 1.0 + mus * 0.55 + fx * 0.55
    # gentle bus limiter
    peak = np.abs(mix).max()
    mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.95
    fade = int(0.6 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    wavfile.write(os.path.join(ROOT, "public/audio/voice.wav"), SR, (vo * 32767).astype(np.int16))
    print(json.dumps({"total": total, "remotion_total": remotion_total, "scenes": scenes, "cta": cta}, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
