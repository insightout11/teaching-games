import { describe, expect, it } from 'vitest';
import { alternateTurns } from './activity';

const s = (id: string) => ({ id, name: id }) as never;

describe('tag-team turns', () => {
  it('alternates sides and gives everyone a turn', () => {
    const t = alternateTurns([s('a'), s('b')], [s('c'), s('d')], 4, 'for');
    expect(t.map((x) => `${x.side}:${(x.student as { id: string }).id}`)).toEqual(['for:a', 'against:c', 'for:b', 'against:d']);
  });
  it('handles uneven teams by rotating the smaller one', () => {
    const t = alternateTurns([s('a'), s('b'), s('c')], [s('d')], 4, 'against');
    expect(t.map((x) => (x.student as { id: string }).id)).toEqual(['d', 'a', 'd', 'b']);
  });
});
