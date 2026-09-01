/**
 * Cargo Hold â€” voting, favourites, and Scoring V2 mapping.
 *
 * Two independent awards per round:
 *   grammar   1 point for a card that genuinely fits the prompt
 *   favourite 2 further points for the valid answer the class votes for
 *
 * Ties are co-wins. There is deliberately no speed or teacher tie-breaker.
 */

import type { ScoreOutcome } from '@/lib/score-engine';
import type { CargoStudentAction, CargoSubmission } from './types';

export const GRAMMAR_POINTS = 1;
export const FAVORITE_BONUS = 2;

export interface CargoRoundScore {
  clientId: string;
  studentId: string | null;
  displayName: string;
  grammarPoints: number;
  favoriteBonus: number;
  points: number;
  outcome: ScoreOutcome;
  voteCount: number;
  isFavorite: boolean;
}

/** Only valid submissions can win the class vote; invalid ones are never eligible. */
export function favoriteSubmissionIds(submissions: CargoSubmission[]): string[] {
  const eligible = submissions.filter((submission) => submission.teacherValidity);
  const top = eligible.reduce((max, submission) => Math.max(max, submission.voteCount), 0);
  if (top <= 0) return [];
  return eligible
    .filter((submission) => submission.voteCount === top)
    .map((submission) => submission.submissionId);
}

export function scoreRound(submissions: CargoSubmission[]): CargoRoundScore[] {
  const favorites = new Set(favoriteSubmissionIds(submissions));

  return submissions.map((submission) => {
    const grammarPoints = submission.teacherValidity ? GRAMMAR_POINTS : 0;
    const isFavorite = favorites.has(submission.submissionId);
    const favoriteBonus = isFavorite ? FAVORITE_BONUS : 0;
    const points = grammarPoints + favoriteBonus;

    // Scoring V2 mapping: attempted but ungrammatical still counts as genuine
    // participation, a valid card is on-task, the class favourite is a standout.
    const outcome: ScoreOutcome = isFavorite
      ? 'standout'
      : submission.teacherValidity
        ? 'on-task'
        : 'genuine';

    return {
      clientId: submission.clientId,
      studentId: submission.studentId,
      displayName: submission.displayName,
      grammarPoints,
      favoriteBonus,
      points,
      outcome,
      voteCount: submission.voteCount,
      isFavorite,
    };
  });
}

/** Idempotency key for a score write â€” one per student per round per activity run. */
export function scoreKey(activityInstanceId: string, roundId: string, clientId: string): string {
  return `${activityInstanceId}::${roundId}::${clientId}`;
}

// â”€â”€â”€ Vote acceptance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type VoteRejection =
  | 'stale-instance'
  | 'stale-round'
  | 'unknown-submission'
  | 'invalid-submission'
  | 'self-vote'
  | 'already-voted';

export interface VoteContext {
  activityInstanceId: string;
  roundId: string;
  submissions: CargoSubmission[];
  votedClientIds: Set<string> | string[];
}

/**
 * Authoritative vote check. The UI also disables the student's own tag, but self-vote
 * rejection must exist here too â€” the UI is not the security boundary.
 *
 * First valid vote is final: a second vote from the same student is rejected rather
 * than replacing the first.
 */
export function acceptVote(
  vote: { clientId: string; activityInstanceId: string; roundId: string; submissionId: string },
  context: VoteContext,
): { accepted: true } | { accepted: false; reason: VoteRejection } {
  if (vote.activityInstanceId !== context.activityInstanceId) {
    return { accepted: false, reason: 'stale-instance' };
  }
  if (vote.roundId !== context.roundId) {
    return { accepted: false, reason: 'stale-round' };
  }

  const voted = context.votedClientIds instanceof Set
    ? context.votedClientIds
    : new Set(context.votedClientIds);
  if (voted.has(vote.clientId)) {
    return { accepted: false, reason: 'already-voted' };
  }

  const target = context.submissions.find((s) => s.submissionId === vote.submissionId);
  if (!target) return { accepted: false, reason: 'unknown-submission' };
  if (!target.teacherValidity) return { accepted: false, reason: 'invalid-submission' };
  if (target.clientId === vote.clientId) return { accepted: false, reason: 'self-vote' };

  return { accepted: true };
}

// â”€â”€â”€ Action parsing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ACTION_TYPES = new Set(['repack', 'play', 'read-complete', 'vote', 'board']);

/**
 * Parse a student action off the wire. Anything malformed returns null rather than
 * throwing â€” a corrupt payload must never take the classroom activity down.
 */
export function parseStudentAction(raw: string): CargoStudentAction | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const candidate = parsed as Record<string, unknown>;
  const { type, actionId, activityInstanceId, roundId } = candidate;
  if (typeof type !== 'string' || !ACTION_TYPES.has(type)) return null;
  if (typeof actionId !== 'string' || actionId.length === 0) return null;
  if (typeof activityInstanceId !== 'string' || activityInstanceId.length === 0) return null;
  if (typeof roundId !== 'string' || roundId.length === 0) return null;

  const base = { actionId, activityInstanceId, roundId };

  if (type === 'repack') {
    const cardIds = candidate.cardIds;
    if (!Array.isArray(cardIds) || cardIds.some((id) => typeof id !== 'string')) return null;
    return { type: 'repack', ...base, cardIds: cardIds as string[] };
  }
  if (type === 'play') {
    if (typeof candidate.cardId !== 'string' || !candidate.cardId) return null;
    return { type: 'play', ...base, cardId: candidate.cardId };
  }
  if (type === 'read-complete') {
    if (typeof candidate.submissionId !== 'string' || !candidate.submissionId) return null;
    return { type: 'read-complete', ...base, submissionId: candidate.submissionId };
  }
  if (type === 'vote') {
    if (typeof candidate.submissionId !== 'string' || !candidate.submissionId) return null;
    return { type: 'vote', ...base, submissionId: candidate.submissionId };
  }
  return { type: 'board', ...base };
}
