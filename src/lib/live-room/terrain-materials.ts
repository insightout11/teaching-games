/** One-pixel reconstruction of material coverage, independent of height/silhouette filtering. */
interface MaterialCoverage { attributes: Float32Array; source: Uint8ClampedArray }
const cache = new WeakMap<Uint8ClampedArray, MaterialCoverage>();
const smooth = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
export function beginMaterialCoverage(pixels: Uint8ClampedArray): MaterialCoverage {
  let data = cache.get(pixels);
  if (!data) {
    data = { attributes: new Float32Array(pixels.length / 4 * 2), source: new Uint8ClampedArray(pixels.length) };
    cache.set(pixels, data);
  }
  data.attributes.fill(0);
  return data;
}
export function filterMaterialCoverage(data: MaterialCoverage, pixels: Uint8ClampedArray, depth: Float32Array, w: number, h: number): void {
  const { attributes: a, source } = data;
  source.set(pixels);
  const offsets = [-1, 1, -w, w];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const cell = y * w + x, p = cell * 4, m = cell * 2, alpha = source[p + 3] / 255;
    if (alpha < 0.95 || !Number.isFinite(depth[cell])) continue;
    const snow = a[m] / alpha, land = a[m + 1] / alpha;
    let dr = 0, dg = 0, db = 0;
    for (let direction = 0; direction < 4; direction++) {
      const other = cell + offsets[direction];
      const q = other * 4, n = other * 2, otherAlpha = source[q + 3] / 255;
      if (otherAlpha < 0.95 || !Number.isFinite(depth[other])) continue;
      // Do not join unrelated terrain layers or leak snow across the skyline/coast.
      const otherSnow = a[n] / otherAlpha, contrast = Math.abs(a[n + 1] / otherAlpha - land);
      if (otherSnow === snow && contrast <= 4) continue;
      const dz = Math.abs(depth[other] - depth[cell]) / Math.max(1, depth[cell]);
      if (dz >= 0.12) continue;
      const weight = (dz <= 0.04 ? 1 : 1 - smooth((dz - 0.04) / 0.08)) * 0.125;

      // Only albedo contrast activates land-colour reconstruction, not a sun-shadow edge.
      const snowEdge = Math.min(1, Math.abs(otherSnow - snow) * 8);
      const landWeight = Math.max(snowEdge, (contrast <= 4 ? 0 : smooth((contrast - 4) / 28)) * (1 - snow) * (1 - otherSnow)) * weight;
      dr += (source[q] - source[p]) * landWeight;
      dg += (source[q + 1] - source[p + 1]) * landWeight;
      db += (source[q + 2] - source[p + 2]) * landWeight;
    }
    // Reconstruct snow coverage rather than blurring snow/rock lighting or ridge geometry.
    pixels[p] = source[p] + dr;
    pixels[p + 1] = source[p + 1] + dg;
    pixels[p + 2] = source[p + 2] + db;
  }
}
