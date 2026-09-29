import { describe, expect, it } from 'vitest';
import { greatCirclePoint, overflightAt, terrainAt } from '@/lib/live-room/route-terrain';

const LONDON = { lat: 51.5, lng: -0.13 };
const TOKYO = { lat: 35.68, lng: 139.65 };
const LISBON = { lat: 38.72, lng: -9.14 };
const RIO = { lat: -22.9, lng: -43.2 };

describe('route terrain', () => {
  it('interpolates along the great circle', () => {
    expect(greatCirclePoint(LONDON, TOKYO, 0).lat).toBeCloseTo(LONDON.lat, 5);
    expect(greatCirclePoint(LONDON, TOKYO, 1).lng).toBeCloseTo(TOKYO.lng, 5);
    // The London–Tokyo great circle bends far north, over Siberia.
    expect(greatCirclePoint(LONDON, TOKYO, 0.5).lat).toBeGreaterThan(60);
  });

  it('names what the class flies over', () => {
    expect(overflightAt(LONDON, TOKYO, 0.5)).toMatchObject({ terrain: 'forest', name: 'the Siberian taiga' });
    expect(overflightAt(LISBON, RIO, 0.5)).toMatchObject({ terrain: 'ocean', name: 'the Atlantic Ocean' });
    expect(terrainAt({ lat: 25, lng: 10 })).toMatchObject({ terrain: 'desert', name: 'the Sahara Desert' });
    expect(terrainAt({ lat: 28, lng: 86 })).toMatchObject({ terrain: 'mountains', name: 'the Himalayas' });
    expect(terrainAt({ lat: 72, lng: -40 })).toMatchObject({ terrain: 'ice' });
  });

  it('falls back to farmland on land and a named ocean at sea', () => {
    expect(terrainAt({ lat: 50, lng: 10 })).toMatchObject({ terrain: 'farmland', name: 'Europe' });
    expect(terrainAt({ lat: 0, lng: -150 })).toMatchObject({ terrain: 'ocean', name: 'the Pacific Ocean' });
  });
});
