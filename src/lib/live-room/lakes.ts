/** Natural Earth 1:50m lakes plus the land layer's Caspian hole; public domain.
 * Lazy bundled data. Polygon rings use even-odd filling; returned fills are box-clipped.
 */
import type { LatLng } from './route-terrain';
import { clipMapRing, decodeMapLine, mapQueryBox, mapShape, mapShifts, type MapPoint, type MapShape } from './map-data-geometry';

export interface LakePolygon { name: string; rings: MapPoint[][] }
let loaded: Promise<Array<{ name: string; shape: MapShape }>> | undefined;
function loadLakes() {
  loaded ??= import('@/data/world/lakes.json').then(module => {
    const data = module.default.data as unknown as Array<[string, string[][]]>;
    return data.flatMap(([name, polygons]) => polygons.map(rings => ({ name, shape: mapShape(rings.map(decodeMapLine)) })));
  });
  return loaded;
}
export async function lakesNear(p: LatLng, km: number): Promise<LakePolygon[]> {
  const box = mapQueryBox(p, km);
  if (!km) return [];
  const lakes = await loadLakes();
  return lakes.flatMap(lake => mapShifts(lake.shape, box).flatMap(shift => {
    const outer = clipMapRing(lake.shape.rings[0], box, shift);
    if (!outer.length) return [];
    const holes = lake.shape.rings.slice(1).map(ring => clipMapRing(ring, box, shift)).filter(ring => ring.length);
    return [{ name: lake.name, rings: [outer, ...holes] }];
  }));
}
