import { describe, expect, it } from 'vitest';
import { landAt, routeSpread, VIEW_UNITS_PER_SEC } from '@/components/live-room/flight/cockpit-world';
import { realCoast } from '@/components/live-room/flight/ground-texture';

describe('coast rendering preserves flight behaviour', () => {
  it('keeps real coastlines off by default in classes', () => {
    expect(realCoast()).toBe(false);
  });
  it('keeps the original cruise speed and one route spread for slow flights', () => {
    expect(VIEW_UNITS_PER_SEC).toBe(0.55 * 4200);
    const clock = { at: 0, t: 0.3, km: 1000, perMs: 1 / 7_200_000 };
    const spread = routeSpread(clock);
    expect(clock.km * 400 * clock.perMs * 1000 * spread).toBeCloseTo(VIEW_UNITS_PER_SEC);
    expect(routeSpread({ ...clock, t: 0.9 })).toBe(spread);
    expect(routeSpread({ ...clock, perMs: 1 / 60_000 })).toBe(1);
    expect(routeSpread(null)).toBe(1);
  });
  it('keeps the land mask used by peaks and town lights consistent at holes and coast crossings', () => {
    const edges: number[] = [];
    for (const [left, right, front, back] of [[-100, 100, 0, 100], [-20, 20, 40, 60]]) {
      edges.push(left, front, left, back, right, front, right, back);
    }
    const cw = { edges, buckets: new Map([[0, [0, 1, 2, 3]]]) };
    expect(landAt(cw, 50, 50)).toBe(true);
    expect(landAt(cw, 0, 50)).toBe(false); // sea inside a hole
    expect(landAt(cw, 0, 20)).toBe(true);
    expect(landAt(cw, 101, 20)).toBe(false);
    expect(landAt(cw, -101, 20)).toBe(false);
    expect(landAt(cw, 0, 101)).toBe(false);
  });
});
