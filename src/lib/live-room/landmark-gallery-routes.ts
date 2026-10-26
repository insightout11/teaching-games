import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { LANDMARK_CATALOG, type Landmark } from '@/data/world/landmark-catalog';
import { WORLD_FLIGHT_RANGE_TIERS, type WorldFlightRangeTier } from '@/lib/world-flight/progression';
import { catalogueInView, landmarksAhead } from './landmarks-ahead';
import { routeLengthKm, toRoute } from './coast-strip';
import { bearingDeg } from './sun';
import { greatCirclePoint, type LatLng } from './route-terrain';

export type GalleryCity = Pick<(typeof WORLD_DESTINATIONS)[number], 'id' | 'city' | 'lat' | 'lng'>;
// The flight picker only offers cities with arrival scenes.
export const GALLERY_CITIES = WORLD_DESTINATIONS.filter(d => d.scene);
export interface LandmarkRoute {
  key: string;
  from: GalleryCity;
  to: GalleryCity;
  km: number;
  firstT: number;
  lastT: number;
  bestT: number;
  ahead: number;
  lateral: number;
  range: WorldFlightRangeTier;
}

/** Match the cruise heading used by flight-deck, including curved long routes. */
export function galleryPosition(from: LatLng, to: LatLng, t: number) {
  const point = greatCirclePoint(from, to, t);
  return { point, heading: bearingDeg(point, greatCirclePoint(from, to, Math.min(1, t + 0.01))) };
}

/** Live cruise registration (Niagara is currently excluded by flight-deck). */
export function galleryLiveLandmarks(from: LatLng, to: LatLng, t: number, km: number) {
  const { point, heading } = galleryPosition(from, to, t);
  return landmarksAhead(point, heading).filter(l => l.kind !== 'niagara')
    .map(l => ({ ...l, along: t * km + l.ahead }));
}

/**
 * Dev-only catalogue search. Both directions count separately. Use real destination
 * pairs, then the live view rule, sampled every <=2 km around the great-circle
 * closest approach. This is a geometric candidate, not proof of terrain visibility.
 * The conservative prefilter avoids sampling entire transcontinental flights.
 */
export function routesForLandmark(landmark: Landmark, cities: readonly GalleryCity[] = GALLERY_CITIES): LandmarkRoute[] {
  const routes: LandmarkRoute[] = [];
  for (const from of cities) for (const to of cities) {
    if (from.id === to.id) continue;
    const km = routeLengthKm(from, to);
    if (km < 1) continue;
    const range = WORLD_FLIGHT_RANGE_TIERS.find(tier => km <= tier.rangeKm);
    if (!range) continue;
    const [along, side] = toRoute(from, bearingDeg(from, to) * Math.PI / 180, landmark);
    if (Math.abs(side) > 180 || along < -180 || along > km + 180) continue;
    const start = Math.max(km * 0.02, along - 190);
    const end = Math.min(km * 0.98, along + 15);
    if (start > end) continue;
    const steps = Math.max(1, Math.ceil((end - start) / 2));
    let firstT = -1, lastT = -1, score = Infinity;
    let best: { t: number; ahead: number; lateral: number } | null = null;
    for (let i = 0; i <= steps; i++) {
      const t = (start + (end - start) * i / steps) / km;
      const { point, heading } = galleryPosition(from, to, t);
      const seen = catalogueInView(point, heading, [landmark])[0];
      if (!seen) continue;
      if (firstT < 0) firstT = t;
      lastT = t;
      // Prefer a readable middle-distance view without moving the real landmark.
      const quality = Math.abs(seen.ahead - 65) + Math.abs(seen.lateral) * 1.5;
      if (quality < score) { score = quality; best = { t, ...seen }; }
    }
    if (best) routes.push({ key: from.id + '--' + to.id, from, to, km, range, firstT, lastT, bestT: best.t, ahead: best.ahead, lateral: best.lateral });
  }
  return routes.sort((a, b) => a.km - b.km || a.key.localeCompare(b.key));
}

export function findGalleryLandmark(id: string | null): Landmark | undefined {
  return LANDMARK_CATALOG.find(l => l.id === id);
}
