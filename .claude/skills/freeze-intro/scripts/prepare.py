"""Freeze-frame character intro — asset + timeline builder.

Usage:  python3 prepare.py <project_dir>
Reads   <project_dir>/project.json   (see SKILL.md for the schema)
Writes  <project_dir>/public/gen/<i>/{clip.mp4, freeze.jpg, cutout.png, bg0.jpg, bg1.jpg, echo.png}
        <project_dir>/public/audio/mix.wav
        <project_dir>/src/timeline.json
"""
import json
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
SR = 48000
SFX = "/home/user/Barty-Bart/motion-graphics/skills/sound-effects/sfx"

# timing grammar of the style (seconds)
INTRO = 0.55  # film-burn + vertical streak over the start of the first shot
LIVE_A = 0.8  # moving footage before the freeze (after the intro on the first character)
HOLD = 2.6  # the freeze card
LIVE_B = 1.4  # footage resumes from the freeze moment
OUTRO = 0.3  # vertical whip to black at the very end

# freeze palette: two duotones the background flickers between (paper colour, dot colour)
DUOTONES = [((150, 52, 46), (70, 16, 14)), ((92, 70, 54), (38, 28, 22))]


def run(cmd):
    subprocess.run(cmd, check=True)


def probe_dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def normalise(src, start, dur, dst):
    """Cover-crop to 1080x1920 @30 fps so the freeze frame, the cut-out and the clip line up exactly."""
    vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},setsar=1"
    run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", src, "-vf", vf, "-an", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", dst])


def grab(clip, t, dst):
    run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", clip, "-frames:v", "1", "-q:v", "2", dst])


def cutout(img_path, dst):
    from rembg import new_session, remove

    sess = new_session("u2net_human_seg")
    im = Image.open(img_path).convert("RGB")
    out = remove(im, session=sess)
    a = out.split()[-1].filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out.putalpha(a)
    out.save(dst)
    return np.asarray(a, np.float32) / 255.0


def newspaper(seed):
    """Faint newsprint texture (columns of dummy text + a headline) used under the halftone."""
    rng = np.random.default_rng(seed)
    im = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(im)
    try:
        head = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 130)
        body = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 26)
    except OSError:
        head = body = ImageFont.load_default()
    words = "night dance music party city news latin rhythm stage light crowd story fusion style week club people".split()
    y = 40
    for line in ("DAILY", "NEWS"):
        d.text((60, y), line, font=head, fill=40)
        y += 140
    cols = 3
    cw = (W - 120) // cols
    for c in range(cols):
        yy = y + 20
        while yy < H - 40:
            txt = " ".join(rng.choice(words, size=6))
            d.text((60 + c * cw, yy), txt, font=body, fill=70)
            yy += 34
    return np.asarray(im, np.float32) / 255.0


def halftone(gray, paper, ink, spacing=13, angle=45):
    """Classic rotated dot screen: dot radius grows with darkness."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    a = math.radians(angle)
    u = (xx * math.cos(a) + yy * math.sin(a)) / spacing
    v = (-xx * math.sin(a) + yy * math.cos(a)) / spacing
    du = u - np.round(u)
    dv = v - np.round(v)
    dist = np.sqrt(du * du + dv * dv)
    r = 0.12 + 0.5 * np.clip(1 - gray, 0, 1) ** 0.9
    m = np.clip((r - dist) * spacing * 0.9, 0, 1)[..., None]  # anti-aliased dots
    paper = np.array(paper, np.float32)[None, None]
    ink = np.array(ink, np.float32)[None, None]
    return paper * (1 - m) + ink * m


def freeze_assets(freeze_jpg, alpha, gdir, seed):
    base = Image.open(freeze_jpg).convert("L").filter(ImageFilter.GaussianBlur(2))
    gray = np.asarray(base, np.float32) / 255.0
    gray = np.clip((gray - 0.15) / 0.75, 0, 1)
    news = newspaper(seed)
    for k, (paper, ink) in enumerate(DUOTONES):
        bg = halftone(gray, paper, ink)
        bg = bg * (0.82 + 0.18 * news[..., None])  # newsprint multiply
        Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).save(os.path.join(gdir, f"bg{k}.jpg"), quality=92)
    # echo silhouette: subject alpha, scaled up and nudged up-left, solid dark red
    a = Image.fromarray((alpha * 255).astype(np.uint8))
    s = 1.08
    a = a.resize((int(W * s), int(H * s)), Image.BILINEAR)
    canvas = Image.new("L", (W, H), 0)
    canvas.paste(a, (int(-W * (s - 1) / 2) - 70, int(-H * (s - 1) / 2) - 50))
    echo = Image.new("RGBA", (W, H), (110, 18, 18, 0))
    echo.putalpha(canvas.point(lambda p: int(p * 0.6)))
    echo.save(os.path.join(gdir, "echo.png"))


def beats_of(path, offset, dur):
    import librosa

    sr = 22050  # decode with ffmpeg: librosa/soundfile choke on mp3s with junk headers
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", f"{offset:.3f}", "-t", f"{dur + 1:.3f}", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32).copy()
    o = librosa.onset.onset_strength(y=y, sr=sr)
    t = librosa.times_like(o, sr=sr)
    pk = librosa.util.peak_pick(o, pre_max=3, post_max=3, pre_avg=6, post_avg=6, delta=0.8, wait=4)
    strong = [(t[p], o[p]) for p in pk]
    if not strong:
        return []
    thr = np.percentile([s for _, s in strong], 60)
    return [tt for tt, s in strong if s >= thr]


def decode(path, start, dur, ch=2):
    cmd = ["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", f"{max(0, start):.3f}", "-t", f"{dur:.3f}", "-i", path, "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()
    return x.reshape(-1, ch) if ch == 2 else x


def sfx(name):
    x = decode(os.path.join(SFX, name), 0, 30, ch=1)
    return x / (np.abs(x).max() + 1e-9)


def put(buf, x, at, g):
    i = int(at * SR)
    e = min(len(buf), i + len(x))
    if e > i:
        buf[i:e] += (x[: e - i] * g)[:, None]


def main():
    root = os.path.abspath(sys.argv[1])
    cfg = json.load(open(os.path.join(root, "project.json")))
    chars = cfg["characters"]
    music = cfg.get("music")
    hold = cfg.get("hold", HOLD)

    # 1) lay out the timeline (seconds) — freeze moments are later nudged onto strong beats
    segs = []
    t = 0.0
    for i, c in enumerate(chars):
        lead = c.get("lead", LIVE_A + (INTRO if i == 0 else 0))
        tail = c.get("tail", LIVE_B)
        segs.append({"lead": lead, "tail": tail, "at": t})
        t += lead + hold + tail
    total = t

    music_start = cfg.get("musicStart")
    if music:
        if music_start is None:
            # choose the song offset whose strong beats best hit every freeze moment
            mdur = probe_dur(music)
            cand = beats_of(music, 0, min(mdur, 90))
            freezes = [s["at"] + s["lead"] for s in segs]
            best, bs = 0.0, 1e9
            for b in cand:
                off = b - freezes[0]
                if off < 0 or off + total > mdur:
                    continue
                err = 0.0
                for fz in freezes[1:]:
                    err += min((abs(c - (fz + off)) for c in cand), default=1.0)
                score = err - 0.002 * b  # prefer later (fuller) parts of the song on ties
                if score < bs:
                    best, bs = off, score
            music_start = best
        beats = beats_of(music, music_start, total)
        # nudge each freeze onto its nearest strong beat by stretching the shot before it (±0.25 s)
        t = 0.0
        for s in segs:
            fz = t + s["lead"]
            near = min(beats, key=lambda b: abs(b - fz), default=fz)
            if abs(near - fz) <= 0.25 and s["lead"] + (near - fz) >= 0.4:
                s["lead"] += near - fz
            s["at"] = t
            t += s["lead"] + hold + s["tail"]
        total = t

    # 2) per-character assets
    timeline = {"fps": FPS, "total": int(round(total * FPS)), "hold": int(round(hold * FPS)), "intro": int(round(INTRO * FPS)), "outro": int(round(OUTRO * FPS)), "characters": []}
    for i, (c, s) in enumerate(zip(chars, segs)):
        gdir = os.path.join(root, "public/gen", str(i))
        os.makedirs(gdir, exist_ok=True)
        src = c["video"] if os.path.isabs(c["video"]) else os.path.join(root, c["video"])
        fz = float(c["freeze"])
        a0 = max(0.0, fz - s["lead"])
        lead = fz - a0
        clip_dur = lead + s["tail"] + 0.2
        normalise(src, a0, clip_dur, os.path.join(gdir, "clip.mp4"))
        grab(os.path.join(gdir, "clip.mp4"), lead, os.path.join(gdir, "freeze.jpg"))
        alpha = cutout(os.path.join(gdir, "freeze.jpg"), os.path.join(gdir, "cutout.png"))
        freeze_assets(os.path.join(gdir, "freeze.jpg"), alpha, gdir, seed=i + 1)
        timeline["characters"].append({
            "from": int(round(s["at"] * FPS)),
            "lead": int(round(lead * FPS)),
            "tail": int(round(s["tail"] * FPS)),
            "name": c["name"],
            "tag": c.get("tag", ""),
            "accent": c.get("accent", "#E5512A"),
            "tagY": c.get("tagY", 1080),
            "tagSide": c.get("tagSide", "left"),
        })
        print(f"character {i}: freeze at {(s['at'] + lead):.2f}s  ({c['name']})")
    json.dump(timeline, open(os.path.join(root, "src/timeline.json"), "w"), ensure_ascii=False, indent=1)

    # 3) audio: music (beat-matched) + transition SFX
    n = int(total * SR)
    mix = np.zeros((n, 2), np.float32)
    if music:
        m = decode(music, music_start, total)[:n]
        mix[: len(m)] += m / (np.abs(m).max() + 1e-9) * 0.8
    fx = np.zeros((n, 2), np.float32)
    put(fx, sfx("whoosh/fs-169867-swoosh.ogg"), 0.0, 0.5)
    for ch in timeline["characters"]:
        f0 = ch["from"] / FPS
        fz = f0 + ch["lead"] / FPS
        if ch["from"] > 0:
            put(fx, sfx("whoosh/fs-683101-quick-woosh.ogg"), f0 - 0.15, 0.45)
        put(fx, sfx("impact/kenney-impact-impactpunch-heavy-000.ogg"), fz, 0.55)
        put(fx, sfx("pop/fs-824189-pop-in-sfx.ogg"), fz + 0.2, 0.3)
        put(fx, sfx("whoosh/fs-169867-swoosh.ogg"), fz + hold - 0.12, 0.45)
    mix += fx * 0.5
    fade = int(0.4 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    mix = np.tanh(mix * 1.1) * 0.95
    os.makedirs(os.path.join(root, "public/audio"), exist_ok=True)
    from scipy.io import wavfile

    wavfile.write(os.path.join(root, "public/audio/mix.wav"), SR, (mix * 32767).astype(np.int16))
    print(f"total {total:.2f}s, music from {music_start if music else 0:.2f}s")


if __name__ == "__main__":
    main()
