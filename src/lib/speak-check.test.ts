import { describe, expect, it } from 'vitest';
import { fallbackSpeakSituation, summariseSpeak, validSpeakSituation } from './speak-check';

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
});
