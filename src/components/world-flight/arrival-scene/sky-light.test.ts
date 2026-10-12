import { describe, expect, it } from 'vitest';
import { BLEED_X, CONTENT_W, LAYOUT } from './types';
import { primaryLight, sceneHeading, skyDiscs, type SkyLight } from './sky-light';

const base: SkyLight = {
  sun: { elevation: 40, azimuth: 90 },
  moon: { elevation: -20, azimuth: 270, illumination: 0.5, waxing: true, litOnRight: true },
  heading: 90,
};
const centre = BLEED_X + CONTENT_W / 2;

describe('skyDiscs', () => {
  it('puts the sun in the middle of the frame with no offset, and higher in the sky as it climbs', () => {
    const low = skyDiscs({ ...base, sun: { elevation: 10, azimuth: 90 } }).sun;
    const high = skyDiscs({ ...base, sun: { elevation: 50, azimuth: 90 } }).sun;
    expect(low.x).toBeCloseTo(centre, 0);
    expect(low.y).toBeLessThan(LAYOUT.horizonY);
    expect(high.y).toBeLessThan(low.y);
  });

  it('moves the sun left or right of centre with the per-city offset', () => {
    expect(skyDiscs(base, -25).sun.x).toBeLessThan(centre);
    expect(skyDiscs(base, 25).sun.x).toBeGreaterThan(centre);
  });

  it('keeps the sun in shot wherever the plane is heading (the camera turns toward it)', () => {
    for (const heading of [0, 90, 180, 270]) {
      const discs = skyDiscs({ ...base, sun: { elevation: 30, azimuth: 262 }, heading });
      expect(discs.sun.visible).toBe(true);
      expect(primaryLight(discs)).toBeDefined();
    }
  });

  it('keeps a sun below the horizon out of shot', () => {
    expect(skyDiscs({ ...base, sun: { elevation: -10, azimuth: 90 } }).sun.visible).toBe(false);
  });

  it('lights the scene from the sun by day and from the moon at night', () => {
    expect(primaryLight(skyDiscs(base))).toBeDefined();
    const night: SkyLight = { sun: { elevation: -30, azimuth: 300 }, moon: { elevation: 40, azimuth: 90, illumination: 0.8, waxing: true, litOnRight: true }, heading: 90 };
    expect(primaryLight(skyDiscs(night))?.x).toBeCloseTo(skyDiscs(night).moon.x, 5);
  });

  it('turns toward the moon once the sun has set, and shows it where it really is in height', () => {
    const night: SkyLight = { sun: { elevation: -25, azimuth: 280 }, moon: { elevation: 35, azimuth: 120, illumination: 0.7, waxing: false, litOnRight: false }, heading: 90 };
    const discs = skyDiscs(night);
    expect(discs.moon.visible).toBe(true);
    expect(discs.sun.visible).toBe(false);
    expect(discs.moon.y).toBeCloseTo(LAYOUT.horizonY - 35 * 8.8, 5);
    expect(discs.moon.litOnRight).toBe(false);
  });

  it('shows nothing, and does not invent a light, when both sun and moon are below the horizon', () => {
    const dark: SkyLight = { sun: { elevation: -40, azimuth: 300 }, moon: { elevation: -20, azimuth: 60, illumination: 0.2, waxing: true, litOnRight: true }, heading: 90 };
    const discs = skyDiscs(dark);
    expect(discs.sun.visible).toBe(false);
    expect(discs.moon.visible).toBe(false);
    expect(primaryLight(discs)).toBeUndefined();
    expect(sceneHeading(dark)).toBe(90); // falls back to the plane's own heading
  });
});

describe('an ordinary evening class', () => {
  // The case that mattered: late afternoon in the tropics, the plane just arrived and pointing east (the flight deck's
  // heading on landing) while the sun is low in the west.
  it('still has a sun in shot and a light to shine from', () => {
    const evening: SkyLight = { sun: { elevation: 12, azimuth: 262 }, moon: { elevation: -15, azimuth: 80, illumination: 0.4, waxing: true, litOnRight: true }, heading: 90 };
    const discs = skyDiscs(evening, 10);
    expect(discs.sun.visible).toBe(true);
    expect(primaryLight(discs)).toBeDefined();
  });
});
