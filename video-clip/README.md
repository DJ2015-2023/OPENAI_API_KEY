# VIDEO CLIP — промо-ролик 9:16 (1080×1920, 30 fps)

Кинематографичный motion-graphics ролик с мужским голосом за кадром (рус.).

## Как устроено
| Часть | Инструмент | Файлы |
|---|---|---|
| Интро-заставка (3.6 с) | **HyperFrames** (HTML + GSAP) | `intro/index.html` → `public/intro.mp4` |
| Основной ролик, эффекты, сцены | **Remotion** (React) | `src/*.tsx`, `src/timeline.json` |
| Голос (молодой мужской, нейросетевой Piper «dmitri») | sherpa-onnx, офлайн | `tools/make_narration.py`, `tools/narration.json` → `public/vo/*.wav` |
| Музыка + SFX + сведение (−14 LUFS) | процедурный синтез (numpy) | `tools/make_audio.py` → `public/mix.wav` |

## Пересборка
```bash
npm i
python3 tools/make_narration.py <путь к vits-piper-ru_RU-dmitri-medium> public/vo   # голос
cp public/vo/durations.json tools/ && python3 tools/build_timeline.py              # тайминг сцен
python3 tools/make_audio.py                                                         # музыка и микс
(cd intro && npx hyperframes render -o ../public/intro.mp4)                          # интро
npx remotion render src/index.ts VideoClip out/VIDEO_CLIP_9x16_FullHD.mp4 --audio-codec=aac
```
Голосовая модель: `https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ru_RU-dmitri-medium.tar.bz2`
(альтернативы: `denis`, `ruslan`). Текст озвучки правится в `tools/narration.json`.
