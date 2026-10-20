import { describe, expect, it } from 'vitest';
import { highGroundAhead, highGroundAt, snowlineM } from '@/lib/live-room/elevation-ahead';

describe('real high ground ahead', () => {
  it('finds the Alps rugged and the Netherlands flat', async () => {
    const alps = await highGroundAhead({ lat: 46.6, lng: 8.4 }, 90);
    const dutch = await highGroundAhead({ lat: 52.3, lng: 5.2 }, 90);
    const mid = (g: Awaited<ReturnType<typeof highGroundAhead>>) => highGroundAt(g, 30, 0)!;
    expect(mid(alps).rugged).toBeGreaterThan(500);
    expect(mid(dutch).rugged).toBeLessThan(120);
  });

  it('puts snow on the Himalaya but not on the mountains of Thailand', async () => {
    const himalaya = await highGroundAhead({ lat: 28.0, lng: 86.0 }, 90);
    const thailand = await highGroundAhead({ lat: 18.8, lng: 98.9 }, 0);
    expect(highGroundAt(himalaya, 20, 0)!.snow).toBe(true);
    expect(highGroundAt(thailand, 20, 0)!.snow).toBe(false);
  });

  it('has a lower snowline far from the equator', () => {
    expect(snowlineM(0)).toBeGreaterThan(snowlineM(60));
  });
});
