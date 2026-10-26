import { greatCirclePoint, type LatLng } from '@/lib/live-room/route-terrain';
import { countryAt, type CountryShape } from '@/lib/live-room/places-below';

/**
 * The pre-flight prediction (Oct 2026): one question the class answers on their phones while the route's scenery
 * prepares, which the flight itself then answers (the first border we cross, or the local time as we land).
 */
export interface FlightPrediction {
  kind: 'first-country' | 'landing-time';
  question: string;
  options: string[];
  answer: string;
  /** Route progress (0-1) at which the answer shows outside; null = at the start of the descent. */
  revealAt: number | null;
  /** What the reveal card says. */
  reveal: string;
  /** Landing time only: the destination's time zone, so the reveal can use the actual landing time. */
  zone?: string;
}

const SAMPLES = 240;

/** Stable 32-bit hash, so a route always gets the same option order. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function shuffled<T>(items: T[], seed: string): T[] {
  return items.map((item, i) => ({ item, k: hash(`${seed}|${i}`) })).sort((a, b) => a.k - b.k).map((x) => x.item);
}
function destinationPoint(p: LatLng, bearingDeg: number, km: number): LatLng {
  const r = Math.PI / 180, d = km / 6371, a = p.lat * r, b = p.lng * r, brg = bearingDeg * r;
  const lat = Math.asin(Math.sin(a) * Math.cos(d) + Math.cos(a) * Math.sin(d) * Math.cos(brg));
  const lng = b + Math.atan2(Math.sin(brg) * Math.sin(d) * Math.cos(a), Math.cos(d) - Math.sin(a) * Math.sin(lat));
  return { lat: lat / r, lng: ((lng / r + 540) % 360) - 180 };
}

/** "Which country will we fly over first?": the first border the route crosses, or null if it crosses none. */
export function firstCountryPrediction(origin: LatLng & { city: string }, destination: LatLng & { city: string }, countries: CountryShape[]): FlightPrediction | null {
  const home = countryAt(countries, origin);
  let first: { name: string; t: number } | null = null;
  const later: string[] = [];
  let last = home;
  for (let i = 1; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const c = countryAt(countries, greatCirclePoint(origin, destination, t));
    if (!c) continue; // over the sea: reaching the next coast is the crossing
    if (c !== last && c !== home) {
      if (!first) first = { name: c, t };
      else if (!later.includes(c) && c !== first.name) later.push(c);
    }
    last = c;
  }
  if (!first) return null;
  // Wrong answers: the countries around where we start (the ones a class might expect), then later ones on the route.
  const around = new Map<string, number>();
  for (const km of [250, 500, 850]) for (let b = 0; b < 360; b += 22.5) {
    const c = countryAt(countries, destinationPoint(origin, b, km));
    if (c && c !== home && c !== first.name) around.set(c, (around.get(c) ?? 0) + 1000 / km);
  }
  const nearby = Array.from(around.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name);
  const wrong = Array.from(new Set([...nearby, ...later])).filter((c) => c !== first!.name).slice(0, 3);
  if (wrong.length < 2) return null;
  return {
    kind: 'first-country',
    question: `Which country will we fly over first on the way to ${destination.city}?`,
    options: shuffled([first.name, ...wrong], `${origin.city}>${destination.city}`),
    answer: first.name,
    revealAt: first.t,
    reveal: `We're crossing into ${first.name}!`,
  };
}

const timeIn = (at: number, timeZone?: string) =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', ...(timeZone ? { timeZone } : {}) }).format(new Date(at));

/**
 * "What time will it be in Berlin when we land?". The tempting wrong answer is our own clock: it is always an option
 * when the time zones differ.
 */
export function landingTimePrediction(destination: { city: string }, destinationZone: string, landAt: number, localZone?: string): FlightPrediction {
  const at = Math.round(landAt / 300_000) * 300_000; // to the nearest 5 minutes
  const answer = timeIn(at, destinationZone);
  const candidates = [timeIn(at, localZone), timeIn(at + 3_600_000, destinationZone), timeIn(at - 3_600_000, destinationZone), timeIn(at + 7_200_000, destinationZone)];
  const wrong = Array.from(new Set(candidates)).filter((t) => t !== answer).slice(0, 3);
  return {
    kind: 'landing-time',
    question: `What time will it be in ${destination.city} when we land?`,
    options: shuffled([answer, ...wrong], `${destination.city}@${at}`),
    answer,
    revealAt: null,
    reveal: `It's ${answer} in ${destination.city} as we come in to land.`,
    zone: destinationZone,
  };
}

/**
 * The answer as the flight actually turned out: the class end may have moved after the briefing (+5/-5), which moves
 * the landing time. Border crossings don't change.
 */
export function actualAnswer(p: FlightPrediction, destination: { city: string }, landAt: number): { answer: string; reveal: string } {
  if (p.kind !== 'landing-time' || !p.zone) return { answer: p.answer, reveal: p.reveal };
  const answer = timeIn(Math.round(landAt / 300_000) * 300_000, p.zone);
  return { answer, reveal: `It's ${answer} in ${destination.city} as we come in to land.` };
}

/** One question per flight, alternating between the two kinds so it isn't the same every lesson. */
export function pickPrediction(o: {
  origin: LatLng & { city: string };
  destination: LatLng & { id: string; city: string };
  countries: CountryShape[] | null;
  destinationZone: string | null;
  landAt: number;
  localZone?: string;
  /** Changes between flights (e.g. the take-off day), to alternate the kinds. */
  seed: number;
}): FlightPrediction | null {
  const country = o.countries ? firstCountryPrediction(o.origin, o.destination, o.countries) : null;
  const time = o.destinationZone ? landingTimePrediction(o.destination, o.destinationZone, o.landAt, o.localZone) : null;
  // The landing time is only a question when it differs from our clock.
  const timeDiffers = time && time.options.length === 4 && timeIn(Math.round(o.landAt / 300_000) * 300_000, o.localZone) !== time.answer;
  if (country && timeDiffers) return o.seed % 2 === 0 ? country : time;
  return country ?? time;
}
