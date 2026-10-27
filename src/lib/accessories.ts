/**
 * Avatar accessories from city markets (Oct 2026): after a market scene, each student picks one of the city's
 * accessories and wears it on their crew avatar, kept between lessons. Accessories, never national dress.
 */

export const ACCESSORY_TYPES = ['sun-hat', 'scarf', 'sunglasses', 'bag', 'bracelet', 'cap', 'badge', 'umbrella'] as const;
export type AccessoryType = (typeof ACCESSORY_TYPES)[number];

export interface Accessory {
  /** Unique across all cities, e.g. "dubai-souk-scarf". */
  id: string;
  name: string;
  type: AccessoryType;
  /** [main, accent] hex colours from the city. */
  colors: [string, string];
  motif?: string;
  description?: string;
  /** The city it came from. */
  cityId?: string;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** An accessory from stored JSON or a request, checked field by field; null when anything is wrong. */
export function parseAccessory(raw: unknown): Accessory | null {
  const v = raw as Partial<Accessory> | null;
  if (!v || typeof v !== 'object') return null;
  if (typeof v.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(v.id)) return null;
  if (typeof v.name !== 'string' || !v.name.trim()) return null;
  if (!ACCESSORY_TYPES.includes(v.type as AccessoryType)) return null;
  if (!Array.isArray(v.colors) || v.colors.length !== 2 || !v.colors.every((c) => typeof c === 'string' && HEX.test(c))) return null;
  return {
    id: v.id, name: v.name.trim().slice(0, 60), type: v.type as AccessoryType, colors: [v.colors[0], v.colors[1]],
    ...(typeof v.motif === 'string' ? { motif: v.motif.slice(0, 80) } : {}),
    ...(typeof v.description === 'string' ? { description: v.description.slice(0, 200) } : {}),
    ...(typeof v.cityId === 'string' ? { cityId: v.cityId.slice(0, 60) } : {}),
  };
}

/** Hats replace the avatar's own headgear while worn. */
export const isHat = (t: AccessoryType) => t === 'sun-hat' || t === 'cap';
