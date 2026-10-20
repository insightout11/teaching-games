import { describe, expect, it } from 'vitest';
import { coastAhead } from '@/lib/live-room/coast-ahead';

describe('coastlines in the cockpit frame', () => {
  it('finds the coast off Sydney, with the land on the left when flying north along it at sea', async () => {
    const c = await coastAhead({ lat: -34.0, lng: 151.4 }, 0, 80);
    expect(c.rings.length).toBeGreaterThan(0);
    // most land points lie to the west of a plane flying north just offshore: negative side
    const pts = c.rings.flat();
    const left = pts.filter(([, side]) => side < 0).length;
    expect(left).toBeGreaterThan(pts.length * 0.6);
  });

  it('has no coast in the middle of the Pacific', async () => {
    const c = await coastAhead({ lat: -30, lng: -140 }, 0, 80);
    expect(c.rings.length).toBe(0);
  });
});

describe('what kind of shore', () => {
  it('reads the Norwegian fjords as rocky and the Florida Keys as white sand', async () => {
    const { coastAhead: ca } = await import('@/lib/live-room/coast-ahead');
    const fjords = await ca({ lat: 61.1, lng: 5.2 }, 270, 60);
    const keys = await ca({ lat: 24.8, lng: -80.8 }, 220, 40);
    const share = (c: Awaited<ReturnType<typeof ca>>, k: number) => { const all = c.shores.flat(); return all.filter((x) => x === k).length / Math.max(1, all.length); };
    expect(share(fjords, 2)).toBeGreaterThan(0.5);
    expect(share(keys, 0)).toBeGreaterThan(0.5);
  });
});
