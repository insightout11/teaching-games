"""Coast type tiles: share of tidal flat (GTF30 2020) and mangrove (GMW v2 2016) per 0.01 deg cell, in 10 deg PNG tiles.
R = tidal flat share 0..255, G = mangrove share 0..255. Tile names like the river tiles (N20E050 = south-west corner)."""
import sys, os, glob, zipfile, io, json, hashlib
sys.path.insert(0, sys.argv[1])
import tifffile, numpy as np
from PIL import Image
raw, out = sys.argv[2], sys.argv[3]
CELL = 0.01; N = 1000
tiles = {}
def key(s, w): return f"{'S' if s<0 else 'N'}{abs(s):02d}{'W' if w<0 else 'E'}{abs(w):03d}"
def add(arr, px, lon0, lat0, ch):
    r, c = np.nonzero(arr == 1)
    if not len(r): return 0
    lat = lat0 - (r + 0.5) * px; lon = lon0 + (c + 0.5) * px
    gy = np.floor(lat / CELL).astype(np.int64); gx = np.floor(lon / CELL).astype(np.int64)
    w = (px / CELL) ** 2
    ty = np.floor(gy / N).astype(np.int64); tx = np.floor(gx / N).astype(np.int64)
    for (a, b) in set(zip(ty.tolist(), tx.tolist())):
        m = (ty == a) & (tx == b)
        k = key(int(a * 10), int(b * 10))
        t = tiles.setdefault(k, np.zeros((2, N, N), np.float32))
        yy = N - 1 - (gy[m] - a * N); xx = gx[m] - b * N
        np.add.at(t[ch], (yy, xx), w)
    return len(r)
def tags(p):
    s = p.tags['ModelPixelScaleTag'].value; t = p.tags['ModelTiepointTag'].value
    return s[0], t[3], t[4]
n = 0
for z in sorted(glob.glob(os.path.join(raw, 'gtf30', '*.zip'))):
    with zipfile.ZipFile(z) as zf:
        for name in zf.namelist():
            if not name.endswith('.tif'): continue
            with tifffile.TiffFile(io.BytesIO(zf.read(name))) as tf:
                p = tf.pages[0]; px, lon0, lat0 = tags(p); n += add(p.asarray(), px, lon0, lat0, 0)
    print('gtf', os.path.basename(z), n, flush=True)
m = 0
for f in sorted(glob.glob(os.path.join(raw, 'gmw', 'x', 'gmw2016v2.0', '*.tif'))):
    with tifffile.TiffFile(f) as tf:
        p = tf.pages[0]; px, lon0, lat0 = tags(p); m += add(p.asarray(), px, lon0, lat0, 1)
print('gmw px', m, flush=True)
os.makedirs(out, exist_ok=True)
manifest = {'v': 1, 'cellDeg': CELL, 'tileDeg': 10, 'channels': {'r': 'tidal flat share (GTF30 2020)', 'g': 'mangrove share (GMW v2 2016)'}, 'tiles': {}}
for k, t in sorted(tiles.items()):
    v = np.clip(t * 255, 0, 255).astype(np.uint8)
    if v.max() < 13: continue  # skip tiles with nothing above ~5%
    img = np.zeros((N, N, 3), np.uint8); img[..., 0] = v[0]; img[..., 1] = v[1]
    path = os.path.join(out, k + '.png'); Image.fromarray(img).save(path, optimize=True)
    manifest['tiles'][k] = {'tidalCells': int((v[0] >= 26).sum()), 'mangroveCells': int((v[1] >= 26).sum()), 'bytes': os.path.getsize(path)}
json.dump(manifest, open(os.path.join(out, 'manifest.json'), 'w'), indent=1)
print('tiles', len(manifest['tiles']), sum(x['bytes'] for x in manifest['tiles'].values()))
