import { describe, expect, it } from 'vitest';
import raw from '@/data/world/countries-110m.json';
import { cityNear, countryAt, toShapes } from '@/lib/live-room/places-below';
import type { Ring } from '@/lib/live-room/land-outlines';

const shapes = toShapes(raw as unknown as Array<[string, Ring[]]>);

describe('places below', () => {
  it('names the country under a point', () => {
    expect(countryAt(shapes, { lat: 30.6, lng: 114.3 })).toBe('China');
    expect(countryAt(shapes, { lat: 37.5, lng: 127.5 })).toBe('South Korea');
    expect(countryAt(shapes, { lat: 15, lng: 101 })).toBe('Thailand');
    expect(countryAt(shapes, { lat: 48.5, lng: 2.5 })).toBe('France');
    expect(countryAt(shapes, { lat: -29.5, lng: 28.3 })).toBe('Lesotho');
    expect(countryAt(shapes, { lat: 35, lng: 124 })).toBeNull(); // Yellow Sea
  });

  it('finds a big city nearby', () => {
    expect(cityNear({ lat: 30.7, lng: 114.5 })).toMatchObject({ name: 'Wuhan' });
    expect(cityNear({ lat: 32, lng: 110 })).toBeNull();
  });
});
