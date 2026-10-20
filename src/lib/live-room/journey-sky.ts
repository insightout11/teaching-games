/**
 * The night sky on the journey (Oct 2026): the moon's phase in words, the bright planets that are really up, and the
 * yearly meteor showers. All calculated (no outside service): low-precision formulas, good to a degree or so, plenty to
 * say "that bright star over there is Venus".
 */
import type { LatLng } from '@/lib/live-room/route-terrain';

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const norm = (d: number) => ((d % 360) + 360) % 360;

/** The moon's phase as the class would say it. */
export function moonPhaseName(illumination: number, waxing: boolean): string {
  if (illumination < 0.03) return 'a new moon';
  if (illumination > 0.97) return 'a full moon';
  const way = waxing ? 'waxing' : 'waning';
  if (illumination < 0.4) return `a ${way} crescent moon`;
  if (illumination <= 0.6) return waxing ? 'a first quarter moon' : 'a last quarter moon';
  return `a ${way} gibbous moon`;
}

// ── Planets ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// Mean orbital elements at J2000 and their change per day (Paul Schlyter's "How to compute planetary positions").
interface Elements { N: [number, number]; i: [number, number]; w: [number, number]; a: number; e: [number, number]; M: [number, number] }
const PLANETS: Record<'Venus' | 'Mars' | 'Jupiter' | 'Saturn', Elements> = {
  Venus: { N: [76.6799, 2.4659e-5], i: [3.3946, 2.75e-8], w: [54.891, 1.38374e-5], a: 0.72333, e: [0.006773, -1.302e-9], M: [48.0052, 1.6021302244] },
  Mars: { N: [49.5574, 2.11081e-5], i: [1.8497, -1.78e-8], w: [286.5016, 2.92961e-5], a: 1.523688, e: [0.093405, 2.516e-9], M: [18.6021, 0.5240207766] },
  Jupiter: { N: [100.4542, 2.76854e-5], i: [1.303, -1.557e-7], w: [273.8777, 1.64505e-5], a: 5.20256, e: [0.048498, 4.469e-9], M: [19.895, 0.0830853001] },
  Saturn: { N: [113.6634, 2.3898e-5], i: [2.4886, -1.081e-7], w: [339.3939, 2.97661e-5], a: 9.55475, e: [0.055546, -9.499e-9], M: [316.967, 0.0334442282] },
};
export type PlanetName = keyof typeof PLANETS;

function helio(el: Elements, d: number): [number, number, number] {
  const N = rad(el.N[0] + el.N[1] * d), i = rad(el.i[0] + el.i[1] * d), w = rad(el.w[0] + el.w[1] * d);
  const e = el.e[0] + el.e[1] * d, M = rad(norm(el.M[0] + el.M[1] * d));
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 5; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xv = el.a * (Math.cos(E) - e), yv = el.a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv), r = Math.hypot(xv, yv);
  return [
    r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i)),
    r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i)),
    r * Math.sin(v + w) * Math.sin(i),
  ];
}

/** A planet's height above the horizon and compass direction from a point at a moment. */
export function planetPosition(name: PlanetName, p: LatLng, date: Date): { elevation: number; azimuth: number } {
  const d = date.getTime() / 86400000 - 10957.5 + 1.5; // Schlyter's day 0 is 1999-12-31 0h
  // the Earth (from the sun's place) and the planet, both around the sun
  const ws = rad(282.9404 + 4.70935e-5 * d), Ms = rad(norm(356.047 + 0.9856002585 * d)), es = 0.016709 - 1.151e-9 * d;
  const Es = Ms + es * Math.sin(Ms) * (1 + es * Math.cos(Ms));
  const xs0 = Math.cos(Es) - es, ys0 = Math.sqrt(1 - es * es) * Math.sin(Es);
  const vs = Math.atan2(ys0, xs0) + ws, rs = Math.hypot(xs0, ys0);
  const sx = rs * Math.cos(vs), sy = rs * Math.sin(vs);
  const [hx, hy, hz] = helio(PLANETS[name], d);
  const gx = hx + sx, gy = hy + sy, gz = hz;
  const ecl = rad(23.4393 - 3.563e-7 * d);
  const xe = gx, ye = gy * Math.cos(ecl) - gz * Math.sin(ecl), ze = gy * Math.sin(ecl) + gz * Math.cos(ecl);
  const ra = deg(Math.atan2(ye, xe)), dec = Math.atan2(ze, Math.hypot(xe, ye));
  const gmst = norm((18.697374558 + 24.06570982441908 * (date.getTime() / 86400000 - 10957.5)) * 15);
  const lha = rad(norm(gmst + p.lng - ra)), phi = rad(p.lat);
  const elevation = deg(Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(lha)));
  const azimuth = norm(deg(Math.atan2(-Math.sin(lha), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(lha))));
  return { elevation, azimuth };
}

/** The brightest planet that is really up in a dark enough sky (Venus, then Jupiter, Mars, Saturn), or null. */
export function brightPlanet(p: LatLng, date: Date, sunElevation: number): { name: PlanetName; elevation: number; azimuth: number } | null {
  if (sunElevation > -4) return null;
  for (const name of ['Venus', 'Jupiter', 'Mars', 'Saturn'] as PlanetName[]) {
    const pos = planetPosition(name, p, date);
    if (pos.elevation > 6) return { name, ...pos };
  }
  return null;
}

// ── Meteor showers ──────────────────────────────────────────────────────────────────────────────────────────────────
export interface MeteorShower { name: string; month: number; day: number; perHour: number; from: string }
/** The main yearly showers, at their usual peak dates (they last a few nights around them). */
export const METEOR_SHOWERS: MeteorShower[] = [
  { name: 'the Quadrantids', month: 1, day: 3, perHour: 80, from: 'an old asteroid called 2003 EH1' },
  { name: 'the Lyrids', month: 4, day: 22, perHour: 18, from: 'Comet Thatcher' },
  { name: 'the Eta Aquariids', month: 5, day: 6, perHour: 40, from: "Halley's Comet" },
  { name: 'the Perseids', month: 8, day: 12, perHour: 100, from: 'Comet Swift-Tuttle' },
  { name: 'the Orionids', month: 10, day: 21, perHour: 20, from: "Halley's Comet" },
  { name: 'the Leonids', month: 11, day: 17, perHour: 15, from: 'Comet Tempel-Tuttle' },
  { name: 'the Geminids', month: 12, day: 14, perHour: 120, from: 'an asteroid called 3200 Phaethon' },
];

/** The shower near its peak on this date (within two days), or null. */
export function activeShower(date: Date): MeteorShower | null {
  const y = date.getUTCFullYear();
  for (const s of METEOR_SHOWERS) {
    const peak = Date.UTC(y, s.month - 1, s.day);
    if (Math.abs(date.getTime() - peak) <= 2.5 * 86400000) return s;
  }
  return null;
}

/** Compass direction in words, relative to the plane's heading: "on our left", "ahead", "behind us". */
export function sideOfSky(azimuth: number, heading: number): string {
  const rel = ((azimuth - heading + 540) % 360) - 180;
  if (Math.abs(rel) < 30) return 'ahead of us';
  if (Math.abs(rel) > 150) return 'behind us';
  return rel < 0 ? 'on our left' : 'on our right';
}
