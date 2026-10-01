import { describe, expect, it } from 'vitest';
import { affordable, dealTravellerCards, transportTier } from './traveller-cards';

describe('Traveller Cards', () => {
  const students = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('deals one card per student, the same for the same session', () => {
    const one = dealTravellerCards(students, 'session-1');
    expect(Object.keys(one)).toEqual(['a', 'b', 'c']);
    expect(dealTravellerCards(students, 'session-1')).toEqual(one);
    expect(new Set(Object.values(one).map((c) => c.persona)).size).toBe(3);
  });

  it('tiers transport and checks the budget', () => {
    expect(transportTier('Taxi')).toBe('$$$');
    expect(transportTier('Airport Express train')).toBe('$$');
    expect(transportTier('Metro')).toBe('$');
    expect(affordable({ persona: 'x', budget: '$', food: 'adventurous', want: 'y' }, '$$$')).toBe(false);
    expect(affordable({ persona: 'x', budget: '$$$', food: 'adventurous', want: 'y' }, '$')).toBe(true);
  });
});
