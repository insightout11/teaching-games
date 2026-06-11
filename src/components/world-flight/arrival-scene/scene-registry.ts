import type {
  DestinationSceneSkyline,
  DestinationSceneTerrain,
  DestinationSceneVegetation,
} from '@/lib/world-flight/types';
import type { LandmarkRegistryEntry } from './types';
import { FujiLandmark } from './landmarks/fuji';
import { MountainsLandmark } from './landmarks/mountains';
import { PyramidsLandmark } from './landmarks/pyramids';
import { DiamondHeadLandmark } from './landmarks/diamond-head';
import { TempleRoofLandmark } from './landmarks/temple-roof';
import { OperaHouseLandmark } from './landmarks/opera-house';
import { CanalHousesLandmark } from './landmarks/canal-houses';
import { HallgrimskirkjaLandmark } from './landmarks/hallgrimskirkja';
import { KingsParkSkylineLandmark } from './landmarks/kings-park-skyline';
import { GenericLandmark } from './landmarks/generic-landmark';
import { EiffelLandmark } from './landmarks/eiffel';
import { BigBenLandmark } from './landmarks/big-ben';
import { BurjLandmark } from './landmarks/burj';
import { CnTowerLandmark } from './landmarks/cn-tower';
import { MonasLandmark } from './landmarks/monas';
import { ObeliskLandmark } from './landmarks/obelisk';
import { SaintBasilsLandmark } from './landmarks/saint-basils';
import { MosqueLandmark } from './landmarks/mosque';
import { CathedralLandmark } from './landmarks/cathedral';
import { BrandenburgGateLandmark } from './landmarks/brandenburg-gate';
import { ForbiddenCityLandmark } from './landmarks/forbidden-city';
import { PalaceGateLandmark } from './landmarks/palace-gate';
import { ColosseumLandmark } from './landmarks/colosseum';
import { StatueLibertyLandmark } from './landmarks/statue-liberty';
import { SupertreeLandmark } from './landmarks/supertree';
import { SeaLinkLandmark } from './landmarks/sea-link';
import { LagoonBridgeLandmark } from './landmarks/lagoon-bridge';
import { HarbourLandmark } from './landmarks/harbour';
import { TableMountainLandmark } from './landmarks/table-mountain';
import { HollywoodSignLandmark } from './landmarks/hollywood-sign';
import { ChristTheRedeemerLandmark } from './landmarks/christ-the-redeemer';

// ── Landmark registry ────────────────────────────────────────────────────────
// Placement (depth slot + anchor/baseY/scale/opacity) lives HERE, not inside the
// landmark components — every landmark draws around a base-center local origin
// and the composer applies the transform. baseY is in the shared 0–900 system
// (see LAYOUT in types.ts): background landmarks ≈ horizon (590), foreground
// landmarks sit slightly lower/closer (≈630), still behind the runway band.

// Foreground & midground landmarks anchor on the LEFT half of the frame so the
// plane (which lands/parks on the right) never occludes them; large distant
// background landmarks stay where they read best.
export const LANDMARK_REGISTRY: Record<string, LandmarkRegistryEntry> = {
  // Background — distant, behind the terrain/skyline.
  fuji: { component: FujiLandmark, depth: 'background', anchorX: 0.68, baseY: 590, scale: 1.0 },
  mountains: { component: MountainsLandmark, depth: 'background', anchorX: 0.5, baseY: 588, scale: 1.05, opacity: 0.96 },
  'diamond-head': { component: DiamondHeadLandmark, depth: 'background', anchorX: 0.7, baseY: 594, scale: 0.92 },
  'table-mountain': { component: TableMountainLandmark, depth: 'background', anchorX: 0.5, baseY: 590, scale: 1.0, opacity: 0.96 },
  'christ-the-redeemer': { component: ChristTheRedeemerLandmark, depth: 'background', anchorX: 0.66, baseY: 590, scale: 0.95 },

  // Midground — on the land, behind the city skyline buildings.
  pyramids: { component: PyramidsLandmark, depth: 'midground', anchorX: 0.27, baseY: 600, scale: 0.9 },
  'kings-park-skyline': { component: KingsParkSkylineLandmark, depth: 'midground', anchorX: 0.34, baseY: 598, scale: 0.86 },
  // Hollywood sign on a hill behind the city: midground so the skyline's taller
  // buildings overlap the hill while the letters peek above the shorter ones.
  // baseY lifts the ridge above the shorter rooflines (the hill's grounded base
  // is hidden behind the buildings in front).
  'hollywood-sign': { component: HollywoodSignLandmark, depth: 'midground', anchorX: 0.34, baseY: 632, scale: 0.98 },

  // Foreground — closest cultural accent, in front of the skyline (left side).
  'temple-roof': { component: TempleRoofLandmark, depth: 'foreground', anchorX: 0.32, baseY: 628, scale: 0.78 },
  'opera-house': { component: OperaHouseLandmark, depth: 'foreground', anchorX: 0.34, baseY: 630, scale: 0.84 },
  'canal-houses': { component: CanalHousesLandmark, depth: 'foreground', anchorX: 0.32, baseY: 632, scale: 0.74 },
  hallgrimskirkja: { component: HallgrimskirkjaLandmark, depth: 'foreground', anchorX: 0.34, baseY: 628, scale: 0.76 },

  // towers & columns
  eiffel: { component: EiffelLandmark, depth: 'foreground', anchorX: 0.3, baseY: 628, scale: 0.82 },
  'big-ben': { component: BigBenLandmark, depth: 'foreground', anchorX: 0.32, baseY: 628, scale: 0.8 },
  burj: { component: BurjLandmark, depth: 'foreground', anchorX: 0.3, baseY: 628, scale: 0.72 },
  'cn-tower': { component: CnTowerLandmark, depth: 'foreground', anchorX: 0.34, baseY: 628, scale: 0.78 },
  monas: { component: MonasLandmark, depth: 'foreground', anchorX: 0.32, baseY: 628, scale: 0.8 },
  obelisk: { component: ObeliskLandmark, depth: 'foreground', anchorX: 0.3, baseY: 628, scale: 0.82 },

  // domed / roofed structures
  'saint-basils': { component: SaintBasilsLandmark, depth: 'foreground', anchorX: 0.34, baseY: 632, scale: 0.78 },
  mosque: { component: MosqueLandmark, depth: 'foreground', anchorX: 0.32, baseY: 632, scale: 0.74 },
  cathedral: { component: CathedralLandmark, depth: 'foreground', anchorX: 0.34, baseY: 632, scale: 0.74 },
  'brandenburg-gate': { component: BrandenburgGateLandmark, depth: 'foreground', anchorX: 0.3, baseY: 634, scale: 0.72 },
  'forbidden-city': { component: ForbiddenCityLandmark, depth: 'foreground', anchorX: 0.32, baseY: 634, scale: 0.72 },
  'palace-gate': { component: PalaceGateLandmark, depth: 'foreground', anchorX: 0.34, baseY: 634, scale: 0.74 },
  colosseum: { component: ColosseumLandmark, depth: 'foreground', anchorX: 0.3, baseY: 636, scale: 0.92 },

  // statues / structures
  'statue-liberty': { component: StatueLibertyLandmark, depth: 'foreground', anchorX: 0.32, baseY: 628, scale: 0.82 },
  supertree: { component: SupertreeLandmark, depth: 'foreground', anchorX: 0.34, baseY: 632, scale: 0.82 },

  // bridges / harbour over water
  'sea-link': { component: SeaLinkLandmark, depth: 'foreground', anchorX: 0.34, baseY: 636, scale: 0.78 },
  'lagoon-bridge': { component: LagoonBridgeLandmark, depth: 'foreground', anchorX: 0.34, baseY: 636, scale: 0.74 },
  harbour: { component: HarbourLandmark, depth: 'foreground', anchorX: 0.34, baseY: 636, scale: 0.8 },
};

// Placement for the generic fallback (used when a landmarkSilhouette has no
// authored component yet). Sits midground so it reads as part of the city.
export const GENERIC_LANDMARK_ENTRY: LandmarkRegistryEntry = {
  component: GenericLandmark,
  depth: 'midground',
  anchorX: 0.66,
  baseY: 612,
  scale: 0.82,
};

/**
 * Production landmarkSilhouette values that intentionally fall back to the
 * generic monument (not yet authored). EXPLICIT on purpose: it is the typo-guard
 * — a new/typo'd value that is neither authored nor listed here fails the
 * registry audit test rather than silently rendering generic.
 *
 * As of batch 2 every current production landmark is authored, so this is empty.
 * If a new destination introduces a landmark we haven't drawn yet, add its key
 * here (intentional generic) or author a component.
 */
export const INTENTIONALLY_GENERIC: ReadonlySet<string> = new Set<string>([
  'art-deco',
  'kicc',
  'monserrate',
  'plaza-mayor',
]);

/** Resolve the registry entry for a landmark key, falling back to the generic monument. */
export function resolveLandmark(key: string | undefined): LandmarkRegistryEntry | null {
  if (!key) return null;
  return LANDMARK_REGISTRY[key] ?? GENERIC_LANDMARK_ENTRY;
}

/** True when a key has a bespoke authored landmark (vs. the generic fallback). */
export function isAuthoredLandmark(key: string | undefined): boolean {
  return Boolean(key && key in LANDMARK_REGISTRY);
}

/**
 * Pure audit helper. Returns the keys that are neither authored nor on the
 * INTENTIONALLY_GENERIC allowlist — i.e. likely typos. Used by the registry
 * test; never mutates destination data.
 */
export function validateLandmarkKeys(keys: string[]): { unknown: string[] } {
  const unknown = keys.filter((k) => !(k in LANDMARK_REGISTRY) && !INTENTIONALLY_GENERIC.has(k));
  return { unknown };
}

// ── Terrain / skyline / vegetation normalization ─────────────────────────────
// The terrain/skyline/vegetation layers switch on these internally; the registry
// just guarantees a safe default so no metadata combination can throw.

const TERRAINS = new Set<DestinationSceneTerrain>([
  'coastal', 'mountain', 'flatland', 'desert', 'island', 'urban',
]);
const SKYLINES = new Set<DestinationSceneSkyline>([
  'low', 'dense', 'highrise', 'historic',
]);
const VEGETATIONS = new Set<DestinationSceneVegetation>([
  'palms', 'pines', 'broadleaf', 'none',
]);

export function normalizeTerrain(value: string | undefined): DestinationSceneTerrain {
  return value && TERRAINS.has(value as DestinationSceneTerrain) ? (value as DestinationSceneTerrain) : 'flatland';
}
export function normalizeSkyline(value: string | undefined): DestinationSceneSkyline {
  return value && SKYLINES.has(value as DestinationSceneSkyline) ? (value as DestinationSceneSkyline) : 'low';
}
export function normalizeVegetation(value: string | undefined): DestinationSceneVegetation {
  return value && VEGETATIONS.has(value as DestinationSceneVegetation) ? (value as DestinationSceneVegetation) : 'none';
}
