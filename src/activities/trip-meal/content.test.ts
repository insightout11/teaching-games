import { describe, it, expect } from 'vitest';
import { buildTripMealContent } from './content';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { DestinationPack } from '@/lib/world-flight/types';

function city(id: string): DestinationPack {
  const found = WORLD_DESTINATIONS.find((d) => d.id === id);
  if (!found) throw new Error(`test fixture missing: ${id}`);
  return found;
}

describe('buildTripMealContent', () => {
  it('packs each real dish with its info line', () => {
    const content = buildTripMealContent(city('dublin'));
    expect(content.activityKey).toBe('trip-meal');
    expect(content.city).toBe('Dublin');
    expect(content.dishes.length).toBeGreaterThanOrEqual(3);
    for (const dish of content.dishes) {
      expect(dish.name.length).toBeGreaterThan(0);
      expect(dish.whatItIs.length).toBeGreaterThan(0); // students learn what it is
    }
    expect(content.framingPrompt).toContain('Dublin');
  });

  it('degrades to an empty list when a city has no anchors', () => {
    const bare: DestinationPack = { ...city('dublin'), travelAnchors: undefined };
    expect(buildTripMealContent(bare).dishes).toEqual([]);
  });
});
