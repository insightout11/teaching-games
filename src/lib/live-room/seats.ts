// The Live Room cabin seats crew in join order, four across: A B | aisle | C D.
// Phones show the same label so "Seat 3C" is the seat lit up on the big screen.

export const SEATS_PER_ROW = 4;
const SEAT_LETTERS = ['A', 'B', 'C', 'D'];

/** 0-based join index → seat label, e.g. 0 → "1A", 6 → "2C". */
export function cabinSeatLabel(index: number): string {
  const i = Math.max(0, Math.floor(index));
  return `${Math.floor(i / SEATS_PER_ROW) + 1}${SEAT_LETTERS[i % SEATS_PER_ROW]}`;
}
