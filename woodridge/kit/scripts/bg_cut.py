"""Background for a host card (cutaway, intro or outro): paper grid, brand header, 760px square slot at (80,180).
Usage: python3 bg_cut.py "<right header>" "<kicker>" "<statement>" out.png
Fonts: /tmp/tw/fonts/IBMPlexSans-VF.ttf (google/fonts ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf), IBMPlexMono-Regular.ttf."""
import sys, textwrap
import os
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402
B = brand.load()

RIGHT, KICK, TEXT, OUT = sys.argv[1:5]
W, H = 1920, 1080
PAPER, INK, INK3, SIGNAL = brand.rgb("paper"), brand.rgb("ink"), brand.rgb("ink3"), brand.rgb("signal")
F = os.path.expanduser(os.environ.get("FONT_DIR", "~/.fonts")) + "/"


def sans(size, weight="Regular"):
    f = ImageFont.truetype(F + B["fonts"]["sans_variable_ttf"], size); f.set_variation_by_name(weight); return f


def mono(size):
    return ImageFont.truetype(F + B["fonts"]["mono_ttf"], size)


img = Image.new("RGB", (W, H), PAPER)
grid = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(grid); a = int(255 * 0.16 * 0.35)
for x in range(0, W, 48): g.line([(x, 0), (x, H)], fill=(26, 26, 23, a))
for y in range(0, H, 48): g.line([(0, y), (W, y)], fill=(26, 26, 23, a))
img.paste(grid, (0, 0), grid)
d = ImageDraw.Draw(img)
d.rectangle([80, 56, 98, 74], fill=SIGNAL)
d.text((112, 52), f'{B["brand_name"].upper()} · {B["series_label"].upper()}', font=mono(22), fill=INK3)
rw = d.textlength(RIGHT, font=mono(22)); d.text((W - 80 - rw, 52), RIGHT, font=mono(22), fill=INK3)
d.rectangle([80, 96, W - 80, 97], fill=INK)
CX, CY, CW, CH = 80, 180, 760, 760
d.rectangle([CX + 12, CY + 12, CX + CW + 12, CY + CH + 12], fill=(232, 229, 222))
d.rectangle([CX - 2, CY - 2, CX + CW + 1, CY + CH + 1], fill=INK)
x = 940
d.text((x, 200), KICK, font=mono(26), fill=SIGNAL)
d.rectangle([x, 250, x + 60, 253], fill=SIGNAL)
y = 300
for line in textwrap.wrap(TEXT, 22):
    d.text((x, y), line, font=sans(76, "SemiBold"), fill=INK); y += 92
d.text((x, 860), B["host_name"], font=sans(36, "SemiBold"), fill=INK)
d.text((x, 906), B["brand_name"], font=mono(22), fill=INK3)
d.text((80, 970), B["host_disclosure"], font=mono(20), fill=INK3)
img.save(OUT)
