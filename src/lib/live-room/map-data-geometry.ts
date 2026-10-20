/** Shared static-map geometry. Coordinates are [longitude, latitude], in degrees.
 * Query results use continuous longitude nearest the query, so Fiji may exceed 180.
 * No remote fetches; only the separate layer modules import their bundled JSON.
 */
import type { LatLng } from './route-terrain';

export type MapPoint = [number, number];
export type MapBox = [number, number, number, number];
export interface MapShape { rings: MapPoint[][]; box: MapBox }
const KM_PER_DEGREE = Math.PI * 6371 / 180;

export function mapPosition(p: LatLng): LatLng {
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng) || Math.abs(p.lat) > 90) throw new RangeError('Expected finite coordinates, latitude in [-90, 90]');
  return { lat: p.lat, lng: ((p.lng + 180) % 360 + 360) % 360 - 180 };
}
/** Bounding box, not a geodesic circle. At a pole the box spans all longitudes. */
export function mapQueryBox(p: LatLng, km: number): MapBox {
  const centre = mapPosition(p);
  if (!Number.isFinite(km) || km < 0) throw new RangeError('Expected a finite nonnegative radius');
  const dy = Math.min(180, km / KM_PER_DEGREE);
  const dx = Math.abs(centre.lat) + dy >= 90 ? 180 : Math.min(180, dy / Math.cos(centre.lat * Math.PI / 180));
  return [centre.lng - dx, Math.max(-90, centre.lat - dy), centre.lng + dx, Math.min(90, centre.lat + dy)];
}
export function decodeMapLine(encoded: string): MapPoint[] {
  const parts = encoded.split('.');
  if (parts.length < 4 || parts.length % 2 || parts.some(value => !/^-?[0-9a-z]+$/.test(value))) throw new Error('Invalid map line');
  const points: MapPoint[] = [];
  let x = 0, y = 0;
  for (let i = 0; i < parts.length; i += 2) {
    x += parseInt(parts[i], 36); y += parseInt(parts[i + 1], 36);
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || Math.abs(y) > 9000) throw new Error('Invalid map coordinate');
    points.push([x / 100, y / 100]);
  }
  return points;
}
export function mapShape(rings: MapPoint[][]): MapShape {
  const box: MapBox = [Infinity, Infinity, -Infinity, -Infinity];
  rings[0].forEach(([x, y]) => { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); });
  const anchor = (box[0] + box[2]) / 2;
  return { box, rings: rings.map((ring, i) => {
    const shift = i ? 360 * Math.round((anchor - ring[0][0]) / 360) : 0;
    return shift ? ring.map(([x, y]) => [x + shift, y] as MapPoint) : ring;
  }) };
}
/** Candidate translations include both seam sides and very large polar shapes. */
export function mapShifts(shape: MapShape, box: MapBox): number[] {
  if (shape.box[3] < box[1] || shape.box[1] > box[3]) return [];
  const nearest = 360 * Math.round(((box[0] + box[2]) / 2 - (shape.box[0] + shape.box[2]) / 2) / 360);
  return [nearest - 360, nearest, nearest + 360].filter(shift => shape.box[2] + shift >= box[0] && shape.box[0] + shift <= box[2]);
}
const same = (a: MapPoint, b: MapPoint) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;

/** Liang-Barsky clipping retains crossing edges even when both endpoints are outside. */
export function clipMapLine(points: MapPoint[], box: MapBox, shift = 0, coastline = false): MapPoint[][] {
  const result: MapPoint[][] = [];
  let current: MapPoint[] = [];
  const finish = () => { if (current.length > 1) result.push(current); current = []; };
  for (let i = 1; i < points.length; i++) {
    const a: MapPoint = [points[i - 1][0] + shift, points[i - 1][1]], b: MapPoint = [points[i][0] + shift, points[i][1]];
    // Natural Earth land polygons are cut at the date line and the Antarctic pole.
    // Those boundary closures are not real shores. Retain all other source edges.
    const seam = Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(Math.abs(((a[0] + 180) % 360 + 360) % 360 - 180) - 180) < 0.001;
    if (Math.abs(b[0] - a[0]) > 180 || (coastline && (seam || (a[1] === -90 && b[1] === -90)))) { finish(); continue; }
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const p = [-dx, dx, -dy, dy], q = [a[0] - box[0], box[2] - a[0], a[1] - box[1], box[3] - a[1]];
    let low = 0, high = 1, visible = true;
    for (let side = 0; side < 4; side++) {
      if (p[side] === 0) { if (q[side] < 0) visible = false; }
      else if (p[side] < 0) low = Math.max(low, q[side] / p[side]);
      else high = Math.min(high, q[side] / p[side]);
    }
    if (!visible || low >= high) { finish(); continue; }
    const start: MapPoint = [a[0] + low * dx, a[1] + low * dy], end: MapPoint = [a[0] + high * dx, a[1] + high * dy];
    if (current.length && !same(current[current.length - 1], start)) finish();
    if (!current.length) current.push(start);
    current.push(end);
  }
  finish();
  return result;
}

/** Sutherland-Hodgman for fill rings; clipping edges belong to the fill, not shores. */
export function clipMapRing(ring: MapPoint[], box: MapBox, shift: number): MapPoint[] {
  let points = ring.map(([x, y]) => [x + shift, y] as MapPoint);
  if (points.length > 1 && same(points[0], points[points.length - 1])) points.pop();
  for (let side = 0; side < 4; side++) {
    const axis = side % 2, bound = side < 2 ? box[axis] : box[axis + 2];
    const inside = (p: MapPoint) => side < 2 ? p[axis] >= bound : p[axis] <= bound;
    const next: MapPoint[] = [];
    points.forEach((b, i) => {
      const a = points[(i + points.length - 1) % points.length], ain = inside(a), bin = inside(b);
      if (ain !== bin) {
        const t = (bound - a[axis]) / (b[axis] - a[axis]);
        next.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
      if (bin) next.push(b);
    });
    points = next;
  }
  if (points.length < 3) return [];
  const area = points.reduce((sum, p, i) => { const n = points[(i + 1) % points.length]; return sum + p[0] * n[1] - n[0] * p[1]; }, 0);
  if (Math.abs(area) < 1e-12) return [];
  return [...points, points[0]];
}
