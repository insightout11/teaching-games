import { describe, it, expect } from 'vitest';
import type { DestinationScene } from '@/lib/world-flight/types';
import { destinationClimate, rollWeather, WEATHER_CONDITIONS, WEATHER_PROFILE } from '../weather';

const scene = (over: Partial<DestinationScene>): DestinationScene => ({
  terrain: 'flatland',
  skyline: 'dense',
  palette: 'dawn',
  ...over,
});

describe('destinationClimate', () => {
  it('buckets by palette / terrain / vegetation', () => {
    expect(destinationClimate(scene({ palette: 'winter' }))).toBe('polar');
    expect(destinationClimate(scene({ terrain: 'desert' }))).toBe('desert');
    expect(destinationClimate(scene({ palette: 'tropical' }))).toBe('tropical');
    expect(destinationClimate(scene({ vegetation: 'palms' }))).toBe('tropical');
    expect(destinationClimate(scene({}))).toBe('temperate');
  });

  it('cold palette wins over desert/palms', () => {
    expect(destinationClimate(scene({ palette: 'winter', terrain: 'desert' }))).toBe('polar');
  });
});

describe('rollWeather', () => {
  it('is deterministic for a given seed', () => {
    const s = scene({ palette: 'tropical' });
    expect(rollWeather('flight-1:rio', s)).toBe(rollWeather('flight-1:rio', s));
  });

  it('always returns a valid condition', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(WEATHER_CONDITIONS).toContain(rollWeather(`seed-${i}`, scene({ palette: 'tropical' })));
    }
  });

  it('desert never snows or auroras and is mostly clear', () => {
    const s = scene({ terrain: 'desert' });
    let clear = 0;
    for (let i = 0; i < 300; i += 1) {
      const w = rollWeather(`d-${i}`, s, true);
      expect(w).not.toBe('snow');
      expect(w).not.toBe('aurora');
      if (w === 'clear') clear += 1;
    }
    expect(clear).toBeGreaterThan(150);
  });

  it('aurora only appears at night, and snow can appear in polar climates', () => {
    const s = scene({ palette: 'winter' });
    for (let i = 0; i < 300; i += 1) {
      expect(rollWeather(`day-${i}`, s, false)).not.toBe('aurora');
    }
    let auroraNight = 0;
    let snow = 0;
    for (let i = 0; i < 300; i += 1) {
      const w = rollWeather(`night-${i}`, s, true);
      if (w === 'aurora') auroraNight += 1;
      if (w === 'snow') snow += 1;
    }
    expect(auroraNight).toBeGreaterThan(0);
    expect(snow).toBeGreaterThan(0);
  });
});

describe('WEATHER_PROFILE', () => {
  it('clear is a no-op and every condition has a profile', () => {
    expect(WEATHER_PROFILE.clear).toEqual({ dim: 0, cloudCover: 0, rain: 0, snow: 0, lightning: false, aurora: false });
    for (const c of WEATHER_CONDITIONS) expect(WEATHER_PROFILE[c]).toBeDefined();
  });
});
