/**
 * The controller â†’ request â†’ API contract.
 *
 * The previous round of tests hand-built scoped round IDs and so passed while the real
 * controller was still sending the unsuffixed spec value, silently deduplicating every
 * student's second action. These tests build the request the way the component does â€”
 * from the JSON the Cargo inputs actually submit â€” and run it through the same
 * validators the API uses.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveSubmissionRoundId,
  cargoRoundSuffixMatchesAction,
  cargoActionSuffix,
} from '@/lib/cargo-hold-round';
import { validateRoundSubmission } from '@/lib/direct-submission';
import { resolveActivityScorePoints } from '@/lib/score-engine';
import { roundIdFor } from '@/activities/cargo-hold/state';
import type { InputSpec } from '@/lib/input-spec';

const INSTANCE = 'inst1';
const CHOOSE_ROUND = roundIdFor(INSTANCE, 'choose', 0);

const chooseSpec = {
  gameKey: 'cargo-hold',
  type: 'cargo-hand',
  roundId: CHOOSE_ROUND,
  activityInstanceId: INSTANCE,
} as InputSpec;

/** Exactly the payloads cargo-hand-input.tsx / cargo-vote-input.tsx submit. */
function playPayload(cardId: string, clientId = 'c1') {
  return JSON.stringify({
    type: 'play',
    actionId: `play:${INSTANCE}:${CHOOSE_ROUND}:${clientId}`,
    activityInstanceId: INSTANCE,
    roundId: `${CHOOSE_ROUND}::play`,
    cardId,
  });
}
function repackPayload(cardIds: string[], clientId = 'c1') {
  return JSON.stringify({
    type: 'repack',
    actionId: `repack:${INSTANCE}:${CHOOSE_ROUND}:${clientId}`,
    activityInstanceId: INSTANCE,
    roundId: `${CHOOSE_ROUND}::repack`,
    cardIds,
  });
}
function readPayload(submissionId: string, clientId = 'c1') {
  return JSON.stringify({
    type: 'read-complete',
    actionId: `read:${INSTANCE}:${CHOOSE_ROUND}:${clientId}:${submissionId}`,
    activityInstanceId: INSTANCE,
    roundId: `${CHOOSE_ROUND}::read:${submissionId}`,
    submissionId,
  });
}

/** What StudentController now puts on the wire. */
function requestRoundId(spec: InputSpec, content: string) {
  return resolveSubmissionRoundId(spec, content);
}

describe('cargo hold â€” the request the controller actually sends', () => {
  it('sends a different durable round ID for Repack than for Play', () => {
    const repack = requestRoundId(chooseSpec, repackPayload(['card-a']));
    const play = requestRoundId(chooseSpec, playPayload('card-b'));

    expect(repack).toBe(`${CHOOSE_ROUND}::repack`);
    expect(play).toBe(`${CHOOSE_ROUND}::play`);
    // The durable uniqueness index keys on this exact string, so these must differ or
    // the second action is deduplicated away.
    expect(repack).not.toBe(play);
  });

  it('no longer sends the bare spec round ID for a Cargo action', () => {
    expect(requestRoundId(chooseSpec, playPayload('card-a'))).not.toBe(CHOOSE_ROUND);
  });

  it('accepts both actions against the one live spec', () => {
    for (const content of [repackPayload(['card-a']), playPayload('card-b')]) {
      expect(validateRoundSubmission(chooseSpec, {
        gameKey: 'cargo-hold',
        inputType: 'cargo-hand',
        roundId: requestRoundId(chooseSpec, content),
      })).toBeNull();
    }
  });

  it('gives two reading confirmations distinct durable keys', () => {
    const readSpec = { ...chooseSpec, roundId: roundIdFor(INSTANCE, 'read', 0) } as InputSpec;
    const first = resolveSubmissionRoundId(readSpec, readPayload('sub-1'));
    const second = resolveSubmissionRoundId(readSpec, readPayload('sub-2'));

    expect(first).not.toBe(second);
    for (const roundId of [first, second]) {
      expect(validateRoundSubmission(readSpec, {
        gameKey: 'cargo-hold', inputType: 'cargo-hand', roundId,
      })).toBeNull();
    }
  });

  it('leaves every non-Cargo input untouched', () => {
    const pulse = { gameKey: 'quick-pulse', type: 'choice', roundId: 'qp-1' } as InputSpec;
    expect(resolveSubmissionRoundId(pulse, 'Agree')).toBe('qp-1');
    expect(resolveSubmissionRoundId(null, 'anything')).toBeUndefined();
  });

  it('falls back to the spec round ID when the content is not a Cargo action', () => {
    expect(resolveSubmissionRoundId(chooseSpec, 'not json')).toBe(CHOOSE_ROUND);
  });
});

describe('cargo hold â€” server-side suffix validation', () => {
  it('accepts the suffix each action is entitled to', () => {
    expect(cargoRoundSuffixMatchesAction(`${CHOOSE_ROUND}::play`, playPayload('c'))).toBe(true);
    expect(cargoRoundSuffixMatchesAction(`${CHOOSE_ROUND}::repack`, repackPayload(['c']))).toBe(true);
    expect(cargoRoundSuffixMatchesAction(`${CHOOSE_ROUND}::read:sub-1`, readPayload('sub-1'))).toBe(true);
  });

  it('rejects a play written under the vote key', () => {
    expect(cargoRoundSuffixMatchesAction(`${CHOOSE_ROUND}::vote`, playPayload('c'))).toBe(false);
  });

  it('rejects an invented suffix used to escape one-action-per-round', () => {
    expect(cargoRoundSuffixMatchesAction(`${CHOOSE_ROUND}::play2`, playPayload('c'))).toBe(false);
    expect(cargoRoundSuffixMatchesAction(`${CHOOSE_ROUND}::read:other`, readPayload('sub-1'))).toBe(false);
  });

  it('maps every action type to exactly one suffix', () => {
    expect(cargoActionSuffix({ type: 'play' })).toBe('play');
    expect(cargoActionSuffix({ type: 'repack' })).toBe('repack');
    expect(cargoActionSuffix({ type: 'vote' })).toBe('vote');
    expect(cargoActionSuffix({ type: 'board' })).toBe('board');
    expect(cargoActionSuffix({ type: 'read-complete', submissionId: 's' })).toBe('read:s');
    expect(cargoActionSuffix({ type: 'read-complete' })).toBeNull();
    expect(cargoActionSuffix({ type: 'nonsense' })).toBeNull();
  });
});

describe('activity score points resolution', () => {
  it('uses the engine points when no exact value is given', () => {
    expect(resolveActivityScorePoints(undefined, 3)).toBe(3);
  });

  it('uses the exact value when one is given, including zero', () => {
    expect(resolveActivityScorePoints(0, 1)).toBe(0);
    expect(resolveActivityScorePoints(1, 3)).toBe(1);
    expect(resolveActivityScorePoints(3, 5)).toBe(3);
  });

  it('never persists a negative or fractional score', () => {
    expect(resolveActivityScorePoints(-5, 1)).toBe(0);
    expect(resolveActivityScorePoints(2.6, 1)).toBe(3);
    expect(resolveActivityScorePoints(Number.NaN, 1)).toBe(1);
  });
});
