import { describe, expect, it } from 'vitest';
import { clampElevationSpikes, medianElevation, mountainSnowline, elevationSample, terrainGradient, terrainHeight, snowlineVariation, TERRAIN_GAIN } from '@/lib/live-room/terrain-filter';

describe('cached terrain filtering', () => {
  it('reduces an isolated needle, preserves a constant inland plateau and leaves sea at zero', () => {
    const heights = new Float32Array(49).fill(2000); heights[24] = 8000; heights[0] = 0;
    const blurred = clampElevationSpikes(heights, 7, 7);
    expect(blurred[24]).toBe(2180);
    expect(blurred[40]).toBe(2000);
    expect(blurred[0]).toBe(0);
    expect(heights[24]).toBe(8000);
  });
  it('retains middle ridges while progressively compressing tall summits, monotonically', () => {
    expect(terrainHeight(3000)).toBeCloseTo(3000 * 2.2);
    expect(terrainHeight(8000)).toBeGreaterThan(8000 * 2.2 * 0.94);
    expect(terrainHeight(8000)).toBeLessThan(8000 * 2.2);
    let previous = 0;
    for (let h = 100; h <= 10000; h += 100) {
      expect(terrainHeight(h)).toBeGreaterThan(previous); previous = terrainHeight(h);
      expect((terrainHeight(h + 0.001) - terrainHeight(h - 0.001)) / 0.002).toBeCloseTo(terrainGradient(h, TERRAIN_GAIN), 5);
    }
  });
  it('keeps connected ridges and valley edges instead of averaging them away', () => {
    const heights = new Float32Array(49).fill(1200);
    for (let r = 0; r < 7; r++) heights[r * 7 + 3] = 6500;
    expect(clampElevationSpikes(heights, 7, 7)).toEqual(heights);
    expect(medianElevation(new Float32Array(49).fill(6000), 7, 7)[24]).toBe(6000);
  });
  it('sets regional snow from true elevation without altering other regions', () => {
    expect(mountainSnowline(28, 87)).toBe(4900);
    expect(mountainSnowline(46, 9)).toBe(2800);
    expect(mountainSnowline(40, 14)).toBeNull();
    expect(terrainHeight(1000)).toBeCloseTo(1000 * TERRAIN_GAIN / (1 + 1000 / 18000));
    expect(terrainHeight(8000) - terrainHeight(6000)).toBeGreaterThan(terrainHeight(4000) - terrainHeight(2000));
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
