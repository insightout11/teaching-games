import { describe, expect, it } from 'vitest';
import { clipCoastLine, clipCoastView, coastCacheBand, coastCacheRow, groundMixAt, toRoute, type CoastStrip } from '@/lib/live-room/coast-strip';
import { greatCirclePoint } from '@/lib/live-room/route-terrain';

const manila = { lat: 14.5995, lng: 120.9842 }, hanoi = { lat: 21.0278, lng: 105.8342 };

describe('cached coast pixels follow the ground camera', () => {
  it('joins resampled bands without transparent seams at fractional display scales', () => {
    for (const pixel of [1, 0.8, 1.25]) {
      let previous: number | null = null;
      for (let y = 470; y < 690; y += 2) {
        const a = coastCacheRow(y, 400, 1100, 3200, 3200, 800)!;
        const b = coastCacheRow(y + 2, 400, 1100, 3200, 3200, 800)!;
        const [from, to] = coastCacheBand(a.y, b.y, pixel);
        if (previous !== null) expect(from).toBe(previous);
        expect(from / pixel).toBeCloseTo(Math.round(from / pixel));
        expect(to / pixel).toBeCloseTo(Math.round(to / pixel));
        previous = to;
      }
    }
  });
  it('matches direct world projection when the camera moves and changes height', () => {
    const horizon = 400, focal = 1100, height = 3200, nextHeight = 3100;
    for (const depth of [14000, 30000, 60000]) {
      const row = coastCacheRow(horizon + height * focal / depth, horizon, focal, height, nextHeight, 1200)!;
      expect(row.y).toBeCloseTo(horizon + nextHeight * focal / (depth - 1200));
      expect(2000 * focal / depth * row.scale).toBeCloseTo(2000 * focal / (depth - 1200));
    }
  });
  it('leaves an unmoved view still and rejects rows behind the camera', () => {
    expect(coastCacheRow(600, 400, 1100, 3200, 3200, 0)).toEqual({ y: 600, scale: 1 });
    expect(coastCacheRow(400, 400, 1100, 3200, 3200, 0)).toBeNull();
    expect(coastCacheRow(600, 400, 1100, 3200, 3200, 20000)).toBeNull();
  });
});

describe('coast polygons in the camera view', () => {
  it('clips crossing edges to near, far and side planes before projection', () => {
    const pts = clipCoastView([[-100, 0], [100, 0], [100, 200], [-100, 200]], 10, 5, 50, 0.5);
    expect(pts.length).toBeGreaterThanOrEqual(4);
    for (const [x, z] of pts) {
      expect(z).toBeGreaterThanOrEqual(15);
      expect(z).toBeLessThanOrEqual(60);
      expect(Math.abs(x)).toBeLessThanOrEqual((z - 10) * 0.5 + 1e-9);
    }
  });
  it('discards land behind the camera and retains land enclosing the view', () => {
    expect(clipCoastView([[0, -20], [10, -10], [-10, -10]], 0, 1, 50, 0.5)).toEqual([]);
    expect(clipCoastView([[-100, -10], [100, -10], [100, 100], [-100, 100]], 0, 1, 50, 0.5)).toHaveLength(4);
  });
  it('clips shores crossing the near plane without drawing a closing beach across the view', () => {
    const crossing = clipCoastLine([0, -10], [0, 100], 0, 5, 50, 0.5);
    expect(crossing).toHaveLength(2);
    expect(crossing[0][1]).toBeCloseTo(5);
    expect(crossing[1][1]).toBeCloseTo(50);
    expect(clipCoastLine([100, 10], [200, 50], 0, 5, 50, 0.5)).toEqual([]);
    const segment = clipCoastLine([-100, 20], [100, 20], 0, 5, 50, 0.5);
    expect(segment).toHaveLength(2);
    expect(segment[0][0]).toBeCloseTo(-10);
    expect(segment[1][0]).toBeCloseTo(10);
    expect(segment[0][1]).toBeCloseTo(20);
    expect(segment[1][1]).toBeCloseTo(20);
  });
});

describe('continuous land colours', () => {
  const desert = { terrain: 'desert' as const, region: 'Africa' };
  const farm = { terrain: 'farmland' as const, region: 'Europe' };
  const strip: CoastStrip = { routeKm: 500, land: [], lines: [], shores: [], ground: [[desert, farm], [farm, desert]] };
  it('blends across and along the route with normalized weights', () => {
    const mix = groundMixAt(strip, -335, -315);
    expect(mix).toHaveLength(2);
    expect(mix.find((c) => c.terrain === 'desert')?.weight).toBeCloseTo(0.5);
    expect(mix.reduce((n, c) => n + c.weight, 0)).toBeCloseTo(1);
    expect(groundMixAt(strip, -350, -350)).toEqual([{ ...desert, weight: 1 }]);
  });
  it('has no colour jump at the old nearest-cell boundary', () => {
    const before = groundMixAt(strip, -350, -315.001).find((c) => c.terrain === 'desert')!.weight;
    const after = groundMixAt(strip, -350, -314.999).find((c) => c.terrain === 'desert')!.weight;
    expect(Math.abs(before - after)).toBeLessThan(0.0001);
  });
  it('borrows land at sea cells and handles an empty grid', () => {
    expect(groundMixAt({ ...strip, ground: [[null, farm]] }, -350, -315)).toEqual([{ ...farm, weight: 1 }]);
    expect(groundMixAt({ ...strip, ground: [] }, 0, 0)).toEqual([]);
  });
});
const course = Math.atan2(
  Math.sin(((hanoi.lng - manila.lng) * Math.PI) / 180) * Math.cos((hanoi.lat * Math.PI) / 180),
  Math.cos((manila.lat * Math.PI) / 180) * Math.sin((hanoi.lat * Math.PI) / 180) - Math.sin((manila.lat * Math.PI) / 180) * Math.cos((hanoi.lat * Math.PI) / 180) * Math.cos(((hanoi.lng - manila.lng) * Math.PI) / 180),
);

describe('the coast strip places points along and beside the route', () => {
  it('a point halfway along the route is halfway, on the line', () => {
    const [s, d] = toRoute(manila, course, greatCirclePoint(manila, hanoi, 0.5));
    const [end] = toRoute(manila, course, hanoi);
    expect(Math.abs(s - end / 2)).toBeLessThan(5);
    expect(Math.abs(d)).toBeLessThan(2);
  });
  it('flying west-north-west, a point to the north is on the right', () => {
    const mid = greatCirclePoint(manila, hanoi, 0.5);
    const [, d] = toRoute(manila, course, { lat: mid.lat + 1, lng: mid.lng });
    expect(d).toBeGreaterThan(50);
  });
  it('a point behind the origin has a negative distance along', () => {
    const [s] = toRoute(manila, course, { lat: 13.5, lng: 123.5 });
    expect(s).toBeLessThan(0);
  });
});
