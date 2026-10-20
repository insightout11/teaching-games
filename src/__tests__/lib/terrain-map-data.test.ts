import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { riversNear } from '@/lib/live-room/rivers';
import { lakesNear } from '@/lib/live-room/lakes';
import { coastNear } from '@/lib/live-room/coastlines';
import { decodeElevation, elevationAt, loadElevation } from '@/lib/live-room/elevation';
import { clipMapLine, clipMapRing, decodeMapLine, mapPosition, mapQueryBox, type MapPoint } from '@/lib/live-room/map-data-geometry';

function inBox(points: MapPoint[], centre: { lat: number; lng: number }, km: number) {
  const box = mapQueryBox(centre, km);
  points.forEach(([x, y], i) => {
    expect(x).toBeGreaterThanOrEqual(box[0] - 1e-8); expect(x).toBeLessThanOrEqual(box[2] + 1e-8);
    expect(y).toBeGreaterThanOrEqual(box[1] - 1e-8); expect(y).toBeLessThanOrEqual(box[3] + 1e-8);
    if (i) expect(Math.abs(x - points[i - 1][0])).toBeLessThanOrEqual(box[2] - box[0] + 1e-8);
  });
}

describe('static terrain map sources', () => {
  it.each(['rivers', 'lakes', 'coastlines', 'coastlines-2', 'coastlines-3', 'elevation'])('%s is below both raw and gzip browser budgets', name => {
    const file = path.join(process.cwd(), 'src/data/world', name + '.json');
    const bytes = readFileSync(file);
    expect(statSync(file).size).toBeLessThan(250_000);
    expect(gzipSync(bytes).length).toBeLessThan(100_000);
    const data = JSON.parse(bytes.toString());
    expect(data.metadata.provenance.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(data.metadata.licence).toBe('Public domain');
  });
  it('keeps the requested major river and lake names', () => {
    const rivers = JSON.parse(readFileSync('src/data/world/rivers.json', 'utf8')).data as Array<[string, number, string[]]>;
    const lakes = JSON.parse(readFileSync('src/data/world/lakes.json', 'utf8')).data as Array<[string, string[][]]>;
    const riverNames = rivers.map(r => r[0]).join('|'), lakeNames = lakes.map(l => l[0]).join('|');
    for (const name of ['Nile', 'Amazon', 'Mississippi', 'Yangtze', 'Mekong', 'Danube', 'Rhine', 'Ganges', 'Volga', 'Congo', 'Niger', 'Murray']) expect(riverNames).toContain(name);
    for (const name of ['Superior', 'Michigan', 'Huron', 'Erie', 'Ontario', 'Victoria', 'Baikal', 'Titicaca', 'Ladoga', 'Tanganyika', 'Caspian']) expect(lakeNames).toContain(name);
    expect(rivers.every(r => [1, 2, 3].includes(r[1]))).toBe(true);
  });
  it('retains source coordinate precision and continuous edges in all vector files', () => {
    const rivers = JSON.parse(readFileSync('src/data/world/rivers.json', 'utf8')).data as Array<[string, number, string[]]>;
    const lakes = JSON.parse(readFileSync('src/data/world/lakes.json', 'utf8')).data as Array<[string, string[][]]>;
    const coast = ['coastlines', 'coastlines-2', 'coastlines-3'].flatMap(name => JSON.parse(readFileSync('src/data/world/' + name + '.json', 'utf8')).data as string[][]);
    const lines = [...rivers.flatMap(r => r[2]), ...lakes.flatMap(l => l[1].flat()), ...coast.flat()];
    for (const line of lines) {
      const points = decodeMapLine(line);
      for (let i = 0; i < points.length; i++) {
        expect(Math.abs(points[i][1])).toBeLessThanOrEqual(90);
        if (i && Math.abs(points[i][0] - points[i - 1][0]) > 180) {
          // Natural Earth's artificial South Pole closure is retained in the land
          // polygon, but explicitly excluded by coastNear (tested separately).
          expect(points[i][1]).toBe(-90); expect(points[i - 1][1]).toBe(-90);
        }
      }
    }
  });
});

describe('river and lake geography', () => {
  it('finds and clips the Nile near Luxor', async () => {
    const p = { lat: 25.69, lng: 32.64 }, rivers = await riversNear(p, 30);
    expect(rivers.some(r => r.name === 'Nile' && r.widthClass === 1)).toBe(true);
    rivers.forEach(r => inBox(r.points, p, 30));
  });
  it('returns Lake Victoria near Kampala, including a clipped fill when inside the lake', async () => {
    const p = { lat: 0.31, lng: 32.58 }, lakes = await lakesNear(p, 60);
    expect(lakes.some(l => l.name.includes('Victoria'))).toBe(true);
    lakes.forEach(l => l.rings.forEach(ring => { inBox(ring, p, 60); expect(ring[0]).toEqual(ring[ring.length - 1]); }));
    const interior = await lakesNear({ lat: -1, lng: 33 }, 1);
    expect(interior.some(l => l.name.includes('Victoria'))).toBe(true);
  });
  it('includes the Caspian Sea rather than silently losing an inland sea', async () => {
    expect((await lakesNear({ lat: 41, lng: 50 }, 30)).some(l => l.name === 'Caspian Sea')).toBe(true);
  });
  it('returns no distant river or lake in the central Pacific', async () => {
    expect(await riversNear({ lat: 0, lng: -140 }, 50)).toEqual([]);
    expect(await lakesNear({ lat: 0, lng: -140 }, 50)).toEqual([]);
  });
});

describe('real coastline clipping', () => {
  it('runs broadly north-south near Sydney and stays inside the requested box', async () => {
    const p = { lat: -33.87, lng: 151.21 }, lines = await coastNear(p, 80);
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach(line => inBox(line, p, 80));
    const longest = lines.reduce((a, b) => a.length > b.length ? a : b);
    const span = (axis: number) => Math.max(...longest.map(p => p[axis])) - Math.min(...longest.map(p => p[axis]));
    expect(span(1)).toBeGreaterThan(span(0));
  });
  it('keeps Fiji shores local on both sides of 180 and equivalent wrapped queries', async () => {
    const p = { lat: -16.8, lng: 179.9 }, lines = await coastNear(p, 150);
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach(line => inBox(line, p, 150));
    expect(await coastNear({ lat: p.lat, lng: -180.1 }, 150)).toEqual(lines);
    const east = { lat: -16.8, lng: -179.9 };
    (await coastNear(east, 150)).forEach(line => inBox(line, east, 150));
    expect(await coastNear({ lat: -17, lng: 0 }, 50)).toEqual([]);
  });
  it('does not turn the date-line or pole polygon closure into a shore', async () => {
    const p = { lat: 0, lng: 180 };
    expect(await coastNear(p, 20)).toEqual([]);
    expect(await coastNear({ lat: -90, lng: 0 }, 30)).toEqual([]);
    const aleutians = { lat: 52.5, lng: 179.5 };
    const lines = await coastNear(aleutians, 180);
    expect(lines.length).toBeGreaterThan(0); lines.forEach(line => inBox(line, aleutians, 180));
  });
  it('retains the shore of Capri, an island only several kilometres across', async () => {
    const p = { lat: 40.55, lng: 14.24 }, lines = await coastNear(p, 5);
    expect(lines.length).toBeGreaterThan(0); lines.forEach(line => inBox(line, p, 5));
  });
});

describe('clipping and input contracts', () => {
  it('clips crossing segments with both endpoints outside, without joining separate pieces', () => {
    expect(clipMapLine([[-2, 0], [2, 0]], [-1, -1, 1, 1])).toEqual([[[-1, 0], [1, 0]]]);
    expect(clipMapLine([[-2, 0], [2, 0], [2, 2], [-2, 2], [-2, 0]], [-1, -1, 1, 1])).toHaveLength(1);
    expect(clipMapLine([[180, -1], [180, 1]], [179, -2, 181, 2], 0, true)).toEqual([]);
  });
  it('clips a surrounding polygon into a closed box fill, not an empty edge result', () => {
    const ring = clipMapRing([[-2, -2], [2, -2], [2, 2], [-2, 2], [-2, -2]], [-1, -1, 1, 1], 0);
    expect(ring).toHaveLength(5); expect(ring[0]).toEqual(ring[4]);
    expect(new Set(ring.map(p => p.join(','))).size).toBe(4);
    expect(clipMapRing([[5, 5], [6, 5], [6, 6], [5, 5]], [-1, -1, 1, 1], 0)).toEqual([]);
  });
  it('rejects invalid positions/radii and handles zero radii and poles', async () => {
    expect(() => mapPosition({ lat: 91, lng: 0 })).toThrow(RangeError);
    expect(() => mapPosition({ lat: 0, lng: NaN })).toThrow(RangeError);
    await expect(riversNear({ lat: 0, lng: 0 }, -1)).rejects.toThrow(RangeError);
    await expect(lakesNear({ lat: 0, lng: 0 }, Infinity)).rejects.toThrow(RangeError);
    expect(await coastNear({ lat: 90, lng: 0 }, 0)).toEqual([]);
    expect(mapQueryBox({ lat: 90, lng: 0 }, 1)).toEqual([-180, expect.any(Number), 180, 90]);
    expect(() => decodeMapLine('1.bad!.2.3')).toThrow();
  });
  it('loads static layers and performs queries without network fetches', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
    try {
      await Promise.all([riversNear({ lat: 25.69, lng: 32.64 }, 20), lakesNear({ lat: 0.31, lng: 32.58 }, 60), coastNear({ lat: -33.87, lng: 151.21 }, 50), loadElevation()]);
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });
});

describe('coarse world elevation', () => {
  beforeAll(async () => { await loadElevation(); });
  it('places the Tibetan Plateau above 4000 m and Netherlands lowlands near sea level', () => {
    expect(elevationAt({ lat: 33, lng: 88 })).toBeGreaterThan(4000);
    expect(elevationAt({ lat: 52.2, lng: 5.2 })).toBeLessThan(50);
    expect(elevationAt({ lat: 0, lng: -140 })).toBe(0);
  });
  it('interpolates bilinearly between four cell centres', () => {
    const samples = [{ lat: 32.75, lng: 87.75 }, { lat: 32.75, lng: 88.25 }, { lat: 33.25, lng: 87.75 }, { lat: 33.25, lng: 88.25 }];
    expect(elevationAt({ lat: 33, lng: 88 })).toBeCloseTo(samples.reduce((sum, p) => sum + elevationAt(p), 0) / 4, 5);
  });
  it('wraps longitude continuously at 180 and clamps the polar rows', () => {
    expect(elevationAt({ lat: -17, lng: 180 })).toBe(elevationAt({ lat: -17, lng: -180 }));
    expect(elevationAt({ lat: 45, lng: 370 })).toBe(elevationAt({ lat: 45, lng: 10 }));
    expect(elevationAt({ lat: 90, lng: 0 })).toBe(elevationAt({ lat: 89.75, lng: 0 }));
    expect(elevationAt({ lat: -90, lng: 0 })).toBe(elevationAt({ lat: -89.75, lng: 0 }));
    expect(Number.isFinite(elevationAt({ lat: -90, lng: 180 }))).toBe(true);
  });
  it('checks the whole packed grid and rejects corrupt dimensions/runs', () => {
    const packed = JSON.parse(readFileSync('src/data/world/elevation.json', 'utf8')).data as string;
    const grid = decodeElevation(packed);
    expect(grid.length).toBe(720 * 360);
    expect(grid.every(n => Number.isFinite(n) && n >= 0 && n <= 9000)).toBe(true);
    expect(() => decodeElevation(btoa(String.fromCharCode(0, 0, 0)))).toThrow();
    expect(() => decodeElevation(btoa(String.fromCharCode(0, 2)))).toThrow();
    expect(() => decodeElevation(packed.slice(0, -4))).toThrow();
  });
});
