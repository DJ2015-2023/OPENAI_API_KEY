"""Beat-synced edit decision list + audio mix for the BACHATA LADY STYLE promo.

The track (music/lips_on_you.mp3, ~117 BPM bachata) drives everything: every cut lands on a beat
found by librosa, sections are whole bars. No narration: music + CC0 sound design only.

Outputs:
  src/timing.json        sections, clip segments, beat frames
  public/audio/mix.wav   48 kHz stereo
"""
import json
import os
import subprocess

import librosa
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX = "/home/user/Barty-Bart/motion-graphics/skills/sound-effects/sfx"
SFX2 = "/home/user/Vincentwei1021/video-shotcraft/assets/audio/sfx"
SR = 48000
FPS = 30
SONG_OFFSET = 1.85  # song time at video t=0 (first beat lands at ~0.31 s)

# section -> bars
SECTIONS = [("intro", 3), ("tagline", 3), ("notjust", 3), ("expect", 12), ("song", 2), ("schedule", 5), ("price", 3), ("why", 3), ("cta", 3), ("outro", 3)]
# section -> list of (clip, source start s, beats)
EDL = {
    "intro": [("A", 1.6, 2), ("B", 1.5, 2), ("G", 3.0, 2), ("E", 0.4, 2), ("M", 2.0, 2), ("D", 0.0, 2)],
    "tagline": [("K", 1.0, 4), ("G", 6.0, 4), ("M", 10.0, 4)],
    "notjust": [("D", 3.0, 4), ("H", 2.0, 4), ("A", 4.0, 4)],
    "expect": [("I", 5.0, 4), ("J", 2.0, 4), ("F", 2.0, 4), ("F", 10.0, 4), ("B", 3.2, 4), ("K", 4.5, 4), ("G", 8.0, 4), ("I", 12.0, 4),
               ("M", 14.0, 4), ("E", 2.0, 4), ("L", 0.5, 4), ("D", 5.6, 4)],
    "song": [("M", 20.0, 8)],
    "schedule": [("H", 5.0, 8), ("J", 8.0, 4), ("M", 28.0, 8)],
    "price": [("G", 0.2, 4), ("K", 5.2, 4), ("A", 5.0, 4)],
    "why": [("I", 28.0, 4), ("D", 12.0, 4), ("M", 34.0, 4)],
    "cta": [("F", 6.0, 4), ("B", 0.2, 4), ("D", 18.0, 4)],
    "outro": [("M", 38.0, 12)],
}


def song():
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", os.path.join(ROOT, "music/lips_on_you.mp3"), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def sfx(name, gain=1.0):
    path = name if name.startswith("/") else os.path.join(SFX, name)
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    return x / (np.abs(x).max() + 1e-9) * gain


def put(buf, x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i < 0:
        x, i = x[-i:], 0
    e = min(len(buf), i + len(x))
    if e <= i:
        return
    buf[i:e, 0] += x[: e - i] * g * (1 - max(0, pan))
    buf[i:e, 1] += x[: e - i] * g * (1 + min(0, pan))


def main():
    y, sr = librosa.load(os.path.join(ROOT, "music/lips_on_you.mp3"), sr=22050, mono=True)
    _, beats = librosa.beat.beat_track(y=y, sr=sr)
    bt = librosa.frames_to_time(beats, sr=sr) - SONG_OFFSET
    bt = bt[bt >= 0]
    # cut on the detected beats themselves (the intro is slightly faster, so a fitted grid drifts)
    period = float(np.median(np.diff(bt[:170])))
    phase = float(bt[0])
    grid = lambda i: float(bt[i])
    fr = lambda s: int(round(s * FPS))

    sections, segments, b = {}, [], 0
    for name, bars in SECTIONS:
        start_b = b
        for clip, src, nb in EDL[name]:
            segments.append({"clip": clip, "src": round(src, 3), "from": fr(grid(b)), "dur": fr(grid(b + nb)) - fr(grid(b)), "section": name})
            b += nb
        assert b - start_b == bars * 4, (name, b - start_b, bars * 4)
        sections[name] = {"from": fr(grid(start_b)), "dur": fr(grid(b)) - fr(grid(start_b)), "beat0": start_b}
    # the very first segment starts at frame 0 (fade in from black covers the pickup)
    segments[0]["dur"] += segments[0]["from"]
    segments[0]["from"] = 0
    sections["intro"]["dur"] += sections["intro"]["from"]
    sections["intro"]["from"] = 0
    end_t = grid(b) + 2.0
    total = fr(end_t)
    segments[-1]["dur"] = total - segments[-1]["from"]
    timing = {"fps": FPS, "total": total, "beat": period * FPS, "phase": phase * FPS, "beats": [fr(t) for t in bt if t < end_t], "sections": sections, "segments": segments}
    json.dump(timing, open(os.path.join(ROOT, "src/timing.json"), "w"), indent=1)

    # ------------------------------------------------ mix
    N = int(end_t * SR)
    mus = song()[int(SONG_OFFSET * SR): int(SONG_OFFSET * SR) + N]
    fade = int(3.0 * SR)
    mus[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.6
    fx = np.zeros((N, 2), np.float32)
    S = {k: v["from"] / FPS for k, v in sections.items()}
    B = lambda name, beat: grid(sections[name]["beat0"] + beat)
    put(fx, sfx("riser/fs-464250-echo-chromatic-riser-wav.ogg"), 0.0, 0.25)
    put(fx, sfx("impact/fs-177242-cinematic-impact.ogg"), B("intro", 4), 0.45)
    put(fx, sfx(f"{SFX2}/light/sparkle.mp3") if os.path.exists(f"{SFX2}/light/sparkle.mp3") else sfx("ding/fs-349504-triangle-open-04.ogg"), B("intro", 6), 0.35)
    for name in ("tagline", "notjust", "expect", "song", "schedule", "price", "why", "cta", "outro"):
        put(fx, sfx("whoosh/fs-169867-swoosh.ogg"), S[name] - 0.18, 0.4, pan=0.2)
    for i in range(5):  # list items
        put(fx, sfx("pop/fs-824189-pop-in-sfx.ogg"), B("expect", 8 + i * 8), 0.35)
    put(fx, sfx(f"{SFX2}/camera/camera-shutter-hard.mp3"), B("expect", 40) + 0.3, 0.4)
    put(fx, sfx("ui-blip/kenney-digital-threetone1.ogg"), S["song"] + 0.2, 0.3)
    for i in range(4):  # schedule cards
        put(fx, sfx("click/kenney-interface-select-001.ogg"), B("schedule", 2 + i * 4), 0.4)
    put(fx, sfx(f"{SFX2}/camera/camera-lens-shutter.mp3"), B("schedule", 14), 0.35)
    for i in range(2):  # prices
        put(fx, sfx("ding/kenney-interface-confirmation-001.ogg"), B("price", 2 + i * 5), 0.35)
    put(fx, sfx("impact/fs-222517-dramatic-hit.ogg"), S["cta"], 0.35)
    put(fx, sfx("typing/fs-416777-digital-typing-wav.ogg")[: int(1.2 * SR)], B("cta", 5), 0.3)
    put(fx, sfx("pop/fs-467951-ui-button-click.ogg"), B("cta", 8), 0.4)
    put(fx, sfx("riser/fs-685256-riser-sound-effect-short-wav.ogg"), S["outro"] - 1.0, 0.25)
    put(fx, sfx("ding/fs-349504-triangle-open-04.ogg"), S["outro"] + 0.1, 0.35)
    mix = mus * 0.85 + fx * 0.55
    mix = np.tanh(mix / np.abs(mix).max() * 1.1) / np.tanh(1.1) * 0.95
    mix[: int(0.4 * SR)] *= np.linspace(0, 1, int(0.4 * SR))[:, None]
    os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
    wavfile.write(os.path.join(ROOT, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    print("bpm", round(60 / period, 2), "total s", round(end_t, 2), {k: round(v["from"] / FPS, 2) for k, v in sections.items()})


if __name__ == "__main__":
    main()
