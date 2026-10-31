---
name: freeze-intro
description: Make a vertical 9:16 "freeze-frame character intro" video (the comic/newsprint presentation style) from the user's own footage — the shot plays, FREEZES on a beat, the person stays in colour over a flickering red/brown halftone newspaper background with a dark-red echo of their silhouette, an orange comic name banner with a lightning tail pops in letter by letter under a typed handwritten paper strip, then a vertical whip-blur returns to the moving footage. Use when the user asks for "este estilo", "presentación de personaje", "freeze frame", "congelar y poner el nombre", "intro de personajes", "estilo Ruby Jane", or wants dancers / DJs / teachers / artists introduced one by one with name tags.
---

# Freeze-frame character intro (estilo «Ruby Jane»)

Learned from the user's reference clip (5.8 s, 1080×1920, 30 fps). The user wants **this style learned and reusable** — when they ask for a video "con este estilo", build it with this skill from the footage, names and music *they* give. Do not invent names, roles or event info: the banner/strip texts come from the user.

## Anatomy of the style (what makes it read as "this" style)

| beat | time (ref) | what happens |
|---|---|---|
| intro | 0–0.55 s | black → vertical streak blur → **film burn** (white/peach/orange/pink light leak, orange "film-gate" blobs sliding up the left edge) dissolving into the footage |
| live A | ~0.8 s | real footage, untouched |
| **freeze** | ~2.6 s, lands on a strong beat | hard cut to the frozen frame + white kiss (3 frames) + small zoom-kick 1.06→1 then slow push 1→1.035 |
| ↳ background | | the frame's background turned into a **halftone dot screen** (45°, dot size ∝ darkness) over faint **newsprint** (columns of text + "DAILY NEWS" headline), duotone **flickering every 3 frames between deep red (#96342E / dots #46100E) and brown (#5C4636 / dots #261C16)**, opening on red |
| ↳ echo | | a **dark-red silhouette copy** of the person, scaled ×1.08 and offset up-left (≈ −70, −50 px), multiplied over the background |
| ↳ subject | | the person **cut out in full colour**, sharp, slight soft shadow |
| ↳ tag | | **cream torn-paper strip** (handwritten caps, *Caveat 700*, typed 1 char / 2 frames) sitting on an **orange-red banner** (#E5512A, skewX −6°, 5 px black border, **hard black offset shadow 12 px**), whole tag rotated −2°, springs in from 0.3 scale. **Name** in *Rubik 900* white with black outline + 4 px hard shadow, letters pop one by one (2 frames apart, first 2 frames tinted accent). **Lightning-bolt speech tail** under the banner (left side, mirrored when `tagSide: right`) |
| whip | 5–6 frames | freeze slides down with a **vertical directional blur** (SVG `feGaussianBlur stdDeviation="0 N"`) and the footage drops in from above, brightened ×1.35 → 1 |
| live B | ~1.4 s | footage resumes **from the freeze moment** (continuity) |
| outro | last 0.3 s | vertical whip up + fade to black |

Music: punchy beat (the ref has hits every ~0.3 s). **Freezes land on strong beats** — that's what sells it. SFX: whoosh at intro, heavy punch at each freeze, small pop as the name starts, swoosh at each whip.

Several characters chain: live A → freeze → live B → (whip) → next character…

## Workflow

1. **Inputs from the user**: clip(s) of each person (any aspect; it is cover-cropped to 9:16), the moment to freeze (seconds in each clip — pick a frame where the person is sharp, facing camera, whole body or ¾), the NAME and the small strip text for each, the music. Ask only for what's missing; if they give no freeze time, pick the sharpest frame with one clearly separated person (check with a contact sheet).
2. **Scaffold**: `bash .claude/skills/freeze-intro/scripts/new_project.sh <project_dir>` (copies the Remotion template, fonts, hard-links an existing node_modules from the repo or runs npm install).
3. **Fill `<project_dir>/project.json`**:
   ```json
   {
     "music": "/abs/path/song.mp3",          // optional; "musicStart": 12.3 to force the song offset
     "hold": 2.6,                             // optional freeze length (s)
     "characters": [
       {"video": "/abs/path/a.mp4", "freeze": 2.4, "name": "RUBY JANE", "tag": "DESCRIPTION",
        "accent": "#E5512A", "tagY": 1080, "tagSide": "left", "lead": 0.8, "tail": 1.4}
     ]
   }
   ```
   `tagY` = top of the tag in px (default 1080 ≈ chest/waist; move it so it never covers the face), `tagSide` left|right, `lead`/`tail` = seconds of live footage before/after the freeze (the shot must really contain them — check scene cuts with `ffmpeg -vf "select='gt(scene,0.2)',showinfo"` and keep lead+tail inside one shot).
4. **Build assets + timeline + audio**: `python3 .claude/skills/freeze-intro/scripts/prepare.py <project_dir>`
   - normalises each clip to 1080×1920@30 (`public/gen/<i>/clip.mp4`), grabs the freeze frame, cuts the person out with **rembg `u2net_human_seg`**, renders `bg0.jpg` / `bg1.jpg` (red / brown halftone newsprint) and `echo.png`;
   - if music is given, picks the song offset whose strong beats hit every freeze and nudges each freeze onto its nearest beat (±0.25 s);
   - writes `src/timeline.json` and `public/audio/mix.wav` (music + SFX).
5. **Check stills before rendering**: `npx remotion still src/index.ts FreezeIntro work/f.jpg --frame=<n> --scale=0.5` on a freeze frame of every character — cut-out clean? tag not over the face? text fits on one line (long names auto-shrink: >9 chars 96 px, >12 chars 82 px)?
6. **Render**: `npx remotion render src/index.ts FreezeIntro out/main.mp4 --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k </dev/null` (run in background for long ones), then re-encode `-pix_fmt yuv420p -movflags +faststart` and verify (`node ~/.claude/skills/video-editing/scripts/verify-render.mjs out.mp4 --duration N` if available).

## Tuning knobs (template `src/FreezeIntro.tsx`, `scripts/prepare.py`)

- Palette: `DUOTONES` in prepare.py (paper, dot colour per variant); banner colour per character via `accent`.
- Halftone density: `halftone(spacing=13)`; newsprint strength: `0.82 + 0.18 * news`.
- Flicker speed: `Math.floor(f / 3)` in `Freeze`.
- Typing speed: `<Typed every={2}>`, letter pop `<PopLetters every={2}>`.
- Whip strength: `VBlur amt` (70 px) and translate (260 px).
- Timing grammar constants at the top of prepare.py: `INTRO, LIVE_A, HOLD, LIVE_B, OUTRO`.

## Gotchas

- **Segmentation model**: rembg needs `~/.rembg/models/u2net_human_seg/u2net_human_seg.onnx` (or `~/.u2net/`). If missing and HuggingFace is blocked, download it from GitHub: `https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_human_seg.onnx`. For non-human subjects use `isnet-general-use`.
- Pick freeze frames **without motion blur**; a blurry frame gives a mushy cut-out. Two people in frame → both are cut out (fine for couples).
- librosa can't open some mp3s (junk headers) — prepare.py already decodes via ffmpeg.
- Keep text Cyrillic-safe: Rubik and Caveat ship latin + cyrillic subsets in `template/public/fonts`.
- Don't put watermarks or the reference's sample text in deliverables; "DESCRIPTION"/"RUBY JANE" are placeholders only.

## Reference images

`reference/ref-contact-sheet.jpg` (the user's clip at 6 fps), `reference/ref-freeze-keys.jpg` (freeze card close-ups), `reference/ref-whips.jpg` (film burn / vertical whips), `reference/our-freeze-frame.jpg` (what this template produces). Compare your stills against them.
