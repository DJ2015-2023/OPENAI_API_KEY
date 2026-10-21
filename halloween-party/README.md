# Halloween · Latin Fusion Party — промо 9:16 (1080×1920, 30 fps, 40 с)

- `intro-hf/` — интро на **HyperFrames** (молнии, туман, летучие мыши, глитч) → `public/intro.mp4`
- `src/` — основной ролик на **Remotion** + `@remotion/three` (3D-тыквы, кровавая луна, золотое 3D «31»), переходы: iris/glitch/drop/рой летучих мышей/3D-флип/zoom
- `tools/make_audio.py` — процедурная музыка 120 BPM (dembow, гуиро, бас, гитара Karplus-Strong, орган, хор) и SFX → `public/mix.wav`
- Финал — афиша `public/poster.png` (не хранится в репозитории, положить вручную).

```bash
npm i
python3 tools/make_audio.py
(cd intro-hf && npx hyperframes render -o ../public/intro.mp4)
npx remotion render src/index.ts HalloweenParty out/Halloween_Latin_Fusion_9x16.mp4 --audio-codec=aac
```
