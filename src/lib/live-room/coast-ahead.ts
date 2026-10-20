/**
 * Real coastlines around the plane (terrain upgrade, Oct 2026): the land outlines (Natural Earth 1:10m, via Codex,
 * `src/lib/live-room/coastlines.ts`) in the cockpit's frame, km ahead and km to the right, so the scenery can paint
 * land and sea at their real places, bays and islands included.
 */

import { coastNear } from '@/lib/live-room/coastlines';
import { elevationAt, loadElevation } from '@/lib/live-room/elevation';
import { toFrame, type FramePoint } from '@/lib/live-room/waters-ahead';
import type { LatLng } from '@/lib/live-room/route-terrain';

export interface Coast {
  /** Coastlines (open lines, land on their right), in the cockpit frame. */
  rings: FramePoint[][];
  /** How far the data reaches from the plane (km): beyond it the scenery falls back to its usual ground. */
  reachKm: number;
  /** What each stretch of shore is like, per point of each ring (see ShoreKind). */
  shores: ShoreKind[][];
}

/** 0 white tropical sand (clear turquoise shallows), 1 golden or tan sand, 2 rocky shore and cliffs (no beach). */
export type ShoreKind = 0 | 1 | 2;

/**
 * What a stretch of coast is like, from what we know: rocky where the land just inland is high (Norway, Chile, Big Sur)
 * or far north or south; white sand in the tropics; golden sand elsewhere. `inlandM` is the height a few km inland.
 */
export function shoreKind(lat: number, inlandM: number): ShoreKind {
  if (inlandM > 260 || Math.abs(lat) > 58) return 2;
  if (Math.abs(lat) < 26) return 0; // the tropics and a little beyond (the Florida Keys, the Bahamas)
  return 1;
}

/** The land outlines within `km` of the plane, in its frame. Empty rings = open sea or deep inland (no coast near). */
export async function coastAhead(at: LatLng, headingDeg: number, km = 175): Promise<Coast> {
  const [raw] = await Promise.all([coastNear(at, km).catch(() => [] as Awaited<ReturnType<typeof coastNear>>), loadElevation().catch(() => undefined)]);
  const rings = raw.filter((r) => r.length > 2);
  const inland = (ring: typeof rings[number], i: number) => {
    // the land lies to the right of the line: a point about 8 km that way
    const [x1, y1] = ring[Math.max(0, i - 1)], [x2, y2] = ring[Math.min(ring.length - 1, i + 1)];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    try { return elevationAt({ lng: ring[i][0] + (dy / len) * 0.08, lat: ring[i][1] - (dx / len) * 0.08 }); } catch { return 0; }
  };
  return {
    rings: rings.map((ring) => ring.map((p) => toFrame(at, headingDeg, p))),
    reachKm: km,
    shores: rings.map((ring) => ring.map((p, i) => shoreKind(p[1], inland(ring, i)))),
  };
}
