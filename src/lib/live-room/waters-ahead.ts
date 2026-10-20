/**
 * Rivers and lakes around the plane (terrain upgrade, Oct 2026), turned into the cockpit's own frame: km ahead of the
 * plane and km to its side (right positive), so the scenery can lay them on the ground at their real places. Data:
 * Natural Earth rivers and lakes (Codex, `src/lib/live-room/rivers.ts`, `lakes.ts`).
 */

import { riversNear } from '@/lib/live-room/rivers';
import { lakesNear } from '@/lib/live-room/lakes';
import type { MapPoint } from '@/lib/live-room/map-data-geometry';
import type { LatLng } from '@/lib/live-room/route-terrain';

/** A point in the cockpit's frame: [km ahead, km to the right]. */
export type FramePoint = [number, number];
export interface FrameRiver { id: string; name: string; widthClass: 1 | 2 | 3; points: FramePoint[] }
export interface FrameLake { id: string; name: string; rings: FramePoint[][] }
export interface Waters { rivers: FrameRiver[]; lakes: FrameLake[] }

const R = 6371, rad = Math.PI / 180;

/** [lng, lat] → [km ahead, km right] from `at`, flying on `headingDeg` (a local flat frame; fine for ~200 km). */
export function toFrame(at: LatLng, headingDeg: number, [lng, lat]: MapPoint): FramePoint {
  let dLng = lng - at.lng;
  if (dLng > 180) dLng -= 360;
  if (dLng < -180) dLng += 360;
  const east = dLng * rad * R * Math.cos(at.lat * rad), north = (lat - at.lat) * rad * R;
  const h = headingDeg * rad;
  return [north * Math.cos(h) + east * Math.sin(h), east * Math.cos(h) - north * Math.sin(h)];
}

/** Rivers and lakes within `km` of the plane, in its frame; only what could be in view (not far behind). */
export async function watersAhead(at: LatLng, headingDeg: number, km = 170): Promise<Waters> {
  const [rivers, lakes] = await Promise.all([riversNear(at, km).catch(() => []), lakesNear(at, km).catch(() => [])]);
  const keep = (pts: FramePoint[]) => pts.some(([a]) => a > -10);
  return {
    rivers: rivers
      .map((r, i) => ({ id: `${r.name}#${i}#${r.points.length}`, name: r.name, widthClass: r.widthClass, points: r.points.map((p) => toFrame(at, headingDeg, p)) }))
      .filter((r) => r.points.length > 1 && keep(r.points)),
    lakes: lakes
      .map((l, i) => ({ id: `${l.name}#${i}`, name: l.name, rings: l.rings.map((ring) => ring.map((p) => toFrame(at, headingDeg, p))) }))
      .filter((l) => l.rings.some(keep)),
  };
}
