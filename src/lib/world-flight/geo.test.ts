import { describe, expect, it } from 'vitest';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { destinationsWithinRange, distanceKm, greatCircleLine, rangePolygon, rangeRing } from '@/lib/world-flight/geo';

function destination(id: string) {
  const match = WORLD_DESTINATIONS.find((item) => item.id === id);
  if (!match) throw new Error(`Missing test destination: ${id}`);
  return match;
}

describe('world flight geography', () => {
  it('calculates a realistic Bangkok to Tokyo great-circle distance', () => {
    expect(distanceKm(destination('bangkok'), destination('tokyo'))).toBeCloseTo(4599, -1);
  });

  it('keeps date-line routes visually continuous', () => {
    const coordinates = greatCircleLine(destination('bangkok'), destination('new-york')).geometry.coordinates;
    const largestLongitudeStep = coordinates.reduce((largest, coordinate, index) => {
      if (index === 0) return largest;
      return Math.max(largest, Math.abs(coordinate[0] - coordinates[index - 1][0]));
    }, 0);

    expect(largestLongitudeStep).toBeLessThan(180);
  });

  it('creates a closed range-ring polygon', () => {
    const coordinates = rangePolygon(destination('bangkok'), 5200).geometry.coordinates[0];
    expect(coordinates[0]).toEqual(coordinates.at(-1));
  });

  it('keeps date-line-crossing range rings visually continuous', () => {
    const coordinates = rangeRing(destination('vancouver'), 5200).geometry.coordinates;
    const largestLongitudeStep = coordinates.reduce((largest, coordinate, index) => {
      if (index === 0) return largest;
      return Math.max(largest, Math.abs(coordinate[0] - coordinates[index - 1][0]));
    }, 0);

    expect(largestLongitudeStep).toBeLessThan(180);
  });

  it('accurately identifies onward destinations from a candidate city', () => {
    const nextHops = destinationsWithinRange(destination('honolulu'), WORLD_DESTINATIONS, 5200);

    expect(distanceKm(destination('honolulu'), destination('tokyo'))).toBeCloseTo(6200, -2);
    expect(nextHops.some((candidate) => candidate.destination.id === 'tokyo')).toBe(false);
  });
});
