import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  stampTimedSpec,
  computeTimerState,
  getInputSpecRevision,
  ANSWERS_OPEN_GRACE_MS,
  type InputSpec,
} from '@/lib/input-spec';

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

describe('computeTimerState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(SERVER_NOW);
  });
  afterEach(() => vi.useRealTimers());

  const clock = (over: Partial<{ timerSeconds: number; startedAt: number; answersOpenAt: number }> = {}) => ({
    timerSeconds: 30,
    startedAt: SERVER_NOW,
    answersOpenAt: SERVER_NOW + ANSWERS_OPEN_GRACE_MS,
    ...over,
  });

  it('holds at full timerSeconds during the grace beat (countdown is deferred, not eaten)', () => {
    // 1s after broadcast, still inside the 4s grace window.
    vi.setSystemTime(SERVER_NOW + 1000);
    const s = computeTimerState(clock());
    expect(s.answersOpen).toBe(false);
    expect(s.opensIn).toBe(3);
    expect(s.timeLeft).toBe(30); // NOT 29 — the grace does not consume the answer window
  });

  it('starts the answer window at the full timerSeconds the instant answers open', () => {
    vi.setSystemTime(SERVER_NOW + ANSWERS_OPEN_GRACE_MS);
    const s = computeTimerState(clock());
    expect(s.answersOpen).toBe(true);
    expect(s.opensIn).toBe(0);
    expect(s.timeLeft).toBe(30);
  });

  it('counts down from answersOpenAt once open', () => {
    vi.setSystemTime(SERVER_NOW + ANSWERS_OPEN_GRACE_MS + 5000);
    expect(computeTimerState(clock()).timeLeft).toBe(25);
  });

  it('applies the clock offset so a skewed device agrees with the server', () => {
    // Local device clock runs 10s ahead; offset corrects it back to server time.
    vi.setSystemTime(SERVER_NOW + ANSWERS_OPEN_GRACE_MS + 10_000);
    const offset = -10_000; // serverNow = localNow - 10s
    expect(computeTimerState(clock(), offset).timeLeft).toBe(30);
  });

  it('never reports more than timerSeconds and never below zero', () => {
    vi.setSystemTime(SERVER_NOW - 60_000); // absurdly early
    expect(computeTimerState(clock()).timeLeft).toBe(30);
    vi.setSystemTime(SERVER_NOW + 10 * 60_000); // long past deadline
    expect(computeTimerState(clock()).timeLeft).toBe(0);
  });

  it('extends the deadline by extraMs (the teacher +time button)', () => {
    vi.setSystemTime(SERVER_NOW + ANSWERS_OPEN_GRACE_MS + 20_000); // 10s left of 30
    expect(computeTimerState(clock()).timeLeft).toBe(10);
    expect(computeTimerState(clock(), 0, 30_000).timeLeft).toBe(40); // +30s deadline
  });

  it('falls back to startedAt origin when answersOpenAt is absent (legacy specs)', () => {
    vi.setSystemTime(SERVER_NOW + 5000);
    const s = computeTimerState({ timerSeconds: 30, startedAt: SERVER_NOW });
    expect(s.answersOpen).toBe(true);
    expect(s.timeLeft).toBe(25);
  });

  it('returns timerSeconds with no active window for an unstamped/non-timed clock', () => {
    expect(computeTimerState({ timerSeconds: 0 })).toEqual({ timeLeft: 0, opensIn: 0, answersOpen: true });
    expect(computeTimerState({ timerSeconds: 30 })).toEqual({ timeLeft: 30, opensIn: 0, answersOpen: true });
  });
});

describe('getInputSpecRevision', () => {
  it('is stable across object key order', () => {
    const a = {
      type: 'choice',
      gameKey: 'flash-quiz',
      options: ['A', 'B'],
      timerSeconds: 30,
      perStudentData: { c2: { locked: true }, c1: { locked: false } },
    };
    const b = {
      perStudentData: { c1: { locked: false }, c2: { locked: true } },
      timerSeconds: 30,
      options: ['A', 'B'],
      gameKey: 'flash-quiz',
      type: 'choice',
    };

    expect(getInputSpecRevision(a)).toBe(getInputSpecRevision(b));
  });

  it('changes when the active spec changes', () => {
    const base = { type: 'choice', gameKey: 'flash-quiz', options: ['A', 'B'] };

    expect(getInputSpecRevision(base)).not.toBe(
      getInputSpecRevision({ ...base, options: ['A', 'C'] }),
    );
    expect(getInputSpecRevision(base)).not.toBe(getInputSpecRevision(null));
  });

  it('treats the same activity prompt in a new round as a distinct response instance', () => {
    const questionOne = { type: 'binary', gameKey: 'prediction-round', prompt: 'Choose', roundId: 'prediction-round-0' };
    const questionTwo = { ...questionOne, roundId: 'prediction-round-1' };
    expect(getInputSpecRevision(questionOne)).not.toBe(getInputSpecRevision(questionTwo));
  });
});
