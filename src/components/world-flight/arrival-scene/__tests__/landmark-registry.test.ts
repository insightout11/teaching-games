import { describe, expect, it } from 'vitest';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import {
  INTENTIONALLY_GENERIC,
  LANDMARK_REGISTRY,
  isAuthoredLandmark,
  validateLandmarkKeys,
} from '../scene-registry';

const productionKeys = WORLD_DESTINATIONS
  .map((d) => d.scene.landmarkSilhouette)
  .filter((k): k is string => Boolean(k));

describe('landmark registry audit', () => {
  it('every production landmarkSilhouette is authored or intentionally generic', () => {
    // A typo in destinations.ts (e.g. opera-huose) would surface here.
    expect(validateLandmarkKeys(productionKeys)).toEqual({ unknown: [] });
  });

  it('flags an unknown/typo key via the pure helper (no data mutation)', () => {
    expect(validateLandmarkKeys(['opera-huose'])).toEqual({ unknown: ['opera-huose'] });
  });

  it('does not list authored keys as intentionally generic (no overlap)', () => {
    for (const key of Object.keys(LANDMARK_REGISTRY)) {
      expect(INTENTIONALLY_GENERIC.has(key)).toBe(false);
    }
  });

  it('every registry entry has sane placement metadata', () => {
    for (const [key, entry] of Object.entries(LANDMARK_REGISTRY)) {
      expect(['background', 'midground', 'foreground'], key).toContain(entry.depth);
      expect(entry.anchorX, key).toBeGreaterThanOrEqual(0);
      expect(entry.anchorX, key).toBeLessThanOrEqual(1);
      expect(entry.baseY, key).toBeGreaterThan(0);
      expect(entry.baseY, key).toBeLessThan(900);
      expect(entry.scale, key).toBeGreaterThan(0);
    }
  });

  it('reports which cities currently use the generic fallback', () => {
    const generic = WORLD_DESTINATIONS
      .filter((d) => !isAuthoredLandmark(d.scene.landmarkSilhouette))
      .map((d) => `${d.city} (${d.scene.landmarkSilhouette})`);
    // Informational — guides the next authoring batch.
    // eslint-disable-next-line no-console
    console.log(`Generic-fallback cities (${generic.length}):\n  ${generic.join('\n  ')}`);
    expect(generic.length).toBe(productionKeys.filter((key) => INTENTIONALLY_GENERIC.has(key)).length);
  });
});
