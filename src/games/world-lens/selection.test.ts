import { describe, expect, it } from 'vitest';
import type { PlaceMediaRecord } from '@/lib/place-media';
import { selectWorldLensRounds } from './selection';

function place(id: string, region: string, difficulty: PlaceMediaRecord['difficulty']): PlaceMediaRecord {
  return {
    id,
    name: id,
    city: id,
    country: `Country ${id}`,
    region,
    lat: 0,
    lng: 0,
    kind: 'city',
    difficulty,
    tags: [],
    media: [{
      id: `${id}-media`,
      kind: 'cityscape',
      title: `${id} media`,
      provider: 'wikimedia',
      usage: ['geo-clue', 'reveal'],
      difficulty,
      url: `https://example.com/${id}.jpg`,
      alt: id,
      caption: id,
      sourceName: 'Example',
      sourceUrl: 'https://example.com',
    }],
  };
}

describe('world lens selection', () => {
  it('avoids recent places before falling back to repeats', () => {
    const rounds = selectWorldLensRounds(
      [
        place('a', 'Asia', 'medium'),
        place('b', 'Europe', 'medium'),
        place('c', 'Africa', 'medium'),
        place('d', 'Americas', 'medium'),
      ],
      {
        count: 2,
        recentPlaceIds: ['a', 'b'],
        clueMode: 'medium',
        random: () => 0.5,
      },
    );

    expect(new Set(rounds.map((round) => round.place.id))).toEqual(new Set(['c', 'd']));
  });

  it('falls back to recent places when the fresh pool is exhausted', () => {
    const rounds = selectWorldLensRounds(
      [place('a', 'Asia', 'medium'), place('b', 'Europe', 'medium')],
      {
        count: 2,
        recentPlaceIds: ['a', 'b'],
        clueMode: 'medium',
        random: () => 0.5,
      },
    );

    expect(rounds).toHaveLength(2);
    expect(new Set(rounds.map((round) => round.place.id)).size).toBe(2);
  });

  it('prioritizes harder places in hard clue mode', () => {
    const rounds = selectWorldLensRounds(
      [
        place('easy', 'Europe', 'easy'),
        place('medium', 'Asia', 'medium'),
        place('hard', 'Africa', 'hard'),
      ],
      {
        count: 1,
        recentPlaceIds: [],
        clueMode: 'hard',
        random: () => 0.5,
      },
    );

    expect(rounds[0].place.id).toBe('hard');
  });

  it('skips places without geo-clue media', () => {
    const noMedia = place('no-media', 'Asia', 'medium');
    noMedia.media = [];
    const rounds = selectWorldLensRounds(
      [noMedia, place('with-media', 'Asia', 'medium')],
      {
        count: 2,
        recentPlaceIds: [],
        clueMode: 'medium',
        random: () => 0.5,
      },
    );

    expect(rounds.map((round) => round.place.id)).toEqual(['with-media']);
  });
});
