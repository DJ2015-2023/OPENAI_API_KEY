"""Splits the client's poster (source/poster.png) into animatable layers without redrawing anything.

Every layer is the poster's own pixels with an alpha mask, so when all layers are on screen the
frame is the original poster. Outputs to public/img/:
  plate.png      background stage with the logo, texts and artist painted out (cv2 inpaint)
  logo.png       Bachata Forever emblem
  artist.png     Akai Rojas (u2net_human_seg mask, cut above the title)
  t_*.png        each text line / the 3D title, letter masks from local contrast
  poster.png     the untouched poster (1080x1920) for the final hold
  layers.json    bounding boxes, used for light sweeps
"""
import json
import os

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public/img")
os.makedirs(OUT, exist_ok=True)

src = Image.open(os.path.join(ROOT, "source/poster.png")).convert("RGB").resize((1080, 1920), Image.LANCZOS)
src = src.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
im = np.asarray(src).astype(np.float32)
H, W = im.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def feather(mask, grow=3, blur=2.0):
    m = (mask > 0.5).astype(np.uint8) * 255
    if grow:
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1)))
    m = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), blur)
    return np.clip(m, 0, 1)


def text_mask(y0, y1, x0=40, x1=1040, thr=38):
    """Letters (+ their dark bevel) inside a band: pixels that stand out from a median-filtered background."""
    band = im[y0:y1, x0:x1]
    bg = np.stack([cv2.medianBlur(band[..., c].astype(np.uint8), 41) for c in range(3)], -1).astype(np.float32)
    lum, lbg = band.mean(-1), bg.mean(-1)
    mx, mn = band.max(-1), band.min(-1)
    sat = (mx - mn) / (mx + 1)
    bright = (lum - lbg > thr) | ((lum > 200) & (sat < 0.35))
    m = np.zeros((H, W), np.float32)
    m[y0:y1, x0:x1] = bright
    m = cv2.morphologyEx((m * 255).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)) / 255
    # keep only reasonably sized blobs (drops stray bokeh dots)
    n, lab, stats, _ = cv2.connectedComponentsWithStats((m > 0.5).astype(np.uint8))
    keep = np.zeros_like(m)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= 25:
            keep[lab == i] = 1
    edge = smooth(0, 6, yy - y0) * smooth(0, 6, y1 - yy)
    return feather(keep, grow=4, blur=1.6) * edge


def save(name, alpha):
    rgba = np.dstack([im, alpha * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(rgba).save(os.path.join(OUT, f"{name}.png"), optimize=True)
    ys, xs = np.nonzero(alpha > 0.1)
    return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]


layers = {}
# emblem
r = np.hypot(xx - 539, yy - 110)
logo = 1 - smooth(132, 158, r)
layers["logo"] = save("logo", logo)

# text lines (y ranges measured on the 1080x1920 poster)
TEXT = {
    "t_akai": (248, 326, 120, 960),
    "t_live": (326, 424, 180, 900),
    "t_date": (424, 490, 120, 960),
    "t_moskva": (1342, 1446, 270, 810),
    "t_dates": (1444, 1496, 200, 880),
    "t_inv1": (1594, 1646, 190, 890),
    "t_inv2": (1644, 1692, 300, 780),
    "t_inv3": (1690, 1752, 120, 960),
    "t_inv4": (1750, 1802, 190, 890),
}
masks = {}
for k, (a, b, x0, x1) in TEXT.items():
    masks[k] = text_mask(a, b, x0, x1, thr=34 if k.startswith("t_inv") else 38) * smooth(x0, x0 + 8, xx) * smooth(x1, x1 - 8, xx)
    layers[k] = save(k, masks[k])

# 3D title: isnet-general segmentation restricted to the title block, split in two words
isnet = np.asarray(Image.open(os.path.join(ROOT, "source/mask_isnet-general-use.png")).convert("L")).astype(np.float32) / 255
title = isnet * smooth(935, 965, yy) * (1 - smooth(1335, 1350, yy))
# isnet misses the dark-red left letters ("TE", "E"): add local-contrast letters + saturated red/orange there
lc = text_mask(940, 1350, 0, 1080, thr=30)
red = ((im[..., 0] > 120) & (im[..., 0] > im[..., 2] * 1.6)).astype(np.float32) * (xx < 360) * (yy > 950) * (yy < 1345)
title = np.maximum.reduce([title > 0.35, lc > 0.5, red > 0.5]).astype(np.float32)
title = cv2.morphologyEx((title * 255).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)) / 255
title = feather(title, grow=3, blur=1.5)
temp = title * (1 - smooth(1150, 1175, yy + (xx - 540) * 0.0))
euro = title * smooth(1150, 1175, yy)
layers["t_temp"] = save("t_temp", temp)
layers["t_euro"] = save("t_euro", euro)

# artist: head to the top of the title (legs stay in the plate, they are dark)
human = np.asarray(Image.open(os.path.join(ROOT, "source/mask_u2net_human_seg.png")).convert("L")).astype(np.float32) / 255
artist = np.clip((human - 0.15) / 0.7, 0, 1) * (1 - smooth(975, 1010, yy)) * (yy > 450)
artist = cv2.GaussianBlur(artist, (0, 0), 1.2)
layers["artist"] = save("artist", artist)

# clean plate: paint out everything that gets revealed later
hole = np.maximum.reduce([logo, artist, title, *masks.values()])
hole8 = (cv2.dilate((hole > 0.05).astype(np.uint8), np.ones((9, 9), np.uint8)) * 255)
# normalized-convolution fill: holes take the blurred colour of the surrounding stage light
keepw = 1 - cv2.dilate((hole > 0.05).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
def nconv(sig):
    num = np.stack([cv2.GaussianBlur(im[..., c] * keepw, (0, 0), sig) for c in range(3)], -1)
    den = cv2.GaussianBlur(keepw, (0, 0), sig)[..., None]
    return num / np.maximum(den, 1e-4), den
f1, d1 = nconv(10)
f2, _ = nconv(45)
fill = np.where(d1 > 0.25, f1, f2)
fill = cv2.GaussianBlur(fill, (0, 0), 3)
hf = cv2.GaussianBlur(1 - keepw, (0, 0), 3)[..., None]
plate = im * (1 - hf) + fill * hf
Image.fromarray(plate.clip(0, 255).astype(np.uint8)).save(os.path.join(OUT, "plate.jpg"), quality=95)
src.save(os.path.join(OUT, "poster.jpg"), quality=96)
json.dump(layers, open(os.path.join(OUT, "layers.json"), "w"), indent=1)
print(json.dumps(layers))
