import { describe, expect, it } from 'vitest';
import { pickNextSpeaker } from './next-speaker';

describe('pickNextSpeaker', () => {
  it('never picks an absent student', () => {
    const present = ['a', 'b', 'c'];
    const next = pickNextSpeaker(present, {}, [], null);
    expect(present.indexOf(next as string) !== -1).toBe(true);
    const withPreferredAbsent = pickNextSpeaker(present, {}, [], 'ghost');
    expect(present.indexOf(withPreferredAbsent as string) !== -1).toBe(true);
  });

  it('names nobody twice before everyone has had a turn', () => {
    const present = ['a', 'b', 'c'];
    const counts = { a: 0, b: 0, c: 0 };
    const seen: string[] = [];
    const already: string[] = [];
    for (let i = 0; i < present.length; i++) {
      const next = pickNextSpeaker(present, counts, already, null);
      expect(next).not.toBeNull();
      expect(seen.indexOf(next as string) === -1).toBe(true);
      seen.push(next as string);
      already.push(next as string);
    }
    // The cycle restarts after everyone has been named.
    const restart = pickNextSpeaker(present, counts, already, null);
    expect(present.indexOf(restart as string) !== -1).toBe(true);
  });

  it('picks least recent first', () => {
    const present = ['a', 'b', 'c'];
    const counts = { a: 5, b: 1, c: 3 };
    expect(pickNextSpeaker(present, counts, [], null)).toBe('b');
    expect(pickNextSpeaker(present, counts, ['b'], null)).toBe('c');
    expect(pickNextSpeaker(present, counts, ['b', 'c'], null)).toBe('a');
  });

  it('prefers the requested first speaker when present and unnamed', () => {
    const present = ['a', 'b', 'c'];
    const counts = { a: 0, b: 0, c: 0 };
    expect(pickNextSpeaker(present, counts, [], 'c')).toBe('c');
    // Already named this cycle: fall back to the rest.
    const next = pickNextSpeaker(present, counts, ['c'], 'c');
    expect(next !== 'c').toBe(true);
  });
});
