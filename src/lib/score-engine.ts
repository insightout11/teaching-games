export type ScoreOutcome = 'invalid' | 'genuine' | 'on-task' | 'standout'
export type AccuracyStatus = 'correct' | 'incorrect' | 'not_applicable'

export interface ScoringProfile {
  displayMode: 'class' | 'team' | 'competitive'
  supportsOnTask: boolean
  supportsStandout: boolean
  tracksAccuracy: boolean
  defaultOutcome?: 'genuine' | 'on-task'
  // Used when no explicitOutcome and no isCorrect signal is available.
  // 'genuine' for participation activities, 'on-task' for task-completion activities.
  // Omit for accuracy games that always provide isCorrect.
}

export interface ScoreEngineInput {
  explicitOutcome?: ScoreOutcome
  isCorrect: boolean | null   // null = activity has no right/wrong concept
  isEmpty?: boolean           // true = caller explicitly signals blank/spam; never inferred
  profile?: ScoringProfile
}

export interface ScoreEngineResult {
  outcome: ScoreOutcome
  points: 0 | 1 | 3 | 5
  accuracyStatus: AccuracyStatus
  countsForAccuracy: boolean
  isCorrect: boolean          // DB compat — always boolean, never null; honest for accuracy
  scoringVersion: 2
}

/**
 * Central scoring function. All score events must pass through this.
 *
 * Outcome (points tier) and accuracy_status (correctness) are independent axes.
 * A wrong answer in Vocab Sprint: outcome=genuine (+1), accuracy=incorrect.
 * A standout answer in Story Sprint: outcome=standout (+5), accuracy=not_applicable.
 */
export function runScoreEngine(input: ScoreEngineInput): ScoreEngineResult {
  const { profile } = input

  // 1. Resolve outcome — priority order:
  //    isEmpty > explicitOutcome > isCorrect > profile.defaultOutcome > 'genuine'
  let outcome: ScoreOutcome
  if (input.isEmpty) {
    outcome = 'invalid'
  } else if (input.explicitOutcome) {
    outcome = input.explicitOutcome
  } else if (input.isCorrect === true) {
    outcome = 'on-task'
  } else if (input.isCorrect === false) {
    outcome = 'genuine'
  } else if (profile?.defaultOutcome) {
    outcome = profile.defaultOutcome
  } else {
    outcome = 'genuine'
  }

  // 2. Clamp unsupported outcomes — prevents activity drift
  if (profile) {
    if (outcome === 'standout' && !profile.supportsStandout) {
      outcome = profile.supportsOnTask ? 'on-task' : 'genuine'
    }
    if (outcome === 'on-task' && !profile.supportsOnTask) {
      outcome = 'genuine'
    }
  }

  const points = outcomeToPoints(outcome)

  // 3. Derive accuracy_status from tracksAccuracy + isCorrect (never from outcome)
  //    No profile = no accuracy tracking (must opt in via tracksAccuracy: true)
  let accuracyStatus: AccuracyStatus
  if (!profile?.tracksAccuracy || input.isCorrect === null) {
    accuracyStatus = 'not_applicable'
  } else {
    accuracyStatus = input.isCorrect ? 'correct' : 'incorrect'
  }

  return {
    outcome,
    points,
    accuracyStatus,
    countsForAccuracy: accuracyStatus !== 'not_applicable',
    // is_correct mapped from accuracyStatus so old readers stay honest
    isCorrect: accuracyStatus === 'correct',
    scoringVersion: 2,
  }
}

export function outcomeToPoints(outcome: ScoreOutcome): 0 | 1 | 3 | 5 {
  switch (outcome) {
    case 'standout': return 5
    case 'on-task':  return 3
    case 'genuine':  return 1
    case 'invalid':  return 0
  }
}

export function addScoreBonus(basePoints: number, requestedBonus?: number) {
  const bonusPoints = Number.isFinite(requestedBonus)
    ? Math.max(0, Math.min(10, Math.round(requestedBonus ?? 0)))
    : 0;
  return { bonusPoints, totalPoints: basePoints + bonusPoints };
}
