"""Generate the Russian voice-over with a local Piper (VITS) voice via sherpa-onnx.

Usage: python3 make_narration.py <voice_dir> <out_dir>
Writes one WAV per line plus durations.json used by the Remotion timeline.
"""
import json, sys, pathlib
import numpy as np, soundfile as sf, sherpa_onnx

voice_dir, out_dir = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
out_dir.mkdir(parents=True, exist_ok=True)
name = voice_dir.name.replace("vits-piper-", "")
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(
    model=sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(
            model=str(voice_dir / f"{name}.onnx"), tokens=str(voice_dir / "tokens.txt"),
            data_dir=str(voice_dir / "espeak-ng-data"), noise_scale=0.62, noise_scale_w=0.85),
        num_threads=4)))

lines = json.loads((pathlib.Path(__file__).parent / "narration.json").read_text())
durations = {}
for line in lines:
    audio = tts.generate(line["text"], sid=0, speed=0.9)
    x = np.asarray(audio.samples, dtype=np.float32)
    x = x / (np.abs(x).max() + 1e-9) * 0.89
    sf.write(out_dir / f"{line['id']}.wav", x, audio.sample_rate)
    durations[line["id"]] = round(len(x) / audio.sample_rate, 3)
    print(line["id"], durations[line["id"]])
(out_dir / "durations.json").write_text(json.dumps(durations, indent=1))
