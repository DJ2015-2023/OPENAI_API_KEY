"""Generative textures (seeded, tileable) + Telegram QR used by the Remotion scenes."""
import os

import numpy as np
import qrcode
import qrcode.image.svg
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public/img")
rng = np.random.default_rng(31)


def fbm(n, slope, seed):
    """Periodic fractal noise: white noise shaped by a 1/f^slope spectrum (tiles seamlessly)."""
    r = np.random.default_rng(seed)
    k = np.fft.fftfreq(n)[:, None] ** 2 + np.fft.fftfreq(n)[None, :] ** 2
    spec = np.fft.fft2(r.standard_normal((n, n))) / np.maximum(k, 1 / n**2) ** (slope / 2)
    x = np.real(np.fft.ifft2(spec))
    return (x - x.min()) / (x.max() - x.min())


# fog: soft white wisps on transparent, two octave mixes
for i, (slope, seed, gamma) in enumerate(((3.2, 7, 2.2), (2.6, 13, 2.8))):
    a = fbm(512, slope, seed)
    a = np.clip((a - 0.35) / 0.65, 0, 1) ** gamma
    rgba = np.zeros((512, 512, 4), np.uint8)
    rgba[..., :3] = 235
    rgba[..., 3] = (a * 255).astype(np.uint8)
    Image.fromarray(rgba).save(os.path.join(OUT, f"fog{i}.png"))

# moon: craters from low-frequency noise, limb darkening, alpha disc
n = 720
y, x = np.mgrid[-1:1:n * 1j, -1:1:n * 1j]
r = np.sqrt(x**2 + y**2)
tex = 0.4 * fbm(n, 2.4, 3) + 0.35 * fbm(n, 1.6, 5) + 0.25 * fbm(n, 0.9, 6)
mare = np.clip((fbm(n, 3.0, 9) - 0.5) * 2.5, 0, 1) * 0.8 + np.clip((fbm(n, 2.2, 11) - 0.6) * 3, 0, 1) * 0.5
shade = np.sqrt(np.clip(1 - r**2, 0, 1)) ** 0.35
lum = (0.72 + 0.45 * (tex - 0.5) - 0.3 * mare + 0.08) * shade
col = np.stack([lum * 255, lum * 238, lum * 214], -1)
alpha = np.clip((1 - r) * n / 3, 0, 1)
Image.fromarray(np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8)).save(os.path.join(OUT, "moon.png"))

# grunge texture (stone / old paper), dark multiply layer
g = 0.6 * fbm(1024, 1.4, 21) + 0.4 * fbm(1024, 2.8, 22)
Image.fromarray((g * 255).astype(np.uint8)).save(os.path.join(OUT, "grunge.png"))

# QR for the Telegram channel
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=1, box_size=1)
qr.add_data("https://t.me/MSDE_BACHATA")
qr.make()
m = np.array(qr.get_matrix(), bool)
cells = [f'<rect x="{c}" y="{r}" width="1.04" height="1.04"/>' for r, c in zip(*np.nonzero(m))]
open(os.path.join(OUT, "qr.svg"), "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {m.shape[1]} {m.shape[0]}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#F3E9DC"/><g fill="#0B0610">{"".join(cells)}</g></svg>')
print("qr", m.shape)
