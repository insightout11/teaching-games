import { describe, expect, it } from 'vitest';
import { accusedFrom, clueOrder, pickImposters } from '@/activities/imposter/logic';

const names = ['Maya', 'Sam', 'Leo', 'Ana', 'Kai', 'Zoe'];

describe('imposter clue order', () => {
  it('changes every round and never starts with an imposter', () => {
    let prev: string[] | null = null;
    for (let round = 0; round < 200; round++) {
      const imposters = [names[round % names.length]];
      const order = clueOrder(names, imposters, prev);
      expect(order.slice().sort()).toEqual(names.slice().sort());
      expect(imposters).not.toContain(order[0]);
      if (prev) {
        expect(order[0]).not.toBe(prev[0]);
        expect(order.join('|')).not.toBe(prev.join('|'));
      }
      prev = order;
    }
  });

  it('still works for the smallest class (3 students)', () => {
    const three = ['A', 'B', 'C'];
    let prev: string[] | null = null;
    for (let i = 0; i < 50; i++) {
      const order = clueOrder(three, ['C'], prev);
      expect(order[0]).not.toBe('C');
      expect(order).toHaveLength(3);
      prev = order;
    }
  });
});

describe('imposter picking', () => {
  it('prefers students who have not been imposter yet', () => {
    const picked = pickImposters(names, ['Maya', 'Sam', 'Leo', 'Ana', 'Kai'], 1);
    expect(picked).toEqual(['Zoe']);
  });

  it('keeps at least two crew', () => {
    expect(pickImposters(['A', 'B', 'C'], [], 2)).toHaveLength(1);
    expect(pickImposters(names, [], 2)).toHaveLength(2);
  });
});

describe('accusations', () => {
  const v = (choice: string, i: number) => ({ clientId: `c${i}`, choice });
  it('accuses the top vote-getter', () => {
    expect(accusedFrom([v('Leo', 1), v('Leo', 2), v('Sam', 3)], 1)).toEqual(['Leo']);
  });
  it('accuses nobody on a tie', () => {
    expect(accusedFrom([v('Leo', 1), v('Sam', 2)], 1)).toEqual([]);
  });
  it('accuses the top two with two imposters', () => {
    expect(accusedFrom([v('Leo', 1), v('Leo', 2), v('Sam', 3), v('Sam', 4), v('Ana', 5)], 2)).toEqual(['Leo', 'Sam']);
  });
});
