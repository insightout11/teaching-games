import { describe, expect, it } from 'vitest';
import { blurElevation, elevationSample, terrainGradient, terrainHeight, snowlineVariation, TERRAIN_GAIN } from '@/lib/live-room/terrain-filter';

describe('cached terrain filtering', () => {
  it('reduces an isolated needle, preserves a constant inland plateau and leaves sea at zero', () => {
    const heights = new Float32Array(49).fill(2000); heights[24] = 8000; heights[0] = 0;
    const blurred = blurElevation(heights, 7, 7);
    expect(blurred[24]).toBe(5375);
    expect(blurred[40]).toBe(2000);
    expect(blurred[0]).toBe(0);
    expect(heights[24]).toBe(8000);
  });
  it('retains middle ridges while progressively compressing tall summits, monotonically', () => {
    expect(terrainHeight(3000)).toBeCloseTo(3000 * 2.2);
    expect(terrainHeight(8000)).toBeLessThan(8000 * 2.2 * 0.85);
    let previous = 0;
    for (let h = 100; h <= 10000; h += 100) {
      expect(terrainHeight(h)).toBeGreaterThan(previous); previous = terrainHeight(h);
      expect((terrainHeight(h + 0.1) - terrainHeight(h - 0.1)) / 0.2).toBeCloseTo(terrainGradient(h, TERRAIN_GAIN), 5);
    }
  });
  it('interpolates the whole cell continuously without choosing a triangle diagonal', () => {
    const heights = new Float32Array([0, 1000, 2000, 4000]);
    expect(elevationSample(heights, 2, 2, 0.5, 0.5)).toBe(1750);
    expect(elevationSample(heights, 2, 2, 0.5, 0.49999)).toBeCloseTo(elevationSample(heights, 2, 2, 0.5, 0.50001), 0);
  });
  it('anchors gentle snowline variation to geography instead of time or grid cells', () => {
    expect(snowlineVariation(100, 20)).toBe(snowlineVariation(100, 20));
    expect(Math.abs(snowlineVariation(100, 20) - snowlineVariation(100.01, 20))).toBeLessThan(1);
    expect(Math.abs(snowlineVariation(100, 20))).toBeLessThanOrEqual(250);
  });
});
