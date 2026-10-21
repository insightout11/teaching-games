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

/** The nearest drawn landmark within `maxKm` of a city (Giza from Cairo, Fuji from Tokyo), and which side of the plane
 * it is on when flying `headingDeg`: for the scenic look after take-off. */
export function drawnLandmarkNear(at: LatLng, headingDeg: number, maxKm = 150, catalog: readonly Landmark[] = LANDMARK_CATALOG): { id: string; kind: WorldLandmarkKind; name: string; side: 'left' | 'right' } | null {
  let best: { id: string; kind: WorldLandmarkKind; name: string; side: 'left' | 'right' } | null = null, bestKm = maxKm;
  for (const l of catalog) {
    const kind = DRAWN[l.shape];
    if (!kind || kind === 'niagara') continue;
    const d = km(at, l);
    if (d > bestKm) continue;
    const rel = (((bearingDeg(at, l) - headingDeg) % 360) + 360) % 360;
    best = { id: l.id, kind, name: l.name, side: rel < 180 ? 'right' : 'left' };
    bestKm = d;
  }
  return best;
}

/** The drawing a catalogue landmark uses in the scenery, or null when it has none. */
export function drawnKindOf(id: string, catalog: readonly Landmark[] = LANDMARK_CATALOG): WorldLandmarkKind | null {
  const l = catalog.find((x) => x.id === id);
  return (l && DRAWN[l.shape]) || null;
}

/** Every drawn landmark within `maxKm` of a city, nearest first: the album's "still to find" frames. */
export function drawnLandmarksNear(at: LatLng, maxKm = 150, catalog: readonly Landmark[] = LANDMARK_CATALOG): Array<{ id: string; name: string; km: number }> {
  return catalog
    .filter((l) => DRAWN[l.shape] && DRAWN[l.shape] !== 'niagara')
    .map((l) => ({ id: l.id, name: l.name, km: Math.round(km(at, l)) }))
    .filter((l) => l.km <= maxKm)
    .sort((a, b) => a.km - b.km);
}

/** Every catalogue landmark in view from `at` (drawn or not): for the route report and, later, the album's hints. */
export function catalogueInView(at: LatLng, headingDeg: number, catalog: readonly Landmark[] = LANDMARK_CATALOG): Array<{ id: string; ahead: number; lateral: number }> {
  return inView(at, headingDeg, catalog, false).map(({ id, ahead, lateral }) => ({ id, ahead, lateral }));
}

/** Drawn landmarks in view from `at`, flying on `headingDeg`: how far ahead and to the side (km; right is positive). */
export function landmarksAhead(at: LatLng, headingDeg: number, catalog: readonly Landmark[] = LANDMARK_CATALOG): WorldLandmark[] {
  return inView(at, headingDeg, catalog, true) as WorldLandmark[];
}

function inView(at: LatLng, headingDeg: number, catalog: readonly Landmark[], drawnOnly: boolean): Array<WorldLandmark | { id: string; kind: null; ahead: number; lateral: number }> {
  const out: Array<WorldLandmark | { id: string; kind: null; ahead: number; lateral: number }> = [];
  for (const l of catalog) {
    const kind = DRAWN[l.shape] ?? null;
    if (drawnOnly && !kind) continue;
    const d = km(at, l);
    if (d > AHEAD_MAX_KM * 1.2) continue;
    const rel = ((bearingDeg(at, l) - headingDeg) * Math.PI) / 180;
    const ahead = d * Math.cos(rel), lateral = d * Math.sin(rel);
    if (ahead < AHEAD_MIN_KM || ahead > AHEAD_MAX_KM || Math.abs(lateral) > ahead * SIDE_SHARE + 6) continue;
    out.push(kind ? { id: l.id, kind, ahead, lateral } : { id: l.id, kind: null, ahead, lateral });
  }
  return out;
}
