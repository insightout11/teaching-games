"""
Draws the land outlines for the home page's "what is in range" map from the same country data the Live Room map
uses (src/data/world/countries-110m.json). Output: public/assets/marketing/range-map-base.svg.

The projection here MUST match RANGE_MAP in src/components/homepage/range-map.ts (the page places its city pins
with the same numbers). Re-run after changing either:  python scripts/build-marketing-range-map.py
"""
import json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
L0, L1, B0, B1, K, MID_LAT = -100.0, 85.0, -8.0, 68.0, 6.0, 38.0
cx = math.cos(math.radians(MID_LAT))
W, H = (L1 - L0) * K * cx, (B1 - B0) * K
pt = lambda lng, lat: ((lng - L0) * K * cx, (B1 - lat) * K)

paths = []
for _name, rings in json.loads((ROOT / 'src/data/world/countries-110m.json').read_text(encoding='utf-8')):
    for ring in rings:
        for r in (ring if isinstance(ring[0][0], list) else [ring]):
            if any(L0 - 8 <= p[0] <= L1 + 8 and B0 - 8 <= p[1] <= B1 + 8 for p in r):
                paths.append('M' + 'L'.join('%d %d' % pt(*p) for p in r) + 'Z')
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}"><rect width="{W:.0f}" height="{H:.0f}" fill="#0a1728"/>'
       f'<path d="{"".join(paths)}" fill="#1b3556" stroke="#33557f" stroke-width="1"/></svg>')
out = ROOT / 'public/assets/marketing/range-map-base.svg'
out.write_text(svg, encoding='utf-8')
print(out, len(svg), f'{W:.0f}x{H:.0f}')
