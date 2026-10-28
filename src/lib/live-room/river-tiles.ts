/**
 * River lines for the flight terrain, from HydroRIVERS v1.0 (HydroSHEDS; Lehner & Grill 2013; free for commercial use
 * with attribution). Built by scripts/build-river-tiles.py into public/data/rivers/<tile>.json, 10-degree tiles.
 *
 * Kept: rivers with average flow >= 10 m3/s or catchment >= 3,000 km2 (dry-country rivers stay). Simplified to ~100 m.
 * widthClass from discharge: 1 < 50, 2 < 500, 3 < 5,000, 4 >= 5,000 m3/s. A cartographic class, not a measured width.
 * Points are [lng, lat] in degrees. Lines are not clipped to the query box; they come whole per tile.
 * Credit: "Rivers: HydroRIVERS (HydroSHEDS), Lehner & Grill 2013."
 */
export type RiverPoint = [number, number];
export interface RiverLine { widthClass: 1 | 2 | 3 | 4; points: RiverPoint[]; box: [number, number, number, number] }
interface RiverTileFile { v: number; tile: string; unit: number; lines: Array<[number, string]> }

export const RIVER_TILE_DEG = 10;
export const RIVER_CREDIT = 'Rivers: HydroRIVERS (HydroSHEDS), Lehner & Grill 2013.';

/** Tile key for a point, e.g. N30E130. Matches the build script. */
export function riverTileKey(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90) throw new RangeError('Invalid latitude/longitude');
  const x = ((lng + 180) % 360 + 360) % 360 - 180;
  const south = Math.min(80, Math.floor(lat / RIVER_TILE_DEG) * RIVER_TILE_DEG);
  const west = Math.min(170, Math.floor(x / RIVER_TILE_DEG) * RIVER_TILE_DEG);
  return `${south < 0 ? 'S' : 'N'}${String(Math.abs(south)).padStart(2, '0')}${west < 0 ? 'W' : 'E'}${String(Math.abs(west)).padStart(3, '0')}`;
}

/** Decode one tile file. Strict: a damaged file throws rather than drawing wrong geography. */
export function decodeRiverTile(file: RiverTileFile): RiverLine[] {
  if (file.v !== 1 || !(file.unit > 0) || !Array.isArray(file.lines)) throw new Error('Invalid river tile');
  return file.lines.map(([widthClass, encoded]) => {
    if (![1, 2, 3, 4].includes(widthClass)) throw new Error('Invalid river width class');
    const parts = encoded.split('.');
    if (parts.length < 4 || parts.length % 2) throw new Error('Invalid river line');
    const points: RiverPoint[] = [];
    const box: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
    let x = 0, y = 0;
    for (let i = 0; i < parts.length; i += 2) {
      x += parseInt(parts[i], 36); y += parseInt(parts[i + 1], 36);
      if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) throw new Error('Invalid river coordinate');
      const lng = x * file.unit, lat = y * file.unit;
      points.push([lng, lat]);
      box[0] = Math.min(box[0], lng); box[1] = Math.min(box[1], lat); box[2] = Math.max(box[2], lng); box[3] = Math.max(box[3], lat);
    }
    return { widthClass: widthClass as RiverLine['widthClass'], points, box };
  });
}

/** Keys of all tiles overlapping a [west, south, east, north] box (degrees, west may be < -180 or east > 180). */
export function riverTilesForBox([w, s, e, n]: [number, number, number, number]): string[] {
  const keys = new Set<string>();
  for (let lat = Math.floor(s / RIVER_TILE_DEG) * RIVER_TILE_DEG; lat <= n; lat += RIVER_TILE_DEG) {
    for (let lng = Math.floor(w / RIVER_TILE_DEG) * RIVER_TILE_DEG; lng <= e; lng += RIVER_TILE_DEG) {
      keys.add(riverTileKey(Math.max(-90, Math.min(89.999, lat)), lng));
    }
  }
  return Array.from(keys);
}

const cache = new Map<string, Promise<RiverLine[]>>();

/**
 * River lines overlapping a box. Tiles load once from /data/rivers and are cached; a missing tile (open ocean, no
 * rivers) returns no lines. Pass `fetcher` in tests.
 */
export async function riversInBox(box: [number, number, number, number], fetcher: typeof fetch = fetch, base = '/data/rivers'): Promise<RiverLine[]> {
  const tiles = await Promise.all(riverTilesForBox(box).map((key) => {
    let p = cache.get(key);
    if (!p) {
      p = fetcher(`${base}/${key}.json`).then(async (res) => (res.ok ? decodeRiverTile(await res.json()) : []));
      p.catch(() => cache.delete(key));
      cache.set(key, p);
    }
    return p.catch(() => [] as RiverLine[]);
  }));
  const [w, s, e, n] = box;
  return tiles.flat().filter((l) => l.box[2] >= w && l.box[0] <= e && l.box[3] >= s && l.box[1] <= n);
}

/** For tests. */
export function clearRiverTileCache() { cache.clear(); }
