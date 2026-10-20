import { describe, expect, it } from 'vitest';
import { ANIMAL_MIGRATIONS } from '@/data/world/animal-migrations';
import { REGION_ANIMALS } from '@/data/world/region-animals';
import { normalizeAnimalPlace } from '@/lib/animals-below';
import audit from '../../../docs/route-places.json';

function photoAndSource(photo: string, source: string) {
  expect(photo.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2);
  expect(photo.trim().split(/\s+/).length).toBeLessThanOrEqual(5);
  expect(new URL(source).protocol).toBe('https:');
  expect(source).not.toMatch(/\s/);
}

describe('checked animal migration data', () => {
  it('has unique stable IDs and a useful range of examples', () => {
    expect(ANIMAL_MIGRATIONS.length).toBeGreaterThanOrEqual(25);
    expect(ANIMAL_MIGRATIONS.length).toBeLessThanOrEqual(40);
    expect(new Set(ANIMAL_MIGRATIONS.map((m) => m.id)).size).toBe(ANIMAL_MIGRATIONS.length);
  });
  ANIMAL_MIGRATIONS.forEach((migration) => {
    it(`${migration.id}: complete facts, season and honest area`, () => {
      expect(migration.animal.trim()).not.toBe('');
      expect(migration.areaDescription.trim()).not.toBe('');
      expect(migration.seasonNote.trim()).not.toBe('');
      expect(migration.below).toMatch(/^Below us /);
      expect(migration.below).not.toMatch(/right now|guaranteed|\d/);
      expect(['land', 'sea']).toContain(migration.habitat);
      expect(migration.facts).toHaveLength(3);
      expect(new Set(migration.facts).size).toBe(3);
      migration.facts.forEach((fact) => expect(fact.trim().length).toBeGreaterThan(15));
      photoAndSource(migration.photoSearch, migration.source);
      expect(migration.sources).toContain(migration.source);
      migration.sources.forEach((source) => expect(new URL(source).protocol).toBe('https:'));
      expect(migration.months.length).toBeGreaterThan(0);
      migration.months.forEach(({ start, end }) => {
        [start, end].forEach((month) => {
          expect(Number.isInteger(month)).toBe(true);
          expect(month).toBeGreaterThanOrEqual(1);
          expect(month).toBeLessThanOrEqual(12);
        });
      });
      expect(migration.polygons.length).toBeGreaterThan(0);
      migration.polygons.forEach((ring) => {
        expect(ring.length).toBeGreaterThanOrEqual(4);
        expect(ring[0]).toEqual(ring[ring.length - 1]);
        expect(new Set(ring.slice(0, -1).map((p) => p.join(','))).size).toBe(ring.length - 1);
        ring.forEach(([lng, lat]) => {
          expect(Number.isFinite(lng) && Number.isFinite(lat)).toBe(true);
          expect(Math.abs(lng)).toBeLessThanOrEqual(180);
          expect(Math.abs(lat)).toBeLessThanOrEqual(90);
        });
        const area = ring.slice(0, -1).reduce((sum, p, i) => sum + p[0] * ring[i + 1][1] - ring[i + 1][0] * p[1], 0);
        expect(Math.abs(area)).toBeGreaterThan(0.000001);
        // These hand-drawn envelopes are small and do not cross the date line.
        // Check that no non-adjacent edges intersect (a bow tie is not an area).
        const turn = (a: readonly number[], b: readonly number[], c: readonly number[]) =>
          (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        for (let i = 0; i < ring.length - 1; i += 1) {
          for (let j = i + 2; j < ring.length - 1; j += 1) {
            if (i === 0 && j === ring.length - 2) continue;
            const [a, b, c, d] = [ring[i], ring[i + 1], ring[j], ring[j + 1]];
            expect(turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0).toBe(false);
          }
        }
      });
      expect(JSON.stringify(migration)).not.toMatch(/\uFFFD|[\u0000-\u0008]/);
    });
  });
});

describe('resident wildlife coverage', () => {
  it('covers each ranked place through the published cutoff without fabricating ambiguous ranges', () => {
    audit.places.filter((place) => place.rank <= 150).forEach((place) => {
      const entry = REGION_ANIMALS.find((region) => region.name === place.title);
      expect(entry, place.title).toBeDefined();
      expect(entry?.rank).toBe(place.rank);
      if (audit.metadata.ambiguousExcluded.includes(place.title)) {
        expect(entry?.animals).toEqual([]);
        expect(entry?.scope).toMatch(/Ambiguous/);
      } else {
        expect(entry?.animals.length).toBeGreaterThanOrEqual(2);
        expect(entry?.animals.length).toBeLessThanOrEqual(4);
      }
    });
    expect(REGION_ANIMALS.every((region) => region.rank <= 150)).toBe(true);
    expect(REGION_ANIMALS.find((region) => region.name === 'Sudan')?.rank).toBe(150);
  });
  it('has collision-free normalized names and aliases', () => {
    const owners: Record<string, string> = Object.create(null);
    REGION_ANIMALS.forEach((region) => {
      [region.name].concat(Array.from(region.aliases)).forEach((name) => {
        const key = normalizeAnimalPlace(name);
        expect(key).not.toBe('');
        expect(owners[key] === undefined || owners[key] === region.name, name).toBe(true);
        owners[key] = region.name;
      });
    });
  });
  REGION_ANIMALS.forEach((region) => {
    it(`${region.name}: sourced and qualified wildlife`, () => {
      expect(region.scope.trim().length).toBeGreaterThan(15);
      region.sources.forEach((source) => expect(new URL(source).protocol).toBe('https:'));
      expect(new Set(region.animals.map((animal) => animal.animal)).size).toBe(region.animals.length);
      region.animals.forEach((animal) => {
        expect(animal.scientificName.trim()).not.toBe('');
        expect(animal.fact.trim().length).toBeGreaterThan(15);
        photoAndSource(animal.photoSearch, animal.source);
      });
      expect(JSON.stringify(region)).not.toMatch(/\uFFFD|[\u0000-\u0008]/);
    });
  });
});
