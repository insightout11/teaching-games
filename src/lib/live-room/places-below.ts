/**
 * Which country (and which big city, if any) is under the plane. Country
 * outlines are Natural Earth's 1:110m admin-0 countries (public domain), via
 * the world-atlas package, decoded and rounded to 0.1° in
 * src/data/world/countries-110m.json. Loaded lazily: only the Live Room needs it.
 */
import type { LatLng } from '@/lib/live-room/route-terrain';
import { MAJOR_CITIES } from '@/data/world/major-cities';
import { distanceBetweenCoordsKm } from '@/lib/world-flight/geo';
import { inRing, type Ring } from '@/lib/live-room/land-outlines';

export interface CountryShape {
  name: string;
  rings: Ring[];
  box: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
}

export function toShapes(raw: Array<[string, Ring[]]>): CountryShape[] {
  return raw.map(([name, rings]) => {
    let a = 180, b = 90, c = -180, d = -90;
    for (const r of rings) for (const [x, y] of r) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
    return { name, rings, box: [a, b, c, d] };
  });
}

let loaded: Promise<CountryShape[]> | null = null;
export function loadCountries(): Promise<CountryShape[]> {
  loaded ??= import('@/data/world/countries-110m.json').then((m) => toShapes((m.default ?? m) as unknown as Array<[string, Ring[]]>));
  return loaded;
}

export function countryAt(shapes: CountryShape[], p: LatLng): string | null {
  for (const s of shapes) {
    const [a, b, c, d] = s.box;
    if (p.lng < a || p.lng > c || p.lat < b || p.lat > d) continue;
    // Even–odd across all rings, so enclaves (Lesotho in South Africa) come out right.
    let hits = 0;
    for (const r of s.rings) if (inRing(p.lng, p.lat, r)) hits++;
    if (hits % 2 === 1) return s.name;
  }
  return null;
}

export function cityNear(p: LatLng, maxKm = 60): { name: string; km: number } | null {
  let best: { name: string; km: number } | null = null;
  for (const [name, lat, lng] of MAJOR_CITIES) {
    if (Math.abs(lat - p.lat) > 1.2) continue;
    const km = distanceBetweenCoordsKm(p, { lat, lng });
    if (km <= maxKm && (!best || km < best.km)) best = { name, km };
  }
  return best;
}
