import sys; sys.path.insert(0, sys.argv[1])
import tifffile, numpy as np
from PIL import Image
src, out = sys.argv[2], sys.argv[3]
a = tifffile.imread(src)
print(a.shape, a.dtype)
u, c = np.unique(a, return_counts=True); print(list(zip(u.tolist(), c.tolist())))
# map to 0..5 (0 none, 1 very large ... 5 very small)
m = np.zeros(a.shape, np.uint8)
for v, k in [(3502,1),(3503,2),(3504,3),(3505,4),(3506,5)]: m[a == v] = k
# place into a global 0.05 deg grid by mode of non-zero classes
px = 0.0053898917; x0 = -159.8296926552; y0 = 69.9971760962
H, W = 3600, 7200  # 0.05 deg, lat 90..-90
counts = np.zeros((6, H, W), np.uint32)
rows, cols = m.shape
lat = y0 - (np.arange(rows) + 0.5) * px
lon = x0 + (np.arange(cols) + 0.5) * px
gi = np.clip(((90 - lat) / 0.05).astype(int), 0, H - 1)
gj = (((lon + 180) % 360) / 0.05).astype(int) % W
for r in range(rows):
    row = m[r]; nz = row > 0
    if not nz.any(): continue
    np.add.at(counts, (row[nz], gi[r], gj[nz]), 1)
best = counts[1:].argmax(0).astype(np.uint8) + 1
best[counts[1:].sum(0) == 0] = 0
Image.fromarray(best).save(out, optimize=True)
print('classes', np.unique(best, return_counts=True))
