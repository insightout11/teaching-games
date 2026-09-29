import { describe, expect, it } from 'vitest';
import { bearingDeg, solarClock, sunPosition } from '@/lib/live-room/sun';

describe('sun position', () => {
  it('is high at local noon near the equator on an equinox', () => {
    const s = sunPosition({ lat: 0, lng: 0 }, new Date('2026-03-20T12:07:00Z'));
    expect(s.elevation).toBeGreaterThan(85);
  });

  it('is below the horizon at local midnight', () => {
    expect(sunPosition({ lat: 51.5, lng: -0.1 }, new Date('2026-06-21T00:00:00Z')).elevation).toBeLessThan(0);
  });

  it('rises in the east and sets in the west', () => {
    // London, spring morning and evening
    const morning = sunPosition({ lat: 51.5, lng: -0.1 }, new Date('2026-04-15T06:00:00Z'));
    const evening = sunPosition({ lat: 51.5, lng: -0.1 }, new Date('2026-04-15T18:30:00Z'));
    expect(morning.azimuth).toBeGreaterThan(60);
    expect(morning.azimuth).toBeLessThan(120);
    expect(evening.azimuth).toBeGreaterThan(260);
    expect(evening.azimuth).toBeLessThan(310);
  });

  it('flying east brings the evening sooner', () => {
    const t = new Date('2026-09-29T09:00:00Z');
    expect(sunPosition({ lat: 35, lng: 139 }, t).elevation).toBeLessThan(sunPosition({ lat: 35, lng: 100 }, t).elevation);
  });

  it('gives the local solar time and headings', () => {
    expect(solarClock(0, new Date('2026-09-29T18:40:00Z'))).toBe('6:40 pm');
    expect(solarClock(90, new Date('2026-09-29T18:00:00Z'))).toBe('12:00 am');
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 0, lng: 10 })).toBeCloseTo(90, 0);
  });
});
