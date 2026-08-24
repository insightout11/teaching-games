export interface ArrivalMetricSource {
  pending: boolean;
  responders: number;
  rosterTotal: number;
  totalResponses: number;
  overallAccuracy: number | null;
  bestStreak: number;
  authoritative?: {
    participantCount?: number;
    meaningfulParticipantCount?: number;
    responseCount?: number;
    accuracyRate?: number | null;
    bestStreak?: number;
  } | null;
}

export interface ArrivalMetricDisplay {
  aboard: string;
  responses: number | string;
  accuracy: string;
  bestStreak: number | string;
}

export function resolveArrivalMetricDisplay(source: ArrivalMetricSource): ArrivalMetricDisplay {
  if (source.pending) {
    return { aboard: '…', responses: '…', accuracy: '…', bestStreak: '…' };
  }

  const authoritative = source.authoritative;
  const responders = authoritative?.meaningfulParticipantCount ?? source.responders;
  const rosterTotal = authoritative?.participantCount ?? source.rosterTotal;
  const responses = authoritative?.responseCount ?? source.totalResponses;
  const accuracy = authoritative?.accuracyRate !== undefined
    ? authoritative.accuracyRate === null
      ? null
      : Math.round(authoritative.accuracyRate * 100)
    : source.overallAccuracy;
  const bestStreak = authoritative?.bestStreak ?? source.bestStreak;

  return {
    aboard: `${responders}/${rosterTotal}`,
    responses,
    accuracy: accuracy === null ? '—' : `${accuracy}%`,
    bestStreak,
  };
}
