import { describe, expect, it } from 'vitest';
import { fairPick } from '@/lib/fair-pick';

describe('fairPick', () => {
  it('picks everyone once before repeating, never twice in a row', () => {
    const ids = ['a', 'b', 'c'];
    let picked: string[] = [];
    let last: string | null = null;
    const seen: string[] = [];
    for (let i = 0; i < 30; i++) {
      const r = fairPick(ids, picked, last);
      expect(r.id).not.toBe(last);
      picked = r.picked;
      last = r.id;
      seen.push(r.id!);
    }
    for (let i = 0; i < 30; i += 3) expect(new Set(seen.slice(i, i + 3)).size).toBe(3);
  });
  it('alternates with two students', () => {
    let picked: string[] = []; let last: string | null = null;
    const seq: string[] = [];
    for (let i = 0; i < 6; i++) { const r = fairPick(['a', 'b'], picked, last); picked = r.picked; last = r.id; seq.push(r.id!); }
    for (let i = 1; i < 6; i++) expect(seq[i]).not.toBe(seq[i - 1]);
  });
  it('handles one or no students', () => {
    expect(fairPick([], [], null).id).toBeNull();
    expect(fairPick(['a'], ['a'], 'a').id).toBe('a');
  });
});
