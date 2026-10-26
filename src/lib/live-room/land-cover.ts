import type { Terrain } from '@/components/live-room/flight/cockpit-ground';
import type { LatLng } from './route-terrain';
import {
  LAND_COVER_HEIGHT, LAND_COVER_WIDTH, LAND_COVER_RESOLUTION,
  LAND_COVER_LEGEND, LAND_COVER_RUNS,
} from '@/data/world/land-cover';
import type { LandCover } from '@/data/world/land-cover';
import { NAMED_REGIONS, TEACHING_LANDMARKS } from '@/data/world/named-regions';
import { inPolygon, type RegionPolygon } from './terrain-geometry';

export type { LandCover } from '@/data/world/land-cover';
let grid: string | undefined;

/** Decode only on the first lookup; importing a helper does not expand the grid. */
export function decodeLandCover(runs: string): string {
  const pattern = /([0-9a-z]+)([A-O])/g;
  const parts: string[] = [];
  let match: RegExpExecArray | null, consumed = 0, cells = 0;
  while ((match = pattern.exec(runs))) {
    if (match.index !== consumed) throw new Error('Invalid land-cover encoding');
    const count = parseInt(match[1], 36);
    cells += count;
    if (!count || cells > LAND_COVER_WIDTH * LAND_COVER_HEIGHT) throw new Error('Invalid land-cover run length');
    parts.push(match[2].repeat(count));
    consumed = pattern.lastIndex;
  }
  if (consumed !== runs.length || cells !== LAND_COVER_WIDTH * LAND_COVER_HEIGHT) throw new Error('Invalid land-cover dimensions');
  return parts.join('');
}

function normalise(p: LatLng): LatLng {
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng) || p.lat < -90 || p.lat > 90) throw new RangeError('Expected finite coordinates and latitude in [-90, 90]');
  return { lat: p.lat, lng: ((p.lng + 180) % 360 + 360) % 360 - 180 };
}

/** Half-open cells west/east and north/south; poles clamp to their nearest row. */
export function landCoverAt(p: LatLng): LandCover {
  const { lat, lng } = normalise(p);
  if (grid === undefined) grid = decodeLandCover(LAND_COVER_RUNS);
  const x = Math.floor((lng + 180) / LAND_COVER_RESOLUTION);
  const y = Math.min(LAND_COVER_HEIGHT - 1, Math.floor((90 - lat) / LAND_COVER_RESOLUTION));
  return LAND_COVER_LEGEND[grid[y * LAND_COVER_WIDTH + x] as keyof typeof LAND_COVER_LEGEND];
}

const mountainClimateCache = new Map<number, number>();
const coverDryness: Partial<Record<LandCover, number>> = {
  desert: 1, 'salt-flats': 1, tundra: 0.85, grassland: 0.65, savanna: 0.65,
  farmland: 0.15, 'rice-paddies': 0, forest: 0, 'boreal-forest': 0, rainforest: 0, wetlands: 0,
};
/** Mountain is a relief refinement, not a climate. Borrow nearby MODIS cover once per source cell. */
export function mountainClimateAt(p: LatLng): number {
  const point = normalise(p), cover = landCoverAt(point);
  if (cover !== 'mountains') return coverDryness[cover] ?? 0;
  const x = Math.floor((point.lng + 180) / LAND_COVER_RESOLUTION);
  const y = Math.min(LAND_COVER_HEIGHT - 1, Math.floor((90 - point.lat) / LAND_COVER_RESOLUTION));
  const key = y * LAND_COVER_WIDTH + x, cached = mountainClimateCache.get(key);
  if (cached !== undefined) return cached;
  let dry = 0, total = 0;
  // Fixed cell centres avoid a climate change within one categorical MODIS cell. Ignore water/ice/cities.
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
    if ((!dx && !dy) || y + dy < 0 || y + dy >= LAND_COVER_HEIGHT) continue;
    const neighbour = landCoverAt({lat: 90 - (y + dy + 0.5) * LAND_COVER_RESOLUTION,
      lng: (x + dx + 0.5) * LAND_COVER_RESOLUTION - 180});
    const value = coverDryness[neighbour]; if (value === undefined) continue;
    const distance = dx * dx + dy * dy, weight = 1 / (distance * distance);
    dry += value * weight; total += weight;
  }
  const result = total ? dry / total : 0.5;
  mountainClimateCache.set(key, result); return result;
}

const SCENE_TERRAIN: Record<LandCover, Terrain> = {
  ocean: 'ocean', ice: 'ice', tundra: 'farmland', 'boreal-forest': 'forest',
  forest: 'forest', rainforest: 'forest', savanna: 'farmland', grassland: 'farmland',
  farmland: 'farmland', 'rice-paddies': 'farmland', desert: 'desert',
  'salt-flats': 'desert', wetlands: 'farmland', mountains: 'mountains', city: 'farmland',
};

/** Compatibility only: callers must opt in; the current renderer is untouched. */
export function toSceneTerrain(cover: LandCover): Terrain { return SCENE_TERRAIN[cover]; }

/** Decode the compact delta representation once when named geography is first used. */
export function decodeRegionGeometry(geometry: string): RegionPolygon[] {
  return geometry.split('|').map(polygon => polygon.split('~').map(ring => {
    const values = ring.split('.');
    if (values.length < 8 || values.length % 2) throw new Error('Invalid region ring');
    let x = 0, y = 0;
    const points: [number, number][] = [];
    for (let i = 0; i < values.length; i += 2) {
      if (!/^-?[0-9a-z]+$/.test(values[i]) || !/^-?[0-9a-z]+$/.test(values[i + 1])) throw new Error('Invalid region coordinate');
      x += parseInt(values[i], 36); y += parseInt(values[i + 1], 36);
      points.push([x / 1000, y / 1000]);
    }
    return points;
  }));
}

interface RegionCandidate {
  name: string; kind: string; areaKm2: number;
  contains: (p: LatLng) => boolean;
}
let candidates: RegionCandidate[] | undefined;

function distanceKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const h = Math.sin((a.lat - b.lat) * rad / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((a.lng - b.lng) * rad / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, h)));
}

function regionCandidates(): RegionCandidate[] {
  if (candidates) return candidates;
  candidates = NAMED_REGIONS.map(region => {
    const polygons = decodeRegionGeometry(region.geometry).map(polygon => {
      const outer = polygon[0]; // Build script has already unwrapped longitudes.
      return {
        polygon, anchor: outer[0][0],
        minX: Math.min(...outer.map(p => p[0])), maxX: Math.max(...outer.map(p => p[0])),
        minY: Math.min(...outer.map(p => p[1])), maxY: Math.max(...outer.map(p => p[1])),
      };
    });
    return {
      name: region.name, kind: region.kind, areaKm2: region.areaKm2,
      contains: (p: LatLng) => polygons.some(shape => {
        const lng = p.lng + 360 * Math.round((shape.anchor - p.lng) / 360);
        return lng >= shape.minX && lng <= shape.maxX && p.lat >= shape.minY && p.lat <= shape.maxY && inPolygon(lng, p.lat, shape.polygon);
      }),
    };
  });
  candidates = candidates.concat(TEACHING_LANDMARKS.map(place => ({
    name: place.name, kind: place.kind, areaKm2: Math.PI * place.radiusKm ** 2,
    contains: (p: LatLng) => distanceKm(p, place) <= place.radiusKm,
  })));
  candidates.sort((a, b) => a.areaKm2 - b.areaKm2 || a.name.localeCompare(b.name));
  return candidates;
}

/** Smallest matching region or proximity circle wins, including nested ranges. */
export function namedRegionAt(p: LatLng): { name: string; kind: string } | null {
  const point = normalise(p);
  const match = regionCandidates().find(candidate => candidate.contains(point));
  return match ? { name: match.name, kind: match.kind } : null;
}
