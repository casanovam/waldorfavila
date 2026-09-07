"""Build the responsive photo set from assets/img/src/*.jpg.

Uniform 4:3 crop, one warm grade for every photo, Lanczos resize with a light
unsharp mask, progressive JPEG at 640/960/1280/1600, plus a 1200x630 share card.
Run with a Python that has Pillow:  python tools/process-images.py
"""
import os, sys
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
SRC = os.path.join(ROOT, 'src')
WIDTHS = [640, 960, 1280, 1600]
NAMES = ['waldorf-1', 'waldorf-2', 'waldorf-5', 'waldorf-6', 'waldorf-7']

def grade(im):
    # Consistent warm grade: gentle contrast, a little saturation, warmth via channel gain
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = ImageEnhance.Color(im).enhance(1.10)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.035 + 2)))
    b = b.point(lambda v: max(0, int(v * 0.965 - 2)))
    return Image.merge('RGB', (r, g, b))

def crop43(im):
    w, h = im.size
    target = 4 / 3
    if w / h > target:
        nw = int(h * target); x = (w - nw) // 2; return im.crop((x, 0, x + nw, h))
    nh = int(w / target); y = (h - nh) // 2; return im.crop((0, y, w, y + nh))

def save(im, path, q=82):
    im.save(path, 'JPEG', quality=q, optimize=True, progressive=True, subsampling=1)

for name in NAMES:
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, name + '.jpg'))).convert('RGB')
    im = grade(crop43(im))
    for w in WIDTHS:
        if w > im.size[0]: continue  # never upscale
        h = round(w * 3 / 4)
        out = im.resize((w, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.1, percent=70, threshold=2))
        save(out, os.path.join(ROOT, f'{name}-{w}.jpg'), q=74 if w <= 960 else 72)
    print(name, im.size)

# Share card 1200x630 from the outdoor photo
im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, 'waldorf-1.jpg'))).convert('RGB')
im = grade(im)
w, h = im.size; target = 1200 / 630
nh = int(w / target); y = max(0, (h - nh) // 2 - h // 12)
im = im.crop((0, y, w, y + nh)).resize((1200, 630), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.1, percent=60, threshold=2))
save(im, os.path.join(ROOT, 'share.jpg'), q=82)
print('share.jpg', im.size)
