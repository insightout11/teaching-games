import type { Terrain } from '@/components/live-room/flight/cockpit-ground';
import type { LatLng } from './route-terrain';
import {
  LAND_COVER_HEIGHT, LAND_COVER_WIDTH, LAND_COVER_RESOLUTION,
  LAND_COVER_LEGEND, LAND_COVER_RUNS,
} from '@/data/world/land-cover';
import type { LandCover } from '@/data/world/land-cover';

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

const SCENE_TERRAIN: Record<LandCover, Terrain> = {
  ocean: 'ocean', ice: 'ice', tundra: 'farmland', 'boreal-forest': 'forest',
  forest: 'forest', rainforest: 'forest', savanna: 'farmland', grassland: 'farmland',
  farmland: 'farmland', 'rice-paddies': 'farmland', desert: 'desert',
  'salt-flats': 'desert', wetlands: 'farmland', mountains: 'mountains', city: 'farmland',
};

/** Compatibility only: callers must opt in; the current renderer is untouched. */
export function toSceneTerrain(cover: LandCover): Terrain { return SCENE_TERRAIN[cover]; }
