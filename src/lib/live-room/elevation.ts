/** NOAA ETOPO1 ice surface, public domain. 0.5-degree sampled heights, metres.
 * Call await loadElevation() once before synchronous elevationAt(). Bundled import only.
 * Sea/depressions = 0; bilinear interpolation smooths coarse samples, not peak heights.
 */
import type { LatLng } from './route-terrain';
import { mapPosition } from './map-data-geometry';

const WIDTH = 720, HEIGHT = 360, RESOLUTION = 0.5;
let grid: Float32Array | undefined;
let loaded: Promise<void> | undefined;

export function decodeElevation(encoded: string): Float32Array {
  const bytes = atob(encoded), result = new Float32Array(WIDTH * HEIGHT);
  let cell = 0;
  for (let i = 0; i < bytes.length; i++) {
    const code = bytes.charCodeAt(i);
    if (code) {
      if (cell >= result.length) throw new Error('Elevation overflow');
      result[cell++] = (code / 255) ** 2 * 9000;
    } else {
      if (i + 2 >= bytes.length) throw new Error('Truncated elevation run');
      const count = bytes.charCodeAt(++i) * 256 + bytes.charCodeAt(++i);
      if (!count || cell + count > result.length) throw new Error('Invalid elevation run');
      cell += count;
    }
  }
  if (cell !== result.length) throw new Error('Invalid elevation dimensions');
  return result;
}
export function loadElevation(): Promise<void> {
  loaded ??= import('@/data/world/elevation.json').then(module => { grid = decodeElevation(module.default.data); });
  return loaded;
}
export function elevationAt(p: LatLng): number {
  const { lat, lng } = mapPosition(p);
  if (!grid) throw new Error('Call await loadElevation() before elevationAt()');
  const x = (lng + 179.75) / RESOLUTION;
  const y = Math.min(HEIGHT - 1, Math.max(0, (89.75 - lat) / RESOLUTION));
  const floorX = Math.floor(x), y0 = Math.floor(y), y1 = Math.min(HEIGHT - 1, y0 + 1);
  const x0 = ((floorX % WIDTH) + WIDTH) % WIDTH, x1 = (x0 + 1) % WIDTH;
  const fx = x - floorX, fy = y - y0;
  const top = grid[y0 * WIDTH + x0] * (1 - fx) + grid[y0 * WIDTH + x1] * fx;
  const bottom = grid[y1 * WIDTH + x0] * (1 - fx) + grid[y1 * WIDTH + x1] * fx;
  return top * (1 - fy) + bottom * fy;
}
