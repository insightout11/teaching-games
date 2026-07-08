import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stampTimedSpec, ANSWERS_OPEN_GRACE_MS, type InputSpec } from '@/lib/input-spec';

const SERVER_NOW = 1_800_000_000_000;

describe('stampTimedSpec', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(SERVER_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes non-timed specs through untouched (startedAt stays a client dedupe nonce)', () => {
    const spec = { type: 'textarea', gameKey: 'story-sprint', startedAt: 12345 };
    expect(stampTimedSpec(spec, null)).toBe(spec);
  });

  it('passes null/non-object specs through', () => {
    expect(stampTimedSpec(null, null)).toBeNull();
    expect(stampTimedSpec(undefined, { gameKey: 'x' })).toBeUndefined();
  });

  it('stamps a new timed round with server time and answersOpenAt', () => {
    const clientTime = SERVER_NOW - 90_000; // teacher clock 90s behind
    const spec = { type: 'choice', gameKey: 'flash-quiz', timerSeconds: 30, startedAt: clientTime };

    const out = stampTimedSpec(spec, null) as InputSpec;

    expect(out.startedAt).toBe(SERVER_NOW);
    expect(out.answersOpenAt).toBe(SERVER_NOW + ANSWERS_OPEN_GRACE_MS);
    expect(out.clientStartedAt).toBe(clientTime);
  });

  it('keeps the original stamp when the same round is rewritten (lock updates, reveals)', () => {
    const nonce = SERVER_NOW - 5_000;
    const first = stampTimedSpec(
      { type: 'choice', gameKey: 'flash-quiz', timerSeconds: 30, startedAt: nonce },
      null,
    ) as InputSpec;

    vi.setSystemTime(SERVER_NOW + 12_000); // rewrite arrives 12s into the round
    const rewrite = stampTimedSpec(
      { type: 'choice', gameKey: 'flash-quiz', timerSeconds: 30, startedAt: nonce, perStudentData: { c1: { locked: true } } },
      first,
    ) as InputSpec;

    expect(rewrite.startedAt).toBe(first.startedAt);
    expect(rewrite.answersOpenAt).toBe(first.answersOpenAt);
    expect(rewrite.perStudentData).toEqual({ c1: { locked: true } });
  });

  it('re-stamps when the client nonce changes (new round)', () => {
    const first = stampTimedSpec(
      { type: 'choice', gameKey: 'flash-quiz', timerSeconds: 30, startedAt: 111 },
      null,
    ) as InputSpec;

    vi.setSystemTime(SERVER_NOW + 40_000);
    const next = stampTimedSpec(
      { type: 'choice', gameKey: 'flash-quiz', timerSeconds: 30, startedAt: 222 },
      first,
    ) as InputSpec;

    expect(next.startedAt).toBe(SERVER_NOW + 40_000);
    expect(next.answersOpenAt).toBe(SERVER_NOW + 40_000 + ANSWERS_OPEN_GRACE_MS);
  });

  it('re-stamps when a different game takes over the spec', () => {
    const prev = stampTimedSpec(
      { type: 'choice', gameKey: 'flash-quiz', timerSeconds: 30, startedAt: 111 },
      null,
    ) as InputSpec;

    vi.setSystemTime(SERVER_NOW + 60_000);
    const next = stampTimedSpec(
      { type: 'choice', gameKey: 'sector-strike', timerSeconds: 60, startedAt: 111 },
      prev,
    ) as InputSpec;

    expect(next.startedAt).toBe(SERVER_NOW + 60_000);
  });

  it('stamps timed specs that carry no client startedAt', () => {
    const out = stampTimedSpec(
      { type: 'text', gameKey: 'listening-gap-fill', timerSeconds: 20 },
      null,
    ) as InputSpec;

    expect(out.startedAt).toBe(SERVER_NOW);
    expect(out.answersOpenAt).toBe(SERVER_NOW + ANSWERS_OPEN_GRACE_MS);
    expect(out.clientStartedAt).toBeUndefined();
  });
});
