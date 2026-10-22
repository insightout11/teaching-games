/**
 * The coastline for a whole flight (Oct 2026), worked out once at take-off from the permanent land map (Natural Earth,
 * `coastlines.ts`). Every point is placed by how far along the route it is (km from the origin) and how far to the side
 * (km, right is positive). The scenery then reads the strip at the plane's real place on the route each frame, so the
 * coast scrolls smoothly and is never re-placed (re-placing it every 20 seconds made land appear and vanish).
 */

import { coastNear, landNear } from '@/lib/live-room/coastlines';
import { shoreKind, type ShoreKind } from '@/lib/live-room/coast-ahead';
import { greatCirclePoint, regionOf, terrainAt, type LatLng } from '@/lib/live-room/route-terrain';
import type { Terrain } from '@/components/live-room/flight/cockpit-ground';

export type StripPoint = [along: number, side: number];

/** Reproject a cached ground row through the same camera after moving forward by dz world units. */
export function coastCacheRow(y: number, horizon: number, focal: number, cachedHeight: number, height: number, dz: number): { y: number; scale: number } | null {
  if (y <= horizon) return null;
  const depth = cachedHeight * focal / (y - horizon), remaining = depth - dz;
  if (remaining <= 0) return null;
  return { y: horizon + height * focal / remaining, scale: depth / remaining };
}

/** Adjacent cached-image bands share a whole device-pixel edge, with no partially covered seams. */
export function coastCacheBand(from: number, to: number, pixel: number): [number, number] {
  return [Math.round(from / pixel) * pixel, Math.round(to / pixel) * pixel];
}

/** Clip a world-space (x, depth) polygon to the camera frustum before perspective division. */
export function clipCoastView(ring: Array<[number, number]>, base: number, near: number, far: number, halfSlope: number): Array<[number, number]> {
  let pts = ring;
  const planes = [
    ([, z]: [number, number]) => z - base - near,
    ([, z]: [number, number]) => base + far - z,
    ([x, z]: [number, number]) => (z - base) * halfSlope - x,
    ([x, z]: [number, number]) => (z - base) * halfSlope + x,
  ];
  for (const distance of planes) {
    const out: Array<[number, number]> = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const da = distance(a), db = distance(b);
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    pts = out;
  }
  return pts;
}

/** Clip only the original shore segment, never the artificial closing edges of a clipped land polygon. */
export function clipCoastLine(a: [number, number], b: [number, number], base: number, near: number, far: number, halfSlope: number): Array<[number, number]> {
  let lo = 0, hi = 1;
  const depths = (p: [number, number]) => [p[1] - base - near, base + far - p[1], (p[1] - base) * halfSlope - p[0], (p[1] - base) * halfSlope + p[0]];
  const da = depths(a), db = depths(b);
  for (let i = 0; i < da.length; i++) {
    if (da[i] < 0 && db[i] < 0) return [];
    if ((da[i] < 0) !== (db[i] < 0)) {
      const t = da[i] / (da[i] - db[i]);
      if (da[i] < 0) lo = Math.max(lo, t); else hi = Math.min(hi, t);
    }
  }
  if (lo > hi) return [];
  return [lo, hi].map((t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
}

export interface CoastStrip {
  /** The land as closed outlines, in route coordinates (km along, km to the right). */
  land: StripPoint[][];
  /** Coastlines (open lines), for the beaches. */
  lines: StripPoint[][];
  /** What each stretch of shore is like, per point of each line. */
  shores: ShoreKind[][];
  /** The route's length (km). */
  routeKm: number;
  /** What the land is like along the route (farmland, forest, desert...), on a grid: rows every GROUND_STEP_KM along
   *  (from -BAND_KM), columns every GROUND_SIDE_KM across (from -BAND_KM). Null where it is sea. So each piece of coast
   *  is painted as what is really there (it all borrowed the last land crossed: Egyptian desert as far as Italy). */
  ground: Array<Array<{ terrain: Terrain; region: string | null } | null>>;
}

export const GROUND_STEP_KM = 30;
export const GROUND_SIDE_KM = 70;

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

function distKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
/** The route's length (km), along the great circle. */
export function routeLengthKm(a: LatLng, b: LatLng): number { return distKm(a, b); }

function bearingRad(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return Math.atan2(y, x);
}

/** A point's place relative to the great circle from `a` heading `course`: km along it and km to its right. */
export function toRoute(a: LatLng, course: number, p: LatLng): StripPoint {
  const d13 = distKm(a, p) / R;
  if (d13 < 1e-9) return [0, 0];
  const diff = bearingRad(a, p) - course;
  const xt = Math.asin(Math.max(-1, Math.min(1, Math.sin(d13) * Math.sin(diff))));
  const at = Math.acos(Math.max(-1, Math.min(1, Math.cos(d13) / Math.cos(xt))));
  return [(Math.cos(diff) >= 0 ? at : -at) * R, xt * R];
}

/** The point `km` from `p` on bearing `brg` (radians). */
function offsetKm(p: LatLng, brg: number, km: number): LatLng {
  if (!km) return p;
  const d = km / R, la = rad(p.lat), lo = rad(p.lng);
  const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(brg));
  const lo2 = lo + Math.atan2(Math.sin(brg) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
  return { lat: (la2 * 180) / Math.PI, lng: ((((lo2 * 180) / Math.PI) + 540) % 360) - 180 };
}

/** What the land is at a place in route coordinates (km along, km to the right), from the strip's grid. */
export function groundAt(strip: CoastStrip, along: number, side: number): { terrain: Terrain; region: string | null } | null {
  const i = Math.round((along + BAND_KM) / GROUND_STEP_KM), j = Math.round((side + BAND_KM) / GROUND_SIDE_KM);
  const row = strip.ground[Math.max(0, Math.min(strip.ground.length - 1, i))];
  if (!row) return null;
  // the nearest land cell in the row (a coast cell may sample the sea)
  for (let k = 0; k < row.length; k++) {
    const a = row[j - k], b = row[j + k];
    if (a) return a;
    if (b) return b;
  }
  return null;
}

/** Continuous land-kind weights between grid centres. Sea samples borrow nearby land, never add blue patches. */
export function groundMixAt(strip: CoastStrip, along: number, side: number): Array<{ terrain: Terrain; region: string | null; weight: number }> {
  const u = (along + BAND_KM) / GROUND_STEP_KM, v = (side + BAND_KM) / GROUND_SIDE_KM;
  const i = Math.floor(u), j = Math.floor(v);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const fy = smooth(u - i), fx = smooth(v - j);
  const kinds = new Map<string, { terrain: Terrain; region: string | null; weight: number }>();
  let total = 0;
  for (let di = 0; di < 2; di++) for (let dj = 0; dj < 2; dj++) {
    const weight = (di ? fy : 1 - fy) * (dj ? fx : 1 - fx);
    if (weight < 1e-6) continue;
    const cell = groundAt(strip, (i + di) * GROUND_STEP_KM - BAND_KM, (j + dj) * GROUND_SIDE_KM - BAND_KM);
    if (!cell) continue;
    const key = `${cell.terrain}|${cell.region}`;
    const found = kinds.get(key);
    if (found) found.weight += weight; else kinds.set(key, { ...cell, weight });
    total += weight;
  }
  return Array.from(kinds.values(), (cell) => ({ ...cell, weight: cell.weight / total }));
}

/** Side band kept around the route (km): wide enough for the window's view at any height. */
const BAND_KM = 350;

/** Cut a closed outline to the band beside the route (|side| <= band), keeping it closed (Sutherland-Hodgman, two
 *  edges). Far-off coast is then never scanned: the whole Mediterranean's outlines, scanned for every row of the
 *  picture, froze the scenery. */
function clipToBand(ring: StripPoint[], band: number): StripPoint[] {
  const clip = (pts: StripPoint[], keep: (p: StripPoint) => boolean, cut: (a: StripPoint, b: StripPoint) => StripPoint) => {
    const out: StripPoint[] = [];
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i], prev = pts[(i + pts.length - 1) % pts.length];
      const inC = keep(cur), inP = keep(prev);
      if (inC) { if (!inP) out.push(cut(prev, cur)); out.push(cur); } else if (inP) out.push(cut(prev, cur));
    }
    return out;
  };
  const at = (a: StripPoint, b: StripPoint, d: number): StripPoint => { const t = (d - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, d]; };
  let r = clip(ring, (p) => p[1] <= band, (a, b) => at(a, b, band));
  r = clip(r, (p) => p[1] >= -band, (a, b) => at(a, b, -band));
  return r;
}

export async function coastStrip(origin: LatLng, destination: LatLng): Promise<CoastStrip> {
  const routeKm = distKm(origin, destination);
  const course = bearingRad(origin, destination);
  const mid = greatCirclePoint(origin, destination, 0.5);
  // one box around the whole route, so every outline is cut once (overlapping boxes would double the edges)
  const boxKm = routeKm / 2 + BAND_KM + 300;
  const [landRaw, lineRaw] = await Promise.all([landNear(mid, boxKm).catch(() => []), coastNear(mid, boxKm).catch(() => [])]);
  const near = (pts: StripPoint[]) => pts.some(([s, d]) => Math.abs(d) < BAND_KM && s > -BAND_KM && s < routeKm + BAND_KM);
  const conv = (ring: Array<[number, number]>) => ring.map(([lng, lat]) => toRoute(origin, course, { lat, lng }));
  const land = landRaw.map(conv).filter(near).map((r) => clipToBand(r, BAND_KM)).filter((r) => r.length > 3);
  const lines: StripPoint[][] = [];
  const shores: ShoreKind[][] = [];
  for (const raw of lineRaw) {
    if (raw.length < 3) continue;
    const pts = conv(raw);
    if (!near(pts)) continue;
    // keep only the runs inside the band beside the route (every far-off beach was drawn-tested each frame)
    let run: StripPoint[] = [], kinds: ShoreKind[] = [];
    const flush = () => { if (run.length > 1) { lines.push(run); shores.push(kinds); } run = []; kinds = []; };
    pts.forEach((pt, i) => {
      if (Math.abs(pt[1]) <= BAND_KM && pt[0] > -BAND_KM && pt[0] < routeKm + BAND_KM) { run.push(pt); kinds.push(shoreKind(raw[i][1], 0)); } else flush();
    });
    flush();
  }
  // the land along the route, sampled on a grid (a point at km along, km to the side)
  const ground: CoastStrip['ground'] = [];
  for (let along = -BAND_KM; along <= routeKm + BAND_KM; along += GROUND_STEP_KM) {
    const row: CoastStrip['ground'][number] = [];
    const t = Math.max(0, Math.min(1, along / Math.max(1, routeKm)));
    const onRoute = greatCirclePoint(origin, destination, t);
    const ahead = greatCirclePoint(origin, destination, Math.min(1, t + 0.001));
    const back = greatCirclePoint(origin, destination, Math.max(0, t - 0.001));
    const heading = bearingRad(back, ahead);
    const extra = along < 0 ? along : along > routeKm ? along - routeKm : 0; // before the origin or past the end
    for (let side = -BAND_KM; side <= BAND_KM; side += GROUND_SIDE_KM) {
      const p = offsetKm(offsetKm(onRoute, heading, extra), heading + Math.PI / 2, side);
      let cell: { terrain: Terrain; region: string | null } | null = null;
      try { const o = terrainAt(p); if (o.terrain !== 'ocean') cell = { terrain: o.terrain, region: regionOf(p) }; } catch { cell = null; }
      row.push(cell);
    }
    ground.push(row);
  }
  return { land, lines, shores, routeKm, ground };
}
