"""ASR check + word onsets for narration/n*.wav (sherpa-onnx Russian zipformer) -> narration/words.json."""
import json, os, subprocess, sys
import numpy as np, sherpa_onnx
A = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "work/asr")
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f"{A}/encoder.int8.onnx", decoder=f"{A}/decoder.int8.onnx", joiner=f"{A}/joiner.int8.onnx", tokens=f"{A}/tokens.txt", num_threads=4)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = {}
for i in range(1, 13):
    f = os.path.join(ROOT, f"narration/n{i}.wav")
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
    y = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    idx = np.where(np.abs(y) > 0.004)[0]
    head = max(0, idx[0] - int(0.03 * 16000)) / 16000
    s = rec.create_stream(); s.accept_waveform(16000, y); rec.decode_stream(s)
    words = []
    for tok, t in zip(s.result.tokens, s.result.timestamps):
        if tok.startswith(("▁", " ")) or not words:
            words.append([tok.lstrip("▁ "), round(max(0.0, t - head), 2)])
        else:
            words[-1][0] += tok
    out[f"n{i}"] = {"dur": round(len(y) / 16000 - head, 2), "words": words}
    print(f"n{i}", s.result.text)
json.dump(out, open(os.path.join(ROOT, "narration/words.json"), "w"), ensure_ascii=False, indent=0)
