"""
Put the real LessonCaptain "L" on a plane's tail, the same way on every plane.

The plane pictures were generated with a hand-placed L baked in: different sizes, upright on a leaning fin,
sometimes sitting across a paint line. This script fixes one picture from a small recipe:

  1. erase:  the old mark is painted out with the fin's own colour (smoothly filled from the pixels around it);
  2. lines:  panel lines the old mark covered are drawn back;
  3. mark:   the real mark (LC_L_MARK in src/components/world-flight/arrival-scene/lc-brand.ts) is drawn at
             `at` (the bottom-left corner of the L), `height` pixels tall, leaning with the fin by `lean`
             (pixels the top moves sideways per pixel of height; negative = top leans left).

Recipes live in scripts/plane-tail-marks.json, keyed by file name. Run:

  python scripts/apply-plane-tail-mark.py <name> [--out DIR]     # one picture, e.g. lc-cadet
  python scripts/apply-plane-tail-mark.py --all [--out DIR]

Without --out the result is written to tmp/plane-tail-marks/ for review; nothing in public/ is touched unless
--out points there. Needs Pillow and numpy.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PLANES = ROOT / 'public' / 'assets' / 'flight' / 'planes'
RECIPES = Path(__file__).resolve().parent / 'plane-tail-marks.json'
# The L itself inside the 512 viewBox (the mark without its compass-star accent).
MARK_BOX = (92.0, 31.0, 426.0, 487.5)
SS = 4  # supersampling for clean edges


def mark_subpaths():
    src = (ROOT / 'src/components/world-flight/arrival-scene/lc-brand.ts').read_text(encoding='utf-8')
    d = re.search(r"LC_L_MARK\s*=\s*'([^']+)'", src, re.S).group(1)
    tokens = re.findall(r'[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?', d)
    subpaths, cur, pos, i, cmd = [], [], (0.0, 0.0), 0, None

    def num():
        nonlocal i
        v = float(tokens[i]); i += 1
        return v

    while i < len(tokens):
        if tokens[i] in 'MLHVCZ':
            cmd = tokens[i]; i += 1
            if cmd == 'Z':
                if cur: subpaths.append(cur)
                cur = []
                continue
        if cmd == 'M':
            if cur: subpaths.append(cur)
            pos = (num(), num()); cur = [pos]; cmd = 'L'
        elif cmd == 'L':
            pos = (num(), num()); cur.append(pos)
        elif cmd == 'H':
            pos = (num(), pos[1]); cur.append(pos)
        elif cmd == 'V':
            pos = (pos[0], num()); cur.append(pos)
        elif cmd == 'C':
            p1, p2, p3 = (num(), num()), (num(), num()), (num(), num())
            for t in np.linspace(0, 1, 25)[1:]:
                a, b, c, e = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3
                cur.append((a * pos[0] + b * p1[0] + c * p2[0] + e * p3[0], a * pos[1] + b * p1[1] + c * p2[1] + e * p3[1]))
            pos = p3
    if cur: subpaths.append(cur)
    return subpaths


def mark_mask(size, at, height, lean):
    """An 'L' alpha mask the size of the picture: bottom-left corner at `at`, `height` tall, sheared by `lean`."""
    x0, y0, x1, y1 = MARK_BOX
    scale = height / (y1 - y0)
    big = Image.new('1', (size[0] * SS, size[1] * SS), 0)
    for sub in mark_subpaths():
        layer = Image.new('1', big.size, 0)
        pts = []
        for (x, y) in sub:
            up = (y1 - y) * scale                      # pixels above the L's baseline
            px = at[0] + (x - x0) * scale + lean * up  # the lean moves higher points sideways
            pts.append((px * SS, (at[1] - up) * SS))
        ImageDraw.Draw(layer).polygon(pts, fill=1)
        big = ImageChops.logical_xor(big, layer)       # even-odd fill, as in the SVG
    return big.convert('L').resize(size, Image.LANCZOS)


def erase(rgb, alpha, spec):
    """Paint out the old mark inside `box`: a smooth fill grown inwards from the surrounding fin colour."""
    bx0, by0, bx1, by1 = spec['box']
    # Work on the box plus a margin, so the fill always has real fin pixels around it to grow from.
    pad = 10
    x0, y0, x1, y1 = max(0, bx0 - pad), max(0, by0 - pad), min(rgb.shape[1], bx1 + pad), min(rgb.shape[0], by1 + pad)
    region = rgb[y0:y1, x0:x1].astype(np.float32)
    opaque = alpha[y0:y1, x0:x1] > 200
    inside = np.zeros(region.shape[:2], bool)
    inside[by0 - y0:by1 - y0, bx0 - x0:bx1 - x0] = True
    if spec.get('poly'):
        # Only inside this outline (keeps the fill off a fin edge or a paint line that runs through the box).
        shape = Image.new('L', (x1 - x0, y1 - y0), 0)
        ImageDraw.Draw(shape).polygon([(px - x0, py - y0) for px, py in spec['poly']], fill=255)
        inside &= np.array(shape) > 0
    if spec.get('whole'):
        hole = inside.copy()
    else:
        # `ink`: the old mark's own colour (use on a tail where panel lines must survive). Otherwise everything
        # that is not fin-coloured (the old mark and its shadow).
        if spec.get('white'):
            # A white mark with a drop shadow on a shaded fin: the white pixels, grown far enough to take the shadow.
            hole = region.min(axis=2) > spec['white']
        elif spec.get('ink'):
            hole = np.linalg.norm(region - np.array(spec['ink'], np.float32), axis=2) < spec.get('tolerance', 110)
        else:
            hole = np.linalg.norm(region - np.array(spec['fin'], np.float32), axis=2) > spec.get('tolerance', 40)
        hole = np.array(Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * spec.get('grow', 2) + 1))) > 0
        hole &= inside
    # Pixels outside the plane carry no colour: fill them too, so they never bleed into the fin.
    hole |= ~opaque
    known = ~hole
    out = region.copy()
    out[hole] = region[known].mean(axis=0) if known.any() else spec.get('fin', [0, 0, 0])
    for _ in range(spec.get('passes', 600)):
        blur = np.empty_like(out)
        blur[1:-1, 1:-1] = (out[:-2, 1:-1] + out[2:, 1:-1] + out[1:-1, :-2] + out[1:-1, 2:]) / 4
        blur[0], blur[-1], blur[:, 0], blur[:, -1] = out[0], out[-1], out[:, 0], out[:, -1]
        out[hole] = blur[hole]
    rgb[y0:y1, x0:x1] = np.clip(out, 0, 255).astype(np.uint8)


def apply(name, out_dir):
    recipes = json.loads(RECIPES.read_text(encoding='utf-8'))
    spec = recipes[name]
    im = Image.open(PLANES / f'{name}.png').convert('RGBA')
    arr = np.array(im)
    rgb, alpha = arr[:, :, :3].copy(), arr[:, :, 3]
    for e in spec.get('erase', []):
        erase(rgb, alpha, e)
    base = Image.fromarray(np.dstack([rgb, alpha]), 'RGBA')
    # Panel lines the old mark covered.
    if spec.get('lines'):
        layer = Image.new('RGBA', (im.width * SS, im.height * SS), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        for ln in spec['lines']:
            d.line([(ln['from'][0] * SS, ln['from'][1] * SS), (ln['to'][0] * SS, ln['to'][1] * SS)], fill=tuple(ln['color']), width=int(ln.get('width', 1.5) * SS))
        base.alpha_composite(layer.resize(im.size, Image.LANCZOS))
    m = spec.get('mark')
    if m:
        mask = mark_mask(im.size, m['at'], m['height'], m.get('lean', 0))
        # Never paint outside the plane itself.
        mask = ImageChops.multiply(mask, Image.fromarray(alpha).point(lambda a: 255 if a > 200 else 0))
        paint = Image.new('RGBA', im.size, tuple(m['color']) + (255,))
        paint.putalpha(mask.point(lambda v: int(v * m.get('opacity', 1.0))))
        base.alpha_composite(paint)
    out_dir.mkdir(parents=True, exist_ok=True)
    base.save(out_dir / f'{name}.png')
    base.save(out_dir / f'{name}.webp', quality=92, method=6)
    print('wrote', out_dir / f'{name}.png')
    # The "-ground" picture is the same plane with its wheels down: same tail, same recipe.
    ground = PLANES / f'{name}-ground.png'
    if not name.endswith('-ground') and ground.exists() and f'{name}-ground' not in recipes:
        g = np.array(Image.open(ground).convert('RGBA'))
        if g.shape == arr.shape:
            ys, xs = np.nonzero(np.array(base)[:, :, :3] != arr[:, :, :3])[:2]
            if len(ys):
                y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
                if (g[y0:y1, x0:x1] == arr[y0:y1, x0:x1]).all():
                    g[y0:y1, x0:x1] = np.array(base)[y0:y1, x0:x1]
                    out_g = Image.fromarray(g, 'RGBA')
                    out_g.save(out_dir / f'{name}-ground.png')
                    out_g.save(out_dir / f'{name}-ground.webp', quality=92, method=6)
                    print('wrote', out_dir / f'{name}-ground.png')
                else:
                    print('SKIPPED ground variant (its tail differs):', name)


if __name__ == '__main__':
    args = sys.argv[1:]
    out = ROOT / 'tmp' / 'plane-tail-marks'
    if '--out' in args:
        out = Path(args[args.index('--out') + 1]); args = [a for i, a in enumerate(args) if a != '--out' and (i == 0 or sys.argv[1:][i - 1] != '--out')]
    names = list(json.loads(RECIPES.read_text(encoding='utf-8'))) if '--all' in args else [a for a in args if not a.startswith('--')]
    for n in names:
        apply(n, out)
