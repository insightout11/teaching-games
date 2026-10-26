// The Live Room cabin seats crew in join order, four across: A B | aisle | C D.
// Phones show the same label so "Seat 3C" is the seat lit up on the big screen.

export const SEATS_PER_ROW = 4;
const SEAT_LETTERS = ['A', 'B', 'C', 'D'];

/** 0-based join index → seat label, e.g. 0 → "1A", 6 → "2C". */
export function cabinSeatLabel(index: number): string {
  const i = Math.max(0, Math.floor(index));
  return `${Math.floor(i / SEATS_PER_ROW) + 1}${SEAT_LETTERS[i % SEATS_PER_ROW]}`;
}

/** Seats a class can pick from on the phone (12 rows of four). */
export const MAX_CABIN_SEATS = 48;

/**
 * Who sits where (Oct 2026): students who picked a seat on their phone sit there; everyone else fills the free seats
 * in the order they boarded. `people` must already be in boarding order. Returns the cabin, one entry per seat.
 * The room and the phones both use this, so "Seat 2C" on a phone is the seat lit up on the big screen.
 */
export function assignSeats<T extends { seat?: number | null }>(people: readonly T[]): Array<T | undefined> {
  const cabin: Array<T | undefined> = [];
  const rest: T[] = [];
  for (const p of people) {
    const s = p.seat;
    if (typeof s === 'number' && Number.isInteger(s) && s >= 0 && s < MAX_CABIN_SEATS && !cabin[s]) cabin[s] = p;
    else rest.push(p);
  }
  let i = 0;
  for (const p of rest) {
    while (cabin[i]) i++;
    cabin[i] = p;
  }
  return cabin;
}
