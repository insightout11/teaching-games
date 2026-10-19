import { describe, expect, it } from 'vitest';
import { flightClock } from '@/lib/live-room/flight-clock';

const MIN = 60_000;
const start = 1_000_000_000_000;

describe('flightClock', () => {
  it('a take-off at the start arrives 5 minutes before the end', () => {
    const c = flightClock({ classStartAt: start, classMinutes: 60, takeoffAt: start, now: start });
    expect(c.flightMs).toBe(55 * MIN);
    expect(c.landAt).toBe(start + 55 * MIN);
  });

  it('a late take-off flies faster and still lands on time (the Cairo case)', () => {
    const takeoffAt = start + 12 * MIN;
    const c = flightClock({ classStartAt: start, classMinutes: 60, takeoffAt, now: takeoffAt + 43 * MIN });
    expect(c.flightMs).toBe(43 * MIN);
    expect(c.routeT).toBe(1);
    expect(c.holding).toBe(true);
    expect(c.classMinutesLeft).toBe(5);
  });

  it('halfway through the flight', () => {
    const takeoffAt = start + 10 * MIN;
    const c = flightClock({ classStartAt: start, classMinutes: 60, takeoffAt, now: takeoffAt + 22.5 * MIN });
    expect(c.routeT).toBeCloseTo(0.5);
    expect(c.minutesLeft).toBeCloseTo(22.5);
    expect(c.holding).toBe(false);
  });

  it('+5 minutes moves the arrival', () => {
    const takeoffAt = start;
    const a = flightClock({ classStartAt: start, classMinutes: 60, takeoffAt, now: start + 30 * MIN });
    const b = flightClock({ classStartAt: start, classMinutes: 65, takeoffAt, now: start + 30 * MIN });
    expect(b.landAt - a.landAt).toBe(5 * MIN);
    expect(b.routeT).toBeLessThan(a.routeT);
  });

  it('never a flight shorter than 3 minutes, even after the class should have ended', () => {
    const takeoffAt = start + 70 * MIN;
    const c = flightClock({ classStartAt: start, classMinutes: 60, takeoffAt, now: takeoffAt });
    expect(c.flightMs).toBe(3 * MIN);
    expect(c.classMinutesLeft).toBe(0);
  });

  it('before take-off: no route progress', () => {
    const c = flightClock({ classStartAt: start, classMinutes: 45, takeoffAt: null, now: start + 5 * MIN });
    expect(c.routeT).toBe(0);
    expect(c.minutesLeft).toBeNull();
    expect(c.flightMs).toBe(35 * MIN);
  });
});
