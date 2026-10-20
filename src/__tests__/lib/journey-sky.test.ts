import { describe, expect, it } from 'vitest';
import { activeShower, moonPhaseName, planetPosition, sideOfSky } from '@/lib/live-room/journey-sky';
import { sunPosition } from '@/lib/live-room/sun';

const sep = (a: { elevation: number; azimuth: number }, b: { elevation: number; azimuth: number }) => {
  const r = Math.PI / 180;
  const c = Math.sin(a.elevation * r) * Math.sin(b.elevation * r) + Math.cos(a.elevation * r) * Math.cos(b.elevation * r) * Math.cos((a.azimuth - b.azimuth) * r);
  return Math.acos(Math.max(-1, Math.min(1, c))) / r;
};

describe('the night sky on the journey', () => {
  it('names the moon phases', () => {
    expect(moonPhaseName(0.01, true)).toBe('a new moon');
    expect(moonPhaseName(0.2, true)).toBe('a waxing crescent moon');
    expect(moonPhaseName(0.5, false)).toBe('a last quarter moon');
    expect(moonPhaseName(0.99, false)).toBe('a full moon');
  });

  it('keeps Venus near the sun (never more than about 47 degrees away), all year', () => {
    const p = { lat: 13.7, lng: 100.5 };
    for (let m = 0; m < 24; m++) {
      const date = new Date(Date.UTC(2026, m, 15, 12));
      expect(sep(planetPosition('Venus', p, date), sunPosition(p, date))).toBeLessThan(49);
    }
  });

  it('finds the Perseids in mid-August and nothing in early March', () => {
    expect(activeShower(new Date(Date.UTC(2026, 7, 12)))?.name).toBe('the Perseids');
    expect(activeShower(new Date(Date.UTC(2026, 2, 3)))).toBeNull();
  });

  it('says which side of the plane', () => {
    expect(sideOfSky(270, 0)).toBe('on our left');
    expect(sideOfSky(10, 0)).toBe('ahead of us');
  });
});
