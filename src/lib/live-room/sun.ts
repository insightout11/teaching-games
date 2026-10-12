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

export interface MoonPosition extends SunPosition {
  /** How much of the disc is lit, 0 (new) to 1 (full). */
  illumination: number;
  /** True while the lit part is growing. */
  waxing: boolean;
  /**
   * Which side of the disc is lit as the observer sees it. A waxing moon is lit on the right from the northern
   * hemisphere and on the left from the southern one (Sydney sees the moon the other way up).
   */
  litOnRight: boolean;
}

/**
 * Where the moon is, and how much of it is lit: the same kind of compact low-precision formula as the sun's (good to
 * about half a degree, plenty for a picture). Replaces the old guess of "opposite the sun".
 */
export function moonPosition(p: LatLng, date: Date): MoonPosition {
  const d = date.getTime() / 86400000 - 10957.5; // days since J2000.0
  const L = norm(218.316 + 13.176396 * d);
  const M = rad(norm(134.963 + 13.064993 * d));
  const F = rad(norm(93.272 + 13.22935 * d));
  const lon = rad(norm(L + 6.289 * Math.sin(M)));
  const lat = rad(5.128 * Math.sin(F));
  const e = rad(23.439 - 0.00000036 * d);
  const ra = deg(Math.atan2(Math.sin(lon) * Math.cos(e) - Math.tan(lat) * Math.sin(e), Math.cos(lon)));
  const dec = Math.asin(Math.sin(lat) * Math.cos(e) + Math.cos(lat) * Math.sin(e) * Math.sin(lon));
  const gmst = norm((18.697374558 + 24.06570982441908 * d) * 15);
  const lha = rad(norm(gmst + p.lng - ra));
  const phi = rad(p.lat);
  const geocentric = deg(Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(lha)));
  // The moon is near enough that the observer's position shifts it by almost a degree.
  const elevation = geocentric - 0.95 * Math.cos(rad(geocentric));
  const azimuth = norm(deg(Math.atan2(-Math.sin(lha), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(lha))));
  // Phase from how far the moon is ahead of the sun along the ecliptic.
  const g = rad(norm(357.529 + 0.98560028 * d));
  const q = norm(280.459 + 0.98564736 * d);
  const sunLon = norm(q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const elong = rad(norm(deg(lon) - sunLon));
  const waxing = Math.sin(elong) > 0;
  return { elevation, azimuth, illumination: (1 - Math.cos(elong)) / 2, waxing, litOnRight: waxing === (p.lat >= 0) };
}

/**
 * Is the plane keeping pace with the sun? Flying west about as fast as the sun appears to move, the sun hangs in the
 * sky while the ground below passes through evening. Measured over `aheadMs` of flight: how far the sun's height
 * changes at the plane's moving position, against how far it would change for someone standing still. It only counts
 * when the sun really is moving for a person on the ground (at noon its height barely changes for anyone) and is up
 * or close to the horizon.
 */
export function sunChase(here: LatLng, ahead: LatLng, at: Date, aheadMs: number): boolean {
  const later = new Date(at.getTime() + aheadMs);
  const now = sunPosition(here, at);
  if (now.elevation < -6) return false;
  const stillRate = Math.abs(sunPosition(here, later).elevation - now.elevation); // a stationary observer
  const movingRate = Math.abs(sunPosition(ahead, later).elevation - now.elevation); // the plane, which has moved on
  // The sun is moving for an observer on the ground, but hardly at all for the plane.
  const perTwoMinutes = aheadMs / 120000;
  return stillRate > 0.15 * perTwoMinutes && movingRate < stillRate * 0.4;
}
