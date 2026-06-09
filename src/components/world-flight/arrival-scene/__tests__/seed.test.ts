import { describe, expect, it } from 'vitest';
import { seededRand } from '../seed';

// The arrival composer recreates its RNG every render (NOT memoized), relying on
// seededRand being pure: a fresh generator from the same id must reproduce the
// exact same sequence, so the skyline/stars/vegetation layout is byte-identical
// across re-renders (otherwise the scene appears to "move" when progress/phase
// change). These tests guard that invariant.

function take(fn: () => number, n: number) {
  return Array.from({ length: n }, () => fn());
}

describe('seededRand determinism', () => {
  it('two fresh generators with the same id produce identical sequences', () => {
    const a = take(seededRand('tokyo'), 50);
    const b = take(seededRand('tokyo'), 50);
    expect(a).toEqual(b);
  });

  it('different ids produce different sequences', () => {
    const a = take(seededRand('tokyo'), 20);
    const b = take(seededRand('cairo'), 20);
    expect(a).not.toEqual(b);
  });

  it('values stay within [0,1)', () => {
    const vals = take(seededRand('reykjavik'), 200);
    for (const v of vals) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
