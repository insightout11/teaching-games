"""Netherlands detail lines from OpenStreetMap (ODbL): canals, drains, ditches, tree rows/hedges, road bridges.
1-degree tiles, base36 delta encoding like the river tiles (unit 0.0001 deg), simplified (Douglas-Peucker ~8 m)."""
import sys, os, json, math, collections
sys.path.insert(0, sys.argv[1])
import osmium
src, out = sys.argv[2], sys.argv[3]
KIND = {'canal': 1, 'drain': 2, 'ditch': 3, 'tree_row': 4, 'hedge': 4, 'bridge': 5}
UNIT = 0.0001
lines = collections.defaultdict(list); counts = collections.Counter()
def simplify(pts, tol):
    if len(pts) < 3: return pts
    keep = [False]*len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts)-1)]
    while st:
        a, b = st.pop(); (x1, y1), (x2, y2) = pts[a], pts[b]; dx, dy = x2-x1, y2-y1; L = math.hypot(dx, dy) or 1e-12
        best, bi = 0, -1
        for i in range(a+1, b):
            d = abs(dy*(pts[i][0]-x1) - dx*(pts[i][1]-y1)) / L
            if d > best: best, bi = d, i
        if best > tol: keep[bi] = True; st += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]
class H(osmium.SimpleHandler):
    def way(self, w):
        t = w.tags; k = None
        if t.get('waterway') in ('canal', 'drain', 'ditch'): k = KIND[t['waterway']]
        elif t.get('natural') in ('tree_row', 'hedge'): k = 4
        elif t.get('bridge') and t.get('bridge') != 'no' and t.get('highway') in ('motorway','trunk','primary','secondary','tertiary','unclassified','residential','motorway_link','trunk_link','primary_link','secondary_link','road'): k = 5
        if not k: return
        try: pts = [(n.lon, n.lat) for n in w.nodes]
        except osmium.InvalidLocationError: return
        if len(pts) < 2: return
        lat0 = pts[0][1]; c = math.cos(math.radians(lat0))
        p2 = [(x*c, y) for x, y in pts]; s = simplify(p2, 8/111320)
        pts = [(x/c, y) for x, y in s]
        mx = sum(p[0] for p in pts)/len(pts); my = sum(p[1] for p in pts)/len(pts)
        tile = f"N{int(math.floor(my)):02d}E{int(math.floor(mx)):03d}"
        lines[tile].append((k, pts)); counts[k] += 1
H().apply_file(src, locations=True, idx='flex_mem')
def b36(n):
    s = '-' if n < 0 else ''; n = abs(n); d = '0123456789abcdefghijklmnopqrstuvwxyz'; r = ''
    while True:
        r = d[n % 36] + r; n //= 36
        if not n: break
    return s + r
os.makedirs(out, exist_ok=True); man = {'v': 1, 'unit': UNIT, 'tileDeg': 1, 'kinds': {1:'canal',2:'drain',3:'ditch',4:'tree row or hedge',5:'road bridge'}, 'licence': 'ODbL 1.0, (c) OpenStreetMap contributors', 'tiles': {}}
for tile, ls in sorted(lines.items()):
    enc = []
    for k, pts in ls:
        x = y = 0; parts = []
        for lon, lat in pts:
            X, Y = round(lon/UNIT), round(lat/UNIT); parts += [b36(X-x), b36(Y-y)]; x, y = X, Y
        enc.append([k, '.'.join(parts)])
    path = os.path.join(out, tile + '.json'); json.dump({'v': 1, 'tile': tile, 'unit': UNIT, 'lines': enc}, open(path, 'w'), separators=(',', ':'))
    man['tiles'][tile] = {'lines': len(enc), 'bytes': os.path.getsize(path)}
json.dump(man, open(os.path.join(out, 'manifest.json'), 'w'), indent=1)
print(dict(counts)); print('tiles', len(man['tiles']), 'MB', round(sum(t['bytes'] for t in man['tiles'].values())/1e6, 1))
