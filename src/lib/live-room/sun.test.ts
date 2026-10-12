import { describe, expect, it } from 'vitest';
import { moonPosition, sunPosition } from '@/lib/live-room/sun';

const greenwich = { lat: 51.5, lng: 0 };

describe('moonPosition', () => {
  it('is nearly dark at a known new moon (2000-01-06 18:14 UTC)', () => {
    expect(moonPosition(greenwich, new Date('2000-01-06T18:14:00Z')).illumination).toBeLessThan(0.02);
  });

  it('is nearly full at a known full moon (2000-01-21 04:40 UTC)', () => {
    expect(moonPosition(greenwich, new Date('2000-01-21T04:40:00Z')).illumination).toBeGreaterThan(0.98);
  });

  it('is waxing a few days after new moon and waning a few days after full', () => {
    expect(moonPosition(greenwich, new Date('2000-01-10T12:00:00Z')).waxing).toBe(true);
    expect(moonPosition(greenwich, new Date('2000-01-25T12:00:00Z')).waxing).toBe(false);
  });

  it('lights the opposite side from the southern hemisphere', () => {
    const t = new Date('2000-01-10T12:00:00Z'); // waxing
    expect(moonPosition({ lat: 51.5, lng: 0 }, t).litOnRight).toBe(true);
    expect(moonPosition({ lat: -33.9, lng: 151.2 }, t).litOnRight).toBe(false);
  });

  it('is high in the sky at night when full and roughly opposite the sun', () => {
    const t = new Date('2000-01-21T00:00:00Z'); // midnight in Greenwich, full moon
    const moon = moonPosition(greenwich, t);
    const sun = sunPosition(greenwich, t);
    expect(sun.elevation).toBeLessThan(0);
    expect(moon.elevation).toBeGreaterThan(20);
    const apart = Math.abs(((moon.azimuth - sun.azimuth + 360) % 360) - 180); // 0 = exactly opposite
    expect(apart).toBeLessThan(30);
  });
});
