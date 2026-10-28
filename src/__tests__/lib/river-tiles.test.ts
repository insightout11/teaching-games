import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { clearRiverTileCache, decodeRiverTile, riverTileKey, riverTilesForBox, riversInBox, type RiverLine } from '@/lib/live-room/river-tiles';

const DIR = join(process.cwd(), 'public', 'data', 'rivers');
// Serves the real built tiles from disk.
const diskFetch = (async (url: string) => {
  const key = String(url).split('/').pop()!;
  try {
    const text = readFileSync(join(DIR, key), 'utf8');
    return { ok: true, json: async () => JSON.parse(text) } as Response;
  } catch {
    return { ok: false, json: async () => ({}) } as Response;
  }
}) as typeof fetch;

const km = (lat: number, a: [number, number], b: [number, number]) =>
  Math.hypot((a[0] - b[0]) * 111.32 * Math.cos((lat * Math.PI) / 180), (a[1] - b[1]) * 111.32);
const nearestKm = (lines: RiverLine[], lat: number, lng: number) =>
  Math.min(...lines.flatMap((l) => l.points.map((p) => km(lat, p, [lng, lat]))));
const around = (lat: number, lng: number, d = 0.2): [number, number, number, number] => [lng - d, lat - d, lng + d, lat + d];

describe('river tiles', () => {
  beforeEach(() => clearRiverTileCache());

  it('names tiles like the build script', () => {
    expect(riverTileKey(35.9, 140.07)).toBe('N30E140');
    expect(riverTileKey(28.6, 77.2)).toBe('N20E070');
    expect(riverTileKey(-3.1, -60)).toBe('S10W060');
    expect(riverTileKey(89.9, 179.99)).toBe('N80E170');
    expect(riverTilesForBox([-1, 9, 1, 11]).sort()).toEqual(['N00E000', 'N00W010', 'N10E000', 'N10W010']);
  });

  it('decodes strictly', () => {
    const lines = decodeRiverTile({ v: 1, tile: 'T', unit: 0.0005, lines: [[2, '1.2.1.-1']] });
    expect(lines[0].widthClass).toBe(2);
    expect(lines[0].points).toEqual([[0.0005, 0.001], [0.001, 0.0005]]);
    expect(() => decodeRiverTile({ v: 2, tile: 'T', unit: 0.0005, lines: [] })).toThrow();
    expect(() => decodeRiverTile({ v: 1, tile: 'T', unit: 0.0005, lines: [[7, '1.2.1.1']] })).toThrow();
  });

  it('every built tile decodes, and the manifest matches the files', () => {
    const manifest = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8'));
    const keys = Object.keys(manifest.tiles);
    expect(keys.length).toBeGreaterThan(200);
    for (const key of keys) {
      const file = JSON.parse(readFileSync(join(DIR, `${key}.json`), 'utf8'));
      expect(file.tile).toBe(key);
      expect(decodeRiverTile(file).length).toBe(manifest.tiles[key].lines);
    }
  });

  it('finds real rivers where they are', async () => {
    // Yamuna at Delhi, Rhine at Cologne, Draa near Zagora (dry-country river kept by catchment), Shinano at Nagaoka.
    for (const [lat, lng, maxKm] of [[28.61, 77.25, 2], [50.94, 6.96, 2], [30.33, -5.84, 3], [37.45, 138.85, 3]] as const) {
      const lines = await riversInBox(around(lat, lng), diskFetch);
      expect(nearestKm(lines, lat, lng)).toBeLessThan(maxKm);
    }
  });

  it('returns nothing over open ocean', async () => {
    expect(await riversInBox(around(-30, -130), diskFetch)).toEqual([]);
  });
});
