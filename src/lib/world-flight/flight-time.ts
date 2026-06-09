// Narrative flight clock for World Flight.
//
// A lesson is a flight from an origin city to a destination city. The whole
// journey reads as ONE continuous clock: departure at a fixed narrative time
// (sunset), advancing by a duration that scales with flight DISTANCE. A short
// hop barely moves the clock (you arrive close to the light you left in); a
// long haul runs the full sunset -> overnight -> sunrise arc the app already has.
//
// Every flight phase (in-flight sky, descent, arrival scene) reads this clock,
// so time-of-day stays consistent and in order. Distance comes from
// `distanceKm` in ./geo. Mapping constants are intentionally tunable.

/** Narrative departure time, in hours (18:00 = sunset). */
export const DEPARTURE_HOUR = 18;

/** ~Narrative cruise pace (km per clock-hour): 5200 km (plane range) -> 13 h. */
const KM_PER_HOUR = 400;
/** Even the shortest hop advances the clock at least this much... */
const MIN_HOURS = 1;
/** ...and the longest in-range flight resolves to the full overnight. */
const MAX_HOURS = 13;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const wrap24 = (h: number) => ((h % 24) + 24) % 24;

/** Clock hours the flight advances, clamped to [MIN_HOURS, MAX_HOURS]. */
export function flightDurationHours(distanceKm: number): number {
  return clamp(distanceKm / KM_PER_HOUR, MIN_HOURS, MAX_HOURS);
}

/** Wall-clock hour (0–24) at a normalized journey position `progress` (0..1). */
export function clockHourAt(progress: number, distanceKm: number): number {
  const p = clamp(progress, 0, 1);
  return wrap24(DEPARTURE_HOUR + p * flightDurationHours(distanceKm));
}

/** Wall-clock hour at touchdown. */
export function arrivalHour(distanceKm: number): number {
  return clockHourAt(1, distanceKm);
}

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

/** Coarse time-of-day band for an hour (0–24). */
export function timeOfDay(hour: number): TimeOfDay {
  const h = wrap24(hour);
  if (h >= 5 && h < 7.5) return 'dawn';
  if (h >= 7.5 && h < 17) return 'day';
  if (h >= 17 && h < 19.5) return 'dusk';
  return 'night';
}
