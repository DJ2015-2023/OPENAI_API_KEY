"""Split the flat poster into animatable layers (run: python3 -I src/build_layers.py).

Coordinates are in the source poster's pixel space (1125x2000); every layer is
saved full-frame at 1080x1920 so all layers stack at 0,0 in the composition.
"""
import os
import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "layers")
os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1920

src = np.array(Image.open(os.path.join(HERE, "poster.webp")).convert("RGB"))
sh, sw = src.shape[:2]
people_a = np.array(Image.open(os.path.join(HERE, "people_full.png")).convert("RGBA"))[:, :, 3].astype(np.float32) / 255


def poly_mask(pts, feather=0):
    m = np.zeros((sh, sw), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
    m = m.astype(np.float32) / 255
    if feather:
        m = cv2.GaussianBlur(m, (0, 0), feather)
    return m


def rect_mask(x0, y0, x1, y1, feather=0):
    return poly_mask([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], feather)


def circle_mask(cx, cy, r, feather=0):
    m = np.zeros((sh, sw), np.uint8)
    cv2.circle(m, (cx, cy), r, 255, -1)
    m = m.astype(np.float32) / 255
    if feather:
        m = cv2.GaussianBlur(m, (0, 0), feather)
    return m


def push_pull(img, hole, valid=None):
    """Smooth hole fill: mask-weighted pyramid down, then fill back up (no streaks)."""
    w = (1 - (hole > 0.5)).astype(np.float32)
    if valid is not None:
        w = w * valid
    levels = []
    c = img.astype(np.float32) * w[..., None]
    while min(w.shape) > 4:
        levels.append((c, w))
        c = cv2.pyrDown(c)
        w = cv2.pyrDown(w)
    fill = c / np.maximum(w, 1e-6)[..., None]
    for c, w in reversed(levels):
        up = cv2.resize(fill, (w.shape[1], w.shape[0]), interpolation=cv2.INTER_LINEAR)
        up = cv2.GaussianBlur(up, (0, 0), 1.5)
        known = c / np.maximum(w, 1e-6)[..., None]
        a = np.clip(w * 4, 0, 1)[..., None]
        fill = known * a + up * (1 - a)
    return fill


def inpaint(img, mask, scale=4, radius=9, valid=None, feather=3):
    filled = push_pull(img, mask, valid)
    m = np.clip(cv2.GaussianBlur(mask.astype(np.float32), (0, 0), feather) * (1.6 if feather > 3 else 1), 0, 1)[..., None]
    return np.clip(img * (1 - m) + filled * m, 0, 255).astype(np.uint8)


def save(name, rgb, alpha=None):
    rgb = np.clip(rgb, 0, 255).astype(np.uint8)
    if alpha is None:
        im = Image.fromarray(rgb, "RGB")
    else:
        a = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
        im = Image.fromarray(np.dstack([rgb, a]), "RGBA")
    im = im.resize((W, H), Image.LANCZOS)
    path = os.path.join(OUT, name)
    if alpha is None:
        im.save(path.replace(".png", ".jpg"), quality=93)
    else:
        im.save(path, optimize=True)
    print("wrote", name)


# ---- regions -------------------------------------------------------------
FLAG_L = [(0, 108), (120, 126), (235, 176), (345, 250), (440, 325), (515, 400), (515, 560),
          (340, 700), (310, 905), (150, 890), (0, 875)]
FLAG_R = [(690, 470), (830, 378), (1000, 312), (1125, 255), (1125, 940), (900, 945), (815, 905),
          (780, 700), (690, 570)]
TITLE_BOX = (70, 870, 1060, 1262)
TEXT_BANDS = {  # sequential info lines (top, bottom), shared x range
    "info1": (1232, 1380),
    "info2": (1380, 1432),
    "info3": (1432, 1470),
    "info4": (1470, 1575),
}
TEXT_X = (200, 930)
LOGO = (948, 202, 172)

people_cut = people_a * (1 - np.clip((np.arange(sh)[:, None] - 880) / 40.0, 0, 1))  # fade under title
people_hole = cv2.dilate((people_cut > 0.05).astype(np.uint8), np.ones((15, 15), np.uint8)).astype(np.float32)

flag_l = poly_mask(FLAG_L)
flag_r = poly_mask(FLAG_R)
title_m = rect_mask(*TITLE_BOX)
text_m = rect_mask(TEXT_X[0], 1232, TEXT_X[1], 1575)
logo_m = circle_mask(*LOGO)

# ---- background plate: skyline / sky / river only --------------------------
remove = np.clip(people_hole + flag_l + flag_r + title_m + text_m + logo_m, 0, 1)
remove = cv2.dilate(remove, np.ones((21, 21), np.uint8))
plate = inpaint(src, remove, scale=4, radius=12, feather=22)
# Re-texture the large filled sky with procedural sunset cloud streaks (seeded).
rng = np.random.default_rng(226)


def fbm(h, w, octaves=6, base=(3, 2)):
    acc = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        gy, gx = base[1] * 2 ** o * 4 + 1, base[0] * 2 ** o + 1  # more rows than cols -> horizontal streaks
        g = rng.standard_normal((gy, gx)).astype(np.float32)
        acc += cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC) * amp
        tot += amp
        amp *= 0.55
    return acc / tot


n1 = fbm(sh, sw)
n2 = fbm(sh, sw, octaves=4, base=(2, 3))
clouds = np.clip(0.5 + 1.25 * n1, 0, 1)
clouds = clouds ** 1.6
rows = np.arange(sh)[:, None].astype(np.float32)
glow_band = np.exp(-((rows - 1450) / 520.0) ** 2)  # warmer, lit undersides toward the horizon
lum = 0.78 + 0.5 * clouds * (0.5 + 0.6 * glow_band) + 0.08 * n2
rim = np.clip((clouds - 0.55) * 3, 0, 1) * glow_band  # golden edges on cloud tops
textured = plate.astype(np.float32) * lum[..., None] + rim[..., None] * np.array([90, 50, 8], np.float32)
sky_zone = remove * np.clip((1545 - rows) / 60.0, 0, 1)
sz = np.clip(cv2.GaussianBlur(sky_zone, (0, 0), 18) * 1.3, 0, 1)[..., None]
plate = plate.astype(np.float32) * (1 - sz) + textured * sz
save("bg_plate.png", plate)

# Full original (exact final frame) and river strip for the water ripples.
save("poster_full.png", src.astype(np.float32))
water_a = np.clip((np.arange(sh)[:, None] - 1792) / 14.0, 0, 1) * np.ones((1, sw))
save("water.png", src.astype(np.float32), water_a)

# ---- flags: fill the area hidden by the artists with flag colour -----------
flag_fill = inpaint(src, people_hole * np.clip(flag_l + flag_r, 0, 1),
                    valid=np.clip(flag_l + flag_r, 0, 1) * (1 - title_m))
# Flags fade out just before the artists' silhouette (the artists cover that area
# later), so no smeared fill is ever visible while the flags are on screen alone.
near_people = cv2.GaussianBlur(cv2.dilate((people_cut > 0.05).astype(np.uint8), np.ones((31, 31), np.uint8)).astype(np.float32), (0, 0), 16)
fl_a = cv2.GaussianBlur(flag_l, (0, 0), 3) * (1 - title_m) * (1 - near_people)
fr_a = cv2.GaussianBlur(flag_r, (0, 0), 3) * (1 - title_m) * (1 - near_people)
save("flag_left.png", flag_fill, fl_a)
save("flag_right.png", flag_fill, fr_a)

# ---- artists ----------------------------------------------------------------
save("people.png", src.astype(np.float32), people_cut)

# ---- difference matte vs. a plate with only the graphic removed ------------
def diff_matte(region, lo=14, hi=48, plate_img=None):
    p = plate_img if plate_img is not None else inpaint(src, region, scale=4, radius=10)
    d = np.abs(src.astype(np.float32) - p.astype(np.float32)).max(axis=2)
    a = np.clip((d - lo) / (hi - lo), 0, 1)
    a = cv2.GaussianBlur(a, (0, 0), 1.2)
    return a


graphic_plate = inpaint(src, np.clip(title_m + text_m, 0, 1), scale=4, radius=12)

# Title: full box with soft edges + matte so letters stay crisp; split words by components.
tb = rect_mask(*TITLE_BOX, feather=10)
hsv = cv2.cvtColor(src, cv2.COLOR_RGB2HSV).astype(np.float32)
Hh, Ss, Vv = hsv[..., 0], hsv[..., 1] / 255, hsv[..., 2] / 255
letters = ((Vv > 0.72) & (Ss < 0.4)) | ((Vv > 0.86) & (Ss < 0.6)) | ((Ss > 0.8) & (Vv > 0.55) & ((Hh < 8) | (Hh > 100) | ((Hh > 18) & (Hh < 40))))
letters = (letters & (title_m > 0.5)).astype(np.uint8)
letters = cv2.morphologyEx(letters, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n0, lab0, st0, _ = cv2.connectedComponentsWithStats(letters, 8)
keep = np.zeros_like(letters)
for i in range(1, n0):
    if st0[i][4] > 120:
        keep[lab0 == i] = 1
body = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
ta = np.clip(cv2.GaussianBlur(body.astype(np.float32), (0, 0), 7) * 1.6, 0, 1) * tb
cv2.imwrite(os.path.join(HERE, "title_mask_debug.png"), (ta * 255).astype(np.uint8))
core = keep
n, lab, stats, cent = cv2.connectedComponentsWithStats(core, 8)
temp_core = np.zeros_like(core)
for i in range(1, n):
    x, y, w, h, area = stats[i]
    if area < 30:
        continue
    if cent[i][1] < 1098:
        temp_core[lab == i] = 1
# Words overlap vertically: give each pixel to the nearer word's letters.
rows = np.arange(sh)[:, None]
temp_core = ((keep > 0) & (rows < 1090)).astype(np.uint8)
euro_core = ((keep > 0) & (rows > 1132)).astype(np.uint8)
d_t = cv2.distanceTransform(1 - temp_core, cv2.DIST_L2, 5)
d_e = cv2.distanceTransform(1 - euro_core, cv2.DIST_L2, 5)
temp_w = np.clip((1108 - rows) / 22.0 + 0.5, 0, 1) * np.ones((1, sw))  # soft seam, hidden by the reveal glow
save("title_temperatura.png", src.astype(np.float32), ta * temp_w)
save("title_europea.png", src.astype(np.float32), ta * (1 - temp_w))
# Soft dark glow behind the title (gives the reveal its depth even before letters land).
glow = np.clip(cv2.GaussianBlur(ta, (0, 0), 18) * 1.4, 0, 1) * tb
save("title_shadow.png", np.zeros_like(src, np.float32) + np.array([20, 8, 2], np.float32), glow * 0.55)

# Info lines: each band keeps the original lettering + its dark backing plate.
ia = diff_matte(text_m, lo=10, hi=40, plate_img=graphic_plate)
for name, (y0, y1) in TEXT_BANDS.items():
    band = rect_mask(TEXT_X[0], y0, TEXT_X[1], y1)
    band = cv2.GaussianBlur(band, (0, 0), 0.8)
    edge = rect_mask(TEXT_X[0], 1232, TEXT_X[1], 1575, feather=14)
    save(f"{name}.png", src.astype(np.float32), ia * band * edge)

# ---- logo -----------------------------------------------------------------
la = circle_mask(LOGO[0], LOGO[1], LOGO[2] - 6, feather=7)
save("logo.png", src.astype(np.float32), la)
print("done")
