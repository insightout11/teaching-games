/**
 * The class mascot (Oct 2026, pilot 001): built by the class from five quick votes, one per category. Any combination
 * is valid. Some parts are locked until the class really sees something (Saturn: alien body). Drawn by
 * `MascotFigure` in the crew sticker style.
 */

export const MASCOT_BODIES = ['blob', 'bird', 'dragon', 'robot', 'cat', 'alien'] as const;
export const MASCOT_COLORS = ['#4DA3FF', '#F59E0B', '#2FE59B', '#d4537e', '#a78bfa', '#ef4444'] as const;
export const MASCOT_EYES = ['round', 'cyclops', 'three', 'sleepy', 'sparkly', 'googly'] as const;
export const MASCOT_HEADS = ['none', 'horns', 'antenna', 'propeller', 'pilot-cap', 'flower', 'crown', 'party-hat', 'astronaut'] as const;
export const MASCOT_EXTRAS = ['none', 'wings', 'tail', 'cape', 'jetpack', 'scarf', 'camera'] as const;

export type MascotBody = (typeof MASCOT_BODIES)[number];
export type MascotEyes = (typeof MASCOT_EYES)[number];
export type MascotHead = (typeof MASCOT_HEADS)[number];
export type MascotExtra = (typeof MASCOT_EXTRAS)[number];

export interface MascotLook { body: MascotBody; color: string; eyes: MascotEyes; head: MascotHead; extra: MascotExtra }

export const MASCOT_LABELS: Record<string, string> = {
  blob: 'Blob', bird: 'Bird', dragon: 'Dragon', robot: 'Robot', cat: 'Cat', alien: 'Alien',
  round: 'Round eyes', cyclops: 'One big eye', three: 'Three eyes', sleepy: 'Sleepy eyes', sparkly: 'Sparkly eyes', googly: 'Googly eyes',
  none: 'Nothing', horns: 'Horns', antenna: 'Antenna', propeller: 'Propeller hat', 'pilot-cap': 'Pilot cap', flower: 'Flower',
  crown: 'Crown', 'party-hat': 'Party hat', astronaut: 'Astronaut helmet',
  '#4DA3FF': 'Sky blue', '#F59E0B': 'Sunset orange', '#2FE59B': 'Jungle green', '#d4537e': 'Berry pink', '#a78bfa': 'Purple', '#ef4444': 'Red',
  wings: 'Wings', tail: 'Tail', cape: 'Cape', jetpack: 'Jetpack', scarf: 'Scarf', camera: 'Camera',
};

/** Parts a class must earn first: the unlock id stored in class_unlocks, and what earns it. */
export const MASCOT_LOCKED: Partial<Record<string, { unlockId: string; earnedBy: string }>> = {
  alien: { unlockId: 'mascot:alien', earnedBy: 'Seeing Saturn from the plane' },
  astronaut: { unlockId: 'mascot:astronaut', earnedBy: 'Seeing the International Space Station' },
  camera: { unlockId: 'mascot:camera', earnedBy: 'Taking your first landmark photo' },
};

export function isMascotPartOpen(part: string, unlocks: ReadonlySet<string>): boolean {
  const lock = MASCOT_LOCKED[part];
  return !lock || unlocks.has(lock.unlockId);
}

export const DEFAULT_MASCOT: MascotLook = { body: 'blob', color: MASCOT_COLORS[0], eyes: 'round', head: 'none', extra: 'none' };

/** A random mascot (the gallery, and "surprise me"). `rand` is injectable for tests. */
export function randomMascot(rand: () => number = Math.random): MascotLook {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  return { body: pick(MASCOT_BODIES), color: pick(MASCOT_COLORS), eyes: pick(MASCOT_EYES), head: pick(MASCOT_HEADS), extra: pick(MASCOT_EXTRAS) };
}

/** A saved look from the database or a request, checked part by part; null if anything is unknown. */
export function parseMascotLook(raw: unknown): MascotLook | null {
  const v = raw as Partial<Record<keyof MascotLook, unknown>> | null;
  if (!v || typeof v !== 'object') return null;
  const ok = <T extends string>(list: readonly T[], x: unknown): x is T => typeof x === 'string' && (list as readonly string[]).includes(x);
  if (!ok(MASCOT_BODIES, v.body) || !ok(MASCOT_COLORS, v.color) || !ok(MASCOT_EYES, v.eyes) || !ok(MASCOT_HEADS, v.head) || !ok(MASCOT_EXTRAS, v.extra)) return null;
  return { body: v.body, color: v.color, eyes: v.eyes, head: v.head, extra: v.extra };
}
