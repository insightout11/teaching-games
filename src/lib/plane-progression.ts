export interface PlaneEntry {
  key: string;
  name: string;
  webp: string;
  png: string;
}

export const DEFAULT_PLANE_KEY = 'starter-biplane';

const PLANE_ENTRIES: PlaneEntry[] = [
  { key: 'starter-biplane',     name: 'Starter Biplane',     webp: '/assets/flight/planes/starter-biplane.webp',     png: '/assets/flight/planes/starter-biplane.png' },
  { key: 'scout-monoplane',     name: 'Scout Monoplane',     webp: '/assets/flight/planes/scout-monoplane.webp',     png: '/assets/flight/planes/scout-monoplane.png' },
  { key: 'cloud-hopper',        name: 'Cloud Hopper',        webp: '/assets/flight/planes/cloud-hopper.webp',        png: '/assets/flight/planes/cloud-hopper.png' },
  { key: 'trailblazer-biplane', name: 'Trailblazer Biplane', webp: '/assets/flight/planes/trailblazer-biplane.webp', png: '/assets/flight/planes/trailblazer-biplane.png' },
  { key: 'sky-racer',           name: 'Sky Racer',           webp: '/assets/flight/planes/sky-racer.webp',           png: '/assets/flight/planes/sky-racer.png' },
  { key: 'cargo-cruiser',       name: 'Cargo Cruiser',       webp: '/assets/flight/planes/cargo-cruiser.webp',       png: '/assets/flight/planes/cargo-cruiser.png' },
  { key: 'twin-prop-scout',     name: 'Twin-Prop Scout',     webp: '/assets/flight/planes/twin-prop-scout.webp',     png: '/assets/flight/planes/twin-prop-scout.png' },
  { key: 'solar-flyer',         name: 'Solar Flyer',         webp: '/assets/flight/planes/solar-flyer.webp',         png: '/assets/flight/planes/solar-flyer.png' },
  { key: 'aurora-glider',       name: 'Aurora Glider',       webp: '/assets/flight/planes/aurora-glider.webp',       png: '/assets/flight/planes/aurora-glider.png' },
  { key: 'storm-runner',        name: 'Storm Runner',        webp: '/assets/flight/planes/storm-runner.webp',        png: '/assets/flight/planes/storm-runner.png' },
  { key: 'future-flyer',        name: 'Future Flyer',        webp: '/assets/flight/planes/future-flyer.webp',        png: '/assets/flight/planes/future-flyer.png' },
  { key: 'starliner-mini',      name: 'Starliner Mini',      webp: '/assets/flight/planes/starliner-mini.webp',      png: '/assets/flight/planes/starliner-mini.png' },
  { key: 'comet-jet',           name: 'Comet Jet',           webp: '/assets/flight/planes/comet-jet.webp',           png: '/assets/flight/planes/comet-jet.png' },
];

const PLANE_MAP = new Map(PLANE_ENTRIES.map((p) => [p.key, p]));
const DEFAULT_PLANE = PLANE_MAP.get(DEFAULT_PLANE_KEY)!;

export function getPlaneAsset(planeKey?: string | null): PlaneEntry {
  if (!planeKey) return DEFAULT_PLANE;
  return PLANE_MAP.get(planeKey) ?? DEFAULT_PLANE;
}
