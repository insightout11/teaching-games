/**
 * Landmark Quest step 2: which real landmarks are in view ahead of the plane, and where they stand relative to it,
 * so the cockpit can put them in the scenery at their real distance and side. Only landmarks that have a drawing.
 */

import { LANDMARK_CATALOG, type Landmark } from '@/data/world/landmark-catalog';
import type { WorldLandmark, WorldLandmarkKind } from '@/components/live-room/flight/world-landmarks';
import { bearingDeg } from '@/lib/live-room/sun';
import type { LatLng } from '@/lib/live-room/route-terrain';

/** Catalogue shapes that are drawn in the scenery today (the rest keep the "Look outside" card only). */
const DRAWN: Partial<Record<Landmark['shape'], WorldLandmarkKind>> = {
  fuji: 'fuji', pyramids: 'pyramids', everest: 'everest', matterhorn: 'matterhorn', kilimanjaro: 'kilimanjaro', niagara: 'niagara',
  volcano: 'volcano',
};

/** The cockpit's view: as far ahead as the horizon (about 150 km), and narrowing nearer the plane. */
const AHEAD_MIN_KM = 8;
const AHEAD_MAX_KM = 145;
const SIDE_SHARE = 0.5; // visible sideways out to about half the distance ahead (the windscreen's field of view)

function km(a: LatLng, b: LatLng): number {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Drawn landmarks in view from `at`, flying on `headingDeg`: how far ahead and to the side (km; right is positive). */
export function landmarksAhead(at: LatLng, headingDeg: number, catalog: readonly Landmark[] = LANDMARK_CATALOG): WorldLandmark[] {
  const out: WorldLandmark[] = [];
  for (const l of catalog) {
    const kind = DRAWN[l.shape];
    if (!kind) continue;
    const d = km(at, l);
    if (d > AHEAD_MAX_KM * 1.2) continue;
    const rel = ((bearingDeg(at, l) - headingDeg) * Math.PI) / 180;
    const ahead = d * Math.cos(rel), lateral = d * Math.sin(rel);
    if (ahead < AHEAD_MIN_KM || ahead > AHEAD_MAX_KM || Math.abs(lateral) > ahead * SIDE_SHARE + 6) continue;
    out.push({ id: l.id, kind, ahead, lateral });
  }
  return out;
}
