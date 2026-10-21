"""Lay the scenes end to end from the voice-over durations -> src/timeline.json."""
import json, pathlib

root = pathlib.Path(__file__).parent
dur = json.loads((root / "durations.json").read_text())
lines = {l["id"]: l["text"] for l in json.loads((root / "narration.json").read_text())}

INTRO = 3.6  # HyperFrames logo sting, no voice
# (scene id, voice lead-in, tail after voice)
plan = [("hook", 0.35, 0.9), ("about", 0.45, 0.8), ("how", 0.3, 0.9),
        ("s1", 0.5, 0.8), ("s2", 0.5, 0.8), ("s3", 0.5, 0.8), ("s4", 0.5, 0.8), ("s5", 0.5, 0.9),
        ("why", 0.5, 1.0), ("feel", 0.4, 1.0), ("cta", 0.4, 1.0), ("outro", 0.4, 3.0)]

scenes, t = [{"id": "intro", "start": 0.0, "dur": INTRO}], INTRO
for sid, lead, tail in plan:
    d = round(lead + dur[sid] + tail, 3)
    scenes.append({"id": sid, "start": round(t, 3), "dur": d, "voiceAt": round(t + lead, 3),
                   "voiceDur": dur[sid], "text": lines[sid]})
    t += d
out = {"fps": 30, "total": round(t, 3), "scenes": scenes}
(root.parent / "src" / "timeline.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print("total", round(t, 2), "s")
