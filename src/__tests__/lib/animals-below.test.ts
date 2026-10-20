import { describe, expect, it } from 'vitest';
import { ANIMAL_MIGRATIONS } from '@/data/world/animal-migrations';
import type { AnimalPolygon } from '@/data/world/animal-migrations';
import { REGION_ANIMALS } from '@/data/world/region-animals';
import { animalRegionOf, animalsOf, distanceToAnimalAreaKm, migrationsNear, monthInSeason } from '@/lib/animals-below';

const square: AnimalPolygon = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]];

describe('animal area distance', () => {
  it('includes interiors, vertices and boundaries at radius zero', () => {
    [[0, 0], [-1, -1], [1, 0]].forEach(([lng, lat]) =>
      expect(distanceToAnimalAreaKm([lng, lat], [square])).toBe(0));
  });
  it('measures to the nearest edge rather than the centre', () => {
    expect(distanceToAnimalAreaKm([2, 0], [square])).toBeCloseTo(111.195, 2);
    expect(distanceToAnimalAreaKm({ lng: 2, lat: 0 }, [square])).toBeCloseTo(111.195, 2);
  });
  it('uses endpoints when the perpendicular misses the segment', () => {
    expect(distanceToAnimalAreaKm([2, 2], [square])).toBeCloseTo(157.225, 2);
  });
  it('finds the nearest of disconnected polygons', () => {
    const distant: AnimalPolygon = [[9, -1], [11, -1], [11, 1], [9, 1], [9, -1]];
    expect(distanceToAnimalAreaKm([10, 0], [square, distant])).toBe(0);
    expect(distanceToAnimalAreaKm([8, 0], [square, distant])).toBeCloseTo(111.195, 2);
  });
  it('handles the date line without treating Greenwich as inside', () => {
    const crossing: AnimalPolygon = [[179, -1], [-179, -1], [-179, 1], [179, 1], [179, -1]];
    expect(distanceToAnimalAreaKm([180, 0], [crossing])).toBe(0);
    expect(distanceToAnimalAreaKm([-180, 0], [crossing])).toBe(0);
    expect(distanceToAnimalAreaKm([-179.5, 0], [crossing])).toBe(0);
    expect(distanceToAnimalAreaKm([178, 0], [crossing])).toBeCloseTo(111.195, 2);
    expect(distanceToAnimalAreaKm([0, 0], [crossing])).toBeGreaterThan(19000);
  });
  it('handles a small polar ring and reversed vertex order', () => {
    const polar: AnimalPolygon = [[0, 85], [120, 85], [-120, 85], [0, 85]];
    expect(distanceToAnimalAreaKm([0, 90], [polar])).toBe(0);
    expect(distanceToAnimalAreaKm([0, -90], [polar])).toBeGreaterThan(19000);
    expect(distanceToAnimalAreaKm([0, 90], [Array.from(polar).reverse()])).toBe(0);
  });
  it('respects a concave cutout and has no antipodal false interior', () => {
    const concave: AnimalPolygon = [[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2], [0, 0]];
    expect(distanceToAnimalAreaKm([0.5, 1.5], [concave])).toBe(0);
    expect(distanceToAnimalAreaKm([1.5, 1.5], [concave])).toBeGreaterThan(50);
    expect(distanceToAnimalAreaKm([180, 0], [square])).toBeGreaterThan(19000);
  });
  it('fails closed for invalid coordinates or absent areas', () => {
    [[NaN, 0], [0, Infinity], [0, 91], [181, 0]].forEach(([lng, lat]) =>
      expect(distanceToAnimalAreaKm([lng, lat], [square])).toBe(Infinity));
    expect(distanceToAnimalAreaKm([0, 0], [])).toBe(Infinity);
  });
});

describe('seasonal migrations near a route point', () => {
  it('finds every real area on a boundary in season without modifying the data', () => {
    const before = JSON.stringify(ANIMAL_MIGRATIONS);
    ANIMAL_MIGRATIONS.forEach((migration) => {
      const date = new Date(Date.UTC(2026, migration.months[0].start - 1, 15));
      migration.polygons.forEach((polygon) => {
        expect(migrationsNear(polygon[0], date, 0)).toContain(migration);
      });
    });
    expect(JSON.stringify(ANIMAL_MIGRATIONS)).toBe(before);
  });
  it('includes both ends of a December–February season and excludes the gap', () => {
    const season = [{ start: 12, end: 2 }];
    [12, 1, 2].forEach((month) => expect(monthInSeason(month, season)).toBe(true));
    [3, 11, 0, 13, 1.5, NaN].forEach((month) => expect(monthInSeason(month, season)).toBe(false));
  });
  it('preserves gaps between separate seasonal passages', () => {
    const season = [{ start: 3, end: 5 }, { start: 11, end: 12 }];
    expect(monthInSeason(4, season)).toBe(true);
    expect(monthInSeason(11, season)).toBe(true);
    expect(monthInSeason(8, season)).toBe(false);
  });
  it('matches a real winter return and filters it in summer', () => {
    expect(migrationsNear([-122.97, 38.01], new Date('2026-01-15T12:00:00Z'), 0).map((m) => m.id)).toContain('elephant-seal-reyes');
    expect(migrationsNear([-122.97, 38.01], new Date('2026-07-15T12:00:00Z'), 0).map((m) => m.id)).not.toContain('elephant-seal-reyes');
  });
  it('uses UTC month even when the supplied date has a local offset', () => {
    expect(migrationsNear([-122.97, 38.01], new Date('2026-03-31T20:00:00-07:00'), 0).map((m) => m.id)).not.toContain('elephant-seal-reyes');
  });
  it('includes an area exactly at the radius, and rejects a smaller radius', () => {
    const migration = ANIMAL_MIGRATIONS.find((m) => m.id === 'sockeye-brooks')!;
    const point = [-155.7, 58.55] as const;
    const distance = distanceToAnimalAreaKm(point, migration.polygons);
    const date = new Date('2026-07-15T00:00:00Z');
    expect(distance).toBeGreaterThan(0);
    expect(migrationsNear(point, date, distance)).toContain(migration);
    expect(migrationsNear(point, date, distance - 0.01)).not.toContain(migration);
  });
  it('rejects invalid dates and radii', () => {
    expect(migrationsNear([0, 0], new Date('bad'), 20)).toEqual([]);
    [-1, NaN, Infinity].forEach((km) => expect(migrationsNear([0, 0], new Date(), km)).toEqual([]));
    expect(migrationsNear([0, 91], new Date(), 20)).toEqual([]);
  });
});

describe('exact resident animal matching', () => {
  it('resolves every audited alias, ignoring case and a leading the', () => {
    REGION_ANIMALS.forEach((region) => {
      [region.name].concat(Array.from(region.aliases)).forEach((alias) => {
        expect(animalsOf(alias.toUpperCase())).toBe(region.animals);
        expect(animalRegionOf('  the ' + alias.replace(/^the /i, '') + '  ')).toBe(region);
      });
    });
  });
  it('never guesses from a substring, nearby name or object property', () => {
    ['York', 'South', 'China Sea', 'New York City park', 'unknown', '', '__proto__', 'constructor'].forEach((name) => {
      expect(animalsOf(name)).toEqual([]);
      expect(animalRegionOf(name)).toBeUndefined();
    });
  });
  it('exposes qualifications and the reason for an intentionally withheld list', () => {
    expect(animalRegionOf('Greenland ice sheet')?.scope).toMatch(/melt/);
    expect(animalsOf('Cordillera Oriental')).toEqual([]);
    expect(animalRegionOf('Cordillera Oriental')?.scope).toMatch(/Ambiguous/);
  });
});
