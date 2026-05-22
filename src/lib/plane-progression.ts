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
  displayMeta: PlaneDisplayMeta;
}

export const DEFAULT_PLANE_KEY = 'starter-biplane';

// Aspect ratios (w/h from actual assets):
//   starter-biplane 1.96 · scout-monoplane 1.82 · cloud-hopper 1.79 · trailblazer-biplane 1.78
//   sky-racer 2.09 · cargo-cruiser 1.88 · twin-prop-scout 1.95
//   solar-flyer 2.00 · aurora-glider 2.20 · storm-runner 2.07
//   future-flyer 2.01 · starliner-mini 2.00 · comet-jet 2.04
//
// aurora-glider is the clear outlier at 2.20 — mostly wing, tiny fuselage.
// All others are within ±15% of each other and render acceptably at default size.

function entry(
  key: string,
  name: string,
  meta: Partial<PlaneDisplayMeta> = {},
): PlaneEntry {
  return {
    key,
    name,
    webp: `/assets/flight/planes/${key}.webp`,
    png:  `/assets/flight/planes/${key}.png`,
    displayMeta: { ...DEFAULT_META, ...meta },
  };
}

const PLANE_ENTRIES: PlaneEntry[] = [
  entry('starter-biplane',     'Starter Biplane'),
  entry('scout-monoplane',     'Scout Monoplane'),
  entry('cloud-hopper',        'Cloud Hopper'),
  entry('trailblazer-biplane', 'Trailblazer Biplane'),
  entry('sky-racer',           'Sky Racer'),
  entry('cargo-cruiser',       'Cargo Cruiser'),
  entry('twin-prop-scout',     'Twin-Prop Scout'),
  entry('solar-flyer',         'Solar Flyer'),
  // Aurora Glider is 2.20 aspect ratio — mostly wingspan, tiny fuselage.
  // Scale it down so it doesn't visually dwarf every other plane on the runway.
  entry('aurora-glider',       'Aurora Glider',       { parkedScale: 0.85, flyingScale: 0.9 }),
  entry('storm-runner',        'Storm Runner'),
  entry('future-flyer',        'Future Flyer'),
  entry('starliner-mini',      'Starliner Mini'),
  entry('comet-jet',           'Comet Jet'),
];

const PLANE_MAP = new Map(PLANE_ENTRIES.map((p) => [p.key, p]));
const DEFAULT_PLANE = PLANE_MAP.get(DEFAULT_PLANE_KEY)!;

export function getPlaneAsset(planeKey?: string | null): PlaneEntry {
  if (!planeKey) return DEFAULT_PLANE;
  return PLANE_MAP.get(planeKey) ?? DEFAULT_PLANE;
}

export interface PlaneTier {
  tier: number;
  label: string;
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
  choices: keys.map((k) => PLANE_MAP.get(k)!),
}));
