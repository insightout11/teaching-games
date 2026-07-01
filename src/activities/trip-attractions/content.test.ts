import { describe, it, expect } from 'vitest';
import { buildTripAttractionsContent } from './content';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { DestinationPack } from '@/lib/world-flight/types';

function city(id: string): DestinationPack {
  const found = WORLD_DESTINATIONS.find((d) => d.id === id);
  if (!found) throw new Error(`test fixture missing: ${id}`);
  return found;
}

describe('buildTripAttractionsContent', () => {
  it('packs each real attraction with its info line', () => {
    const content = buildTripAttractionsContent(city('tokyo'));
    expect(content.activityKey).toBe('trip-attractions');
    expect(content.city).toBe('Tokyo');
    expect(content.attractions.length).toBeGreaterThanOrEqual(3);
    for (const attraction of content.attractions) {
      expect(attraction.name.length).toBeGreaterThan(0);
      expect(attraction.whatItIs.length).toBeGreaterThan(0); // students get info
    }
    expect(content.framingPrompt).toContain('Tokyo');
  });

  it('degrades to an empty list when a city has no anchors', () => {
    const bare: DestinationPack = { ...city('tokyo'), travelAnchors: undefined };
    const content = buildTripAttractionsContent(bare);
    expect(content.attractions).toEqual([]);
    expect(content.framingPrompt).toContain('Tokyo');
  });
});
