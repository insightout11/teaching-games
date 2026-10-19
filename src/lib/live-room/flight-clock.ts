/**
 * The room's flight clock. Every flight lasts the class, whatever the distance: the clock starts when the class
 * starts (the room opening), the plane arrives 5 minutes before the class ends, and the last 5 minutes are the
 * arrival. A late take-off flies faster and still lands on time.
 */

export const ARRIVAL_MINUTES = 5;
/** The shortest flight, for a take-off right at the end of class. */
export const MIN_FLIGHT_MINUTES = 3;

export interface FlightClock {
  /** When the class ends. */
  endAt: number;
  /** When the plane arrives (5 minutes before the end). */
  landAt: number;
  /** How long this flight lasts, take-off to arrival (before take-off: from now). */
  flightMs: number;
  /** 0 → 1 along the route. */
  routeT: number;
  /** Arrived: the plane circles until the teacher lands. */
  holding: boolean;
  /** Minutes to arrival (null before take-off). */
  minutesLeft: number | null;
  /** Minutes since take-off (null before take-off). */
  minutesFlown: number | null;
  /** Minutes until the class ends. */
  classMinutesLeft: number;
}

export function flightClock(o: { classStartAt: number; classMinutes: number; takeoffAt: number | null; now: number }): FlightClock {
  const endAt = o.classStartAt + o.classMinutes * 60_000;
  const landAt = endAt - ARRIVAL_MINUTES * 60_000;
  const from = o.takeoffAt ?? o.now;
  const flightMs = Math.max(MIN_FLIGHT_MINUTES * 60_000, landAt - from);
  const elapsed = o.takeoffAt ? Math.max(0, o.now - o.takeoffAt) : 0;
  return {
    endAt,
    landAt,
    flightMs,
    routeT: o.takeoffAt ? Math.min(1, elapsed / flightMs) : 0,
    holding: o.takeoffAt !== null && elapsed >= flightMs,
    minutesLeft: o.takeoffAt ? Math.max(0, (flightMs - elapsed) / 60_000) : null,
    minutesFlown: o.takeoffAt ? elapsed / 60_000 : null,
    classMinutesLeft: Math.max(0, (endAt - o.now) / 60_000),
  };
}
