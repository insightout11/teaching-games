import { describe, expect, it } from 'vitest';
import { canDosFor, countTicks } from './trip-can-do';

describe('trip can-dos', () => {
  it('filters to played stops, all when unknown', () => {
    expect(canDosFor(['arrival', 'hotel']).map((c) => c.id)).toEqual(['passport', 'check-in']);
    expect(canDosFor(undefined)).toHaveLength(6);
  });
  it('counts ticks per can-do', () => {
    expect(countTicks({ a: ['ticket', 'order'], b: ['order'] })).toEqual({ ticket: 1, order: 2 });
  });
});
