/**
 * The coastline for a whole flight (Oct 2026), worked out once at take-off from the permanent land map (Natural Earth,
 * `coastlines.ts`). Every point is placed by how far along the route it is (km from the origin) and how far to the side
 * (km, right is positive). The scenery then reads the strip at the plane's real place on the route each frame, so the
 * coast scrolls smoothly and is never re-placed (re-placing it every 20 seconds made land appear and vanish).
 */

import { coastNear, landNear } from '@/lib/live-room/coastlines';
import { shoreKind, type ShoreKind } from '@/lib/live-room/coast-ahead';
import { greatCirclePoint, type LatLng } from '@/lib/live-room/route-terrain';

export type StripPoint = [along: number, side: number];

export interface CoastStrip {
  /** The land as closed outlines, in route coordinates (km along, km to the right). */
  land: StripPoint[][];
  /** Coastlines (open lines), for the beaches. */
  lines: StripPoint[][];
  /** What each stretch of shore is like, per point of each line. */
  shores: ShoreKind[][];
  /** The route's length (km). */
  routeKm: number;
}

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
  return { land, lines, shores, routeKm };
}
