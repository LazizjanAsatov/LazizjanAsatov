# Prepares the inputs the SVG build needs: the picture sampled into a brightness grid, and the name
# converted to outlines so it looks the same on every device. Writes prep.json next to this file.
#
#   python tools/prep.py <picture> [crop as x0,y0,x1,y1 fractions of the picture]
#
# Needs Pillow and fontTools, and Consolas Bold (C:/Windows/Fonts/consolab.ttf; pass --font to use another).
import json
import os
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageFilter, ImageOps

args = sys.argv[1:]
font_file = "C:/Windows/Fonts/consolab.ttf"
if "--font" in args:
    i = args.index("--font")
    font_file = args[i + 1]
    del args[i : i + 2]
if not args:
    raise SystemExit("usage: python tools/prep.py <picture> [x0,y0,x1,y1] [--font file.ttf]")
picture = args[0]
crop = [float(v) for v in args[1].split(",")] if len(args) > 1 else [0, 0, 1, 1]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prep.json")


def grid(n):
    im = Image.open(picture).convert("L")
    w, h = im.size
    im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    im = im.filter(ImageFilter.UnsharpMask(radius=3, percent=140, threshold=2))
    im = ImageOps.autocontrast(im, cutoff=2)
    im = im.resize((n, n), Image.LANCZOS)
    px = list(im.getdata())
    return [[int(px[y * n + x]) for x in range(n)] for y in range(n)]


def outline(text, size=100.0, tracking=4.0):
    font = TTFont(font_file)
    scale = size / font["head"].unitsPerEm
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    pen = SVGPathPen(glyphs, ntos=lambda v: ("%.2f" % v).rstrip("0").rstrip("."))
    x = 0.0
    for ch in text:
        name = cmap.get(ord(ch))
        if name is None:
            raise SystemExit("font %s has no glyph for %r" % (font_file, ch))
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, 0)))
        x += glyphs[name].width * scale + tracking
    return {"d": pen.getCommands(), "w": round(x - tracking, 2)}


data = {
    "grid": {"100": grid(100)},
    "outline": {"mono": {t: outline(t) for t in ("LAZIZJON", "ASATOV")}},
}
with open(out, "w", encoding="utf-8") as f:
    json.dump(data, f)
print("wrote", out)
