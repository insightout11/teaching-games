import { describe, expect, it } from 'vitest';
import { decodeTerrarium, sampleTerrarium, terrainPixel, TERRARIUM_ZOOM } from '@/lib/live-room/terrarium';

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
});
