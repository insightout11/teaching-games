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
}

const DEFAULT_META: PlaneDisplayMeta = {
  parkedScale: 1,
  flyingScale: 1,
  runwayYOffset: 0,
  transitionYOffset: 0,
};

export interface PlaneEntry {
  key: string;
  name: string;
  webp: string;
  png: string;
  frontWebp?: string;
  frontPng?: string;
  front3qWebp?: string;
  front3qPng?: string;
  displayMeta: PlaneDisplayMeta;
}

export const DEFAULT_PLANE_KEY = 'starter-biplane';

const LC_WAYFARER_ASSETS = {
  side: 'lc-wayfarer',
  front: 'lc-wayfarer-front',
  front3q: 'lc-wayfarer-front-3q',
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

// Temporary branded fallback: keep progression keys/ranges stable while new
// LessonCaptain-style upgrade aircraft are authored.
const PENDING_BRANDED_UPGRADE_ASSETS = LC_WAYFARER_ASSETS;

function entry(
  key: string,
  name: string,
  meta: Partial<PlaneDisplayMeta> = {},
  assets: {
    side?: string;
    front?: string;
    front3q?: string;
  } = {},
): PlaneEntry {
  const side = assets.side ?? key;
  return {
    key,
    name,
    webp: `/assets/flight/planes/${side}.webp`,
    png:  `/assets/flight/planes/${side}.png`,
    ...(assets.front
      ? {
          frontWebp: `/assets/flight/planes/${assets.front}.webp`,
          frontPng: `/assets/flight/planes/${assets.front}.png`,
        }
      : {}),
    ...(assets.front3q
      ? {
          front3qWebp: `/assets/flight/planes/${assets.front3q}.webp`,
          front3qPng: `/assets/flight/planes/${assets.front3q}.png`,
        }
      : {}),
    displayMeta: { ...DEFAULT_META, ...meta },
  };
}

const PLANE_ENTRIES: PlaneEntry[] = [
  // Keep the persisted starter key stable while the starter aircraft becomes
  // the smaller LC Scout across every view.
  entry('starter-biplane', 'LC Scout', {}, LC_SCOUT_ASSETS),
  entry('scout-monoplane',     'LC Wayfarer',         {}, PENDING_BRANDED_UPGRADE_ASSETS),
  entry('cloud-hopper',        'Cloud Hopper',        {}, LC_CLOUD_HOPPER_ASSETS),
  entry('trailblazer-biplane', 'Trailblazer',         {}, LC_TRAILBLAZER_ASSETS),
  entry('sky-racer',           'Sky Racer',           {}, LC_SKY_RACER_ASSETS),
  entry('cargo-cruiser',       'Cargo Cruiser',       {}, LC_CARGO_CRUISER_ASSETS),
  entry('twin-prop-scout',     'Twin-Prop Scout',     {}, LC_TWIN_PROP_SCOUT_ASSETS),
  entry('solar-flyer',         'Solar Flyer',         {}, LC_SOLAR_FLYER_ASSETS),
  entry('aurora-glider',       'Aurora Glider',       {}, LC_AURORA_GLIDER_ASSETS),
  entry('storm-runner',        'Storm Runner',        {}, LC_STORM_RUNNER_ASSETS),
  entry('future-flyer',        'Future Flyer',        {}, PENDING_BRANDED_UPGRADE_ASSETS),
  entry('starliner-mini',      'Starliner Mini',      {}, PENDING_BRANDED_UPGRADE_ASSETS),
  entry('comet-jet',           'Comet Jet',           {}, PENDING_BRANDED_UPGRADE_ASSETS),
];

const PLANE_MAP = new Map(PLANE_ENTRIES.map((p) => [p.key, p]));
const DEFAULT_PLANE = PLANE_MAP.get(DEFAULT_PLANE_KEY)!;

export function getPlaneAsset(planeKey?: string | null): PlaneEntry {
  if (!planeKey) return DEFAULT_PLANE;
  return PLANE_MAP.get(planeKey) ?? DEFAULT_PLANE;
}

export type PlaneView = 'side' | 'front' | 'front-3q';

export function getPlaneViewAsset(
  planeKey: string | null | undefined,
  view: PlaneView,
  format: 'webp' | 'png' = 'webp',
) {
  const plane = getPlaneAsset(planeKey);
  if (view === 'side') return format === 'webp' ? plane.webp : plane.png;

  if (view === 'front') {
    return format === 'webp'
      ? plane.frontWebp ?? DEFAULT_PLANE.frontWebp ?? DEFAULT_PLANE.webp
      : plane.frontPng ?? DEFAULT_PLANE.frontPng ?? DEFAULT_PLANE.png;
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
    { tier: 1, label: 'First Upgrade', keys: ['scout-monoplane', 'cloud-hopper', 'trailblazer-biplane'] },
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
