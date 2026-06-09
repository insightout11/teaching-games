import { describe, expect, it } from 'vitest';
import {
  DEPARTURE_HOUR,
  arrivalHour,
  clockHourAt,
  flightDurationHours,
  timeOfDay,
} from './flight-time';

describe('flightDurationHours', () => {
  it('clamps to the min for very short hops', () => {
    expect(flightDurationHours(50)).toBe(1);
  });

  it('clamps to the max at/above plane range', () => {
    expect(flightDurationHours(5200)).toBe(13);
    expect(flightDurationHours(20000)).toBe(13);
  });

  it('scales between for mid distances (short hop < long haul)', () => {
    const tokyoSeoul = flightDurationHours(1150);
    const bangkokTokyo = flightDurationHours(4599);
    expect(tokyoSeoul).toBeLessThan(bangkokTokyo);
    expect(tokyoSeoul).toBeGreaterThan(1);
  });
});

describe('clock + arrival', () => {
  it('starts at the narrative departure hour', () => {
    expect(clockHourAt(0, 4599)).toBe(DEPARTURE_HOUR);
  });

  it('a long haul arrives around sunrise; a short hop arrives the same evening/night', () => {
    expect(arrivalHour(5200)).toBeCloseTo((DEPARTURE_HOUR + 13) % 24, 5); // ~7:00
    const shortArr = arrivalHour(1150);
    // short hop should NOT roll all the way to morning
    expect(timeOfDay(shortArr)).not.toBe('dawn');
    expect(timeOfDay(shortArr)).not.toBe('day');
  });
});

describe('timeOfDay bands', () => {
  it('classifies representative hours', () => {
    expect(timeOfDay(6)).toBe('dawn');
    expect(timeOfDay(12)).toBe('day');
    expect(timeOfDay(18)).toBe('dusk');
    expect(timeOfDay(23)).toBe('night');
    expect(timeOfDay(2)).toBe('night');
  });

  it('wraps hours outside 0–24', () => {
    expect(timeOfDay(26)).toBe(timeOfDay(2));
  });
});
