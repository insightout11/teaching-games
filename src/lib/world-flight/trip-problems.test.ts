import { describe, expect, it } from 'vitest';
import { pickTripProblem, tripProblems } from './trip-problems';
import type { TravellerCard } from './traveller-cards';

const card = (over: Partial<TravellerCard>): TravellerCard => ({ persona: 'an art student', budget: '$$', food: 'adventurous', want: 'x', ...over });

describe('Take 2 problems', () => {
  it('fits the problem to the traveller card', () => {
    expect(pickTripProblem('meal', card({ food: 'nut allergy' }), 0).id).toBe('peanuts');
    expect(pickTripProblem('getting-there', card({ budget: '$' }), 0).id).toBe('too-expensive');
  });
  it('rotates general problems by turn and never hands a card-specific one to a non-fit', () => {
    const a = pickTripProblem('hotel', card({}), 0);
    const b = pickTripProblem('hotel', card({}), 1);
    expect(a.id).not.toBe(b.id);
    expect(a.fits).toBeUndefined();
    expect(pickTripProblem('arrival', undefined, 3).fits).toBeUndefined();
  });
  it('every problem has an opener, goal and phrases', () => {
    (['arrival', 'getting-there', 'hotel', 'meal'] as const).forEach((stop) => tripProblems(stop).forEach((p) => {
      expect(p.serviceOpener.length).toBeGreaterThan(5);
      expect(p.goal.length).toBeGreaterThan(5);
      expect(p.phrases.length).toBeGreaterThanOrEqual(3);
    }));
  });
});
