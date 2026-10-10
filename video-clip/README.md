# VIDEO CLIP — промо-ролик (Remotion, 9:16)

Vertical 1080×1920 explainer video (≈88 s, 30 fps) for the **VIDEO CLIP** project, built with Remotion.

## Contents

| Scene | File | What it shows |
|---|---|---|
| Intro | `src/scenes/Intro.tsx` | 3D clapperboard snaps shut, title, tagline |
| Представь | `src/scenes/Imagine.tsx` | Song → story → you |
| Не просто | `src/scenes/NotJust.tsx` | What the project is (and isn't) |
| Шаг 1 | `src/scenes/Step1.tsx` | 3D vinyl, sending the song, analysis |
| Шаг 2 | `src/scenes/Step2.tsx` | Dance + mini-film cards merge into a music mini-film |
| Шаг 3 | `src/scenes/Step3.tsx` | 6-hour rehearsal counter and checklist |
| Шаг 4 | `src/scenes/Step4.tsx` | 3D film camera, viewfinder, 1–2 hours of shooting |
| Шаг 5 | `src/scenes/Step5.tsx` | Individual scheduling (place / dates / shoot) |
| Почему особенный | `src/scenes/WhyDeck.tsx`, `WhyCreate.tsx` | Your own song, choreography, story, clip |
| Итог + CTA | `src/scenes/Summary.tsx`, `Cta.tsx` | Summary, 3D heart, "write me in DMs" |

The scene order, durations and transitions live in `src/Main.tsx`. Shared look (colors, fonts, backdrop, film grain, helpers) is in `src/theme.tsx`, 3D objects in `src/three/`.

All music and sound effects are synthesized by `scripts/make_audio.py` (no third-party audio), fonts (Unbounded, Montserrat — OFL) are in `public/fonts`.

## Commands

```bash
npm i
npm run dev                         # Remotion Studio preview
python3 scripts/make_audio.py 88.5  # regenerate music + SFX (needs numpy)
npx remotion render VideoClip out/video-clip.mp4 --gl=angle
```

Every scene is also registered as its own composition (`Intro`, `Step1`, …) so it can be previewed alone in Studio.

To replace the synthesized music with a real track, drop it in `public/` and change the `src` of `<Music>` in `src/Main.tsx`.
