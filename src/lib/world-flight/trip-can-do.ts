/**
 * Travel v2, step 5: the before/after. At boarding each phone ticks what they could do in the
 * city; at landing they tick again for the stops the class actually played, and the screen
 * stamps the change (class counts only, never names).
 */
export interface CanDo { id: string; stageId: string; text: string }

export const TRIP_CAN_DOS: CanDo[] = [
  { id: 'passport', stageId: 'arrival', text: 'Answer questions at passport control' },
  { id: 'announcement', stageId: 'announcement', text: 'Catch the platform and time in an announcement' },
  { id: 'ticket', stageId: 'getting-there', text: 'Buy a ticket into the city' },
  { id: 'directions', stageId: 'find-your-way', text: 'Ask for and follow directions' },
  { id: 'check-in', stageId: 'hotel', text: 'Check in at a hotel and fix a problem' },
  { id: 'order', stageId: 'local-table', text: 'Order food and explain what I can’t eat' },
];

/** The can-dos for the stops that were played (all of them when nothing is known). */
export function canDosFor(playedStageIds: string[] | undefined): CanDo[] {
  if (!playedStageIds || playedStageIds.length === 0) return TRIP_CAN_DOS;
  return TRIP_CAN_DOS.filter((c) => playedStageIds.indexOf(c.stageId) >= 0);
}

/** How many phones ticked each can-do. */
export function countTicks(ticks: Record<string, string[]>): Record<string, number> {
  const out: Record<string, number> = {};
  Object.keys(ticks).forEach((k) => ticks[k].forEach((id) => { out[id] = (out[id] ?? 0) + 1; }));
  return out;
}
