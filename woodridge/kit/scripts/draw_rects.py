#!/usr/bin/env python3
"""Draw Ken Burns target rects on full-size images so you can check them before rendering.

Usage: draw_rects.py <image> <x,y,w,h> [<x,y,w,h> ...] [--out check.jpg]
Draws each rect (in the image's own pixels) plus a 120 px grid with labels. Look at the output: the rect
must sit exactly on the detail the narration names (the hinge, the label, the moulding, the product).
"""
import sys
from PIL import Image, ImageDraw

args = sys.argv[1:]
out = "check.jpg"
if "--out" in args:
    i = args.index("--out"); out = args[i + 1]; del args[i:i + 2]
im = Image.open(args[0]).convert("RGB")
d = ImageDraw.Draw(im)
for x in range(0, im.width, 120):
    d.line([(x, 0), (x, im.height)], fill=(255, 255, 255), width=1); d.text((x + 3, 3), str(x), fill=(255, 255, 0))
for y in range(0, im.height, 120):
    d.line([(0, y), (im.width, y)], fill=(255, 255, 255), width=1); d.text((3, y + 3), str(y), fill=(255, 255, 0))
for n, r in enumerate(args[1:]):
    x, y, w, h = [int(v) for v in r.split(",")]
    d.rectangle([x, y, x + w, y + h], outline=(240, 80, 15), width=max(4, im.width // 300))
    d.text((x + 8, y + 8), f"#{n}", fill=(240, 80, 15))
print(f"{args[0]}: {im.width}x{im.height} -> {out}")
im.save(out, quality=88)
