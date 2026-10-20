/**
 * Which country (and which big city, if any) is under the plane. Country
 * outlines are Natural Earth's 1:110m admin-0 countries (public domain), via
 * the world-atlas package, decoded and rounded to 0.1° in
 * src/data/world/countries-110m.json. Loaded lazily: only the Live Room needs it.
 */
import type { LatLng } from '@/lib/live-room/route-terrain';
import { MAJOR_CITIES } from '@/data/world/major-cities';
import { NAMED_FEATURES, type FeatureKind } from '@/data/world/named-features';
import { bearingDeg } from '@/lib/live-room/sun';
import { distanceBetweenCoordsKm } from '@/lib/world-flight/geo';
import { inRing, type Ring } from '@/lib/live-room/land-outlines';

export interface CountryShape {
  name: string;
  rings: Ring[];
  box: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
  /** Crosses the 180° line (Fiji, Russia, the Aleutians): stored and tested in 0..360° longitude. */
  wrap?: boolean;
}

export function toShapes(raw: Array<[string, Ring[]]>): CountryShape[] {
  return raw.map(([name, rawRings]) => {
    // A country reaching both sides of the 180° line: a plain inside test would see a band right round the world at
    // its latitudes (Fiji "under" central Australia). Shift its western-hemisphere points by 360° so it is whole.
    const crosses = rawRings.some((r) => r.some(([x]) => x > 150) && r.some(([x]) => x < -150))
      || (rawRings.some((r) => r.some(([x]) => x > 150)) && rawRings.some((r) => r.some(([x]) => x < -150)));
    const rings = crosses ? rawRings.map((r) => r.map(([x, y]) => [x < 0 ? x + 360 : x, y] as [number, number])) : rawRings;
    let a = 400, b = 90, c = -400, d = -90;
    for (const r of rings) for (const [x, y] of r) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
    return { name, rings, box: [a, b, c, d], ...(crosses ? { wrap: true } : {}) };
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
    const lng = s.wrap && p.lng < 0 ? p.lng + 360 : p.lng;
    if (lng < a || lng > c || p.lat < b || p.lat > d) continue;
    // Even–odd across all rings, so enclaves (Lesotho in South Africa) come out right.
    let hits = 0;
    for (const r of s.rings) if (inRing(lng, p.lat, r)) hits++;
    if (hits % 2 === 1) return s.name;
  }
  return null;
}

/**
 * A small town under the plane when no major city is near. Not a real place: about a third of half-degree squares
 * hold one, at a fixed jittered spot, so the same stretch of route always shows the same towns.
 * Returns a seed for the town's layout, or null.
 */
export function townNear(p: LatLng): string | null {
  const cell = 0.5;
  const ci = Math.round(p.lat / cell), cj = Math.round(p.lng / cell);
  const h = (a: number) => { const r = Math.sin(a) * 43758.5453; return r - Math.floor(r); };
  if (h(ci * 127.1 + cj * 311.7) > 0.35) return null;
  const lat = ci * cell + (h(ci * 269.5 + cj * 183.3) - 0.5) * 0.3;
  const lng = cj * cell + (h(ci * 419.2 + cj * 371.9) - 0.5) * 0.3;
  const km = Math.hypot(p.lat - lat, (p.lng - lng) * Math.cos((p.lat * Math.PI) / 180)) * 111;
  return km < 9 ? `T${ci}_${cj}` : null;
}

export interface CityAround {
  id: string;
  name: string;
  km: number;
  /** Kilometres ahead of the plane (negative: already behind). */
  ahead: number;
  /** Kilometres to the side: negative is the left of the plane, positive the right. */
  lateral: number;
}

/**
 * The listed big cities within `maxKm` of the plane that are ahead of it or just passing, with where each lies
 * relative to the way the plane is heading. Nearest first. This is what "Paris, 80 km on your left" is made from, and
 * what the distant city lights are drawn from.
 */
export function citiesAround(p: LatLng, headingDeg: number, maxKm = 150): CityAround[] {
  const out: CityAround[] = [];
  for (const [name, lat, lng] of MAJOR_CITIES) {
    if (Math.abs(lat - p.lat) > maxKm / 111 + 0.5) continue;
    const km = distanceBetweenCoordsKm(p, { lat, lng });
    if (km > maxKm) continue;
    const rel = ((bearingDeg(p, { lat, lng }) - headingDeg + 540) % 360 - 180) * (Math.PI / 180);
    const ahead = km * Math.cos(rel);
    if (ahead < -10) continue; // well behind us
    out.push({ id: name, name, km: Math.round(km), ahead: Math.round(ahead), lateral: Math.round(km * Math.sin(rel)) });
  }
  return out.sort((a, b) => a.km - b.km);
}

/** "on your left", "on your right" or "ahead", for text. */
export function sideOf(c: Pick<CityAround, 'km' | 'ahead' | 'lateral'>): 'left' | 'right' | 'ahead' {
  if (Math.abs(c.lateral) < Math.max(8, c.km * 0.3) && c.ahead > 0) return 'ahead';
  return c.lateral < 0 ? 'left' : 'right';
}

export interface FeatureBelow {
  name: string;
  kind: FeatureKind;
  km: number;
}

/** The named river, lake, mountain, strait, island or sight the plane is over, if any (the closest to its centre). */
export function featureNear(p: LatLng): FeatureBelow | null {
  let best: (FeatureBelow & { ratio: number }) | null = null;
  for (const [name, kind, lat, lng, radius] of NAMED_FEATURES) {
    if (Math.abs(lat - p.lat) > radius / 111 + 0.5) continue;
    const km = distanceBetweenCoordsKm(p, { lat, lng });
    if (km > radius) continue;
    const ratio = km / radius;
    if (!best || ratio < best.ratio) best = { name, kind, km: Math.round(km), ratio };
  }
  return best ? { name: best.name, kind: best.kind, km: best.km } : null;
}

/** How a feature reads in "Below us: …": over rivers, lakes, straits and islands, near mountains and sights. */
export function featureText(f: FeatureBelow): string {
  return `${f.kind === 'mountain' || f.kind === 'sight' ? 'near' : 'over'} ${f.name}`;
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
