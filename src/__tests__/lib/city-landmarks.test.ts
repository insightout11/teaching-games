import { describe, expect, it } from 'vitest';
import { LANDMARK_CATALOG, LANDMARK_COLOURS, type Landmark } from '@/data/world/landmark-catalog';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { drawnLandmarkNear } from '@/lib/live-room/landmarks-ahead';
import { cityLandmarksReport, greatCircleKm, renderCityLandmarksReport, shapeIsDrawn, REACH_KM } from '../../../scripts/dev/city-landmarks-report';

// The additions from this brief, not a fixed total for the growing catalogue.
const additions = ['popocatepetl', 'rangitoto', 'mount-baker', 'diamond-head', 'salak', 'keilir', 'longonot', 'tolima', 'tupungato'];
const baseline = LANDMARK_CATALOG.filter(landmark => !additions.includes(landmark.id));

describe('city landmark report', () => {
  it('uses spherical distance across the date line and at the antipode', () => {
    expect(greatCircleKm({ lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 })).toBeCloseTo(111.195, 3);
    expect(greatCircleKm({ lat: 0, lng: 0 }, { lat: 0, lng: 180 })).toBeCloseTo(Math.PI * 6371, 6);
    expect(greatCircleKm({ lat: 90, lng: 0 }, { lat: 90, lng: 180 })).toBeCloseTo(0, 6);
    expect(greatCircleKm({ lat: -20, lng: 30 }, { lat: -20, lng: 30 })).toBe(0);
  });

  it('includes the 150 km boundary, excludes beyond it, and sorts using unrounded distances', () => {
    const city = { id: 'test', city: 'Test City', lat: 0, lng: 0 };
    const at = (id: string, km: number): Landmark => ({ ...LANDMARK_CATALOG[0], id, lat: 0, lng: km / 6371 * 180 / Math.PI });
    const report = cityLandmarksReport([city], [at('outside', 150.01), at('boundary', REACH_KM), at('closer', 149.99)]);
    expect(report[0].landmarks.map(row => row.landmark.id)).toEqual(['closer', 'boundary']);
    expect(report[0].landmarks[1].distanceKm).toBeCloseTo(REACH_KM, 8);
    expect(report[0].takeOffLandmark?.id).toBe('closer');
  });

  it('lists all and only nearby landmarks for every destination, including non-drawn shapes', () => {
    const report = cityLandmarksReport();
    expect(report.map(row => row.city.id)).toEqual(WORLD_DESTINATIONS.map(city => city.id));
    report.forEach(row => {
      expect(row.landmarks.map(entry => entry.landmark.id).sort()).toEqual(LANDMARK_CATALOG
        .filter(landmark => greatCircleKm(row.city, landmark) <= REACH_KM).map(landmark => landmark.id).sort());
      expect(row.takeOffLandmark).toEqual(drawnLandmarkNear(row.city, 0));
    });
    const london = report.find(row => row.city.id === 'london')!;
    expect(london.landmarks.find(row => row.landmark.id === 'stonehenge')?.drawn).toBe(false);
  });

  it('distinguishes the Niagara drawing from eligibility for city take-off', () => {
    const niagara = LANDMARK_CATALOG.find(landmark => landmark.id === 'niagara')!;
    expect(shapeIsDrawn(niagara)).toBe(true);
    const report = cityLandmarksReport([{ id: 'toronto', city: 'Toronto', lat: 43.6532, lng: -79.3832 }], [niagara]);
    expect(report[0].landmarks[0].drawn).toBe(true);
    expect(report[0].takeOffLandmark).toBeNull();
    expect(renderCityLandmarksReport(report)).toContain('| yes | no |');
  });

  it('prints cities with no landmarks and no drawn landmark, without dropping non-drawn rows', () => {
    const ruin: Landmark = { ...LANDMARK_CATALOG[0], id: 'ruin', name: 'Old | ruins', shape: 'ruins', lat: 0, lng: 0.1 };
    const report = cityLandmarksReport([
      { id: 'near', city: 'Near', lat: 0, lng: 0 },
      { id: 'empty', city: 'Empty', lat: 60, lng: 0 },
    ], [ruin]);
    const text = renderCityLandmarksReport(report);
    expect(text).toContain('| Near (near) | Old \\| ruins | ruins | 11.1 | no | no |');
    expect(text).toContain('| Empty (empty) | none |');
    expect(text).toContain('Cities with no drawn shape in reach:\nNear, Empty');
    expect(text).toContain('Cities with no eligible city take-off landmark in reach:\nNear, Empty');
    expect(renderCityLandmarksReport([])).toContain('Cities with no drawn shape in reach:\nnone');
  });
});

describe('city landmark additions', () => {
  it.each(additions)('%s has a valid summit, supported drawing and sourced teaching content', id => {
    const landmark = LANDMARK_CATALOG.find(entry => entry.id === id);
    expect(landmark, id).toBeDefined();
    if (!landmark) return;
    expect(Number.isFinite(landmark.lat)).toBe(true);
    expect(Number.isFinite(landmark.lng)).toBe(true);
    expect(Math.abs(landmark.lat)).toBeLessThanOrEqual(90);
    expect(Math.abs(landmark.lng)).toBeLessThanOrEqual(180);
    expect(landmark.shape).toBe('volcano');
    expect(shapeIsDrawn(landmark)).toBe(true);
    expect(landmark.look).toBeDefined();
    expect(LANDMARK_COLOURS).toContain(landmark.look!.colour);
    expect(landmark.look!.snowLine).toBeGreaterThanOrEqual(0);
    expect(landmark.look!.snowLine).toBeLessThanOrEqual(1);
    expect(typeof landmark.look!.steam).toBe('boolean');
    expect(typeof landmark.look!.crater).toBe('boolean');
    for (const level of ['junior', 'core', 'advanced'] as const) {
      expect(landmark.facts[level]).toHaveLength(3);
      landmark.facts[level].forEach(fact => {
        expect(fact.trim()).not.toBe('');
        expect(fact).not.toMatch(/\uFFFD/);
        if (level === 'junior') expect(fact.trim().split(/\s+/).length, fact).toBeLessThanOrEqual(8);
      });
    }
    expect(landmark.question).toMatch(/\?$/);
    expect(landmark.sources.length).toBeGreaterThan(0);
    landmark.sources.forEach(source => expect(new URL(source).protocol).toBe('https:'));
    expect(landmark.note?.trim().length).toBeGreaterThan(0);
  });

  it.each(additions)('%s fills a previously uncovered destination within 150 km', id => {
    const landmark = LANDMARK_CATALOG.find(entry => entry.id === id)!;
    expect(WORLD_DESTINATIONS.some(city => greatCircleKm(city, landmark) <= REACH_KM
      && drawnLandmarkNear(city, 0, REACH_KM, baseline) === null
      && drawnLandmarkNear(city, 0, REACH_KM, [landmark])?.id === id)).toBe(true);
  });

  it('does not duplicate any catalogue landmark within one kilometre', () => {
    for (let a = 0; a < LANDMARK_CATALOG.length; a++) {
      for (let b = a + 1; b < LANDMARK_CATALOG.length; b++) {
        const first = LANDMARK_CATALOG[a], second = LANDMARK_CATALOG[b];
        expect(greatCircleKm(first, second), `${first.id} / ${second.id}`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
