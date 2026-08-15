import { describe, expect, it } from 'vitest';
import { chunkValues, dedupeRows, paginateRows } from '@/lib/beta/export-data';

describe('beta export data aggregation', () => {
  it('chunks and deduplicates IDs conservatively', () => {
    expect(chunkValues(['a', 'b', 'a', 'c'], 2)).toEqual([['a', 'b'], ['c']]);
  });

  it('paginates until a short page', async () => {
    const pages = [[1, 2], [3, 4], [5]];
    const calls: [number, number][] = [];
    const result = await paginateRows(async (from, to) => { calls.push([from, to]); return pages.shift() ?? []; }, 2);
    expect(result).toEqual([1, 2, 3, 4, 5]);
    expect(calls).toEqual([[0, 1], [2, 3], [4, 5]]);
  });

  it('deduplicates chunk overlap by stable row key', () => {
    expect(dedupeRows([{ id: 'a', value: 1 }, { id: 'a', value: 2 }, { id: 'b', value: 3 }], (row) => row.id))
      .toEqual([{ id: 'a', value: 2 }, { id: 'b', value: 3 }]);
  });
});
