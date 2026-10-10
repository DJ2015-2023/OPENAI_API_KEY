"""Generates the Russian male voiceover with RHVoice (apt install rhvoice rhvoice-russian).

Reads src/narration.json, writes one cleaned-up WAV per line to public/voice/
and the line lengths (in frames) to src/voice-durations.json.
"""
import json, math, os, subprocess, tempfile, wave

ROOT = os.path.join(os.path.dirname(__file__), "..")
VOICE = os.environ.get("VOICE", "aleksandr-hq")
RATE = os.environ.get("RATE", "135")    # % speech rate
PITCH = os.environ.get("PITCH", "106")  # % pitch, slightly up for a younger sound
FPS = 30

narration = json.load(open(os.path.join(ROOT, "src", "narration.json"), encoding="utf-8"))
out_dir = os.path.join(ROOT, "public", "voice")
os.makedirs(out_dir, exist_ok=True)
durations = {}

# Voice polish: trim silence, rumble cut, presence lift, gentle compression, short room.
FILTER = (
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,"
    "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,"
    "highpass=f=90,equalizer=f=3200:t=q:w=1.2:g=3,equalizer=f=220:t=q:w=1:g=1.5,"
    "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=4,"
    "aecho=0.8:0.5:22:0.12,aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=7"
)

with tempfile.TemporaryDirectory() as tmp:
    for scene, lines in narration.items():
        durations[scene] = []
        for k, line in enumerate(lines):
            raw = os.path.join(tmp, "raw.wav")
            subprocess.run(
                ["RHVoice-test", "-p", VOICE, "-r", RATE, "-t", PITCH, "-o", raw],
                input=line["text"].encode("utf-8"),
                check=True,
            )
            dst = os.path.join(out_dir, f"{scene}-{k}.wav")
            subprocess.run(
                ["ffmpeg", "-loglevel", "error", "-y", "-i", raw, "-af", FILTER, "-ac", "2", dst],
                check=True,
            )
            with wave.open(dst) as w:
                secs = w.getnframes() / w.getframerate()
            durations[scene].append(math.ceil(secs * FPS))
            print(f"{scene}-{k}: {secs:.2f}s  {line['text']}")

json.dump(durations, open(os.path.join(ROOT, "src", "voice-durations.json"), "w"), indent=2)
