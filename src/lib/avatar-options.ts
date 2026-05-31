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

export const AVATAR_SEEDS = [...HELMET_AVATAR_SEEDS] as const;

export const DEFAULT_AVATAR_SEED = HELMET_AVATAR_SEEDS[0];

const VALID_AVATAR_SEEDS = new Set<string>(AVATAR_SEEDS);

export function resolveAvatarSeed(seed: string | null | undefined, name = ''): string {
  if (seed && VALID_AVATAR_SEEDS.has(seed)) return seed;
  if (!name) return DEFAULT_AVATAR_SEED;

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }

  return AVATAR_SEEDS[hash % AVATAR_SEEDS.length];
}

export function avatarUrl(seed: string | null | undefined, name = ''): string {
  return `/avatars/avatar-${resolveAvatarSeed(seed, name)}.png`;
}
