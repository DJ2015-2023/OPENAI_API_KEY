"""Synthesize voiceover phrases with Kokoro (a natural-sounding local neural voice).

Usage: python3 scripts/tts_kokoro.py <model_dir> <voice> <jobs.json>
jobs.json is a list of {"text": ..., "out": ...}; one model load serves every phrase.
"""
import json
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

model_dir, voice, jobs_path = sys.argv[1:4]
kokoro = Kokoro(f"{model_dir}/kokoro-v1.0.onnx", f"{model_dir}/voices-v1.0.bin")
for job in json.load(open(jobs_path)):
    samples, sr = kokoro.create(job["text"], voice=voice, speed=1.08, lang="en-us")
    sf.write(job["out"], samples, sr)
