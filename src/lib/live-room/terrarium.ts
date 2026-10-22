import { TERRAIN_SOURCE } from '@/data/world-flight/map-style';
import type { LatLng } from './route-terrain';

export const TERRARIUM_ZOOM = 9;
const SIZE = 256, CACHE_NAME = 'flight-terrarium-v1';
type Tile = Float32Array;
const tiles = new Map<string, Promise<Tile>>();

/** Web Mercator pixel centres, including continuous coordinates across the antimeridian. */
export function terrainPixel(p: LatLng, zoom = TERRARIUM_ZOOM): [number, number] {
  const lat = Math.max(-85.05112878, Math.min(85.05112878, p.lat)) * Math.PI / 180;
  const scale = SIZE * 2 ** zoom;
  return [(p.lng + 180) / 360 * scale - 0.5, Math.max(0, Math.min(scale - 1, (1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * scale - 0.5))];
}
export function decodeTerrarium(rgba: Uint8ClampedArray): Tile {
  const result = new Float32Array(rgba.length / 4);
  for (let i = 0; i < result.length; i++) result[i] = rgba[i * 4] * 256 + rgba[i * 4 + 1] + rgba[i * 4 + 2] / 256 - 32768;
  return result;
}
function tileKey(x: number, y: number): string {
  const n = 2 ** TERRARIUM_ZOOM;
  return `${((x % n) + n) % n}/${Math.max(0, Math.min(n - 1, y))}`;
}
function keyAt(x: number, y: number): string { return tileKey(Math.floor(x / SIZE), Math.floor(y / SIZE)); }

async function readTile(key: string, signal?: AbortSignal): Promise<Tile> {
  const [x, y] = key.split('/');
  const url = TERRAIN_SOURCE.tiles[0].replace('{z}', String(TERRARIUM_ZOOM)).replace('{x}', x).replace('{y}', y);
  // CacheStorage persists PNGs between flights/reloads. A denied storage quota still permits HTTP caching.
  const disk = await globalThis.caches?.open(CACHE_NAME).catch(() => undefined);
  let response = await disk?.match(url);
  if (!response) {
    signal?.throwIfAborted();
    response = await fetch(url, { cache: 'force-cache', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Terrain tile ${key}: ${response.status}`);
    await disk?.put(url, response.clone()).catch(() => undefined);
  }
  const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  try {
    // Dedicated CPU decoder: never read the canvases used as ground textures.
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Terrain PNG decoder unavailable');
    ctx.drawImage(bitmap, 0, 0);
    return decodeTerrarium(ctx.getImageData(0, 0, SIZE, SIZE).data);
  } finally { bitmap.close(); }
}
function cachedTile(key: string, signal?: AbortSignal): Promise<Tile> {
  const cached = tiles.get(key); if (cached) return cached;
  const pending = readTile(key, signal).catch(error => { tiles.delete(key); throw error; });
  tiles.set(key, pending);
  // Bound decoded RAM; a flight owns its loaded tile map until its heightfield is built.
  if (tiles.size > 128) tiles.delete(tiles.keys().next().value!);
  return pending;
}

/** Bilinear samples can straddle tile seams. Heights remain metres, including negative ocean depths. */
export function sampleTerrarium(loaded: ReadonlyMap<string, Tile>, p: LatLng): number | null {
  const [x, y] = terrainPixel(p), ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  let value = 0;
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const px = ix + dx, py = iy + dy, tile = loaded.get(keyAt(px, py));
    if (!tile) return null;
    const row = ((py % SIZE) + SIZE) % SIZE, col = ((px % SIZE) + SIZE) % SIZE;
    value += tile[row * SIZE + col] * (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy);
  }
  return value;
}

/**
 * Tiles needed for points sampled every `spacingKm`. A neighbouring tile is added only when a point lies close
 * enough to a tile edge that denser samples between points (or bilinear interpolation) can cross into it.
 * Padding every point by a whole tile downloaded ~50% more tiles than the route band needs.
 */
export function routeTileKeys(points: Iterable<LatLng>, spacingKm = 12): Set<string> {
  const keys = new Set<string>();
  for (const p of Array.from(points)) {
    const [x, y] = terrainPixel(p), tx = Math.floor(x / SIZE), ty = Math.floor(y / SIZE);
    const kmPerPixel = 40075 * Math.cos(Math.max(-85, Math.min(85, p.lat)) * Math.PI / 180) / (SIZE * 2 ** TERRARIUM_ZOOM);
    const margin = (spacingKm + 1) / Math.max(0.01, kmPerPixel) + 2;
    const fx = x - tx * SIZE, fy = y - ty * SIZE;
    const xs = [0, ...(fx < margin ? [-1] : []), ...(fx > SIZE - 1 - margin ? [1] : [])];
    const ys = [0, ...(fy < margin ? [-1] : []), ...(fy > SIZE - 1 - margin ? [1] : [])];
    for (const dy of ys) for (const dx of xs) keys.add(tileKey(tx + dx, ty + dy));
  }
  return keys;
}

/** Take-off only. A bounded six-request pool fills the route band before rendering uses synchronous samples. */
export async function loadTerrarium(points: Iterable<LatLng>, signal?: AbortSignal): Promise<{ sample: (p: LatLng) => number | null; count: number; failed: number }> {
  const keys = routeTileKeys(points);
  const pending = Array.from(keys), loaded = new Map<string, Tile>(); let next = 0, failed = 0;
  await Promise.all(Array.from({ length: Math.min(6, pending.length) }, async () => {
    while (next < pending.length && !signal?.aborted) {
      const key = pending[next++];
      try { loaded.set(key, await cachedTile(key, signal)); } catch { failed++; }
    }
  }));
  signal?.throwIfAborted();
  return { sample: p => sampleTerrarium(loaded, p), count: loaded.size, failed };
}
