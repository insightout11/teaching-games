import { describe, it, expect } from 'vitest';
import { buildTripDirectionsContent } from './content';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

describe('buildTripDirectionsContent', () => {
  it('provides real landmarks with coordinates for a hero city (Dublin)', () => {
    const dublin = WORLD_DESTINATIONS.find((d) => d.id === 'dublin')!;
    const content = buildTripDirectionsContent(dublin);
    expect(content.activityKey).toBe('trip-directions');
    expect(content.city).toBe('Dublin');
    expect(content.landmarks.length).toBeGreaterThanOrEqual(3);
    for (const landmark of content.landmarks) {
      expect(Number.isFinite(landmark.lat)).toBe(true);
      expect(Number.isFinite(landmark.lng)).toBe(true);
      expect(landmark.name.length).toBeGreaterThan(0);
    }
    expect(content.start.name.length).toBeGreaterThan(0);
    expect(Number.isFinite(content.center.lat)).toBe(true);
  });

  it('returns an empty landmark list for a city without coords yet', () => {
    const noCoords = WORLD_DESTINATIONS.find((d) => d.id === 'suva')!;
    expect(buildTripDirectionsContent(noCoords).landmarks).toEqual([]);
  });
});
