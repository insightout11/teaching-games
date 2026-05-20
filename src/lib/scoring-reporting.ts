export interface ScoreReportingFields {
  counts_for_leaderboard?: boolean | null;
  counts_for_accuracy?: boolean | null;
  scoring_version?: number | null;
  is_correct?: boolean | null;
  accuracy_status?: string | null;
  response_data?: Record<string, unknown> | null;
}

export function countsForLeaderboard(score: ScoreReportingFields): boolean {
  return score.counts_for_leaderboard !== false;
}

export function countsForAccuracy(score: ScoreReportingFields): boolean {
  return score.counts_for_accuracy === true
    || (
      countsForLeaderboard(score)
      && score.scoring_version !== 2
      && score.is_correct != null
    );
}

export function isCorrectScore(score: ScoreReportingFields): boolean {
  if (score.accuracy_status != null) {
    return score.accuracy_status === 'correct';
  }
  return score.scoring_version !== 2 && score.is_correct === true;
}

export function getScoreModuleKey(score: ScoreReportingFields): string | null {
  const data = score.response_data;
  if (!data) return null;
  const key = data.gameKey ?? data.activityKey ?? data.game ?? data.activity;
  return typeof key === 'string' && key.length > 0 ? key : null;
}
