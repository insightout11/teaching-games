import { describe, expect, it } from 'vitest';
import { getInputRemountKey, type InputSpec } from './input-spec';

describe('getInputRemountKey', () => {
  const base: InputSpec = { type: 'sequence', gameKey: 'sentence-scramble', options: ['b', 'a'], timerSeconds: 30, startedAt: 1 };

  it('keeps half-built answers when +30s or per-student feedback arrives', () => {
    const k = getInputRemountKey(base);
    expect(getInputRemountKey({ ...base, timerSeconds: 60 })).toBe(k);
    expect(getInputRemountKey({ ...base, perStudentData: { c1: { status: 'retry', tries: 1 } } })).toBe(k);
    expect(getInputRemountKey({ ...base, publishedAt: 99 })).toBe(k);
  });

  it('remounts for a new question, and keeps per-student data significant elsewhere', () => {
    const k = getInputRemountKey(base);
    expect(getInputRemountKey({ ...base, options: ['c', 'd'] })).not.toBe(k);
    const confirm: InputSpec = { type: 'confirm', gameKey: 'imposter' };
    expect(getInputRemountKey({ ...confirm, perStudentData: { a: 1 } })).not.toBe(getInputRemountKey(confirm));
  });
});
