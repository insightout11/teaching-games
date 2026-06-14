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
  // the LC Wayfarer across every view.
  entry('starter-biplane', 'LC Wayfarer', {}, {
    side: 'lc-wayfarer',
    front: 'lc-wayfarer-front',
    front3q: 'lc-wayfarer-front-3q',
  }),
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
