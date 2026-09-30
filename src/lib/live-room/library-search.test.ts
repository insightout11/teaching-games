import { describe, expect, it } from 'vitest';
import { lengthOf, rankLibrary, type LibraryEntry } from './library-search';

const entry = (over: Partial<LibraryEntry>): LibraryEntry => ({
  key: 'x:1', source: 'x', kind: 'video', title: '', publisher: 'X', byline: null, blurb: '', tags: [],
  cefr: 'B1', ageBand: 'teens', durationSecs: 300, wordCount: null, youtubeId: null, url: null, ...over,
});

describe('library search', () => {
  const lib = [
    entry({ key: 'a', title: 'How rivers shape cities', tags: ['geography'], cefr: 'B1' }),
    entry({ key: 'b', title: 'Why we sleep', blurb: 'Rivers of dreams', cefr: 'B2', durationSecs: 120 }),
    entry({ key: 'c', title: 'Past simple song', kind: 'grammar', cefr: 'A2', ageBand: 'kids' }),
    entry({ key: 'd', title: 'City life debate', kind: 'debate', wordCount: 250, durationSecs: null, ageBand: 'all' }),
  ];

  it('ranks title matches above blurb matches, ignores plurals', () => {
    expect(rankLibrary(lib, { q: 'river' }).map((e) => e.key)).toEqual(['a', 'b']);
  });

  it('falls back to the topic when there is no query', () => {
    expect(rankLibrary(lib, { topic: 'Rivers and cities' })[0].key).toBe('a');
  });

  it('filters by level, age (all always passes), kind and length', () => {
    expect(rankLibrary(lib, { levels: ['A2'] }).map((e) => e.key)).toEqual(['c']);
    expect(rankLibrary(lib, { age: 'kids' }).map((e) => e.key)).toEqual(['c', 'd']);
    expect(rankLibrary(lib, { kind: 'debate' }).map((e) => e.key)).toEqual(['d']);
    expect(rankLibrary(lib, { length: 'short' }).map((e) => e.key)).toEqual(['b', 'd']);
  });

  it('buckets length for videos by seconds and texts by words', () => {
    expect(lengthOf({ durationSecs: 700, wordCount: null })).toBe('long');
    expect(lengthOf({ durationSecs: null, wordCount: 500 })).toBe('medium');
  });
});
