import { describe, expect, it } from 'vitest';
import { beginMaterialCoverage, filterMaterialCoverage } from '@/lib/live-room/terrain-materials';

function scene(snowEdge: boolean) {
  const w = 7, h = 5, pixels = new Uint8ClampedArray(w * h * 4), depth = new Float32Array(w * h).fill(5000);
  const data = beginMaterialCoverage(pixels);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const cell = y * w + x, snow = snowEdge && x >= 3 ? 1 : 0;
    pixels.set([100 + snow * 150, 100 + snow * 150, 100 + snow * 150, 255], cell * 4);
    data.attributes.set([snow, 100], cell * 2);
  }
  return { w, h, pixels, depth, data };
}
describe('screen-footprint material reconstruction', () => {
  it('covers a snow boundary by one internal pixel, retaining white interiors and geometry', () => {
    const s = scene(true), originalDepth = s.depth.slice();
    filterMaterialCoverage(s.data, s.pixels, s.depth, s.w, s.h);
    expect(s.pixels[(2 * 7 + 2) * 4]).toBeGreaterThan(100);
    expect(s.pixels[(2 * 7 + 3) * 4]).toBeLessThan(250);
    expect(s.pixels[(2 * 7 + 5) * 4]).toBe(250);
    expect(s.pixels[(2 * 7 + 1) * 4]).toBe(100);
    expect(s.depth).toEqual(originalDepth);
    expect(s.pixels.every((v, i) => i % 4 !== 3 || v === 255)).toBe(true);
  });
  it('does not spread snow between unrelated foreground and background terrain', () => {
    const s = scene(true), original = s.pixels.slice();
    for (let y = 0; y < s.h; y++) for (let x = 3; x < s.w; x++) s.depth[y * s.w + x] = 18000;
    filterMaterialCoverage(s.data, s.pixels, s.depth, s.w, s.h);
    expect(s.pixels).toEqual(original);
  });
  it('retains a carved lighting edge when the land material is continuous', () => {
    const s = scene(false);
    for (let y = 0; y < s.h; y++) for (let x = 3; x < s.w; x++) s.pixels.set([30, 35, 40, 255], (y * s.w + x) * 4);
    const original = s.pixels.slice();
    filterMaterialCoverage(s.data, s.pixels, s.depth, s.w, s.h);
    expect(s.pixels).toEqual(original);
  });
  it('filters a land-colour boundary without inventing snow', () => {
    const s = scene(false);
    for (let y = 0; y < s.h; y++) for (let x = 3; x < s.w; x++) {
      s.pixels.set([60, 80, 40, 255], (y * s.w + x) * 4);
      s.data.attributes[(y * s.w + x) * 2 + 1] = 65;
    }
    filterMaterialCoverage(s.data, s.pixels, s.depth, s.w, s.h);
    expect(s.pixels[(2 * 7 + 2) * 4]).toBeLessThan(100);
    expect(s.pixels[(2 * 7 + 3) * 4]).toBeGreaterThan(60);
    expect(s.data.attributes.every((v, i) => i % 2 !== 0 || v === 0)).toBe(true);
  });
});
