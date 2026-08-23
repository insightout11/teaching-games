import { getWorldFlightRangeForTier } from '@/lib/world-flight/progression';

export interface PlaneDisplayMeta {
  /** CSS scale applied when parked on runway (transform-origin: center bottom). Default 1.0. */
  parkedScale: number;
  /** CSS scale applied when flying in transition overlay (transform-origin: center center). Default 1.0. */
  flyingScale: number;
  /**
   * Vertical offset in px for parked state, applied after scale.
   * Positive = float up from runway, negative = sink into runway. Default 0.
   */
  runwayYOffset: number;
  /**
   * Vertical offset in px for flying state. Positive = shift up, negative = shift down. Default 0.
   */
  transitionYOffset: number;
  /**
   * SVG y offset for the lobby hangar image. Positive = lower toward the floor.
   * Used to compensate for transparent padding in generated front-three-quarter assets.
   */
  hangarYOffset: number;
}

const DEFAULT_META: PlaneDisplayMeta = {
  parkedScale: 1,
  flyingScale: 1,
  runwayYOffset: 0,
  transitionYOffset: 0,
  hangarYOffset: 0,
};

/**
 * Propulsion family, used to pick a takeoff sound. Deliberately coarse: 14 planes
 * map onto 4 classes, the same way arrival audio expands by region rather than by
 * city (docs/sound-design.md §2a). Required on every entry so it stays a single
 * source of truth rather than a lookup table that drifts.
 */
export type EngineClass = 'piston' | 'twin-prop' | 'electric' | 'jet';

export interface PlaneEntry {
  key: string;
  name: string;
  engineClass: EngineClass;
  webp: string;
  png: string;
  groundWebp?: string;
  groundPng?: string;
  frontWebp?: string;
  frontPng?: string;
  front3qWebp?: string;
  front3qPng?: string;
  front3qGroundWebp?: string;
  front3qGroundPng?: string;
  displayMeta: PlaneDisplayMeta;
}

export const DEFAULT_PLANE_KEY = 'starter-biplane';

const LC_WAYFARER_ASSETS = {
  side: 'lc-wayfarer',
  front: 'lc-wayfarer-front',
  front3q: 'lc-wayfarer-front-3q',
};

const LC_CADET_ASSETS = {
  side: 'lc-cadet',
  front: 'lc-cadet-front',
  front3q: 'lc-cadet-front-3q',
};

const LC_SCOUT_ASSETS = {
  side: 'lc-scout-monoplane',
  front: 'lc-scout-monoplane-front',
  front3q: 'lc-scout-monoplane-front-3q',
};

const LC_CLOUD_HOPPER_ASSETS = {
  side: 'lc-cloud-hopper',
  front: 'lc-cloud-hopper-front',
  front3q: 'lc-cloud-hopper-front-3q',
};

const LC_TRAILBLAZER_ASSETS = {
  side: 'lc-trailblazer',
  front: 'lc-trailblazer-front',
  front3q: 'lc-trailblazer-front-3q',
};

const LC_SKY_RACER_ASSETS = {
  side: 'lc-sky-racer',
  front: 'lc-sky-racer-front',
  front3q: 'lc-sky-racer-front-3q',
};

const LC_CARGO_CRUISER_ASSETS = {
  side: 'lc-cargo-cruiser',
  front: 'lc-cargo-cruiser-front',
  front3q: 'lc-cargo-cruiser-front-3q',
};

const LC_TWIN_PROP_SCOUT_ASSETS = {
  side: 'lc-twin-prop-scout',
  front: 'lc-twin-prop-scout-front',
  front3q: 'lc-twin-prop-scout-front-3q',
};

const LC_SOLAR_FLYER_ASSETS = {
  side: 'lc-solar-flyer',
  front: 'lc-solar-flyer-front',
  front3q: 'lc-solar-flyer-front-3q',
};

const LC_AURORA_GLIDER_ASSETS = {
  side: 'lc-aurora-glider',
  front: 'lc-aurora-glider-front',
  front3q: 'lc-aurora-glider-front-3q',
};

const LC_STORM_RUNNER_ASSETS = {
  side: 'lc-storm-runner',
  front: 'lc-storm-runner-front',
  front3q: 'lc-storm-runner-front-3q',
};

const LC_FUTURE_FLYER_ASSETS = {
  side: 'lc-future-flyer',
  front: 'lc-future-flyer-front',
  front3q: 'lc-future-flyer-front-3q',
};

const LC_STARLINER_MINI_ASSETS = {
  side: 'lc-starliner-mini',
  front: 'lc-starliner-mini-front',
  front3q: 'lc-starliner-mini-front-3q',
};

const LC_COMET_JET_ASSETS = {
  side: 'lc-comet-jet',
  front: 'lc-comet-jet-front',
  front3q: 'lc-comet-jet-front-3q',
};

function entry(
  key: string,
  name: string,
  engineClass: EngineClass,
  meta: Partial<PlaneDisplayMeta> = {},
  assets: {
    side?: string;
    front?: string;
    front3q?: string;
  } = {},
): PlaneEntry {
  const side = assets.side ?? key;
  const front3q = assets.front3q;
  return {
    key,
    name,
    engineClass,
    webp: `/assets/flight/planes/${side}.webp`,
    png:  `/assets/flight/planes/${side}.png`,
    groundWebp: `/assets/flight/planes/${side}-ground.webp`,
    groundPng: `/assets/flight/planes/${side}-ground.png`,
    ...(assets.front
      ? {
          frontWebp: `/assets/flight/planes/${assets.front}.webp`,
          frontPng: `/assets/flight/planes/${assets.front}.png`,
        }
      : {}),
    ...(front3q
      ? {
          front3qWebp: `/assets/flight/planes/${front3q}.webp`,
          front3qPng: `/assets/flight/planes/${front3q}.png`,
          front3qGroundWebp: `/assets/flight/planes/${front3q}-ground.webp`,
          front3qGroundPng: `/assets/flight/planes/${front3q}-ground.png`,
        }
      : {}),
    displayMeta: { ...DEFAULT_META, ...meta },
  };
}

const PLANE_ENTRIES: PlaneEntry[] = [
  // Keep the persisted starter key stable while resolving it to a runway-ready
  // trainer that works in every launch, runway, and arrival scene.
  // runwayYOffset is NOT a taste value — it cancels the transparent padding under
  // each plane's landing gear. PlaneLayer aligns the image BOX bottom to
  // LAYOUT.runwayY, so without this the wheels hover by however much empty space
  // the export happens to carry. Measured per plane with
  // scripts/measure-plane-ground-offsets.mjs; re-run it if the art is re-exported.
  entry('starter-biplane', 'LC Cadet', 'piston', { runwayYOffset: -51, hangarYOffset: 34 }, LC_CADET_ASSETS),
  entry('scout-monoplane',     'LC Wayfarer',      'piston',    { runwayYOffset: -7 }, LC_WAYFARER_ASSETS),
  entry('lc-scout',            'LC Scout',         'piston',    { runwayYOffset: -43, hangarYOffset: 28 }, LC_SCOUT_ASSETS),
  entry('cloud-hopper',        'Cloud Hopper',     'piston',    { runwayYOffset: -43 }, LC_CLOUD_HOPPER_ASSETS),
  entry('trailblazer-biplane', 'Trailblazer',      'piston',    { runwayYOffset: -44, hangarYOffset: 34 }, LC_TRAILBLAZER_ASSETS),
  // Tier 2 reads as still prop-era per world-flight-plane-assets.md, so Sky Racer is a
  // hot piston racer rather than a jet.
  entry('sky-racer',           'Sky Racer',        'piston',    { runwayYOffset: -27 }, LC_SKY_RACER_ASSETS),
  entry('cargo-cruiser',       'Cargo Cruiser',    'twin-prop', { runwayYOffset: -32 }, LC_CARGO_CRUISER_ASSETS),
  entry('twin-prop-scout',     'Twin-Prop Scout',  'twin-prop', { runwayYOffset: -47 }, LC_TWIN_PROP_SCOUT_ASSETS),
  entry('solar-flyer',         'Solar Flyer',      'electric',  { runwayYOffset: -42 }, LC_SOLAR_FLYER_ASSETS),
  entry('aurora-glider',       'Aurora Glider',    'electric',  { runwayYOffset: -49 }, LC_AURORA_GLIDER_ASSETS),
  // Tier 3, rugged and weather-capable — reads as a heavy twin rather than a jet.
  entry('storm-runner',        'Storm Runner',     'twin-prop', { runwayYOffset: -40 }, LC_STORM_RUNNER_ASSETS),
  entry('future-flyer',        'Future Flyer',     'jet',       { runwayYOffset: -32 }, LC_FUTURE_FLYER_ASSETS),
  entry('starliner-mini',      'Starliner Mini',   'jet',       { runwayYOffset: -27 }, LC_STARLINER_MINI_ASSETS),
  entry('comet-jet',           'Comet Jet',        'jet',       { runwayYOffset: -43 }, LC_COMET_JET_ASSETS),
];

const PLANE_MAP = new Map(PLANE_ENTRIES.map((p) => [p.key, p]));
const DEFAULT_PLANE = PLANE_MAP.get(DEFAULT_PLANE_KEY)!;
const PLANE_KEY_ALIASES = new Map<string, string>([
  // Cloud Hopper is a floatplane. Keep old persisted class/session records
  // working, but resolve them to a runway-safe tier-1 aircraft.
  ['cloud-hopper', 'scout-monoplane'],
]);

export function getPlaneAsset(planeKey?: string | null): PlaneEntry {
  if (!planeKey) return DEFAULT_PLANE;
  const resolvedKey = PLANE_KEY_ALIASES.get(planeKey) ?? planeKey;
  return PLANE_MAP.get(resolvedKey) ?? DEFAULT_PLANE;
}

/** Which takeoff sound this plane flies with. Falls back to the starter's class. */
export function getEngineClass(planeKey?: string | null): EngineClass {
  return getPlaneAsset(planeKey).engineClass;
}

export type PlaneView = 'side' | 'ground' | 'front' | 'front-3q' | 'front-3q-ground';

export function getPlaneViewAsset(
  planeKey: string | null | undefined,
  view: PlaneView,
  format: 'webp' | 'png' = 'webp',
) {
  const plane = getPlaneAsset(planeKey);
  if (view === 'side') return format === 'webp' ? plane.webp : plane.png;
  if (view === 'ground') {
    return format === 'webp'
      ? plane.groundWebp ?? plane.webp
      : plane.groundPng ?? plane.png;
  }

  if (view === 'front') {
    return format === 'webp'
      ? plane.frontWebp ?? DEFAULT_PLANE.frontWebp ?? DEFAULT_PLANE.webp
      : plane.frontPng ?? DEFAULT_PLANE.frontPng ?? DEFAULT_PLANE.png;
  }

  if (view === 'front-3q-ground') {
    return format === 'webp'
      ? plane.front3qGroundWebp ?? plane.front3qWebp ?? DEFAULT_PLANE.front3qGroundWebp ?? DEFAULT_PLANE.front3qWebp ?? DEFAULT_PLANE.webp
      : plane.front3qGroundPng ?? plane.front3qPng ?? DEFAULT_PLANE.front3qGroundPng ?? DEFAULT_PLANE.front3qPng ?? DEFAULT_PLANE.png;
  }

  return format === 'webp'
    ? plane.front3qWebp ?? DEFAULT_PLANE.front3qWebp ?? DEFAULT_PLANE.webp
    : plane.front3qPng ?? DEFAULT_PLANE.front3qPng ?? DEFAULT_PLANE.png;
}

export interface PlaneTier {
  tier: number;
  label: string;
  rangeKm: number;
  choices: PlaneEntry[];
}

export const PLANE_TIERS: PlaneTier[] = (
  [
    { tier: 0, label: 'Starter',       keys: ['starter-biplane'] },
    { tier: 1, label: 'First Upgrade', keys: ['scout-monoplane', 'lc-scout', 'trailblazer-biplane'] },
    { tier: 2, label: 'Specialist',    keys: ['sky-racer', 'cargo-cruiser', 'twin-prop-scout'] },
    { tier: 3, label: 'Advanced',      keys: ['solar-flyer', 'aurora-glider', 'storm-runner'] },
    { tier: 4, label: 'Prestige',      keys: ['future-flyer', 'starliner-mini', 'comet-jet'] },
  ] as { tier: number; label: string; keys: string[] }[]
).map(({ tier, label, keys }) => ({
  tier,
  label,
  rangeKm: getWorldFlightRangeForTier(tier).rangeKm,
  choices: keys.map((k) => PLANE_MAP.get(k)!),
}));

export function getPlaneTier(tier: number) {
  const clampedTier = Math.max(0, Math.floor(tier));
  return PLANE_TIERS.find((candidate) => candidate.tier === clampedTier) ?? PLANE_TIERS[0];
}

export function getPlaneTierForKey(planeKey?: string | null) {
  const resolvedKey = getPlaneAsset(planeKey).key;
  return PLANE_TIERS.find((tier) => tier.choices.some((plane) => plane.key === resolvedKey)) ?? PLANE_TIERS[0];
}

export function getPlaneRangeKm(planeKey?: string | null) {
  return getPlaneTierForKey(planeKey).rangeKm;
}

export function isPlaneKeyInTier(planeKey: string | null | undefined, tier: number) {
  const plane = getPlaneAsset(planeKey);
  return getPlaneTier(tier).choices.some((choice) => choice.key === plane.key);
}
