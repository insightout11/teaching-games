/**
 * Cargo Hold â€” resolving the durable round ID a student action must be written under.
 *
 * Durable responses are unique per (session, client, gameKey, roundId). Cargo sends
 * several distinct actions inside one round, so each needs its own suffixed round ID
 * or the second action is silently deduplicated against the first.
 *
 * The suffix is decided here, from the parsed action, rather than being trusted from
 * the payload â€” a device must not be able to claim an arbitrary round ID and so write
 * unlimited rows or land in another round's key space.
 */

import type { InputSpec } from '@/lib/input-spec';
import { parseStudentAction } from '@/activities/cargo-hold/scoring';
import { ROUND_ACTION_SEPARATOR } from '@/lib/direct-submission';

export const CARGO_HOLD_GAME_KEY = 'cargo-hold';

/** The suffix each action type is allowed to occupy. */
export function cargoActionSuffix(action: { type: string; submissionId?: string }): string | null {
  switch (action.type) {
    case 'board':
      return 'board';
    case 'play':
      return 'play';
    case 'repack':
      return 'repack';
    case 'vote':
      return 'vote';
    case 'read-complete':
      // Per submission, so a reader holding two announcements can confirm both.
      return action.submissionId ? `read:${action.submissionId}` : null;
    default:
      return null;
  }
}

/**
 * Given the live spec and the JSON body a Cargo input is submitting, return the round
 * ID the HTTP request must carry. Returns the spec's own round ID unchanged for any
 * non-Cargo input, so this is safe to call on every submission.
 */
export function resolveSubmissionRoundId(
  spec: Pick<InputSpec, 'gameKey' | 'roundId'> | null | undefined,
  content: string,
): string | undefined {
  const specRoundId = spec?.roundId;
  if (spec?.gameKey !== CARGO_HOLD_GAME_KEY || !specRoundId) return specRoundId;

  const action = parseStudentAction(content);
  if (!action) return specRoundId;

  const suffix = cargoActionSuffix(action);
  if (!suffix) return specRoundId;

  return `${specRoundId}${ROUND_ACTION_SEPARATOR}${suffix}`;
}

/**
 * Server-side check that a submitted round ID's suffix is the one its action is
 * entitled to. Prevents a device from writing a `play` payload under the `vote` key
 * (or inventing suffixes to bypass one-action-per-round).
 */
export function cargoRoundSuffixMatchesAction(roundId: string, content: string): boolean {
  const separatorIndex = roundId.indexOf(ROUND_ACTION_SEPARATOR);
  const action = parseStudentAction(content);
  if (!action) return separatorIndex === -1;

  const expected = cargoActionSuffix(action);
  if (!expected) return false;

  return roundId.slice(separatorIndex + ROUND_ACTION_SEPARATOR.length) === expected;
}
