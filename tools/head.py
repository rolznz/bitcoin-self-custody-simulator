#!/usr/bin/env python3
"""Cuts a photo of a face into a head for a character: an oval with a white edge, like a sticker, on a transparent
background. See docs/CHARACTERS.md.

    python3 tools/head.py <photo> <id> <cx> <cy> <rx> <ry>

cx, cy is the middle of the head in the photo and rx, ry is half its width and half its height, all in pixels of the
photo. The oval may run past the edges of the photo. Writes src/img/head-<id>.webp and prints its size.
Needs Pillow (pip install pillow).
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter

HEIGHT = 168   # of the finished picture, in pixels
EDGE = 0.045   # the white edge, as a share of the head's height
SMOOTH = 4     # the oval is drawn this many times larger and shrunk, for a smooth edge

if len(sys.argv) != 7:
    sys.exit(__doc__)
photo, name = sys.argv[1], sys.argv[2]
cx, cy, rx, ry = map(int, sys.argv[3:])

src = Image.open(photo).convert('RGB')
pad = int(ry * 2 * EDGE) + 2
# Put the photo on a larger white sheet first, so the oval can reach past the photo's edges.
sheet = Image.new('RGB', (src.width + 4 * rx, src.height + 4 * ry), (255, 255, 255))
sheet.paste(src, (2 * rx, 2 * ry))
crop = sheet.crop((cx + rx - pad, cy + ry - pad, cx + 3 * rx + pad, cy + 3 * ry + pad))
scale = HEIGHT / crop.height
width = round(crop.width * scale)
crop = crop.resize((width, HEIGHT), Image.LANCZOS)
if scale > 0.65:  # a small photo, enlarged or barely shrunk: sharpen it a little
    crop = crop.filter(ImageFilter.UnsharpMask(radius=1.5, percent=60))


def oval(inset):
    mask = Image.new('L', (width * SMOOTH, HEIGHT * SMOOTH), 0)
    box = (inset * SMOOTH, inset * SMOOTH, (width - inset) * SMOOTH - 1, (HEIGHT - inset) * SMOOTH - 1)
    ImageDraw.Draw(mask).ellipse(box, fill=255)
    return mask.resize((width, HEIGHT), Image.LANCZOS)


outer, inner = oval(0.5), oval(pad * scale)
out = Image.new('RGBA', (width, HEIGHT), (255, 255, 255, 0))
out.paste(Image.new('RGB', (width, HEIGHT), (255, 255, 255)), (0, 0), outer)
out.paste(crop, (0, 0), inner)
out.putalpha(outer)
dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'img', f'head-{name}.webp')
out.save(dest, 'WEBP', quality=82, method=6)
print(f'src/img/head-{name}.webp: {width} wide, {HEIGHT} tall, {os.path.getsize(dest)} bytes')
