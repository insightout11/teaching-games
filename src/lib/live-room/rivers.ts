/** Natural Earth 1:50m rivers, public domain. Bundled data only; lazy on first query.
 * Each returned line is clipped to a km-radius bounding box, not a distance circle.
 * Width is a cartographic scale-rank class, not a measured channel width.
 */
import type { LatLng } from './route-terrain';
import { clipMapLine, decodeMapLine, mapQueryBox, mapShape, mapShifts, type MapPoint, type MapShape } from './map-data-geometry';

export interface RiverSegment { name: string; widthClass: 1 | 2 | 3; points: MapPoint[] }
interface River { name: string; widthClass: 1 | 2 | 3; shape: MapShape }
let loaded: Promise<River[]> | undefined;
function loadRivers(): Promise<River[]> {
  loaded ??= import('@/data/world/rivers.json').then(module => {
    const data = module.default.data as unknown as Array<[string, 1 | 2 | 3, string[]]>;
    return data.flatMap(([name, widthClass, lines]) => lines.map(line => ({ name, widthClass, shape: mapShape([decodeMapLine(line)]) })));
  });
  return loaded;
}
export async function riversNear(p: LatLng, km: number): Promise<RiverSegment[]> {
  const box = mapQueryBox(p, km);
  if (!km) return [];
  const rivers = await loadRivers();
  return rivers.flatMap(river => mapShifts(river.shape, box).flatMap(shift =>
    clipMapLine(river.shape.rings[0], box, shift).map(points => ({ name: river.name, widthClass: river.widthClass, points }))));
}
