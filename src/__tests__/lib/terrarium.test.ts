import { describe, expect, it } from 'vitest';
import { decodeTerrarium, routeTileKeys, sampleTerrarium, terrainPixel, TERRARIUM_ZOOM } from '@/lib/live-room/terrarium';
import { surfacePoint } from '@/lib/live-room/terrain-surface';

describe('route Terrarium elevation', () => {
  it('decodes signed metres and fractional heights without colour scaling', () => {
    expect(Array.from(decodeTerrarium(new Uint8ClampedArray([128, 0, 0, 255, 137, 219, 68, 255, 127, 255, 128, 255]))))
      .toEqual([0, 2523.265625, -0.5]);
  });
  it('interpolates across a tile seam rather than clamping to a tile edge', () => {
    const n = 2 ** TERRARIUM_ZOOM, left = new Float32Array(256 * 256).fill(100), right = new Float32Array(256 * 256).fill(300);
    // At longitude zero the sample lies halfway between the two centre pixels on either side of the seam.
    const loaded = new Map([[`${n / 2 - 1}/${n / 2 - 1}`, left], [`${n / 2}/${n / 2 - 1}`, right],
      [`${n / 2 - 1}/${n / 2}`, left], [`${n / 2}/${n / 2}`, right]]);
    expect(sampleTerrarium(loaded, { lat: 0, lng: 0 })).toBe(200);
    expect(sampleTerrarium(new Map(), { lat: 0, lng: 0 })).toBeNull();
  });
  it('wraps antimeridian neighbours to the same source tiles', () => {
    const n = 2 ** TERRARIUM_ZOOM, tile = new Float32Array(256 * 256).fill(345);
    const loaded = new Map([[`0/${n / 2 - 1}`, tile], [`${n - 1}/${n / 2 - 1}`, tile], [`0/${n / 2}`, tile], [`${n - 1}/${n / 2}`, tile]]);
    expect(sampleTerrarium(loaded, { lat: 0, lng: -180 })).toBe(345);
    expect(sampleTerrarium(loaded, { lat: 0, lng: 180 })).toBe(345);
    expect(terrainPixel({ lat: 90, lng: 0 }).every(Number.isFinite)).toBe(true);
  });
  it.each([
    ['Cairo to Rome', { lat: 30.04, lng: 31.24 }, { lat: 41.9, lng: 12.5 }, 2132],
    ['Zurich to Milan', { lat: 47.37, lng: 8.54 }, { lat: 45.46, lng: 9.19 }, 218],
    ['Kathmandu to Lhasa', { lat: 27.7, lng: 85.3 }, { lat: 29.65, lng: 91.1 }, 610],
  ])('%s: route tiles cover every 1 km surface sample and its interpolation neighbour', (_name, from, to, km) => {
    const band: { lat: number; lng: number }[] = [];
    for (let a = -40; a <= km + 200; a += 12) for (let s = -160; s <= 160; s += 12) band.push(surfacePoint(from, to, a, s, km));
    const keys = routeTileKeys(band), n = 2 ** TERRARIUM_ZOOM;
    const key = (x: number, y: number) => `${((x % n) + n) % n}/${Math.max(0, Math.min(n - 1, y))}`;
    const missing: string[] = [];
    for (let a = -40; a <= km + 200; a += 1) for (let s = -160; s <= 160; s += 1) {
      const [x, y] = terrainPixel(surfacePoint(from, to, a, s, km));
      for (const [px, py] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) {
        const k = key(Math.floor(px / 256), Math.floor(py / 256));
        if (!keys.has(k)) missing.push(`${a},${s} -> ${k}`);
      }
    }
    expect(missing.slice(0, 5)).toEqual([]);
  }, 120000);
});
