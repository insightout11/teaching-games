/** Sparse coverage for internal occluding ridges. Heights, depth samples and materials stay intact. */
export interface TerrainEdges {
  width: number; height: number; count: number;
  near: Float32Array; y: Float32Array; gap: Float32Array;
  front: Uint8ClampedArray; back: Uint8ClampedArray; cells: Uint32Array;
  previous: Float32Array;
}
const cache = new WeakMap<Uint8ClampedArray, TerrainEdges>();
export function beginTerrainEdges(pixels: Uint8ClampedArray, width: number, height: number): TerrainEdges {
  let edges = cache.get(pixels);
  if (!edges || edges.width !== width || edges.height !== height) {
    const n = width * height;
    edges = { width, height, count: 0, near: new Float32Array(n), y: new Float32Array(n), gap: new Float32Array(n),
      front: new Uint8ClampedArray(n * 3), back: new Uint8ClampedArray(n * 3), cells: new Uint32Array(n), previous: new Float32Array(width) };
    cache.set(pixels, edges);
  }
  edges.count = 0; edges.near.fill(0); edges.previous.fill(0);
  return edges;
}
export function recordTerrainEdge(e: TerrainEdges, x: number, y: number, near: number, far: number,
  fr: number, fg: number, fb: number, br: number, bg: number, bb: number): void {
  const row = Math.floor(y); if (row < 1 || row >= e.height - 1) return;
  const cell = row * e.width + x, gap = far - near;
  if (e.near[cell] !== 0 && e.gap[cell] >= gap) return;
  if (e.near[cell] === 0) e.cells[e.count++] = cell;
  e.near[cell] = near; e.y[cell] = y; e.gap[cell] = gap;
  const p = cell * 3;
  e.front[p] = fr; e.front[p + 1] = fg; e.front[p + 2] = fb;
  e.back[p] = br; e.back[p + 1] = bg; e.back[p + 2] = bb;
}
function adjacent(e: TerrainEdges, x: number, row: number, y: number, near: number): number {
  let score = Infinity, result = y;
  for (let r = Math.max(1, row - 3); r <= Math.min(e.height - 2, row + 3); r++) {
    const cell = r * e.width + x, z = e.near[cell]; if (!z) continue;
    const distance = Math.abs(z - near) / near; if (distance > 0.15) continue;
    const cost = distance * 12 + Math.abs(e.y[cell] - y) * 0.08;
    if (cost < score) { score = cost; result = e.y[cell]; }
  }
  return result;
}
// Integral of clamp(y, 0, 1), for exact coverage under a straight edge across a half-column.
const integral = (y: number) => y <= 0 ? 0 : y >= 1 ? y - 0.5 : y * y * 0.5;
function above(a: number, b: number, row: number): number {
  if (Math.abs(b - a) < 0.00001) return Math.max(0, Math.min(1, a - row));
  return (integral(b - row) - integral(a - row)) / (b - a);
}
export function coverTerrainEdges(e: TerrainEdges, pixels: Uint8ClampedArray): void {
  for (let n = 0; n < e.count; n++) {
    const cell = e.cells[n], x = cell % e.width;
    if (x === 0 || x === e.width - 1) continue;
    const row = Math.floor(cell / e.width), y = e.y[cell], near = e.near[cell];
    const left = (y + adjacent(e, x - 1, row, y, near)) * 0.5;
    const right = (y + adjacent(e, x + 1, row, y, near)) * 0.5;
    if (Math.abs(left - y) + Math.abs(right - y) < 0.05) continue;
    const color = cell * 3;
    for (let r = Math.max(0, Math.floor(Math.min(left, y, right))); r < Math.min(e.height, Math.ceil(Math.max(left, y, right))); r++) {
      const p = (r * e.width + x) * 4;
      // The sky/coast retain their own coverage. This pass only joins two opaque terrain layers.
      if (pixels[p + 3] < 250) continue;
      const front = Math.max(0, Math.min(1, 1 - (above(left, y, r) + above(y, right, r)) * 0.5));
      const centre = Math.max(0, Math.min(1, r + 1 - y));
      const correction = Math.max(-0.35, Math.min(0.35, front - centre));
      // Correct lateral coverage only; retain the existing pixel's material/vertical interpolation.
      for (let c = 0; c < 3; c++) pixels[p + c] += (e.front[color + c] - e.back[color + c]) * correction;
    }
  }
}
