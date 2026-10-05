import { describe, expect, it } from 'vitest';
import { bankSituationFor, fallbackSpeakSituation, shuffleReplySet, summariseSpeak, validSpeakSituation } from './speak-check';

describe('speak check', () => {
  it('summarises class counts against the natural reply', () => {
    const set = { replies: ['a', 'b', 'c'], natural: 1 };
    expect(summariseSpeak({ x: { reply: 1, confidence: 2, canDo: true }, y: { reply: 0, confidence: 1, canDo: false } }, set))
      .toEqual({ n: 2, natural: 1, confident: 1, canDo: 1 });
  });

  it('rejects malformed or overlapping situations and keeps a valid one', () => {
    const fb = fallbackSpeakSituation('cafés');
    expect(validSpeakSituation(fb)).not.toBeNull();
    expect(validSpeakSituation({ ...fb, after: fb.before })).toBeNull();
    expect(validSpeakSituation({ ...fb, before: { replies: ['a', 'b'], natural: 0 } })).toBeNull();
    expect(validSpeakSituation({ ...fb, canDo: '' })).toBeNull();
  });

  it('fallback has distinct before/after options with a natural reply each', () => {
    const fb = fallbackSpeakSituation('music');
    expect(fb.before.replies[fb.before.natural]).toContain('because');
    expect(fb.after.replies.some((r) => fb.before.replies.includes(r))).toBe(false);
  });

  it('finds a checked situation for a matching topic, valid and level-aware', () => {
    const s = bankSituationFor('Ordering food at a café', 'Easy');
    expect(s).not.toBeNull();
    expect(validSpeakSituation(s)).not.toBeNull();
    expect(bankSituationFor('quantum chromodynamics')).toBeNull();
  });

  it('shuffles replies but keeps the natural one', () => {
    const set = { replies: ['a', 'b', 'c', 'd'], natural: 0 };
    const out = shuffleReplySet(set, 12345);
    expect(out.replies[out.natural]).toBe('a');
    expect([...out.replies].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('spreads the natural reply across positions over many topics', () => {
    const topics = ['food', 'café', 'shopping', 'school', 'friends', 'hobbies', 'sport', 'travel', 'weather', 'family', 'technology', 'health', 'animals', 'music', 'holidays', 'environment', 'weekend', 'money', 'pets', 'clothes'];
    const positions = topics.map((t) => bankSituationFor(t)?.before.natural).filter((x): x is number => x !== undefined);
    expect(positions.length).toBeGreaterThan(15);
    expect(Math.max(...[0, 1, 2, 3].map((p) => positions.filter((x) => x === p).length)) / positions.length).toBeLessThan(0.5);
  });
});
