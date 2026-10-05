import { describe, expect, it } from 'vitest';
import { fallbackPassTheLine, speakerIndex, validPassTheLine } from './pass-the-line';

describe('pass the line', () => {
  it('validates content and rejects broken shapes', () => {
    const fb = fallbackPassTheLine('music');
    expect(validPassTheLine(fb)).toEqual(fb);
    expect(validPassTheLine({ ...fb, roles: ['A'] })).toBeNull();
    expect(validPassTheLine({ ...fb, cues: fb.cues.slice(0, 2) })).toBeNull();
    expect(validPassTheLine({ ...fb, twists: [] })).toBeNull();
  });

  it('passes the mic round the class, line after line, across rounds', () => {
    expect([0, 1, 2, 3, 4].map((i) => speakerIndex(i, 3))).toEqual([0, 1, 2, 0, 1]);
    expect(speakerIndex(5, 0)).toBe(0);
  });
});
