/**
 * Travel v2, step 3: fewer stops, each one deeper. After Arrival the teacher shortlists the
 * stops, the class votes, and the top 3 stay in the trip; the rest are dropped from the plan.
 */
export interface TripStopChoice { stageId: string; label: string; blurb: string }

export const TRIP_STOP_CHOICES: TripStopChoice[] = [
  { stageId: 'getting-there', label: 'Getting There', blurb: 'Buy a ticket into the city' },
  { stageId: 'find-your-way', label: 'Find Your Way', blurb: 'Give and follow directions on the map' },
  { stageId: 'hotel', label: 'Hotel', blurb: 'Check in at the front desk' },
  { stageId: 'attraction', label: 'Out & About', blurb: 'Choose what to see in the city' },
  { stageId: 'local-table', label: 'Local Table', blurb: 'Order a local dish' },
];

export const TRIP_STOPS_TO_KEEP = 3;
const CHOOSABLE = new Set(TRIP_STOP_CHOICES.map((c) => c.stageId));

/** How many stops each phone picks: 2 favourites when there's a real choice, else 1. */
export function picksPerPhone(shortlistSize: number): number {
  return shortlistSize >= 4 ? 2 : 1;
}

/**
 * The stops that stay: most votes first; ties keep trip order. Votes for stops outside the
 * shortlist are ignored. With no votes, the first stops of the shortlist stay.
 */
export function winningStops(shortlist: string[], votes: Record<string, string[]>, keep = TRIP_STOPS_TO_KEEP): string[] {
  const count: Record<string, number> = {};
  shortlist.forEach((id) => { count[id] = 0; });
  Object.keys(votes).forEach((voter) => {
    votes[voter].forEach((id) => { if (id in count) count[id] += 1; });
  });
  const order = TRIP_STOP_CHOICES.map((c) => c.stageId);
  return [...shortlist]
    .sort((a, b) => (count[b] - count[a]) || (order.indexOf(a) - order.indexOf(b)))
    .slice(0, keep)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/** Drop the choosable stops the class didn't pick (only ones not played yet). */
export function filterTripSlots<T extends { stageId?: string }>(slots: T[], chosen: string[], currentIndex: number): T[] {
  return slots.filter((slot, i) => i <= currentIndex || !slot.stageId || !CHOOSABLE.has(slot.stageId) || chosen.indexOf(slot.stageId) >= 0);
}
