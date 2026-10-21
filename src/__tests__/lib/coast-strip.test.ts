import { describe, expect, it } from 'vitest';
import { clipCoastView, toRoute } from '@/lib/live-room/coast-strip';
import { greatCirclePoint } from '@/lib/live-room/route-terrain';

const manila = { lat: 14.5995, lng: 120.9842 }, hanoi = { lat: 21.0278, lng: 105.8342 };

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
