import { describe, it, expect } from 'vitest';
import { parseEmphasis } from '@/lib/emphasis';

describe('parseEmphasis', () => {
  it('returns a single plain segment when there are no markers', () => {
    expect(parseEmphasis('plain text')).toEqual([{ text: 'plain text', emphasis: false }]);
  });

  it('emphasizes a single *word*', () => {
    expect(parseEmphasis('a *bold* word')).toEqual([
      { text: 'a ', emphasis: false },
      { text: 'bold', emphasis: true },
      { text: ' word', emphasis: false },
    ]);
  });

  it('handles multiple emphasis spans', () => {
    expect(parseEmphasis('*one* and *two*')).toEqual([
      { text: 'one', emphasis: true },
      { text: ' and ', emphasis: false },
      { text: 'two', emphasis: true },
    ]);
  });

  it('renders an unmatched asterisk literally', () => {
    expect(parseEmphasis('2 * 3 = 6')).toEqual([{ text: '2 * 3 = 6', emphasis: false }]);
  });

  it('renders a trailing unclosed marker literally', () => {
    expect(parseEmphasis('start *unclosed')).toEqual([{ text: 'start *unclosed', emphasis: false }]);
  });

  it('does not emphasize empty markers', () => {
    expect(parseEmphasis('empty ** here')).toEqual([{ text: 'empty ** here', emphasis: false }]);
  });

  it('handles an empty string', () => {
    expect(parseEmphasis('')).toEqual([]);
  });

  it('emphasizes a marker that spans the whole string', () => {
    expect(parseEmphasis('*all*')).toEqual([{ text: 'all', emphasis: true }]);
  });
});
