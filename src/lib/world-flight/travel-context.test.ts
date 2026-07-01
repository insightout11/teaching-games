import { describe, it, expect } from 'vitest';
import { buildTripItinerary, type TripStageId } from './travel-context';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { DestinationPack } from './types';

const ALL_STAGES: TripStageId[] = [
  'departures',
  'arrival',
  'getting-there',
  'hotel',
  'attraction',
  'local-table',
  'landing',
];

function findCity(id: string): DestinationPack {
  const city = WORLD_DESTINATIONS.find((d) => d.id === id);
  if (!city) throw new Error(`test fixture missing: ${id}`);
  return city;
}

describe('buildTripItinerary', () => {
  it('produces a grounded source for every trip stage', () => {
    const itinerary = buildTripItinerary(findCity('tokyo'));
    for (const stage of ALL_STAGES) {
      expect(itinerary[stage]).toBeDefined();
      expect(itinerary[stage].sourceType).toBe('travel-english');
      expect(itinerary[stage].summary.length).toBeGreaterThan(0);
      expect(itinerary[stage].title).toContain('Tokyo');
    }
  });

  it('grounds the attraction stage on the city\'s real attractions', () => {
    const tokyo = findCity('tokyo');
    const itinerary = buildTripItinerary(tokyo);
    const firstAttraction = tokyo.travelAnchors?.attractions[0]?.name;
    expect(firstAttraction).toBeTruthy();
    expect(itinerary.attraction.summary).toContain(firstAttraction!);
  });

  it('grounds the meal stage on the city\'s real dishes', () => {
    const tokyo = findCity('tokyo');
    const itinerary = buildTripItinerary(tokyo);
    const firstDish = tokyo.travelAnchors?.dishes[0]?.name;
    expect(firstDish).toBeTruthy();
    expect(itinerary['local-table'].summary).toContain(firstDish!);
  });

  it('references the real airport in the getting-there stage', () => {
    const tokyo = findCity('tokyo');
    const itinerary = buildTripItinerary(tokyo);
    expect(itinerary['getting-there'].summary).toContain(tokyo.primaryAirport);
  });

  it('falls back gracefully when a destination has no travelAnchors', () => {
    const bare: DestinationPack = { ...findCity('tokyo'), travelAnchors: undefined };
    const itinerary = buildTripItinerary(bare);
    // Still produces all stages; attraction/meal use generic framing without throwing.
    for (const stage of ALL_STAGES) {
      expect(itinerary[stage].summary).toContain('travel English');
    }
    expect(itinerary.attraction.summary).toContain('attractions');
    expect(itinerary['local-table'].summary).toContain('local');
  });
});
