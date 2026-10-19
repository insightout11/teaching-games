import { describe, expect, it } from 'vitest';
import { LAND_COVER_LEGEND, LAND_COVER_RUNS } from '@/data/world/land-cover';
import { decodeLandCover, landCoverAt, toSceneTerrain } from '@/lib/live-room/land-cover';
import { classify, encodeRuns } from '../../../scripts/build-land-cover';
import { inPolygon, polygonArea } from '@/lib/live-room/terrain-geometry';

describe('static land cover', () => {
  it('decodes exactly one valid code per global cell', () => {
    const grid = decodeLandCover(LAND_COVER_RUNS);
    expect(grid).toHaveLength(720 * 360);
    expect(grid).toMatch(/^[A-O]+$/);
    expect(decodeLandCover(encodeRuns(grid))).toBe(grid);
    for (const bad of ['', '0A', '1P', '1A!', 'zzzzzzA']) expect(() => decodeLandCover(bad)).toThrow();
  });

  it.each([
    ['Amazon', -3.25, -62.25, ['rainforest']],
    ['Sahara', 25, 10, ['desert']],
    ['northern Serengeti', -1.75, 34.75, ['savanna']],
    ['central Serengeti grass plains', -2.25, 34.75, ['grassland']],
    ['Siberia', 64.25, 100.25, ['boreal-forest', 'tundra']],
    // IGBP identifies crops, not rice. Do not relabel observed crops as wetlands.
    ['Mekong delta', 10.25, 105.75, ['farmland', 'wetlands']],
    ['Kansas', 38.75, -98.25, ['farmland']],
    ['Greenland interior', 72, -40, ['ice']],
    ['Salar de Uyuni', -20.25, -67.75, ['salt-flats']],
    ['Himalaya', 28, 86, ['mountains']],
    ['mid-Atlantic', 0, -30, ['ocean']],
    ['Paris', 48.86, 2.35, ['city', 'farmland']],
  ] as const)('classifies %s from the generated data', (_name, lat, lng, allowed) => {
    expect(allowed).toContain(landCoverAt({ lat, lng }));
  });

  it('handles longitude wrapping, poles and invalid inputs', () => {
    for (const lat of [-90, -40, 0, 80, 90]) {
      expect(landCoverAt({ lat, lng: 180 })).toBe(landCoverAt({ lat, lng: -180 }));
      expect(landCoverAt({ lat, lng: 540 })).toBe(landCoverAt({ lat, lng: -180 }));
    }
    expect(landCoverAt({ lat: -90, lng: 0 })).toBe('ice');
    for (const p of [{ lat: 91, lng: 0 }, { lat: NaN, lng: 0 }, { lat: 0, lng: Infinity }]) expect(() => landCoverAt(p)).toThrow(RangeError);
  });

  it('maps all fifteen classes onto the seven existing scene types', () => {
    for (const cover of Object.values(LAND_COVER_LEGEND)) expect(['ocean', 'mountains', 'hills', 'forest', 'desert', 'ice', 'farmland']).toContain(toSceneTerrain(cover));
    expect(toSceneTerrain('rainforest')).toBe('forest');
    expect(toSceneTerrain('salt-flats')).toBe('desert');
  });

  it('keeps source refinements explicit and rejects unknown IGBP classes', () => {
    expect(classify(2, 0)).toBe('F');
    expect(classify(2, 40)).toBe('E');
    expect(classify(1, 60)).toBe('D');
    expect(classify(7, 70)).toBe('C');
    expect(classify(12, 10)).toBe('I');
    expect(() => classify(255, 0)).toThrow();
  });
});

describe('terrain geometry', () => {
  it('excludes holes and respects polygons rather than bounding boxes', () => {
    const polygon: [number, number][][] = [[[0, 0], [4, 0], [0, 4], [0, 0]], [[1, 1], [2, 1], [1, 2], [1, 1]]];
    expect(inPolygon(0.5, 0.5, polygon)).toBe(true);
    expect(inPolygon(1.25, 1.25, polygon)).toBe(false);
    expect(inPolygon(3, 3, polygon)).toBe(false);
  });

  it('handles date-line crossings with a small spherical area', () => {
    const polygon: [number, number][][] = [[[179, -1], [-179, -1], [-179, 1], [179, 1], [179, -1]]];
    expect(inPolygon(179.5, 0, polygon)).toBe(true);
    expect(inPolygon(-179.5, 0, polygon)).toBe(true);
    expect(inPolygon(0, 0, polygon)).toBe(false);
    expect(polygonArea(polygon)).toBeGreaterThan(49000);
    expect(polygonArea(polygon)).toBeLessThan(50000);
  });
});
