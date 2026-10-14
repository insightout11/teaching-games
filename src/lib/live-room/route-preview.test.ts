import { describe, expect, it } from 'vitest';
import { routePreview } from './route-preview';

const madrid = { city: 'Madrid', lat: 40.4168, lng: -3.7038 };
const lisbon = { city: 'Lisbon', lat: 38.7223, lng: -9.1393 };
const tokyo = { city: 'Tokyo', lat: 35.6762, lng: 139.6503 };
const bangkok = { city: 'Bangkok', lat: 13.7563, lng: 100.5018 };

describe('routePreview', () => {
  it('ends with the landing, in time order, without naming the two end cities on the way', () => {
    for (const [a, b] of [[madrid, lisbon], [bangkok, tokyo]] as const) {
      const stops = routePreview(a, b, null, 55);
      console.log(`${a.city} → ${b.city}:`, stops.map((s) => `${s.at}m ${s.text}`).join(' | '));
      expect(stops[stops.length - 1]).toEqual({ at: 55, text: `Land in ${b.city}` });
      expect(stops.length).toBeLessThanOrEqual(7);
      stops.slice(0, -1).forEach((s, i, arr) => {
        expect(s.text).not.toBe(`Over ${a.city}`);
        expect(s.text).not.toBe(`Over ${b.city}`);
        if (i) expect(s.at).toBeGreaterThanOrEqual(arr[i - 1].at);
      });
    }
  });
});
