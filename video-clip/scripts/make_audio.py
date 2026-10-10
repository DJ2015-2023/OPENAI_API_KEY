"""Synthesizes the music bed and sound effects used by the video (no external assets)."""
import numpy as np, wave, os, sys

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def save(name, x, stereo=None):
    x = np.asarray(x, dtype=np.float64)
    if stereo is None:
        x = np.stack([x, x], axis=1)
    else:
        x = stereo
    peak = np.max(np.abs(x)) or 1
    x = x / peak * 0.89
    data = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())


def t(d):
    return np.arange(int(d * SR)) / SR


def lowpass(x, cutoff):
    """One-pole lowpass; cutoff may be an array (time-varying)."""
    cutoff = np.broadcast_to(cutoff, x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); prev = 0.0
    for i in range(len(x)):
        prev = (1 - a[i]) * x[i] + a[i] * prev
        y[i] = prev
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def env(n, attack, release, total):
    tt = np.arange(n) / SR
    e = np.minimum(1, tt / max(attack, 1e-4)) * np.exp(-np.maximum(0, tt - attack) / release)
    return e


def reverb(x, decay=1.6, mix=0.3):
    ir_t = t(decay)
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 5 / decay)
    ir = lowpass(ir, 5000)
    wet = np.convolve(x, ir)[: len(x) + len(ir)]
    dry = np.concatenate([x, np.zeros(len(ir))])[: len(wet)]
    wet = wet / (np.max(np.abs(wet)) or 1) * (np.max(np.abs(x)) or 1)
    return dry * (1 - mix) + wet * mix


# ---- WHOOSH: noise with a bandpass sweep and swell
def whoosh(d=0.9, up=True):
    tt = t(d); n = rng.standard_normal(len(tt))
    sweep = np.where(up, 400 + 5000 * (tt / d) ** 2, 5400 - 5000 * (tt / d) ** 0.5)
    y = highpass(lowpass(n, sweep), 250)
    e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
    return y * e


save("whoosh.wav", reverb(whoosh(0.8), 0.8, 0.25))
save("whoosh-soft.wav", reverb(whoosh(1.2, False) * 0.7, 1.0, 0.3))

# ---- IMPACT / BOOM: sub drop + noise transient
def impact(d=2.2):
    tt = t(d)
    f = 38 + 90 * np.exp(-tt * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.2)
    click = lowpass(rng.standard_normal(len(tt)), 3000) * np.exp(-tt * 30)
    return reverb(sub + 0.6 * click, 2.0, 0.35)


save("impact.wav", impact())

# ---- RISER: rising noise + rising tone, ends abruptly
def riser(d=2.0):
    tt = t(d)
    n = highpass(lowpass(rng.standard_normal(len(tt)), 600 + 8000 * (tt / d) ** 3), 300)
    f = 180 * 2 ** (3 * tt / d)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.2
    e = (tt / d) ** 2.2
    return (n * 0.8 + tone) * e


save("riser.wav", riser())

# ---- CLAPPERBOARD: sharp wooden clap
def clap():
    tt = t(0.5)
    n = rng.standard_normal(len(tt))
    body = highpass(lowpass(n, 4500), 900) * np.exp(-tt * 45)
    knock = np.sin(2 * np.pi * 820 * tt) * np.exp(-tt * 60) * 0.6
    return reverb(body + knock, 0.6, 0.2)


save("clap.wav", clap())

# ---- SHUTTER: two quick clicks
def shutter():
    tt = t(0.35); y = np.zeros(len(tt))
    for off, amp in [(0, 1), (0.085, 0.7)]:
        i = int(off * SR); seg = tt[: len(tt) - i]
        y[i:] += highpass(rng.standard_normal(len(seg)), 2500) * np.exp(-seg * 90) * amp
    return y


save("shutter.wav", shutter())

# ---- POP: short tonal pop for list items
def pop(f0=700):
    tt = t(0.25)
    f = f0 * (1 + 0.8 * np.exp(-tt * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 22)


save("pop.wav", pop())
save("pop-high.wav", pop(1050))

# ---- SHIMMER: bell-like sparkle arpeggio
def shimmer():
    tt = t(2.0); y = np.zeros(len(tt))
    notes = [1318.5, 1567.98, 1975.5, 2637.0, 3135.96]
    for k, f in enumerate(notes):
        i = int(k * 0.06 * SR); seg = tt[: len(tt) - i]
        tone = sum(np.sin(2 * np.pi * f * h * seg) / h ** 1.5 for h in (1, 2.76, 5.4))
        y[i:] += tone * np.exp(-seg * 3.5) * 0.5
    return reverb(y, 1.6, 0.4)


save("shimmer.wav", shimmer())

# ---- HEARTBEAT: lub-dub
def heartbeat():
    tt = t(1.0); y = np.zeros(len(tt))
    for off, amp in [(0, 1), (0.22, 0.75)]:
        i = int(off * SR); seg = tt[: len(tt) - i]
        f = 45 + 40 * np.exp(-seg * 25)
        y[i:] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-seg * 14) * amp
    return y


save("heartbeat.wav", heartbeat())

# ---- TICK: clock tick
def tick():
    tt = t(0.12)
    return highpass(rng.standard_normal(len(tt)), 3000) * np.exp(-tt * 140) + np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 120) * 0.4


save("tick.wav", tick())

# ---- MUSIC BED: cinematic pop pad + pluck arpeggio + soft beat, Am-F-C-G at 100 BPM
def music(total):
    bpm = 100; beat = 60 / bpm; bar = beat * 4
    n = int(total * SR); L = np.zeros(n); R = np.zeros(n)
    tt_all = np.arange(n) / SR
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
    mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
    # pad
    pad = np.zeros(n)
    nbars = int(np.ceil(total / bar))
    for b in range(nbars):
        ch = chords[b % 4]; s = int(b * bar * SR); e = min(n, int((b + 1) * bar * SR) + int(0.4 * SR))
        seg = tt_all[: e - s]
        x = np.zeros(len(seg))
        for m in ch + [ch[0] + 12]:
            f = mtof(m)
            for det in (-0.12, 0.12):
                ph = 2 * np.pi * f * (1 + det / 100) * seg
                x += (2 * ((f * (1 + det / 100) * seg) % 1) - 1) * 0.5 + np.sin(ph)
        a = np.minimum(1, seg / 0.6) * np.minimum(1, (len(seg) / SR - seg) / 0.5)
        pad[s:e] += x * a
    pad = lowpass(pad, 1400) * 0.06
    # bass
    bass = np.zeros(n)
    for b in range(nbars):
        root = chords[b % 4][0] - 24
        for q in range(8):
            s = int((b * bar + q * beat / 2) * SR)
            if s >= n: break
            seg = tt_all[: min(int(beat / 2 * SR), n - s)]
            bass[s : s + len(seg)] += np.sin(2 * np.pi * mtof(root) * seg) * np.exp(-seg * 4) * (1 if q % 2 == 0 else 0.6)
    bass *= 0.32
    # pluck arpeggio (stereo ping-pong)
    arpL = np.zeros(n); arpR = np.zeros(n)
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    for b in range(nbars):
        ch = chords[b % 4] + [chords[b % 4][0] + 12]
        for q in range(8):
            s = int((b * bar + q * beat / 2) * SR)
            if s >= n: break
            seg = tt_all[: min(int(0.6 * SR), n - s)]
            f = mtof(ch[pattern[q]] + 12)
            note = (np.sin(2 * np.pi * f * seg) + 0.3 * np.sin(4 * np.pi * f * seg)) * np.exp(-seg * 7)
            (arpL if q % 2 == 0 else arpR)[s : s + len(seg)] += note * 0.11
            (arpR if q % 2 == 0 else arpL)[s : s + len(seg)] += note * 0.04
    # drums: kick on 1 & 3, snare/clap on 2 & 4, hats on 8ths — enter after intro
    drums = np.zeros(n)
    start_drums = bar * 2
    kick_seg = tt_all[: int(0.4 * SR)]
    kick = np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-kick_seg * 30)) / SR) * np.exp(-kick_seg * 8)
    sn_seg = tt_all[: int(0.3 * SR)]
    snare = highpass(lowpass(rng.standard_normal(len(sn_seg)), 6000), 1200) * np.exp(-sn_seg * 18)
    hat_seg = tt_all[: int(0.06 * SR)]
    hat = highpass(rng.standard_normal(len(hat_seg)), 7000) * np.exp(-hat_seg * 70)
    k = start_drums
    i8 = 0
    while k < total - bar:
        s = int(k * SR)
        pos = i8 % 8
        def add(sig, amp):
            m = min(len(sig), n - s); drums[s : s + m] += sig[:m] * amp
        if pos in (0, 4): add(kick, 0.55)
        if pos in (2, 6): add(snare, 0.22)
        add(hat, 0.06 if pos % 2 else 0.09)
        k += beat / 2; i8 += 1
    mixL = pad + bass + arpL + drums
    mixR = pad + bass + arpR + drums
    # global fade in/out
    fade = np.minimum(1, tt_all / 2.0) * np.minimum(1, (total - tt_all) / 3.0)
    st = np.stack([reverb(mixL, 1.4, 0.18)[:n] * fade, reverb(mixR, 1.4, 0.18)[:n] * fade], axis=1)
    return st


dur = float(sys.argv[1]) if len(sys.argv) > 1 else 80
m = music(dur)
save("music.wav", None, stereo=m)
print("ok", dur)
