/**
 * Real coastlines around the plane (terrain upgrade, Oct 2026): the land outlines (Natural Earth 1:10m, via Codex,
 * `src/lib/live-room/coastlines.ts`) in the cockpit's frame, km ahead and km to the right, so the scenery can paint
 * land and sea at their real places, bays and islands included.
 */

import { coastNear } from '@/lib/live-room/coastlines';
import { toFrame, type FramePoint } from '@/lib/live-room/waters-ahead';
import type { LatLng } from '@/lib/live-room/route-terrain';

export interface Coast {
  /** Land outlines (closed rings), in the cockpit frame. */
  rings: FramePoint[][];
  /** How far the data reaches from the plane (km): beyond it the scenery falls back to its usual ground. */
  reachKm: number;
}

/** The land outlines within `km` of the plane, in its frame. Empty rings = open sea or deep inland (no coast near). */
export async function coastAhead(at: LatLng, headingDeg: number, km = 175): Promise<Coast> {
  const rings = await coastNear(at, km).catch(() => [] as Awaited<ReturnType<typeof coastNear>>);
  return { rings: rings.map((ring) => ring.map((p) => toFrame(at, headingDeg, p))).filter((r) => r.length > 2), reachKm: km };
}
