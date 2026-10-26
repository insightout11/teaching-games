import { describe, expect, it } from 'vitest';
import { flightClock, reanchorFlight } from '@/lib/live-room/flight-clock';

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

  it('+5 / -5 mid-flight keeps the plane where it is and only changes its speed', () => {
    // 25 minutes into a 50-minute flight: it used to jump back to 45% (+5) or ahead to 56% (-5).
    const takeoffAt = start + 5 * MIN, now = takeoffAt + 25 * MIN;
    for (const delta of [5, -5]) {
      const anchor = reanchorFlight({ classStartAt: start, classMinutes: 60, takeoffAt, now });
      const after = flightClock({ classStartAt: start, classMinutes: 60 + delta, takeoffAt, now, anchor });
      expect(after.routeT).toBeCloseTo(0.5);
      expect(after.minutesLeft).toBeCloseTo(25 + delta);
      expect(after.minutesFlown).toBeCloseTo(25);
      // ...and it still arrives exactly 5 minutes before the new end
      const later = flightClock({ classStartAt: start, classMinutes: 60 + delta, takeoffAt, now: after.landAt, anchor });
      expect(later.routeT).toBe(1);
    }
  });

  it('repeated changes stay continuous', () => {
    const takeoffAt = start;
    let minutes = 60, anchor = null as ReturnType<typeof reanchorFlight>;
    let t = flightClock({ classStartAt: start, classMinutes: minutes, takeoffAt, now: start }).routeT;
    for (const [at, delta] of [[10, 5], [20, -10], [30, 15], [40, -5]] as const) {
      const now = start + at * MIN;
      const before = flightClock({ classStartAt: start, classMinutes: minutes, takeoffAt, now, anchor }).routeT;
      expect(before).toBeGreaterThanOrEqual(t);
      anchor = reanchorFlight({ classStartAt: start, classMinutes: minutes, takeoffAt, now, anchor });
      minutes += delta;
      expect(flightClock({ classStartAt: start, classMinutes: minutes, takeoffAt, now, anchor }).routeT).toBeCloseTo(before);
      t = before;
    }
  });

  it('an arrived plane stays arrived when the class is extended', () => {
    const takeoffAt = start, now = start + 57 * MIN;
    const anchor = reanchorFlight({ classStartAt: start, classMinutes: 60, takeoffAt, now });
    const c = flightClock({ classStartAt: start, classMinutes: 75, takeoffAt, now: now + MIN, anchor });
    expect(c.routeT).toBe(1);
    expect(c.holding).toBe(true);
  });

  it('an end that is already too close makes the plane hurry, never jump', () => {
    const takeoffAt = start, now = start + 40 * MIN;
    const anchor = reanchorFlight({ classStartAt: start, classMinutes: 60, takeoffAt, now });
    const c = flightClock({ classStartAt: start, classMinutes: 30, takeoffAt, now, anchor });
    expect(c.routeT).toBeCloseTo(40 / 55);
    expect(c.holding).toBe(false);
    expect(c.perMs).toBeCloseTo(1 / (3 * MIN));
  });

  it('a new flight ignores the previous flight anchor', () => {
    const anchor = { takeoffAt: start, at: start + 10 * MIN, t: 0.9 };
    const c = flightClock({ classStartAt: start, classMinutes: 60, takeoffAt: start + 20 * MIN, now: start + 20 * MIN, anchor });
    expect(c.routeT).toBe(0);
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
