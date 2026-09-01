import { describe, it, expect } from 'vitest';
import { assignReaders, reassignReader } from '@/activities/cargo-hold/reader-assignment';
import {
  acceptVote,
  favoriteSubmissionIds,
  parseStudentAction,
  scoreKey,
  scoreRound,
} from '@/activities/cargo-hold/scoring';
import { validateDeck, lessonGroundedRatio } from '@/activities/cargo-hold/content-validation';
import { buildFallbackDeck } from '@/activities/cargo-hold/fallback-deck';
import type { CargoSubmission } from '@/activities/cargo-hold/types';

function submission(overrides: Partial<CargoSubmission> = {}): CargoSubmission {
  return {
    submissionId: 's1',
    activityInstanceId: 'inst-1',
    roundId: 'round-1',
    clientId: 'c1',
    studentId: null,
    displayName: 'Ana',
    cardId: 'card-1',
    composedSentence: 'A sentence.',
    automaticValidity: true,
    teacherValidity: true,
    readerClientId: null,
    voteCount: 0,
    ...overrides,
  };
}

describe('cargo hold â€” reader assignment', () => {
  const submissions = ['c1', 'c2', 'c3', 'c4'].map((clientId, i) =>
    submission({ submissionId: `s${i + 1}`, clientId }));
  const readers = ['c1', 'c2', 'c3', 'c4'];

  it('never assigns an author their own sentence', () => {
    const result = assignReaders({ submissions, readerClientIds: readers, roundId: 'r1' });
    submissions.forEach((s) => {
      expect(result[s.submissionId]).not.toBe(s.clientId);
      expect(result[s.submissionId]).not.toBeNull();
    });
  });

  it('is deterministic across repeated calls â€” a refresh cannot reshuffle it', () => {
    const a = assignReaders({ submissions, readerClientIds: readers, roundId: 'r1' });
    const b = assignReaders({ submissions, readerClientIds: readers, roundId: 'r1' });
    expect(a).toEqual(b);
  });

  it('balances reading load to within one', () => {
    const result = assignReaders({ submissions, readerClientIds: readers, roundId: 'r1' });
    const counts = new Map<string, number>();
    Object.values(result).forEach((reader) => {
      if (reader) counts.set(reader, (counts.get(reader) ?? 0) + 1);
    });
    const loads = Array.from(counts.values());
    expect(Math.max(...loads) - Math.min(...loads)).toBeLessThanOrEqual(1);
  });

  it('varies the pairing between rounds when the roster leaves room to rotate', () => {
    // With one reader per author the derangement collapses to a single shift for any
    // offset, which is correct. The rotation shows up as soon as there are spare
    // readers â€” the ordinary case where not everyone submitted.
    const partial = ['c1', 'c2', 'c3'].map((clientId, i) =>
      submission({ submissionId: `s${i + 1}`, clientId }));
    const wide = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    const r1 = assignReaders({ submissions: partial, readerClientIds: wide, roundId: 'r1' });
    const r2 = assignReaders({ submissions: partial, readerClientIds: wide, roundId: 'r2' });
    expect(r1).not.toEqual(r2);
  });

  it('leaves a lone reader own sentence unassigned rather than mis-assigning it', () => {
    const result = assignReaders({
      submissions: [submission({ submissionId: 's1', clientId: 'c1' })],
      readerClientIds: ['c1'],
      roundId: 'r1',
    });
    expect(result.s1).toBeNull();
  });

  it('reassigns away from a disconnected reader without changing authorship', () => {
    const current = { s1: 'c2' };
    const next = reassignReader(current, submission({ submissionId: 's1', clientId: 'c1' }), ['c1', 'c3']);
    expect(next.s1).toBe('c3');
  });
});

describe('cargo hold â€” favourites and scoring', () => {
  it('awards one grammar point for a valid card and none for an invalid one', () => {
    const scores = scoreRound([
      submission({ submissionId: 's1', clientId: 'c1', teacherValidity: true }),
      submission({ submissionId: 's2', clientId: 'c2', teacherValidity: false }),
    ]);
    expect(scores[0].grammarPoints).toBe(1);
    expect(scores[0].outcome).toBe('on-task');
    expect(scores[1].grammarPoints).toBe(0);
    expect(scores[1].outcome).toBe('genuine');
  });

  it('adds two points for the class favourite and marks it standout', () => {
    const scores = scoreRound([
      submission({ submissionId: 's1', clientId: 'c1', voteCount: 3 }),
      submission({ submissionId: 's2', clientId: 'c2', voteCount: 1 }),
    ]);
    expect(scores[0].points).toBe(3);
    expect(scores[0].outcome).toBe('standout');
    expect(scores[1].points).toBe(1);
  });

  it('makes tied top answers co-winners with no tie-breaker', () => {
    const subs = [
      submission({ submissionId: 's1', clientId: 'c1', voteCount: 2 }),
      submission({ submissionId: 's2', clientId: 'c2', voteCount: 2 }),
      submission({ submissionId: 's3', clientId: 'c3', voteCount: 1 }),
    ];
    expect(favoriteSubmissionIds(subs)).toEqual(['s1', 's2']);
    const scores = scoreRound(subs);
    expect(scores[0].points).toBe(3);
    expect(scores[1].points).toBe(3);
    expect(scores[2].points).toBe(1);
  });

  it('never lets an invalid submission win the vote', () => {
    const subs = [
      submission({ submissionId: 's1', clientId: 'c1', teacherValidity: false, voteCount: 9 }),
      submission({ submissionId: 's2', clientId: 'c2', teacherValidity: true, voteCount: 1 }),
    ];
    expect(favoriteSubmissionIds(subs)).toEqual(['s2']);
  });

  it('awards no favourite when nobody voted', () => {
    expect(favoriteSubmissionIds([submission({ voteCount: 0 })])).toEqual([]);
  });

  it('keys scores per instance, round, and student', () => {
    expect(scoreKey('i1', 'r1', 'c1')).toBe('i1::r1::c1');
    expect(scoreKey('i2', 'r1', 'c1')).not.toBe(scoreKey('i1', 'r1', 'c1'));
  });
});

describe('cargo hold â€” vote acceptance', () => {
  const submissions = [
    submission({ submissionId: 's1', clientId: 'c1' }),
    submission({ submissionId: 's2', clientId: 'c2' }),
    submission({ submissionId: 's3', clientId: 'c3', teacherValidity: false }),
  ];
  const base = { activityInstanceId: 'inst-1', roundId: 'round-1', submissions, votedClientIds: new Set<string>() };

  it('accepts a normal vote', () => {
    const result = acceptVote(
      { clientId: 'c2', activityInstanceId: 'inst-1', roundId: 'round-1', submissionId: 's1' }, base);
    expect(result.accepted).toBe(true);
  });

  it('rejects a self-vote even if the UI allowed it through', () => {
    const result = acceptVote(
      { clientId: 'c1', activityInstanceId: 'inst-1', roundId: 'round-1', submissionId: 's1' }, base);
    expect(result).toEqual({ accepted: false, reason: 'self-vote' });
  });

  it('rejects a vote for an invalid submission', () => {
    const result = acceptVote(
      { clientId: 'c1', activityInstanceId: 'inst-1', roundId: 'round-1', submissionId: 's3' }, base);
    expect(result).toEqual({ accepted: false, reason: 'invalid-submission' });
  });

  it('keeps the first vote final', () => {
    const result = acceptVote(
      { clientId: 'c2', activityInstanceId: 'inst-1', roundId: 'round-1', submissionId: 's1' },
      { ...base, votedClientIds: new Set(['c2']) });
    expect(result).toEqual({ accepted: false, reason: 'already-voted' });
  });

  it('rejects stale rounds and stale activity instances', () => {
    expect(acceptVote(
      { clientId: 'c2', activityInstanceId: 'inst-0', roundId: 'round-1', submissionId: 's1' }, base))
      .toEqual({ accepted: false, reason: 'stale-instance' });
    expect(acceptVote(
      { clientId: 'c2', activityInstanceId: 'inst-1', roundId: 'round-0', submissionId: 's1' }, base))
      .toEqual({ accepted: false, reason: 'stale-round' });
  });
});

describe('cargo hold â€” action parsing', () => {
  it('parses each action shape', () => {
    const play = parseStudentAction(JSON.stringify({
      type: 'play', actionId: 'a1', activityInstanceId: 'i1', roundId: 'r1', cardId: 'c1' }));
    expect(play).toEqual({ type: 'play', actionId: 'a1', activityInstanceId: 'i1', roundId: 'r1', cardId: 'c1' });

    const vote = parseStudentAction(JSON.stringify({
      type: 'vote', actionId: 'a2', activityInstanceId: 'i1', roundId: 'r1', submissionId: 's1' }));
    expect(vote?.type).toBe('vote');
  });

  it('returns null for malformed payloads instead of throwing', () => {
    expect(parseStudentAction('not json')).toBeNull();
    expect(parseStudentAction(JSON.stringify({ type: 'nope', actionId: 'a', activityInstanceId: 'i', roundId: 'r' }))).toBeNull();
    expect(parseStudentAction(JSON.stringify({ type: 'play', actionId: 'a', activityInstanceId: 'i', roundId: 'r' }))).toBeNull();
    expect(parseStudentAction(JSON.stringify({ type: 'repack', actionId: 'a', activityInstanceId: 'i', roundId: 'r', cardIds: [1] }))).toBeNull();
  });
});

describe('cargo hold â€” deck contract', () => {
  it('accepts the reviewed fallback deck', () => {
    const { cards, prompts } = buildFallbackDeck('travel');
    const result = validateDeck(cards, prompts);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('rejects a deck that is too small', () => {
    const { cards, prompts } = buildFallbackDeck();
    const result = validateDeck(cards.slice(0, 5), prompts);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('needs 24'))).toBe(true);
  });

  it('drops malformed and duplicate cards rather than trusting the payload', () => {
    const { prompts } = buildFallbackDeck();
    const result = validateDeck([
      { id: 'a', family: 'thing', text: 'a hat', targetTerm: 'hat', targetForm: 'hat', meaning: 'headwear' },
      { id: 'a', family: 'thing', text: 'a duplicate', targetTerm: 'x', targetForm: 'x', meaning: 'y' },
      { id: 'b', family: 'not-a-family', text: 'x', targetTerm: 'x', targetForm: 'x', meaning: 'y' },
      { id: 'c', family: 'thing', text: '', targetTerm: 'x', targetForm: 'x', meaning: 'y' },
    ], prompts);
    expect(result.cards.map((c) => c.id)).toEqual(['a']);
  });

  it('flags a prompt with no compatible card', () => {
    const { cards } = buildFallbackDeck();
    const result = validateDeck(cards, [{
      id: 'lonely', textBefore: 'Nothing fits ', acceptedFamilies: ['wildcard'],
      promptTag: 'unmatched', previewLabel: 'x', explanation: '',
    }]);
    expect(result.errors.some((e) => e.includes('no compatible card'))).toBe(true);
  });

  it('rejects generated family metadata that contradicts an unambiguous grammar cue', () => {
    const { cards, prompts } = buildFallbackDeck();
    const badPrompt = {
      ...prompts[0],
      id: 'bad-start-by',
      textBefore: 'The students decided to start by ',
      acceptedFamilies: ['thing'] as const,
      previewLabel: 'a thing',
    };
    const result = validateDeck(cards, [badPrompt, ...prompts.slice(1)]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'prompt bad-start-by contradicts its grammar cue: expected action',
    );
  });

  it('measures how much of a deck came from the lesson', () => {
    const { cards } = buildFallbackDeck();
    expect(lessonGroundedRatio(cards)).toBe(0);
    expect(lessonGroundedRatio([
      { ...cards[0], source: 'lesson-vocab' },
      { ...cards[1], source: 'safe-fallback' },
    ])).toBe(0.5);
  });
});
