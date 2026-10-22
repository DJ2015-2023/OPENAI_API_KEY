"""Copies hyperframes/cta/timing.json (written by build_audio.py) into the CTA composition."""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t = json.load(open(os.path.join(ROOT, "hyperframes/cta/timing.json")))
p = os.path.join(ROOT, "hyperframes/cta/index.html")
s = open(p).read()
s = re.sub(r"const T1 = [\d.]+, T1D = [\d.]+, T2 = [\d.]+, T2D = [\d.]+, DUR = [\d.]+;",
           f"const T1 = {t['t1']}, T1D = {t['t1dur']}, T2 = {t['t2']}, T2D = {t['t2dur']}, DUR = {t['duration']};", s)
s = re.sub(r'data-duration="[\d.]+"', f'data-duration="{t["duration"]}"', s)
s = re.sub(r"t1 = [\d.]+s (.*?), t2 = [\d.]+s", lambda m: f"t1 = {t['t1']}s {m.group(1)}, t2 = {t['t2']}s", s)
open(p, "w").write(s)
print(t)
