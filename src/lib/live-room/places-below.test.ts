import { describe, expect, it } from 'vitest';
import { citiesAround, featureNear, featureText, sideOf } from '@/lib/live-room/places-below';
import { greatCirclePoint } from '@/lib/live-room/route-terrain';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

// Paris is at 48.9 N, 2.35 E. A plane 100 km due north of it (about 49.8 N) sees it to the south.
const northOfParis = { lat: 49.8, lng: 2.35 };

describe('citiesAround', () => {
  it('puts a city to the south on the right of a plane heading east, and on the left of one heading west', () => {
    const east = citiesAround(northOfParis, 90).find((c) => c.name === 'Paris');
    const west = citiesAround(northOfParis, 270).find((c) => c.name === 'Paris');
    expect(east).toBeDefined();
    expect(east!.lateral).toBeGreaterThan(80);
    expect(sideOf(east!)).toBe('right');
    expect(west!.lateral).toBeLessThan(-80);
    expect(sideOf(west!)).toBe('left');
  });

  it('calls a city dead ahead "ahead"', () => {
    const paris = citiesAround(northOfParis, 180).find((c) => c.name === 'Paris')!; // heading south, straight at it
    expect(paris.ahead).toBeGreaterThan(90);
    expect(sideOf(paris)).toBe('ahead');
  });

  it('leaves out cities beyond the range or well behind the plane, and lists the nearest first', () => {
    expect(citiesAround(northOfParis, 0).find((c) => c.name === 'Paris')).toBeUndefined(); // heading north, Paris is behind
    expect(citiesAround(northOfParis, 90, 50).find((c) => c.name === 'Paris')).toBeUndefined(); // out of range
    const around = citiesAround(northOfParis, 90, 400);
    expect(around.map((c) => c.km)).toEqual([...around.map((c) => c.km)].sort((a, b) => a - b));
  });
});

describe('featureNear', () => {
  it('finds the Nile over Luxor and nothing in the mid-Pacific', () => {
    expect(featureNear({ lat: 25.7, lng: 32.6 })?.name).toBe('the Nile');
    expect(featureNear({ lat: -30, lng: -140 })).toBeNull();
  });

  it('reads rivers and islands as "over" and mountains and sights as "near"', () => {
    expect(featureText({ name: 'the Nile', kind: 'river', km: 5 })).toBe('over the Nile');
    expect(featureText({ name: 'Mont Blanc', kind: 'mountain', km: 5 })).toBe('near Mont Blanc');
  });
});

describe('how often a long flight has something to say', () => {
  const by = (id: string) => WORLD_DESTINATIONS.find((d) => d.id === id)!;
  const share = (from: string, to: string, fn: (p: { lat: number; lng: number }, heading: { lat: number; lng: number }) => boolean) => {
    const A = by(from), B = by(to);
    let hits = 0;
    const steps = 600;
    for (let i = 0; i < steps; i++) {
      const p = greatCirclePoint(A, B, i / steps);
      const next = greatCirclePoint(A, B, (i + 1) / steps);
      if (fn(p, next)) hits++;
    }
    return hits / steps;
  };

  it('now names a city within 150 km far more often than the old 60 km rule did', () => {
    const wide = share('lisbon', 'tokyo', (p, next) => {
      const heading = ((Math.atan2((next.lng - p.lng) * Math.cos((p.lat * Math.PI) / 180), next.lat - p.lat) * 180) / Math.PI + 360) % 360;
      return citiesAround(p, heading, 150).length > 0;
    });
    expect(wide).toBeGreaterThan(0.05); // was about 2% with the old 60 km rule and 154 cities
  });
});
