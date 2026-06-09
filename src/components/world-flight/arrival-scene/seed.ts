// Deterministic pseudo-random generator seeded from a destination id, mirroring
// the LCG used in sky-background.tsx (s = s * 16807 % 2147483647). Same city ⇒
// same layout every render; different cities differ.

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Keep it inside the LCG's valid non-zero range.
  return (Math.abs(h) % 2147483646) + 1;
}

/** Returns a `() => number` yielding deterministic floats in [0,1) for a given id. */
export function seededRand(id: string): () => number {
  let s = hashString(id || 'default');
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Convenience: deterministic float in [min,max). */
export function randRange(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

/** Convenience: deterministic int in [min,max] inclusive. */
export function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(randRange(rand, min, max + 1));
}
