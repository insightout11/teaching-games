import { describe, it, expect } from 'vitest';
import { buildTripGettingThereContent } from './content';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { DestinationPack } from '@/lib/world-flight/types';

function city(id: string): DestinationPack {
  const found = WORLD_DESTINATIONS.find((d) => d.id === id);
  if (!found) throw new Error(`test fixture missing: ${id}`);
  return found;
}

describe('buildTripGettingThereContent', () => {
  it('packs the city\'s real transport options with unique ids', () => {
    const content = buildTripGettingThereContent(city('dublin'));
    expect(content.activityKey).toBe('trip-getting-there');
    expect(content.city).toBe('Dublin');
    expect(content.airport.length).toBeGreaterThan(0);
    expect(content.options.length).toBeGreaterThanOrEqual(2);
    const ids = content.options.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const option of content.options) {
      expect(option.mode.length).toBeGreaterThan(0);
    }
  });

  it('degrades to an empty list when a city has no anchors', () => {
    const bare: DestinationPack = { ...city('dublin'), travelAnchors: undefined };
    expect(buildTripGettingThereContent(bare).options).toEqual([]);
  });
});
