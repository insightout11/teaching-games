import { describe, expect, it } from 'vitest';
import { naturalLandmark, photoLandmarkId, sharpenTerrainSummits, selfieTerrainRoute, terrainRouteLandmarks } from '@/lib/live-room/terrain-landmarks';
import { surfaceFromHighGround } from '@/lib/live-room/terrain-surface';
import { routeLengthKm } from '@/lib/live-room/coast-strip';

const tokyo = { lat: 35.6762, lng: 139.6503 }, osaka = { lat: 34.6937, lng: 135.5023 };
describe('natural landmarks in the terrain', () => {
  it('uses natural summit kinds without treating pyramids or falls as mountains', () => {
    for (const kind of ['fuji','everest','matterhorn','kilimanjaro','volcano'] as const) expect(naturalLandmark(kind)).toBe(true);
    expect(naturalLandmark('pyramids')).toBe(false); expect(naturalLandmark('niagara')).toBe(false);
  });
  it('keeps the real Fuji catalogue position and makes only a small local change to existing relief', () => {
    const km = routeLengthKm(tokyo, osaka), fuji = terrainRouteLandmarks(tokyo, osaka, km).find(l => l.id === 'fuji')!;
    expect(fuji.along).toBeGreaterThan(60); expect(fuji.along).toBeLessThan(110);
    const rows = 101, cols = 101, heights = new Float32Array(rows * cols).fill(3000);
    const g = surfaceFromHighGround({ ahead0: fuji.along! - 50, side0: fuji.lateral - 50, step: 1, rows, cols, height: heights, snow: new Uint8Array(heights.length), rugged: new Float32Array(heights.length) });
    sharpenTerrainSummits(g, tokyo, osaka, km);
    expect(Math.max(...Array.from(g.height))).toBe(3120);
    expect(g.height[0]).toBe(3000);
    expect(g.height.filter(h => h !== 3000).length).toBeLessThan(20);
  });
  it('gives selfie cards a fixed real view through the same catalogue landmark', () => {
    const view = selfieTerrainRoute('everest', 'everest')!;
    expect(view.id).toBe('everest'); expect(view.from.lng).toBeCloseTo(86.925);
    expect((view.from.lat + view.to.lat) / 2).toBeCloseTo(27.9881);
    expect(selfieTerrainRoute('pyramids')?.id).toBe('pyramids');
  });
  it('lifts Everest over a broad summit neighbourhood without changing distant terrain', () => {
    const from = { lat: 27.7172, lng: 85.324 }, to = { lat: 29.652, lng: 91.172 }, km = routeLengthKm(from, to);
    const summit = terrainRouteLandmarks(from, to, km).find(l => l.id === 'everest')!;
    const rows = 101, cols = 101, heights = new Float32Array(rows * cols).fill(8000);
    const g = surfaceFromHighGround({ ahead0: summit.along! - 50, side0: summit.lateral - 50, step: 1, rows, cols, height: heights, snow: new Uint8Array(heights.length), rugged: new Float32Array(heights.length) });
    sharpenTerrainSummits(g, from, to, km);
    expect(g.height.reduce((a, b) => Math.max(a, b), 0)).toBe(8640);
    expect(g.height.filter(h => h > 8000).length).toBe(25);
    expect(g.height.filter(h => h > 8400).length).toBeGreaterThan(1);
    expect(g.height[0]).toBe(8000);
  });
  it('finds photo opportunities by position regardless of how a landmark is drawn', () => {
    const landmarks = new Map([['everest', {x: 0,z: 20000}], ['fuji', {x: 100,z: 15000}], ['pyramids', {x: 0,z: 30000}]]);
    expect(photoLandmarkId(landmarks, 0, 1000, 1200)).toBe('fuji');
    landmarks.set('fuji', {x: 50000,z: 15000});
    expect(photoLandmarkId(landmarks, 0, 1000, 1200)).toBe('everest');
    expect(photoLandmarkId(landmarks, 45000, 1000, 1200)).toBeNull();
  });
});
