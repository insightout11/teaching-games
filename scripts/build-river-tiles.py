"""Build river tiles for the flight terrain from HydroRIVERS v1.0.

Source: HydroRIVERS v1.0 (HydroSHEDS), global shapefile HydroRIVERS_v10_shp.zip from
https://data.hydrosheds.org/file/HydroRIVERS/HydroRIVERS_v10_shp.zip
Licence: free for scientific, educational and commercial use under the HydroSHEDS licence, with attribution.
Citation: Lehner, B., Grill, G. (2013). Global river hydrography and network routing: baseline data and new approaches
to study the world's large river systems. Hydrological Processes, 27(15): 2171-2186. doi:10.1002/hyp.9740
Credit line: "Rivers: HydroRIVERS (HydroSHEDS), Lehner & Grill 2013."

What it keeps: rivers you can see from a plane, i.e. long-term average discharge >= 10 m3/s, OR upstream catchment
>= 3,000 km2 (keeps dry-country rivers such as the Draa that carry little water but cut big green valleys).
Width class from discharge: 1 < 50, 2 < 500, 3 < 5,000, 4 >= 5,000 m3/s. This is a cartographic class, not a
measured channel width.

Steps: filter reaches; join consecutive reaches of the same class into longer lines (via NEXT_DOWN); simplify
(Douglas-Peucker, ~100 m); split into 10-degree tiles; encode as signed base36 deltas in units of 0.0005 degrees.

Run: python scripts/build-river-tiles.py <path to HydroRIVERS_v10.shp> <output dir>
Needs pyshp (pip install pyshp) on the machine that builds; the app needs nothing.
"""
import json, math, os, sys, collections, hashlib, time

import shapefile  # pyshp

MIN_FLOW = 10.0       # m3/s
MIN_UPLAND = 3000.0   # km2
TOLERANCE_DEG = 0.001 # Douglas-Peucker tolerance (~110 m at the equator, scaled by latitude for longitude)
UNIT = 0.0005         # encoding unit in degrees (~55 m)
TILE = 10


def width_class(q):
    return 1 if q < 50 else 2 if q < 500 else 3 if q < 5000 else 4


def dp(points, tol):
    """Douglas-Peucker on (lng, lat) with longitude scaled by cos(lat) so the tolerance is roughly metric."""
    if len(points) < 3:
        return points
    lat0 = math.radians(sum(p[1] for p in points) / len(points))
    k = math.cos(lat0)
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a][0] * k, points[a][1]
        bx, by = points[b][0] * k, points[b][1]
        dx, dy = bx - ax, by - ay
        n2 = dx * dx + dy * dy
        best, idx = -1.0, -1
        for i in range(a + 1, b):
            px, py = points[i][0] * k, points[i][1]
            if n2 == 0:
                d = math.hypot(px - ax, py - ay)
            else:
                t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / n2))
                d = math.hypot(px - (ax + t * dx), py - (ay + t * dy))
            if d > best:
                best, idx = d, i
        if best > tol:
            keep[idx] = True
            stack.append((a, idx))
            stack.append((idx, b))
    return [p for p, kp in zip(points, keep) if kp]


def tile_key(lng, lat):
    south = min(80, int(math.floor(lat / TILE)) * TILE)
    west = int(math.floor(lng / TILE)) * TILE
    if west >= 180:
        west = 170
    return f"{'S' if south < 0 else 'N'}{abs(south):02d}{'W' if west < 0 else 'E'}{abs(west):03d}"


def b36(n):
    if n == 0:
        return '0'
    s, neg, n = '', n < 0, abs(n)
    while n:
        n, r = divmod(n, 36)
        s = '0123456789abcdefghijklmnopqrstuvwxyz'[r] + s
    return ('-' if neg else '') + s


def encode(points):
    out, px, py = [], 0, 0
    for lng, lat in points:
        x, y = round(lng / UNIT), round(lat / UNIT)
        out += [b36(x - px), b36(y - py)]
        px, py = x, y
    return '.'.join(out)


def main(shp, out_dir):
    t0 = time.time()
    r = shapefile.Reader(shp)
    # Pass 1: attributes; keep visible reaches.
    keep = {}
    for i, rec in enumerate(r.iterRecords(fields=['HYRIV_ID', 'NEXT_DOWN', 'DIS_AV_CMS', 'UPLAND_SKM'])):
        d = rec.as_dict()
        if d['DIS_AV_CMS'] >= MIN_FLOW or d['UPLAND_SKM'] >= MIN_UPLAND:
            keep[d['HYRIV_ID']] = (i, d['NEXT_DOWN'], width_class(d['DIS_AV_CMS']))
    print('kept reaches', len(keep), round(time.time() - t0), 's', flush=True)

    # In-degree among kept reaches of the same class: chains break at confluences and class changes.
    indeg = collections.Counter()
    for rid, (_, nxt, cls) in keep.items():
        if nxt in keep and keep[nxt][2] == cls:
            indeg[nxt] += 1
    starts = [rid for rid in keep if indeg[rid] != 1]

    # Pass 2: geometry, chained downstream.
    used = set()
    tiles = collections.defaultdict(list)
    src_points = out_points = lines = 0

    def geom(rid):
        return [tuple(p) for p in r.shape(keep[rid][0]).points]

    def emit(points, cls):
        nonlocal out_points, lines
        pts = dp(points, TOLERANCE_DEG)
        # split into tiles, sharing the boundary point
        cur, key = [pts[0]], tile_key(*pts[0])
        for p in pts[1:]:
            k = tile_key(*p)
            cur.append(p)
            if k != key:
                if len(cur) >= 2:
                    tiles[key].append((cls, cur))
                cur, key = [cur[-2], p], k
        if len(cur) >= 2:
            tiles[key].append((cls, cur))
        out_points += len(pts)
        lines += 1

    for n, start in enumerate(starts):
        if start in used:
            continue
        cls = keep[start][2]
        rid, pts = start, []
        while rid in keep and rid not in used and keep[rid][2] == cls and (rid == start or indeg[rid] == 1):
            used.add(rid)
            g = geom(rid)
            src_points += len(g)
            pts += g if not pts else g[1:]
            rid = keep[rid][1]
        if len(pts) >= 2:
            emit(pts, cls)
        if n % 50000 == 0:
            print('chains', n, '/', len(starts), round(time.time() - t0), 's', flush=True)
    # anything left (loops)
    for rid in keep:
        if rid not in used:
            used.add(rid)
            g = geom(rid)
            if len(g) >= 2:
                emit(g, keep[rid][2])

    os.makedirs(out_dir, exist_ok=True)
    manifest = {}
    for key, items in sorted(tiles.items()):
        body = {'v': 1, 'tile': key, 'unit': UNIT, 'lines': [[cls, encode(p)] for cls, p in items]}
        text = json.dumps(body, separators=(',', ':'))
        with open(os.path.join(out_dir, key + '.json'), 'w', encoding='utf-8', newline='') as f:
            f.write(text)
        manifest[key] = {'lines': len(items), 'bytes': len(text.encode())}
    meta = {
        'source': 'HydroRIVERS v1.0 (HydroSHEDS), HydroRIVERS_v10_shp.zip',
        'url': 'https://data.hydrosheds.org/file/HydroRIVERS/HydroRIVERS_v10_shp.zip',
        'licence': 'HydroSHEDS licence: free for scientific, educational and commercial use, with attribution',
        'citation': 'Lehner, B., Grill, G. (2013). Hydrological Processes, 27(15): 2171-2186. doi:10.1002/hyp.9740',
        'credit': 'Rivers: HydroRIVERS (HydroSHEDS), Lehner & Grill 2013.',
        'filter': {'minFlowCms': MIN_FLOW, 'minUplandKm2': MIN_UPLAND},
        'widthClass': {'1': '< 50 m3/s', '2': '50-500', '3': '500-5000', '4': '>= 5000'},
        'toleranceDeg': TOLERANCE_DEG, 'unitDeg': UNIT, 'tileDeg': TILE,
        'encoding': 'per line: [widthClass, "dx.dy.dx.dy..."], signed base36 deltas in units of unitDeg, [lng, lat]',
        'keptReaches': len(keep), 'lines': lines, 'sourcePoints': src_points, 'outputPoints': out_points,
        'tiles': manifest,
    }
    with open(os.path.join(out_dir, 'manifest.json'), 'w', encoding='utf-8', newline='') as f:
        json.dump(meta, f, indent=1)
    total = sum(m['bytes'] for m in manifest.values())
    print('tiles', len(manifest), 'bytes', total, 'lines', lines, 'points', src_points, '->', out_points, round(time.time() - t0), 's')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
