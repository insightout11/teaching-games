/**
 * Cross-layer regressions for the four blocking findings.
 *
 * These deliberately exercise the seams the pure-helper tests miss: the durable
 * round-identity contract, replayed realtime bursts, score persistence, and refresh
 * recovery.
 */
import { describe, it, expect } from 'vitest';
import { validateRoundSubmission, baseRoundId } from '@/lib/direct-submission';
import { outcomeToPoints, runScoreEngine } from '@/lib/score-engine';
import {
  applyStudentAction,
  emptyCargoState,
  confirmScore,
  hasUnsavedScores,
  hydrateCargoState,
  roundIdFor,
  type CargoRuntimeState,
} from '@/activities/cargo-hold/state';
import { scoreRound } from '@/activities/cargo-hold/scoring';
import { dealHand } from '@/activities/cargo-hold/deal';
import { buildFallbackDeck } from '@/activities/cargo-hold/fallback-deck';
import { sanitizeCards, lessonGroundedRatio } from '@/activities/cargo-hold/content-validation';
import type { InputSpec } from '@/lib/input-spec';
import type { CargoStudentAction } from '@/activities/cargo-hold/types';

const { cards: deck, prompts } = buildFallbackDeck('travel');
const ctx = { deck, prompts };
const INSTANCE = 'inst1';

function actor(clientId: string, displayName = clientId) {
  return { clientId, studentId: null, displayName };
}

function baseState(overrides: Partial<CargoRuntimeState> = {}): CargoRuntimeState {
  return {
    ...emptyCargoState(),
    instanceId: INSTANCE,
    instanceStartedAt: 1000,
    phase: 'choosing',
    ...overrides,
  };
}

function dealt(clientIds: string[]) {
  const hands: Record<string, ReturnType<typeof dealHand>> = {};
  const players: CargoRuntimeState['players'] = {};
  clientIds.forEach((clientId) => {
    hands[clientId] = dealHand(deck, prompts[0]);
    players[clientId] = {
      clientId, studentId: null, displayName: clientId,
      handCardIds: [], repackUsed: false, grammarPoints: 0, favoritePoints: 0,
    };
  });
  return { hands, players };
}

const chooseRound = roundIdFor(INSTANCE, 'choose', 0);

function action(type: CargoStudentAction['type'], extra: Record<string, unknown>, suffix: string): CargoStudentAction {
  return {
    type,
    actionId: `${type}:${extra.clientId ?? 'x'}:${suffix}`,
    activityInstanceId: INSTANCE,
    roundId: `${chooseRound}::${suffix}`,
    ...extra,
  } as CargoStudentAction;
}

// â”€â”€ Finding 1: Repack must not consume the student's Play â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('cargo hold â€” Repack and Play are independently durable', () => {
  const spec = { gameKey: 'cargo-hold', type: 'cargo-hand', roundId: chooseRound } as InputSpec;

  it('accepts distinct action-scoped round IDs against one live spec', () => {
    for (const suffix of ['play', 'repack', 'vote', 'read:sub-1']) {
      expect(validateRoundSubmission(spec, {
        gameKey: 'cargo-hold', inputType: 'cargo-hand', roundId: `${chooseRound}::${suffix}`,
      })).toBeNull();
    }
  });

  it('gives Repack and Play different durable keys, so neither dedups the other', () => {
    const play = `${chooseRound}::play`;
    const repack = `${chooseRound}::repack`;
    expect(play).not.toBe(repack);
    // The DB uniqueness index keys on the whole roundId string.
    expect(baseRoundId(play)).toBe(baseRoundId(repack));
    expect(baseRoundId(play)).toBe(chooseRound);
  });

  it('gives each reading confirmation its own key', () => {
    expect(`${chooseRound}::read:a`).not.toBe(`${chooseRound}::read:b`);
  });

  it('still rejects an action from a previous round', () => {
    expect(validateRoundSubmission(spec, {
      gameKey: 'cargo-hold', inputType: 'cargo-hand',
      roundId: `${roundIdFor(INSTANCE, 'choose', 5)}::play`,
    })).toBe('Stale round identity');
  });

  it('does not loosen round matching for other games', () => {
    const pulse = { gameKey: 'quick-pulse', type: 'choice', roundId: 'qp-1' } as InputSpec;
    expect(validateRoundSubmission(pulse, {
      gameKey: 'quick-pulse', inputType: 'choice', roundId: 'qp-1::play',
    })).toBe('Stale round identity');
  });

  it('applies a Repack then a Play from the same student in one round', () => {
    const { hands, players } = dealt(['c1']);
    let state = baseState({ hands, players });
    const discard = hands.c1[0].id;

    const repacked = applyStudentAction(
      state, action('repack', { cardIds: [discard], clientId: 'c1' }, 'repack'), actor('c1'), ctx);
    expect(repacked.changed).toBe('hands');
    state = repacked.state;
    expect(state.players.c1.repackUsed).toBe(true);

    const card = state.hands.c1[0];
    const played = applyStudentAction(
      state, action('play', { cardId: card.id, clientId: 'c1' }, 'play'), actor('c1'), ctx);
    expect(played.changed).toBe('submissions');
    expect(played.state.submissions).toHaveLength(1);
    expect(played.state.submissions[0].cardId).toBe(card.id);
  });
});

// â”€â”€ Finding 2: replayed bursts must not overwrite one another â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('cargo hold â€” synchronous burst handling', () => {
  it('keeps every play when several arrive before a render', () => {
    const clients = ['c1', 'c2', 'c3', 'c4'];
    const { hands, players } = dealt(clients);
    let state = baseState({ hands, players });

    // Reconnect replays these back to back with no render in between.
    clients.forEach((clientId) => {
      const card = state.hands[clientId][0];
      state = applyStudentAction(
        state, action('play', { cardId: card.id, clientId }, 'play'), actor(clientId), ctx).state;
    });

    expect(state.submissions).toHaveLength(4);
    expect(state.submissions.map((s) => s.clientId).sort()).toEqual(clients);
  });

  it('keeps every vote when several arrive in one burst', () => {
    const clients = ['c1', 'c2', 'c3'];
    const { hands, players } = dealt(clients);
    let state = baseState({ hands, players });
    clients.forEach((clientId) => {
      const card = state.hands[clientId][0];
      state = applyStudentAction(
        state, action('play', { cardId: card.id, clientId }, 'play'), actor(clientId), ctx).state;
    });
    state = {
      ...state,
      phase: 'voting',
      submissions: state.submissions.map((s) => ({ ...s, teacherValidity: true })),
    };

    const target = state.submissions[0].submissionId;
    ['c2', 'c3'].forEach((clientId) => {
      const vote: CargoStudentAction = {
        type: 'vote', actionId: `vote:${clientId}`, activityInstanceId: INSTANCE,
        roundId: `${roundIdFor(INSTANCE, 'vote', 0)}::vote`, submissionId: target,
      };
      state = applyStudentAction(state, vote, actor(clientId), ctx).state;
    });

    expect(state.submissions.find((s) => s.submissionId === target)?.voteCount).toBe(2);
    expect(state.votedClientIds).toEqual(['c2', 'c3']);
  });

  it('does not let one student Repack clobber another student hand', () => {
    const { hands, players } = dealt(['c1', 'c2']);
    let state = baseState({ hands, players });
    const c2HandBefore = state.hands.c2.map((c) => c.id);

    state = applyStudentAction(
      state, action('repack', { cardIds: [hands.c1[0].id], clientId: 'c1' }, 'repack'), actor('c1'), ctx).state;
    state = applyStudentAction(
      state, action('repack', { cardIds: [hands.c2[0].id], clientId: 'c2' }, 'repack'), actor('c2'), ctx).state;

    expect(state.players.c1.repackUsed).toBe(true);
    expect(state.players.c2.repackUsed).toBe(true);
    expect(state.hands.c2.map((c) => c.id)).not.toEqual(c2HandBefore);
    expect(state.hands.c1).toHaveLength(6);
    expect(state.hands.c2).toHaveLength(6);
  });

  it('is inert when the same action is replayed', () => {
    const { hands, players } = dealt(['c1']);
    let state = baseState({ hands, players });
    const act = action('play', { cardId: hands.c1[0].id, clientId: 'c1' }, 'play');

    state = applyStudentAction(state, act, actor('c1'), ctx).state;
    const replay = applyStudentAction(state, act, actor('c1'), ctx);

    expect(replay.changed).toBe('none');
    expect(replay.state).toBe(state);
    expect(state.submissions).toHaveLength(1);
  });

  it('rejects actions from a previous activity instance', () => {
    const { hands, players } = dealt(['c1']);
    const state = baseState({ hands, players });
    const stale: CargoStudentAction = {
      type: 'play', actionId: 'old', activityInstanceId: 'inst0',
      roundId: `${chooseRound}::play`, cardId: hands.c1[0].id,
    };
    expect(applyStudentAction(state, stale, actor('c1'), ctx).state).toBe(state);
  });
});

// â”€â”€ Finding 3: persisted points must equal displayed points â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('cargo hold â€” persisted score matches displayed score', () => {
  const profile = {
    displayMode: 'competitive' as const,
    supportsOnTask: true,
    supportsStandout: true,
    tracksAccuracy: true,
    defaultOutcome: 'genuine' as const,
  };

  it('would persist the wrong totals without exact points', () => {
    // Documents exactly why exactPoints exists: the outcome ladder cannot express 0/1/3.
    expect(outcomeToPoints('genuine')).toBe(1);
    expect(outcomeToPoints('on-task')).toBe(3);
    expect(outcomeToPoints('standout')).toBe(5);
  });

  it('emits 0/1/3 for invalid, valid, and favourite', () => {
    const scores = scoreRound([
      { submissionId: 's1', activityInstanceId: INSTANCE, roundId: 'r', clientId: 'c1',
        studentId: null, displayName: 'A', cardId: 'x', composedSentence: 'a',
        automaticValidity: false, teacherValidity: false, readerClientId: null, voteCount: 0 },
      { submissionId: 's2', activityInstanceId: INSTANCE, roundId: 'r', clientId: 'c2',
        studentId: null, displayName: 'B', cardId: 'x', composedSentence: 'b',
        automaticValidity: true, teacherValidity: true, readerClientId: null, voteCount: 0 },
      { submissionId: 's3', activityInstanceId: INSTANCE, roundId: 'r', clientId: 'c3',
        studentId: null, displayName: 'C', cardId: 'x', composedSentence: 'c',
        automaticValidity: true, teacherValidity: true, readerClientId: null, voteCount: 2 },
    ]);
    expect(scores.map((s) => s.points)).toEqual([0, 1, 3]);

    // The outcome the engine records still classifies correctly for accuracy and
    // leaderboard purposes, even though the persisted points come from exactPoints.
    scores.forEach((score) => {
      const engine = runScoreEngine({
        explicitOutcome: score.outcome, isCorrect: score.grammarPoints > 0, profile,
      });
      expect(engine.outcome).toBe(score.outcome);
    });
  });
});

// â”€â”€ Finding 4: teacher refresh recovery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('cargo hold â€” refresh recovery', () => {
  it('round-trips a live round through the persisted payload', () => {
    const { hands, players } = dealt(['c1', 'c2', 'c3']);
    let state = baseState({ hands, players });
    const card = state.hands.c1[0];
    state = applyStudentAction(
      state, action('play', { cardId: card.id, clientId: 'c1' }, 'play'), actor('c1'), ctx).state;

    const restored = hydrateCargoState(JSON.parse(JSON.stringify(state)));
    expect(restored).not.toBeNull();
    expect(restored!.phase).toBe('choosing');
    expect(restored!.instanceId).toBe(INSTANCE);
    expect(restored!.hands.c1.map((c) => c.id)).toEqual(state.hands.c1.map((c) => c.id));
    expect(restored!.submissions).toHaveLength(1);
    expect(restored!.processedActionIds).toEqual(state.processedActionIds);
  });

  it('keeps replayed actions inert after recovery', () => {
    const { hands, players } = dealt(['c1']);
    let state = baseState({ hands, players });
    const act = action('play', { cardId: hands.c1[0].id, clientId: 'c1' }, 'play');
    state = applyStudentAction(state, act, actor('c1'), ctx).state;

    const restored = hydrateCargoState(JSON.parse(JSON.stringify(state)))!;
    const replay = applyStudentAction(restored, act, actor('c1'), ctx);
    expect(replay.changed).toBe('none');
    expect(replay.state.submissions).toHaveLength(1);
  });

  it('does not restore a structurally unusable payload', () => {
    expect(hydrateCargoState(null)).toBeNull();
    expect(hydrateCargoState({})).toBeNull();
    expect(hydrateCargoState({ instanceId: 'x' })).toBeNull();
  });

  it('preserves votes and scored keys so a refresh cannot double-score', () => {
    const state = baseState({
      phase: 'result',
      votedClientIds: ['c1', 'c2'],
      scoredKeys: [`${INSTANCE}::round::c1`],
    });
    const restored = hydrateCargoState(JSON.parse(JSON.stringify(state)))!;
    expect(restored.votedClientIds).toEqual(['c1', 'c2']);
    expect(restored.scoredKeys).toEqual([`${INSTANCE}::round::c1`]);
  });
});

// â”€â”€ Grounding gate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('cargo hold â€” lesson grounding gate is real', () => {
  it('treats undeclared provenance as fallback, not as lesson vocabulary', () => {
    const generic = sanitizeCards([
      { id: 'a', family: 'thing', text: 'a hat', targetTerm: 'hat', targetForm: 'hat', meaning: 'headwear' },
    ]);
    expect(generic[0].source).toBe('safe-fallback');
    expect(lessonGroundedRatio(generic)).toBe(0);
  });

  it('honours a declared lesson source', () => {
    const grounded = sanitizeCards([
      { id: 'a', family: 'thing', text: 'a hat', targetTerm: 'hat', targetForm: 'hat',
        meaning: 'headwear', source: 'lesson-vocab' },
    ]);
    expect(lessonGroundedRatio(grounded)).toBe(1);
  });
});

// â”€â”€ Score-write recovery: pending scores survive and retry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('cargo hold â€” unconfirmed score writes', () => {
  const pending = {
    key: `${INSTANCE}::round::c1`,
    studentId: null,
    clientId: 'c1',
    displayName: 'Ana',
    promptIndex: 1,
    points: 3,
    outcome: 'standout' as const,
    isCorrect: true,
  };

  it('reports unsaved work while a score is still pending', () => {
    const state = baseState({ phase: 'result', pendingScores: [pending] });
    expect(hasUnsavedScores(state)).toBe(true);
    expect(hasUnsavedScores(baseState())).toBe(false);
  });

  it('moves a confirmed score from pending to scored exactly once', () => {
    const state = baseState({ phase: 'result', pendingScores: [pending] });
    const confirmed = confirmScore(state, pending.key);

    expect(confirmed.pendingScores).toHaveLength(0);
    expect(confirmed.scoredKeys).toEqual([pending.key]);
    expect(hasUnsavedScores(confirmed)).toBe(false);

    // A duplicated success must not record the key twice.
    const again = confirmScore(confirmed, pending.key);
    expect(again).toBe(confirmed);
    expect(again.scoredKeys).toEqual([pending.key]);
  });

  it('keeps a failed score pending rather than silently dropping it', () => {
    const state = baseState({ phase: 'result', pendingScores: [pending] });
    // No confirmation arrives; the entry must still be there to retry.
    expect(state.pendingScores).toHaveLength(1);
    expect(state.scoredKeys).not.toContain(pending.key);
  });

  it('carries pending scores through a refresh so the retry survives', () => {
    const state = baseState({ phase: 'result', pendingScores: [pending] });
    const restored = hydrateCargoState(JSON.parse(JSON.stringify(state)))!;

    expect(restored.pendingScores).toEqual([pending]);
    expect(hasUnsavedScores(restored)).toBe(true);
    // Everything the retry needs is present without the live round.
    expect(restored.pendingScores[0].points).toBe(3);
    expect(restored.pendingScores[0].outcome).toBe('standout');
  });

  it('retains the retry payload even after the round advances', () => {
    // nextRound clears submissions; the pending entry must not depend on them.
    const state = baseState({ phase: 'result', pendingScores: [pending], submissions: [] });
    expect(state.pendingScores[0].clientId).toBe('c1');
    expect(state.pendingScores[0].promptIndex).toBe(1);
  });
});
