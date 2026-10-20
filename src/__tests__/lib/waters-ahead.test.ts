import { describe, expect, it } from 'vitest';
import { toFrame, watersAhead } from '@/lib/live-room/waters-ahead';

describe('waters in the cockpit frame', () => {
  it('puts a point due north ahead when flying north, and east on the right', () => {
    const at = { lat: 10, lng: 20 };
    const [aheadN, sideN] = toFrame(at, 0, [20, 10.5]);
    expect(aheadN).toBeGreaterThan(50);
    expect(Math.abs(sideN)).toBeLessThan(1);
    const [aheadE, sideE] = toFrame(at, 0, [20.5, 10]);
    expect(Math.abs(aheadE)).toBeLessThan(1);
    expect(sideE).toBeGreaterThan(40);
  });

  it('turns with the heading: flying east, north is on the left', () => {
    const [, side] = toFrame({ lat: 10, lng: 20 }, 90, [20, 10.5]);
    expect(side).toBeLessThan(-50);
  });

  it('finds the Nile ahead when flying up the valley from Luxor', async () => {
    const w = await watersAhead({ lat: 25.69, lng: 32.64 }, 0, 120);
    expect(w.rivers.some((r) => r.name === 'Nile' && r.points.some(([a]) => a > 20))).toBe(true);
  });
});
