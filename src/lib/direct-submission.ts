import type { InputSpec } from '@/lib/input-spec';

const STRICT_ROUND_GAMES = new Set(['quick-pulse', 'prediction-round', 'cargo-hold']);
const ACTION_SCOPED_ROUND_GAMES = new Set(['cargo-hold']);
export const ROUND_ACTION_SEPARATOR = '::';

export interface RoundSubmissionIdentity {
  gameKey?: string | null;
  inputType?: string | null;
  roundId?: string | null;
}

export function baseRoundId(roundId: string): string {
  const index = roundId.indexOf(ROUND_ACTION_SEPARATOR);
  return index === -1 ? roundId : roundId.slice(0, index);
}

/**
 * Validate a structured response against the authoritative input spec persisted
 * on the session. This prevents a delayed response from a previous question or
 * activity run being written into the current round.
 */
export function validateRoundSubmission(
  activeSpec: InputSpec | null,
  submission: RoundSubmissionIdentity,
): string | null {
  const { gameKey, inputType, roundId } = submission;
  const requiresRound = Boolean(gameKey && STRICT_ROUND_GAMES.has(gameKey));

  if (requiresRound && !roundId) return 'Missing round identity';
  if (!roundId) return null;
  if (!gameKey || !inputType) return 'Invalid round identity';
  if (!activeSpec) return 'Response window is closed';
  const actionScoped = ACTION_SCOPED_ROUND_GAMES.has(gameKey);
  const roundMatches = actionScoped
    ? baseRoundId(roundId) === activeSpec.roundId
    : roundId === activeSpec.roundId;
  if (
    activeSpec.gameKey !== gameKey
    || activeSpec.type !== inputType
    || !roundMatches
  ) {
    return 'Stale round identity';
  }
  return null;
}

/** Existing participants may finish an explicitly active session after the
 * anonymous-write freshness window. Unknown clients remain rejected. */
export function verifiedParticipantStudentId(
  participant: { student_id?: string | null } | null,
  requestedStudentId?: string | null,
): { allowed: boolean; studentId: string | null } {
  if (!participant) return { allowed: false, studentId: null };
  const authoritativeStudentId = participant.student_id ?? null;
  if (requestedStudentId && requestedStudentId !== authoritativeStudentId) {
    return { allowed: false, studentId: null };
  }
  return { allowed: true, studentId: authoritativeStudentId };
}
