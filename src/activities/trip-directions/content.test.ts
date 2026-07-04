import { describe, it, expect } from 'vitest';
import { buildTripDirectionsContent } from './content';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { distanceBetweenCoordsKm } from '@/lib/world-flight/geo';
import type { DestinationPack } from '@/lib/world-flight/types';

function city(id: string): DestinationPack {
  const found = WORLD_DESTINATIONS.find((d) => d.id === id);
  if (!found) throw new Error(`test fixture missing: ${id}`);
  return found;
}

describe('buildTripDirectionsContent', () => {
  it('provides real landmarks with coordinates for a hero city (Dublin), with a named start', () => {
    const content = buildTripDirectionsContent(city('dublin'));
    expect(content.activityKey).toBe('trip-directions');
    expect(content.city).toBe('Dublin');
    expect(content.landmarks.length).toBeGreaterThanOrEqual(3);
    for (const landmark of content.landmarks) {
      expect(Number.isFinite(landmark.lat)).toBe(true);
      expect(Number.isFinite(landmark.lng)).toBe(true);
      expect(landmark.name.length).toBeGreaterThan(0);
    }
    // Hero cities keep their curated, recognisable start point.
    expect(content.start.name).toBe("O'Connell Bridge");
  });

  it('is playable in EVERY destination — 3+ landmarks near a sensible start', () => {
    for (const destination of WORLD_DESTINATIONS) {
      const content = buildTripDirectionsContent(destination);
      expect(content.landmarks.length, destination.id).toBeGreaterThanOrEqual(3);
      for (const landmark of content.landmarks) {
        expect(Number.isFinite(landmark.lat), `${destination.id}/${landmark.id}`).toBe(true);
        expect(Number.isFinite(landmark.lng), `${destination.id}/${landmark.id}`).toBe(true);
        // The start and every landmark must sit within one playable city map.
        expect(
          distanceBetweenCoordsKm(content.start, landmark),
          `${destination.id}/${landmark.id} too far from start`,
        ).toBeLessThanOrEqual(60);
      }
      expect(content.start.name.length).toBeGreaterThan(0);
      expect(Number.isFinite(content.center.lat)).toBe(true);
    }
  });

  it('degrades to an empty landmark list when anchors are missing', () => {
    const bare: DestinationPack = { ...city('suva'), travelAnchors: undefined };
    // Suva has no curated hero fallback, so stripped anchors -> graceful empty state.
    expect(buildTripDirectionsContent(bare).landmarks).toEqual([]);
  });
});
