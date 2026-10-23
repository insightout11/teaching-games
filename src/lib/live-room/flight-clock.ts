/**
 * The room's flight clock. Every flight lasts the class, whatever the distance: the clock starts when the class
 * starts (the room opening), the plane arrives 5 minutes before the class ends, and the last 5 minutes are the
 * arrival. A late take-off flies faster and still lands on time.
 */

export const ARRIVAL_MINUTES = 5;
/** The shortest flight, for a take-off right at the end of class. */
export const MIN_FLIGHT_MINUTES = 3;

/**
 * Where the plane was when the class end changed mid-flight. Progress is kept at that point and only the speed
 * changes, so +5/-5 never moves the plane. Tied to its take-off so a new flight ignores it.
 */
export interface FlightAnchor {
  takeoffAt: number;
  /** When the change was made. */
  at: number;
  /** Progress along the route (0-1) at that moment. */
  t: number;
}

export interface FlightClock {
  /** When the class ends. */
  endAt: number;
  /** When the plane arrives (5 minutes before the end). */
  landAt: number;
  /** How long this flight lasts, take-off to arrival (before take-off: from now). */
  flightMs: number;
  /** 0 → 1 along the route. */
  routeT: number;
  /** Route progress per millisecond from now on (0 before take-off and once arrived). */
  perMs: number;
  /** Arrived: the plane circles until the teacher lands. */
  holding: boolean;
  /** Minutes to arrival (null before take-off). */
  minutesLeft: number | null;
  /** Minutes since take-off (null before take-off). */
  minutesFlown: number | null;
  /** Minutes until the class ends. */
  classMinutesLeft: number;
}

export function flightClock(o: { classStartAt: number; classMinutes: number; takeoffAt: number | null; now: number; anchor?: FlightAnchor | null }): FlightClock {
  const endAt = o.classStartAt + o.classMinutes * 60_000;
  const landAt = endAt - ARRIVAL_MINUTES * 60_000;
  const minMs = MIN_FLIGHT_MINUTES * 60_000;
  const classMinutesLeft = Math.max(0, (endAt - o.now) / 60_000);
  if (o.takeoffAt === null) {
    return { endAt, landAt, flightMs: Math.max(minMs, landAt - o.now), routeT: 0, perMs: 0, holding: false, minutesLeft: null, minutesFlown: null, classMinutesLeft };
  }
  // Fly from take-off, or from where the plane was when the class end last changed.
  const anchor = o.anchor && o.anchor.takeoffAt === o.takeoffAt ? o.anchor : null;
  const from = anchor ? anchor.at : o.takeoffAt;
  const fromT = anchor ? Math.max(0, Math.min(1, anchor.t)) : 0;
  // The rest of the route, never faster than the shortest flight's pace: an end time that is already too close
  // makes the plane hurry, it never jumps ahead.
  const remainingMs = Math.max(minMs * (1 - fromT), landAt - from);
  const arriveAt = from + remainingMs;
  const elapsed = Math.max(0, o.now - from);
  const routeT = remainingMs > 0 ? Math.min(1, fromT + (1 - fromT) * elapsed / remainingMs) : 1;
  const holding = routeT >= 1;
  return {
    endAt,
    landAt,
    flightMs: arriveAt - o.takeoffAt,
    routeT,
    perMs: holding || remainingMs <= 0 ? 0 : (1 - fromT) / remainingMs,
    holding,
    minutesLeft: Math.max(0, (arriveAt - o.now) / 60_000),
    minutesFlown: Math.max(0, o.now - o.takeoffAt) / 60_000,
    classMinutesLeft,
  };
}

/** Change the class end mid-flight: keep the plane where it is now, so only its speed changes. */
export function reanchorFlight(o: { classStartAt: number; classMinutes: number; takeoffAt: number | null; now: number; anchor?: FlightAnchor | null }): FlightAnchor | null {
  if (o.takeoffAt === null) return null;
  return { takeoffAt: o.takeoffAt, at: o.now, t: flightClock(o).routeT };
}
