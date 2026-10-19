import { describe, expect, it } from 'vitest';
import { classFitMarks, fitsClass, withFallback } from '@/lib/class-fit';

const game = (key: string, minStudents: number, deviceFree: boolean) => ({ key, minStudents, deviceFree });

describe('can this class do this?', () => {
  it('marks a group game in a 1-on-1 class', () => {
    expect(classFitMarks(game('imposter', 3, true), { students: 1 })[0]).toMatchObject({ kind: 'size', label: 'Group game' });
  });
  it('marks too few students', () => {
    expect(classFitMarks(game('taboo', 4, true), { students: 2 })[0].label).toBe('Needs 4+');
  });
  it('no size mark when the class size is unknown', () => {
    expect(classFitMarks(game('taboo', 4, true), { students: 0 })).toEqual([]);
  });
  it('needs phones in a class with no second screens; a light mark when some have them', () => {
    expect(classFitMarks(game('flash', 1, false), { students: 6, screens: 'none' })[0].label).toBe('Needs phones');
    const some = classFitMarks(game('flash', 1, false), { students: 6, screens: 'some' });
    expect(some[0].label).toBe('Phones');
    expect(fitsClass(some)).toBe(true);
    expect(classFitMarks(game('vocab', 1, true), { students: 6, screens: 'none' })).toEqual([]);
  });
  it('fills a list with good fits when fewer than 3 remain (marked ones stay, never hidden)', () => {
    const list = [game('a', 3, false), game('b', 3, false), game('c', 1, true)];
    const pool = [...list, game('d', 1, false), game('e', 1, true), game('f', 1, true)];
    const out = withFallback(list, pool, { students: 1, screens: 'none' });
    expect(out.map((x) => x.key)).toEqual(['c', 'e', 'f', 'a', 'b']);
  });
  it('leaves a good list alone', () => {
    const list = [game('a', 1, true), game('b', 1, true), game('c', 1, true)];
    expect(withFallback(list, list, { students: 5 })).toEqual(list);
  });
});
