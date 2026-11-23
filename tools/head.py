#!/usr/bin/env python3
"""Cuts a photo of a face into a head for a character: an oval with a white edge, like a sticker, on a transparent
background. See docs/CHARACTERS.md.

    python3 tools/head.py <photo> <id> <cx> <cy> <rx> <ry> [<helmet>]

cx, cy is the middle of the head in the photo and rx, ry is half its width and half its height, all in pixels of the
photo. The oval may run past the edges of the photo. Writes src/img/head-<id>.webp and prints its size.
helmet, if given, draws an army helmet over the top of the head, covering a hat or the hair. It is how far down the
photo the helmet comes, in pixels: usually just above the eyebrows. The picture gets a little wider.
Needs Pillow (pip install pillow).
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter

HEIGHT = 168   # of the finished picture, in pixels
EDGE = 0.045   # the white edge, as a share of the head's height
SMOOTH = 4     # the oval is drawn this many times larger and shrunk, for a smooth edge

if len(sys.argv) not in (7, 8):
    sys.exit(__doc__)
photo, name = sys.argv[1], sys.argv[2]
cx, cy, rx, ry = map(int, sys.argv[3:7])
helmet = int(sys.argv[7]) if len(sys.argv) == 8 else None

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

if helmet is not None:
    # A drawn army helmet over whatever is on the head: a dome and a rim, wider than the oval, with the same white edge.
    side = round(HEIGHT * 0.07)                      # how far the helmet sticks out past the oval on each side
    edge = pad * scale                               # the white edge, as wide as the oval's
    low = (helmet - (cy - ry - pad)) * scale         # the helmet's lower edge, in the finished picture
    full, mid, rim = width + 2 * side, width / 2 + side, HEIGHT * 0.065
    reach = full / 2 - edge - 1                      # half the width of the rim

    def shape(grow, dome=True, brim=True):
        mask = Image.new('L', (full * SMOOTH, HEIGHT * SMOOTH), 0)
        d, s = ImageDraw.Draw(mask), SMOOTH
        if dome:
            d.chord([(mid - reach + 3 - grow) * s, (edge - grow) * s, (mid + reach - 3 + grow) * s,
                     (2 * (low - rim) - edge + grow) * s], 180, 360, fill=255)
            d.rectangle([(mid - reach + 3 - grow) * s, (low - rim - 1) * s, (mid + reach - 3 + grow) * s, (low - rim / 2) * s], fill=255)
        if brim:
            d.rounded_rectangle([(mid - reach - grow) * s, (low - rim - grow) * s, (mid + reach + grow) * s, (low + grow) * s],
                                radius=(rim / 2 + grow) * s, fill=255)
        return mask.resize((full, HEIGHT), Image.LANCZOS)

    wide = Image.new('RGBA', (full, HEIGHT), (255, 255, 255, 0))
    white, shell = shape(edge), shape(0)
    wide.paste(Image.new('RGBA', (full, HEIGHT), (255, 255, 255, 255)), (0, 0), white)
    wide.alpha_composite(out, (side, 0))             # the face goes over the helmet's white edge, right up to the rim
    wide.paste(Image.new('RGBA', (full, HEIGHT), (104, 118, 68, 255)), (0, 0), shell)
    # a lighter patch where the light falls, kept inside the dome
    shine = Image.new('L', (full, HEIGHT), 0)
    ImageDraw.Draw(shine).ellipse([mid - reach * 0.62, edge + (low - edge) * 0.16, mid - reach * 0.08, edge + (low - edge) * 0.5], fill=110)
    shine = Image.composite(shine.filter(ImageFilter.GaussianBlur(4)), Image.new('L', (full, HEIGHT), 0), shape(-3, brim=False))
    wide.paste(Image.new('RGBA', (full, HEIGHT), (150, 164, 104, 255)), (0, 0), shine)
    wide.paste(Image.new('RGBA', (full, HEIGHT), (74, 86, 48, 255)), (0, 0), shape(0, dome=False))
    out, width = wide, full
dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'img', f'head-{name}.webp')
out.save(dest, 'WEBP', quality=82, method=6)
print(f'src/img/head-{name}.webp: {width} wide, {HEIGHT} tall, {os.path.getsize(dest)} bytes')
