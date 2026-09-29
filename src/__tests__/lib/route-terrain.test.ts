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

  it('knows sea from land along an Asian route (Seoul to Bangkok)', () => {
    const SEOUL = { lat: 37.57, lng: 126.98 };
    const BANGKOK = { lat: 13.75, lng: 100.5 };
    expect(overflightAt(SEOUL, BANGKOK, 0.1)).toMatchObject({ terrain: 'ocean', name: 'the Yellow Sea' });
    expect(terrainAt({ lat: 37.3, lng: 127 })).toMatchObject({ terrain: 'farmland', name: 'Asia' });
    expect(terrainAt({ lat: 36.5, lng: 128.5 })).toMatchObject({ terrain: 'hills', name: 'the mountains of Korea' });
    expect(terrainAt({ lat: 10, lng: 101.5 })).toMatchObject({ terrain: 'ocean', name: 'the Gulf of Thailand' });
    expect(terrainAt({ lat: 28, lng: 125 })).toMatchObject({ terrain: 'ocean', name: 'the East China Sea' });
    expect(terrainAt({ lat: 14, lng: 100.6 }).terrain).not.toBe('ocean');
  });

  it('keeps land scenery off the sea and sea names off the land', () => {
    expect(terrainAt({ lat: 42, lng: 51 })).toMatchObject({ terrain: 'ocean', name: 'the Caspian Sea' });
    expect(terrainAt({ lat: 36, lng: 138 }).terrain).not.toBe('ocean'); // Honshu, inside the Sea of Japan box
    expect(terrainAt({ lat: 40, lng: 135 })).toMatchObject({ terrain: 'ocean', name: 'the Sea of Japan' });
  });
});
