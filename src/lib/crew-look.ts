// Crew characters: a student's look, stored as a short code in the existing
// `avatar_seed` column (max 32 chars) so no migration is needed.
//   "c1-" + one base-36 digit per field, e.g. "c1-3510a17"
// Old seeds (flight helmets "teal", captain caps "captain-amber", retired badges)
// convert to a character wearing that headgear, so nobody loses their look.

export const SKIN_TONES = ['#FDE0C5', '#F6CFA8', '#F1C27D', '#E0AC69', '#C68642', '#A5673F', '#8D5524', '#5C3A21'] as const;

export const HAIR_STYLES = ['short', 'spiky', 'curly', 'afro', 'long', 'bob', 'bun', 'ponytail', 'braids', 'none'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const HAIR_COLORS = ['#1b1b1f', '#3b2314', '#6b3e26', '#8a4b2a', '#d9a94e', '#c2562c', '#9aa0a8', '#4DA3FF', '#e879a6'] as const;

// Append only: the index is stored in look codes.
export const HEADGEAR = ['captain', 'helmet', 'headset', 'beanie', 'cap', 'none', 'hijab'] as const;
export type Headgear = (typeof HEADGEAR)[number];
export const HEADGEAR_LABEL: Record<Headgear, string> = {
  captain: 'Captain’s cap',
  helmet: 'Pilot helmet',
  headset: 'Headset',
  beanie: 'Beanie',
  cap: 'Cap',
  none: 'Nothing',
  hijab: 'Hijab',
};

/** Same colour names as the old avatar art, so old seeds keep their colour. */
export const GEAR_COLORS = {
  teal: '#14b8a6', blue: '#3b82f6', amber: '#f59e0b', violet: '#8b5cf6', rainbow: 'rainbow',
  pink: '#ec4899', green: '#22c55e', black: '#1f2937', white: '#e5e7eb', red: '#ef4444',
  gold: '#eab308', silver: '#94a3b8',
} as const;
export type GearColor = keyof typeof GEAR_COLORS;
export const GEAR_COLOR_KEYS = Object.keys(GEAR_COLORS) as GearColor[];

export const EYEWEAR = ['none', 'aviators', 'glasses'] as const;
export type Eyewear = (typeof EYEWEAR)[number];

export const SHIRT_COLORS = ['#4DA3FF', '#F59E0B', '#2FE59B', '#d4537e', '#a78bfa', '#EAF1FF', '#1b2233', '#ef4444'] as const;

export interface CrewLook {
  skin: number;
  hair: HairStyle;
  hairColor: number;
  headgear: Headgear;
  gearColor: GearColor;
  eyewear: Eyewear;
  shirt: number;
}

const PREFIX = 'c1-';

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

export function encodeLook(look: CrewLook): string {
  const d = (n: number) => Math.max(0, n).toString(36);
  return PREFIX + [
    d(look.skin),
    d(HAIR_STYLES.indexOf(look.hair)),
    d(look.hairColor),
    d(HEADGEAR.indexOf(look.headgear)),
    d(GEAR_COLOR_KEYS.indexOf(look.gearColor)),
    d(EYEWEAR.indexOf(look.eyewear)),
    d(look.shirt),
  ].join('');
}

function decodeLook(code: string): CrewLook | null {
  const s = code.slice(PREFIX.length);
  if (s.length !== 7) return null;
  const n = s.split('').map((c) => parseInt(c, 36));
  if (n.some((x) => Number.isNaN(x))) return null;
  const pick = <T,>(arr: readonly T[], i: number) => arr[i] ?? arr[0];
  return {
    skin: n[0] < SKIN_TONES.length ? n[0] : 0,
    hair: pick(HAIR_STYLES, n[1]),
    hairColor: n[2] < HAIR_COLORS.length ? n[2] : 0,
    headgear: pick(HEADGEAR, n[3]),
    gearColor: pick(GEAR_COLOR_KEYS, n[4]),
    eyewear: pick(EYEWEAR, n[5]),
    shirt: n[6] < SHIRT_COLORS.length ? n[6] : 0,
  };
}

export function isCrewLookSeed(seed: string | null | undefined): boolean {
  return !!seed && seed.startsWith(PREFIX);
}

/** A friendly random look, stable for a given name. */
export function lookFromName(name: string): CrewLook {
  const h = hash(name || 'crew');
  return {
    skin: h % SKIN_TONES.length,
    hair: HAIR_STYLES[(h >>> 3) % (HAIR_STYLES.length - 1)],
    hairColor: (h >>> 7) % 6,
    headgear: 'captain',
    gearColor: GEAR_COLOR_KEYS[(h >>> 11) % GEAR_COLOR_KEYS.length],
    eyewear: (h >>> 15) % 3 === 0 ? 'aviators' : 'none',
    shirt: (h >>> 17) % SHIRT_COLORS.length,
  };
}

/**
 * Any stored seed → a look. Old art seeds keep their headgear + colour
 * ("captain-amber" = amber captain's cap with aviators, like the old picture);
 * face and hair come from the name so a class isn't all identical.
 */
export function resolveLook(seed: string | null | undefined, name = ''): CrewLook {
  if (seed && isCrewLookSeed(seed)) {
    const look = decodeLook(seed);
    if (look) return look;
  }
  const base = lookFromName(name || seed || '');
  if (!seed) return base;
  if (seed.startsWith('captain-')) {
    const color = seed.slice('captain-'.length) as GearColor;
    return { ...base, headgear: 'captain', eyewear: 'aviators', gearColor: color in GEAR_COLORS ? color : 'amber' };
  }
  if (seed in GEAR_COLORS) {
    return { ...base, headgear: 'helmet', gearColor: seed as GearColor };
  }
  return base;
}
