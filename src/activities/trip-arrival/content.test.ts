import { describe, it, expect } from 'vitest';
import { buildTripArrivalContent } from './content';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

describe('buildTripArrivalContent', () => {
  it('builds reliable arrival content from the destination', () => {
    const dublin = WORLD_DESTINATIONS.find((d) => d.id === 'dublin')!;
    const content = buildTripArrivalContent(dublin);
    expect(content.activityKey).toBe('trip-arrival');
    expect(content.city).toBe('Dublin');
    expect(content.airport.length).toBeGreaterThan(0);
    expect(content.framingPrompt).toContain('Dublin');
  });
});
