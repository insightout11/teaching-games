/** Simplified Natural Earth 1:10m land polygons, public domain. Lazy bundled data only.
 * Returns actual source shore edges clipped to the query box, never box-fill edges.
 * Artificial date-line/polar polygon closures are excluded. Includes inland-sea shores.
 */
import type { LatLng } from './route-terrain';
import { clipMapLine, clipMapRing, decodeMapLine, mapQueryBox, mapShape, mapShifts, type MapPoint, type MapShape } from './map-data-geometry';

let loaded: Promise<MapShape[]> | undefined;
function loadCoasts() {
  loaded ??= Promise.all([import('@/data/world/coastlines.json'), import('@/data/world/coastlines-2.json'), import('@/data/world/coastlines-3.json')]).then(modules =>
    modules.flatMap(module => (module.default.data as string[][]).map(rings => mapShape(rings.map(decodeMapLine)))));
  return loaded;
}
export async function coastNear(p: LatLng, km: number): Promise<MapPoint[][]> {
  const box = mapQueryBox(p, km);
  if (!km) return [];
  const shapes = await loadCoasts();
  return shapes.flatMap(shape => mapShifts(shape, box).flatMap(shift =>
    shape.rings.flatMap(ring => clipMapLine(ring, box, shift, true))));
}

/** The land itself within the box around `p`: closed outlines (cut to the box, so they stay closed), for telling land
 * from sea by counting crossings (inside after an odd number). Holes (inland seas) come as their own rings. */
export async function landNear(p: LatLng, km: number): Promise<MapPoint[][]> {
  const box = mapQueryBox(p, km);
  if (!km) return [];
  const shapes = await loadCoasts();
  return shapes.flatMap(shape => mapShifts(shape, box).flatMap(shift =>
    shape.rings.map(ring => clipMapRing(ring, box, shift)).filter(r => r.length > 3)));
}
