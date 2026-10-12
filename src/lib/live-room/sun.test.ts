import { describe, expect, it } from 'vitest';
import { moonPosition, sunChase, sunPosition } from '@/lib/live-room/sun';

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

describe('sunChase', () => {
  const rome = { lat: 41.9, lng: 12.5 };
  const madrid = { lat: 40.4, lng: -3.7 };
  const lisbon = { lat: 38.7, lng: -9.1 };
  const tokyo = { lat: 35.7, lng: 139.7 };
  const flightMs = 55 * 60_000;
  const step = 120_000;
  const mid = (a: { lat: number; lng: number }, b: { lat: number; lng: number }, t: number) => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });

  it('notices a plane flying west at about the sun\'s pace on an evening flight (Rome to Madrid)', () => {
    const at = new Date('2026-10-12T14:30:00Z'); // late afternoon over Italy, sun low in the west
    const t = 0.3;
    expect(sunChase(mid(rome, madrid, t), mid(rome, madrid, t + step / flightMs), at, step)).toBe(true);
  });

  it('does not claim it when the plane flies east, into a fast sunset', () => {
    const at = new Date('2026-10-12T12:00:00Z');
    const t = 0.3;
    expect(sunChase(mid(lisbon, tokyo, t), mid(lisbon, tokyo, t + step / flightMs), at, step)).toBe(false);
  });

  it('does not claim it at night, or at noon when the sun is barely moving for anyone', () => {
    const night = new Date('2026-10-12T22:00:00Z');
    expect(sunChase(mid(rome, madrid, 0.3), mid(rome, madrid, 0.3 + step / flightMs), night, step)).toBe(false);
    const noon = new Date('2026-10-12T11:00:00Z'); // solar noon near Rome
    expect(sunChase({ lat: 41.9, lng: 12.5 }, { lat: 41.9, lng: 12.4 }, noon, step)).toBe(false);
  });
});
