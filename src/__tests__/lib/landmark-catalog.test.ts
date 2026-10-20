import { describe, expect, it } from 'vitest';
import { LANDMARK_CATALOG, LANDMARK_COLOURS, LANDMARK_SHAPES } from '@/data/world/landmark-catalog';
import { LANDMARK_RARE, LANDMARK_TIMES } from '@/data/world/landmark-rare';
import { NAMED_FEATURES } from '@/data/world/named-features';
import { TEACHING_LANDMARKS } from '@/data/world/named-regions';
import { WEATHER_CONDITIONS } from '@/components/world-flight/arrival-scene/weather';

const byName = (name: string) => LANDMARK_CATALOG.filter(entry => [entry.name, ...(entry.aliases ?? [])].includes(name));

describe('landmark catalogue', () => {
  it('has unique kebab-case ids and unambiguous names/aliases', () => {
    const ids = LANDMARK_CATALOG.map(entry => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = LANDMARK_CATALOG.flatMap(entry => [entry.name, ...(entry.aliases ?? [])]);
    expect(new Set(names).size).toBe(names.length);
    ids.forEach(id => expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/));
  });
  it.each(LANDMARK_CATALOG.map(entry => [entry.id, entry] as const))('%s has valid location, drawing and teaching data', (_id, entry) => {
    expect(Number.isFinite(entry.lat)).toBe(true);
    expect(Number.isFinite(entry.lng)).toBe(true);
    expect(entry.lat).toBeGreaterThanOrEqual(-90);
    expect(entry.lat).toBeLessThanOrEqual(90);
    expect(entry.lng).toBeGreaterThanOrEqual(-180);
    expect(entry.lng).toBeLessThanOrEqual(180);
    expect(entry.country.trim()).not.toBe('');
    expect(entry.name.trim()).not.toBe('');
    expect(LANDMARK_SHAPES).toContain(entry.shape);
    if (entry.heightM !== undefined) {
      expect(Number.isFinite(entry.heightM)).toBe(true);
      expect(entry.heightM).toBeGreaterThan(0);
      expect(entry.heightM).toBeLessThan(9000);
      expect(['peak', 'volcano', 'everest', 'fuji', 'kilimanjaro', 'matterhorn', 'rock']).toContain(entry.shape);
    }
    const look = entry.look;
    if (look?.snowLine !== undefined) {
      expect(look.snowLine).toBeGreaterThanOrEqual(0);
      expect(look.snowLine).toBeLessThanOrEqual(1);
    }
    if (look?.steep !== undefined) {
      expect(look.steep).toBeGreaterThanOrEqual(0.5);
      expect(look.steep).toBeLessThanOrEqual(1.5);
    }
    if (look?.width !== undefined) {
      expect(Number.isFinite(look.width)).toBe(true);
      expect(look.width).toBeGreaterThan(0);
    }
    if (look?.colour !== undefined) expect(LANDMARK_COLOURS).toContain(look.colour);
    if (look?.steam !== undefined) expect(typeof look.steam).toBe('boolean');
    if (look?.crater !== undefined) expect(typeof look.crater).toBe('boolean');
    if (entry.shape === 'volcano' || entry.shape === 'canyon') expect(look).toBeDefined();
    (['junior', 'core', 'advanced'] as const).forEach(level => {
      expect(entry.facts[level]).toHaveLength(3);
      expect(new Set(entry.facts[level]).size).toBe(3);
      entry.facts[level].forEach(fact => {
        expect(fact.trim().length).toBeGreaterThan(0);
        if (level === 'junior') expect(fact.trim().split(/\s+/).length, fact).toBeLessThanOrEqual(8);
      });
    });
    expect(entry.question.trim()).toMatch(/\?$/);
    expect(entry.sources.length).toBeGreaterThan(0);
    entry.sources.forEach(source => expect(new URL(source).protocol).toBe('https:'));
  });
  it('covers every route sight and mountain by its exact name', () => {
    NAMED_FEATURES.filter(([, kind]) => kind === 'sight' || kind === 'mountain').forEach(([name]) => {
      expect(byName(name), name).toHaveLength(1);
    });
  });
  it('covers every teaching volcano and canyon by its exact name', () => {
    TEACHING_LANDMARKS.forEach(({ name }) => expect(byName(name), name).toHaveLength(1));
  });
  it('merges the overlapping route features without confusing distinct Yellowstone features', () => {
    expect(byName('Kilimanjaro')[0]).toBe(byName('Mount Kilimanjaro')[0]);
    expect(byName('Grand Canyon')[0]).toBe(byName('the Grand Canyon')[0]);
    expect(byName('Mount Fuji')).toHaveLength(1);
    expect(byName('Yellowstone')[0]).not.toBe(byName('Yellowstone Caldera')[0]);
    expect(byName('Yellowstone Caldera')[0].heightM).toBeUndefined();
    expect(byName('Crater Lake / Mount Mazama')[0].heightM).toBeUndefined();
  });
});

describe('rare landmark photos', () => {
  it('references catalogue ids and only weather/light values supported by the app', () => {
    const ids = LANDMARK_CATALOG.map(entry => entry.id);
    const keys = LANDMARK_RARE.map(photo => `${photo.landmark}:${photo.when.timeOfDay}:${photo.when.weather}`);
    expect(new Set(keys).size).toBe(keys.length);
    LANDMARK_RARE.forEach(photo => {
      expect(ids).toContain(photo.landmark);
      expect(WEATHER_CONDITIONS).toContain(photo.when.weather);
      expect(LANDMARK_TIMES).toContain(photo.when.timeOfDay);
      expect(photo.title.trim()).not.toBe('');
    });
  });
  it('keeps aurora photos at night and in plausible northern locations', () => {
    LANDMARK_RARE.filter(photo => photo.when.weather === 'aurora').forEach(photo => {
      expect(photo.when.timeOfDay).toBe('night');
      expect(LANDMARK_CATALOG.find(entry => entry.id === photo.landmark)!.lat).toBeGreaterThan(60);
    });
  });
  it('uses only weather and time, without extra inputs, points or rankings', () => {
    LANDMARK_RARE.forEach(photo => {
      expect(Object.keys(photo).sort()).toEqual(['landmark', 'title', 'when']);
      expect(Object.keys(photo.when).sort()).toEqual(['timeOfDay', 'weather']);
    });
  });
});
