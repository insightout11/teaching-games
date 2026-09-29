/**
 * Where the sun is, seen from a point on Earth at a moment in time (a compact
 * version of the standard low-precision solar formulas; good to a fraction of
 * a degree). The cockpit sky follows the sun above the ground the plane is
 * crossing, so flying east races into the evening and west stretches the day.
 */
import type { LatLng } from '@/lib/live-room/route-terrain';

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const norm = (d: number) => ((d % 360) + 360) % 360;

export interface SunPosition {
  /** Degrees above the horizon (negative: below). */
  elevation: number;
  /** Compass degrees, clockwise from north. */
  azimuth: number;
}

export function sunPosition(p: LatLng, date: Date): SunPosition {
  const d = date.getTime() / 86400000 - 10957.5; // days since J2000.0
  const g = rad(norm(357.529 + 0.98560028 * d));
  const q = norm(280.459 + 0.98564736 * d);
  const L = rad(norm(q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)));
  const e = rad(23.439 - 0.00000036 * d);
  const ra = deg(Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = norm((18.697374558 + 24.06570982441908 * d) * 15);
  const lha = rad(norm(gmst + p.lng - ra));
  const lat = rad(p.lat);
  const elevation = deg(Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(lha)));
  const azimuth = norm(deg(Math.atan2(-Math.sin(lha), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(lha))));
  return { elevation, azimuth };
}

/** Local solar time at a longitude (what the sun says the time is there), as "6:40 pm". */
export function solarClock(lng: number, date: Date): string {
  const minutes = ((date.getUTCHours() * 60 + date.getUTCMinutes() + lng * 4) % 1440 + 1440) % 1440;
  const rounded = Math.round(minutes / 5) * 5 % 1440;
  const h24 = Math.floor(rounded / 60);
  const m = rounded % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'am' : 'pm'}`;
}

/** Clock time for a UTC offset (seconds), as "8:08 pm". */
export function offsetClock(offsetSeconds: number, date: Date): string {
  const minutes = ((date.getUTCHours() * 60 + date.getUTCMinutes() + Math.round(offsetSeconds / 60)) % 1440 + 1440) % 1440;
  const h24 = Math.floor(minutes / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(minutes % 60).padStart(2, '0')} ${h24 < 12 ? 'am' : 'pm'}`;
}

/** Compass bearing from a to b. */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return norm(deg(Math.atan2(y, x)));
}
