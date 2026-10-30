"""Procedural modern-bachata score + SFX for the Latin Fusion Halloween spot.

All times are absolute film seconds. Timeline constants mirror src/timeline.ts.
Usage: python3 audio/music.py <out_dir>
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
INTRO = 6.0                      # user's intro clip
DROP = INTRO + 12.4              # bass drop (scene 5 start)
PAUSE = INTRO + 10.9             # music pause before the drop
END = INTRO + 21.8
TOTAL = END + 0.6
BPM = 128.0
BEAT = 60.0 / BPM
rng = np.random.default_rng(31)


def buf():
    return np.zeros(int(TOTAL * SR))


def put(dst, sig, t, gain=1.0):
    i = int(t * SR)
    if i >= len(dst):
        return
    n = min(len(sig), len(dst) - i)
    dst[i:i + n] += sig[:n] * gain


def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4)) * np.exp(-t / r)
    return e


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def pluck(freq, dur=1.2, bright=0.5):
    """Karplus-Strong nylon/requinto pluck."""
    n = int(dur * SR)
    p = max(2, int(SR / freq))
    ring = rng.uniform(-1, 1, p) * bright + rng.uniform(-1, 1, p) * (1 - bright) * 0.3
    out = np.empty(n)
    for i in range(n):
        out[i] = ring[i % p]
        ring[i % p] = 0.497 * (ring[i % p] + ring[(i + 1) % p])
    return out * env(n, 0.001, dur * 0.6)


def reverb(x, mix=0.3):
    y = x.copy()
    for d, g in [(0.031, .5), (0.047, .45), (0.071, .4), (0.113, .33), (0.173, .25), (0.257, .18)]:
        k = int(d * SR)
        z = np.zeros_like(x)
        z[k:] = x[:-k] * g
        y += lp(z, 5000)
    return x * (1 - mix) + y * mix


# Chords: Am - F - C - G (bachata minor loop), 2 beats * 4 = one bar each
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]


def chord_at(t):
    bar = int((t - INTRO + 1.0) / (BEAT * 4))
    return CHORDS[bar % 4]


def build_music():
    pad, gtr, perc, bass, drums = buf(), buf(), buf(), buf(), buf()

    # Mysterious pad from the end of the intro until the pause, back after the drop
    def pad_seg(t0, t1, level):
        n = int((t1 - t0) * SR)
        t = np.arange(n) / SR
        s = np.zeros(n)
        bar_len = BEAT * 4
        for k in range(n // int(bar_len * SR) + 1):
            c = chord_at(t0 + k * bar_len + 0.01)
            a, b = int(k * bar_len * SR), min(n, int((k + 1) * bar_len * SR))
            tt = t[a:b]
            for m in c:
                for det in (-0.12, 0.0, 0.11):
                    f = hz(m - 12) * 2 ** (det / 12)
                    s[a:b] += np.sin(2 * np.pi * f * tt + det) * 0.18 + np.sign(np.sin(2 * np.pi * f * tt)) * 0.03
        s = lp(s, 1400)
        fade = np.minimum(1, t / 1.5) * np.minimum(1, (t1 - t0 - t) / 0.25)
        put(pad, s * fade, t0, level)

    pad_seg(INTRO - 1.2, PAUSE, 0.32)
    pad_seg(DROP, END, 0.22)

    # Requinto arpeggio: sparse before the drop, full 8ths after
    t = INTRO + 0.0
    step = BEAT / 2
    i = 0
    while t < END:
        if PAUSE <= t < DROP:
            t += step; i += 1; continue
        c = chord_at(t)
        pattern = [c[0] + 12, c[2] + 12, c[1] + 24, c[2] + 12, c[0] + 24, c[1] + 12, c[2] + 24, c[1] + 12]
        note = pattern[i % 8]
        if t < DROP:
            if i % 2 == 0:
                put(gtr, pluck(hz(note), 1.4, 0.7), t, 0.55)
        else:
            put(gtr, pluck(hz(note), 0.9, 0.85), t, 0.5 if i % 2 == 0 else 0.35)
        t += step; i += 1
    gtr = reverb(gtr, 0.35)

    # Bongo (martillo) from scene 2, soft; full after drop
    def bongo(f, dur=0.18):
        n = int(dur * SR)
        tt = np.arange(n) / SR
        ph = 2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-tt * 40))) / SR
        return np.sin(ph) * env(n, 0.001, 0.06)

    t, i = INTRO + 3.0, 0
    while t < END:
        if not (PAUSE <= t < DROP):
            lvl = 0.18 if t < DROP else 0.42
            f = 420 if i % 8 in (2, 6) else 300
            put(perc, bongo(f), t, lvl * (1.3 if i % 4 == 2 else 1.0))
        t += BEAT / 2; i += 1

    # Guira (scraped 16ths) after drop, light 8ths before
    def guira(dur=0.07):
        n = int(dur * SR)
        return hp(rng.uniform(-1, 1, n), 6000) * env(n, 0.002, 0.025)

    t, i = INTRO + 6.0, 0
    while t < END:
        if t >= DROP:
            put(perc, guira(0.09 if i % 4 == 0 else 0.05), t, 0.28 if i % 2 == 0 else 0.16)
        elif t < PAUSE and i % 2 == 0:
            put(perc, guira(), t, 0.08)
        t += BEAT / 4; i += 1

    # Kick + 808 bass after the drop
    def kick():
        n = int(0.45 * SR)
        tt = np.arange(n) / SR
        f = 48 + 110 * np.exp(-tt * 28)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.22)

    def sub(freq, dur):
        n = int(dur * SR)
        tt = np.arange(n) / SR
        f = freq * (1 + 0.5 * np.exp(-tt * 30))
        s = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR))
        return lp(s, 900) * env(n, 0.003, dur * 0.9)

    t, i = DROP, 0
    while t < END:
        put(drums, kick(), t, 0.9)
        if i % 2 == 1:  # clap-ish snare on 2 and 4
            n = int(0.2 * SR)
            put(drums, bp(rng.uniform(-1, 1, n), 900, 5000) * env(n, 0.001, 0.07), t, 0.35)
        c = chord_at(t + 0.01)
        root = hz(c[0] - 24)
        put(bass, sub(root, BEAT * 0.9), t, 0.55)
        if i % 2 == 0:
            put(bass, sub(root * 1.5, BEAT * 0.4), t + BEAT * 0.75, 0.35)
        t += BEAT; i += 1

    # Pre-intro low drone + heartbeat in the pause
    n = int((PAUSE - INTRO + 1.0) * SR)
    tt = np.arange(n) / SR
    drone = lp(np.sin(2 * np.pi * 55 * tt) + 0.4 * np.sin(2 * np.pi * 82.4 * tt), 300)
    drone *= np.minimum(1, tt / 2) * np.minimum(1, (n / SR - tt) / 0.3)
    put(pad, drone, INTRO - 1.0, 0.22)
    for hb in (PAUSE + 0.15, PAUSE + 0.75):
        for k, d in enumerate((0, 0.18)):
            nn = int(0.25 * SR)
            x = np.arange(nn) / SR
            put(drums, np.sin(2 * np.pi * (45 + 40 * np.exp(-x * 30)) * x) * env(nn, 0.002, 0.08), hb + d, 0.7 - 0.25 * k)

    mix = pad + gtr * 0.9 + perc + bass + drums
    # sidechain-ish duck on kicks after drop
    duck = np.ones_like(mix)
    t = DROP
    while t < END:
        i0 = int(t * SR)
        nn = int(0.2 * SR)
        duck[i0:i0 + nn] = np.minimum(duck[i0:i0 + nn], 0.55 + 0.45 * np.linspace(0, 1, len(duck[i0:i0 + nn])))
        t += BEAT
    mix = mix * np.where(np.arange(len(mix)) >= int(DROP * SR), duck, 1.0) + bass * 0.0
    tail = np.arange(len(mix)) / SR
    mix *= np.clip((TOTAL - tail) / 0.8, 0, 1)
    return mix


def build_sfx():
    sfx = buf()

    def whoosh(dur=0.45, up=True):
        n = int(dur * SR)
        x = rng.uniform(-1, 1, n)
        tt = np.linspace(0, 1, n)
        y = np.zeros(n)
        for k in range(0, n, 480):
            fc = 400 + 5000 * (tt[k] if up else 1 - tt[k])
            seg = x[max(0, k - 2048):k + 480]
            y[k:k + 480] = bp(seg, fc * 0.6, min(fc * 1.6, 20000))[-len(y[k:k + 480]):]
        return y * np.sin(np.pi * tt) ** 2

    for t in (INTRO - 0.25, INTRO + 2.8, INTRO + 5.8, INTRO + 8.8, INTRO + 16.6):
        put(sfx, whoosh(), t, 0.5)

    # Reverse riser into the drop
    n = int(1.4 * SR)
    tt = np.linspace(0, 1, n)
    riser = hp(rng.uniform(-1, 1, n), 2000) * tt ** 3
    put(sfx, riser, DROP - 1.4, 0.35)

    # Drop impact: sub boom + crash noise
    n = int(2.0 * SR)
    x = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(35 + 90 * np.exp(-x * 9)) / SR) * np.exp(-x * 1.6)
    crash = hp(rng.uniform(-1, 1, n), 4000) * np.exp(-x * 2.2)
    put(sfx, boom * 0.9 + crash * 0.25, DROP, 0.85)

    # Phone "tick" in scene 4
    for t in (INTRO + 9.4, INTRO + 9.55):
        nn = int(0.05 * SR)
        put(sfx, np.sin(2 * np.pi * 2400 * np.arange(nn) / SR) * env(nn, 0.001, 0.012), t, 0.25)

    # Shimmer on poster reveal
    n = int(2.5 * SR)
    x = np.arange(n) / SR
    sh = sum(np.sin(2 * np.pi * hz(m) * x) for m in (81, 84, 88, 93)) * np.exp(-x * 1.4) * np.minimum(1, x / 0.05)
    put(sfx, sh, INTRO + 16.8, 0.08)
    return sfx


def norm(x, peak=0.89):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


if __name__ == '__main__':
    out = sys.argv[1]
    wavfile.write(f'{out}/music.wav', SR, (norm(build_music()) * 32767).astype(np.int16))
    wavfile.write(f'{out}/sfx.wav', SR, (norm(build_sfx(), 0.8) * 32767).astype(np.int16))
    print('ok', TOTAL)
