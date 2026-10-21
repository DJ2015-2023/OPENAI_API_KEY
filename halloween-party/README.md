# Halloween · Latin Fusion Party — промо 9:16 (1080×1920, 30 fps, 40 с)

- `intro-hf/` — интро на **HyperFrames** (молнии, туман, летучие мыши, глитч) → `public/intro.mp4`
- `src/` — основной ролик на **Remotion** + `@remotion/three` (3D-тыквы, кровавая луна, золотое 3D «31»), переходы: iris/glitch/drop/рой летучих мышей/3D-флип/zoom
- `tools/analyze_song.py <song.mp3>` — находит дроп в треке, сетку битов (≈107.7 BPM) и привязывает склейки к долям → `src/timeline.json`
- `tools/make_audio.py <song.mp3>` — фрагмент трека (дроп на 4.0 с) + SFX на битах → `public/mix.wav`
- Финал — афиша `public/poster.png` (не хранится в репозитории, положить вручную).

```bash
npm i
python3 tools/analyze_song.py song.mp3 && python3 tools/make_audio.py song.mp3
(cd intro-hf && npx hyperframes render -o ../public/intro.mp4)
npx remotion render src/index.ts HalloweenParty out/Halloween_Latin_Fusion_9x16.mp4 --audio-codec=aac
```
