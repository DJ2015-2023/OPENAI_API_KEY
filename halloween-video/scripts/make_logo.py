"""Turns the client's logo on black (brand/logo_src.webp) into a transparent PNG.

Black is "un-multiplied" out (alpha = max channel, colour = rgb / alpha) so the neon glows and sparks
keep their soft falloff instead of getting a hard cut-out edge.
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
x = np.asarray(Image.open(os.path.join(ROOT, "brand/logo_src.webp")).convert("RGB")).astype(np.float32) / 255
floor = 0.04  # black level of the source
a = np.clip((x.max(-1) - floor) / (1 - floor), 0, 1)
rgb = np.clip((x - floor * (1 - a[..., None])) / np.maximum(a[..., None], 1e-4), 0, 1)
a = a ** 0.85  # keep the glow a bit denser on dark scenes
out = np.dstack([rgb, a])
Image.fromarray((out * 255).astype(np.uint8)).save(os.path.join(ROOT, "public/img/logo.png"), optimize=True)
print("logo", out.shape)
