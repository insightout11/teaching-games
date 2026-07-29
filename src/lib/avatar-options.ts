export const HELMET_AVATAR_SEEDS = [
  'teal',
  'amber',
  'red',
  'blue',
  'violet',
  'green',
  'white',
  'gold',
  'black',
  'pink',
  'silver',
  'rainbow',
] as const;

// Captain's cap + aviators — the on-theme "combo" set. Colors that don't yet have a cap
// (red/gold/silver) simply stay helmet-only until art lands.
export const CAPTAIN_AVATAR_SEEDS = [
  'captain-teal',
  'captain-blue',
  'captain-amber',
  'captain-violet',
  'captain-rainbow',
  'captain-pink',
  'captain-green',
  'captain-black',
  'captain-white',
] as const;

// Retired crew badges. No longer offered in the picker — kept here only so existing rosters
// that stored one of these seeds get a stable helmet on read (see resolveAvatarSeed) instead
// of the old off-theme badge. The PNGs remain on disk for now; safe to delete later.
export const LEGACY_CREW_AVATAR_SEEDS = [
  'navigator',
  'signal',
  'meteorology',
  'logbook',
  'runway',
  'starchart',
  'radio',
  'wing',
  'beacon',
  'cargo-tag',
  'captain-stripes',
  'comet',
] as const;

// The pickable set: on-theme flight helmets + captain's caps.
export const AVATAR_SEEDS = [
  ...HELMET_AVATAR_SEEDS,
  ...CAPTAIN_AVATAR_SEEDS,
] as const;

export const DEFAULT_AVATAR_SEED = HELMET_AVATAR_SEEDS[0];

const VALID_AVATAR_SEEDS = new Set<string>(AVATAR_SEEDS);
const LEGACY_CREW_SET = new Set<string>(LEGACY_CREW_AVATAR_SEEDS);

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function resolveAvatarSeed(seed: string | null | undefined, name = ''): string {
  if (seed && VALID_AVATAR_SEEDS.has(seed)) return seed;

  // Retired crew badge on an existing roster → deterministically remap to a helmet, so the
  // student keeps a stable on-theme avatar rather than the removed badge.
  if (seed && LEGACY_CREW_SET.has(seed)) {
    return HELMET_AVATAR_SEEDS[hashString(seed) % HELMET_AVATAR_SEEDS.length];
  }

  if (!name) return DEFAULT_AVATAR_SEED;

  return AVATAR_SEEDS[hashString(name) % AVATAR_SEEDS.length];
}

export function avatarUrl(seed: string | null | undefined, name = ''): string {
  return `/avatars/avatar-${resolveAvatarSeed(seed, name)}.png`;
}
