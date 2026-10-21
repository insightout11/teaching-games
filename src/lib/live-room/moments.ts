/**
 * "Look outside" moments along today's route (Phase 3.3). At most 3 per flight, spread through the cruise: never in
 * the first minutes and never in the descent. Each waits for the teacher's tap; a small "coming up" note shows a few
 * minutes before, so the teacher can build anticipation or ignore it.
 */

import { greatCirclePoint, withArticle, type LatLng } from '@/lib/live-room/route-terrain';
import { namedRegionAt } from '@/lib/live-room/land-cover';
import { NAMED_FEATURES } from '@/data/world/named-features';
import { TEACHING_LANDMARKS } from '@/data/world/named-regions';
import type { RouteStop } from '@/lib/live-room/route-preview';

export type MomentKind = 'landmark' | 'place' | 'country' | 'event' | 'crossing';

export interface Moment {
  id: string;
  /** Minutes after take-off when the plane is closest. */
  at: number;
  kind: MomentKind;
  title: string;
  /** A one-line fact when we already have one (teaching landmarks, live events). */
  fact?: string;
  /** Where it is (for "on your left / right"). */
  lat?: number;
  lng?: number;
  /** Drawn as a landmark scene (side window or camera) instead of a photo. */
  drawn?: boolean;
  /** Where it is from the plane at its closest, honestly: "40 km to the left", "180 km to the right, beyond the horizon". */
  where?: string;
  /** Its own question for the class (live moments: the moon, a plane, a holiday...). */
  question?: string;
}

export interface NaturalEvent { id: string; title: string; category: string; lat: number; lng: number }

export const MAX_MOMENTS = 3;

function km(a: LatLng, b: LatLng): number {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

const PRIORITY: Record<MomentKind, number> = { landmark: 0, crossing: 1, event: 1, place: 2, country: 3 };

/** Landmarks drawn in the storybook style (src/components/live-room/flight/landmark-art.tsx): first pick of all. */
export const DRAWN_LANDMARK_NAMES = ['the Matterhorn', 'Mount Everest', 'Mount Fuji', 'Mount Kilimanjaro', 'the Pyramids of Giza', 'Stonehenge', 'the Great Wall of China', 'Niagara Falls'];

/** Plan today's moments: candidates near the route, best first, at least a fifth of the flight apart. */
export function planMoments(o: {
  origin: LatLng;
  destination: LatLng;
  flightMinutes: number;
  stops: RouteStop[];
  events?: NaturalEvent[];
  /** Minutes at the start and before arrival with no moments (the climb and the descent). */
  quietStart?: number;
  quietEnd?: number;
}): Moment[] {
  const { origin, destination, flightMinutes } = o;
  const quietStart = o.quietStart ?? 4;
  const quietEnd = o.quietEnd ?? 6;
  if (flightMinutes < quietStart + quietEnd + 3) return [];
  const samples = 120;
  const route = Array.from({ length: samples + 1 }, (_, i) => greatCirclePoint(origin, destination, i / samples));
  const minuteOf = (i: number) => (i / samples) * flightMinutes;
  const inCruise = (m: number) => m >= quietStart && m <= flightMinutes - quietEnd;
  const closest = (p: LatLng) => {
    let best = { i: 0, d: Infinity };
    route.forEach((q, i) => { const d = km(p, q); if (d < best.d) best = { i, d }; });
    return best;
  };

  // which side of the plane, and how far: past about 110 km it is beyond what the window shows
  const whereFrom = (i: number, p: LatLng, d: number) => {
    const a = route[Math.max(0, i - 1)], b = route[Math.min(samples, i + 1)];
    const cos = Math.cos((a.lat * Math.PI) / 180);
    const cross = (b.lng - a.lng) * cos * (p.lat - a.lat) - (b.lat - a.lat) * (p.lng - a.lng) * cos;
    const side = cross > 0 ? 'left' : 'right';
    const kmR = Math.max(10, Math.round(d / 10) * 10);
    if (d < 15) return 'right below us';
    return d > 110 ? `${kmR} km to the ${side}, beyond the horizon` : `${kmR} km to the ${side}`;
  };
  const found: Moment[] = [];
  for (const l of TEACHING_LANDMARKS) {
    const c = closest(l);
    if (c.d <= 200 && inCruise(minuteOf(c.i))) found.push({ id: `lm:${l.name}`, at: minuteOf(c.i), kind: 'landmark', title: l.name, fact: l.fact, where: whereFrom(c.i, l, c.d) });
  }
  for (const [name, kind, lat, lng] of NAMED_FEATURES) {
    if (kind === 'island') continue;
    const c = closest({ lat, lng });
    const drawn = DRAWN_LANDMARK_NAMES.includes(name);
    // a drawn landmark by the arrival city (Fuji coming into Tokyo) may come in the descent: it is the view outside
    const okTime = inCruise(minuteOf(c.i)) || (drawn && minuteOf(c.i) >= quietStart && minuteOf(c.i) <= flightMinutes - 1.5);
    if (c.d <= (drawn ? 300 : 250) && okTime) {
      found.push({ id: `nf:${name}`, at: minuteOf(c.i), kind: kind === 'mountain' || kind === 'sight' ? 'landmark' : 'place', title: name, lat, lng, where: whereFrom(c.i, { lat, lng }, c.d), ...(drawn ? { drawn: true } : {}) });
    }
  }
  // Named regions the route crosses (deserts, plateaus, ranges, deltas, reefs): the first point inside each.
  for (let i = 0; i <= samples; i += 3) {
    if (!inCruise(minuteOf(i))) continue;
    let r: { name: string; kind: string } | null = null;
    try { r = namedRegionAt(route[i]); } catch { r = null; }
    if (!r || r.kind === 'island' || found.some((f) => f.title.endsWith(r!.name))) continue;
    found.push({ id: `nr:${r.name}`, at: minuteOf(i), kind: r.kind === 'volcano' || r.kind === 'canyon' ? 'landmark' : 'place', title: withArticle(r.name, r.kind) });
  }
  for (const e of o.events ?? []) {
    const c = closest(e);
    if (c.d <= 300 && inCruise(minuteOf(c.i))) found.push({ id: `ev:${e.id}`, at: minuteOf(c.i), kind: 'event', title: e.title, fact: `${e.category}, happening now (NASA)`, where: whereFrom(c.i, e, c.d) });
  }
  // Lines on the globe the route crosses: the Equator, the tropics, the polar circles, the International Date Line
  const LINES: Array<[string, number, string]> = [
    ['the Equator', 0, 'the line halfway between the North and South Poles'],
    ['the Tropic of Cancer', 23.44, 'the furthest line north where the sun can be straight overhead'],
    ['the Tropic of Capricorn', -23.44, 'the furthest line south where the sun can be straight overhead'],
    ['the Arctic Circle', 66.56, 'north of it, the sun stays up all day in midsummer'],
    ['the Antarctic Circle', -66.56, 'south of it, the sun stays up all day in midsummer'],
  ];
  for (let i = 1; i <= samples; i++) {
    const a = route[i - 1], b = route[i];
    if (!inCruise(minuteOf(i))) continue;
    for (const [name, lat, fact] of LINES) if ((a.lat - lat) * (b.lat - lat) < 0) found.push({ id: `ln:${name}`, at: minuteOf(i), kind: 'crossing', title: name, fact: `We are crossing it now: ${fact}.`, where: 'right below us' });
    if (Math.abs(b.lng - a.lng) > 180) found.push({ id: 'ln:dateline', at: minuteOf(i), kind: 'crossing', title: 'the International Date Line', fact: `We are crossing it now: the date changes by a whole day here (${b.lng < a.lng ? 'flying east, back to yesterday' : 'flying west, on to tomorrow'}).`, where: 'right below us' });
  }
  for (const s of o.stops) {
    if (!s.crossing || !inCruise(s.at)) continue;
    const country = s.text.replace(/^Cross into /, '');
    found.push({ id: `cc:${country}`, at: s.at, kind: 'country', title: country });
  }

  // Best first, one per place, then spaced out.
  const seen = new Set<string>();
  const ranked = found
    .sort((a, b) => Number(!!b.drawn) - Number(!!a.drawn) || PRIORITY[a.kind] - PRIORITY[b.kind] || a.at - b.at)
    .filter((m) => (seen.has(m.title) ? false : (seen.add(m.title), true)));
  const gap = flightMinutes / 5;
  const chosen: Moment[] = [];
  for (const m of ranked) {
    if (chosen.length >= MAX_MOMENTS) break;
    if (chosen.every((c) => Math.abs(c.at - m.at) >= gap)) chosen.push(m);
  }
  return chosen.sort((a, b) => a.at - b.at);
}

/** One question the class can talk about, by kind of moment. */
export function momentQuestion(m: Pick<Moment, 'kind' | 'title' | 'question'>): string {
  if (m.question) return m.question;
  if (m.kind === 'country') return `What do you know about ${m.title}? Would you like to go there?`;
  if (m.kind === 'event') return 'What should people nearby do to stay safe?';
  if (m.kind === 'crossing') return `Why do you think people drew ${m.title} on maps?`;
  return `Would you like to visit ${m.title}? What would you do there?`;
}
