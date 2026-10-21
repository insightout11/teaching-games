/**
 * Today's flight, for the World Quiz "Our flight" round (Oct 2026): the room writes what the class has flown over (the
 * cities, the countries crossed, the landmarks and places passed, the heading); the quiz reads it. In memory only.
 */
export interface FlightLog {
  origin: { name: string; country: string; lat: number; lng: number };
  destination: { name: string; country: string; lat: number; lng: number };
  /** Countries the route crosses, in order. */
  countries: string[];
  /** Landmarks and named places the route passes (Look outside moments). */
  places: string[];
  /** Compass direction of the flight at take-off, in degrees. */
  heading: number;
}

let log: FlightLog | null = null;
export function setFlightLog(next: FlightLog | null) { log = next; }
export function getFlightLog(): FlightLog | null { return log; }
