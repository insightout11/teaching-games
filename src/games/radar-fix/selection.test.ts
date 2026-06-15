import { describe, expect, it } from 'vitest';
import type { DestinationPack } from '@/lib/world-flight/types';
import { radarVariationForIndex, selectVariedRadarDestinations } from './selection';

function destination(id: string) {
  return { id } as DestinationPack;
}

describe('radar fix place selection', () => {
  it('uses fresh destinations before recently played destinations', () => {
    const selected = selectVariedRadarDestinations(
      [destination('a'), destination('b'), destination('c'), destination('d')],
      2,
      ['a', 'b'],
      () => 0.5,
    );

    expect(selected.map((item) => item.id).sort()).toEqual(['c', 'd']);
  });

  it('cycles the first-round variation between runs', () => {
    expect([0, 1, 2, 3].map((offset) => radarVariationForIndex(offset, 0))).toEqual([
      'city',
      'airport',
      'clue',
      'city',
    ]);
  });
});
