import { describe, expect, it } from 'vitest';
import { cityStops, stopSceneTopic, STOP_KINDS } from '@/lib/world-flight/city-stops';

describe('city stops', () => {
  it('gives every destination four stops, with accessories at the market', () => {
    const stops = cityStops('dubai');
    expect(stops.map((s) => s.kind)).toEqual([...STOP_KINDS]);
    const market = stops.find((s) => s.kind === 'market')!;
    expect(market.accessories.length).toBeGreaterThanOrEqual(3);
    expect(new Set(market.accessories.map((a) => a.type)).size).toBe(market.accessories.length);
    expect(stopSceneTopic('Dubai', market)).toMatch(/Dubai/);
  });
  it('returns nothing for an unknown city', () => {
    expect(cityStops('nowhere')).toEqual([]);
  });
});
