import { describe, expect, it } from 'vitest';
import { filterTripSlots, picksPerPhone, winningStops } from './trip-stops';

describe('trip stops', () => {
  const all = ['getting-there', 'find-your-way', 'hotel', 'attraction', 'local-table'];

  it('keeps the 3 most voted, in trip order, ties in trip order', () => {
    const votes = { a: ['local-table', 'hotel'], b: ['local-table', 'attraction'], c: ['hotel', 'getting-there'] };
    expect(winningStops(all, votes)).toEqual(['getting-there', 'hotel', 'local-table']);
  });

  it('ignores votes outside the shortlist and falls back to the shortlist order', () => {
    expect(winningStops(['hotel', 'attraction', 'local-table', 'find-your-way'], { a: ['getting-there'] }))
      .toEqual(['find-your-way', 'hotel', 'attraction']);
  });

  it('picks 2 per phone only when there is a real choice', () => {
    expect(picksPerPhone(5)).toBe(2);
    expect(picksPerPhone(3)).toBe(1);
  });

  it('drops only unchosen, unplayed stops', () => {
    const slots = [{ stageId: 'arrival' }, { stageId: 'plan-day' }, { stageId: 'getting-there' }, { stageId: 'find-your-way' }, { stageId: 'hotel' }, { stageId: 'attraction' }, { stageId: 'local-table' }, { stageId: 'end-game' }];
    expect(filterTripSlots(slots, ['getting-there', 'hotel', 'local-table'], 1).map((s) => s.stageId))
      .toEqual(['arrival', 'plan-day', 'getting-there', 'hotel', 'local-table', 'end-game']);
  });
});
