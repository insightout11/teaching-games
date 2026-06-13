export interface WorldFlightRewardParticipant {
  clientId: string;
  studentId?: string | null;
}

export interface WorldFlightRewardScore {
  clientId?: string | null;
  studentId?: string | null;
  outcome?: string | null;
  accuracyStatus?: string | null;
  countsForAccuracy?: boolean | null;
  countsForLeaderboard?: boolean | null;
  responseType?: string | null;
}

export interface WorldFlightRewardSnapshot {
  participantCount: number;
  meaningfulParticipantCount: number;
  meaningfulParticipationRate: number;
  accuracyAttemptCount: number;
  accuracyRate: number | null;
  onTaskParticipantCount: number;
  onTaskParticipationRate: number;
  everyoneAboardEarned: boolean;
  strongLandingEarned: boolean;
}

export interface WorldFlightFlightReward {
  flightHoursAwarded: 1;
  crewStarsAwarded: number;
  snapshot: WorldFlightRewardSnapshot;
}

export interface WorldFlightProgressionRewardResult extends WorldFlightFlightReward {
  flightHours: number;
  crewStars: number;
  alreadyRecorded: boolean;
}

export interface WorldFlightProgressionMilestone {
  tier: number;
  label: string;
  requiredFlightHours: number;
  requiredCrewStars: number;
}

export const WORLD_FLIGHT_PROGRESSION_MILESTONES: WorldFlightProgressionMilestone[] = [
  { tier: 1, label: 'First upgrade', requiredFlightHours: 3, requiredCrewStars: 3 },
  { tier: 2, label: 'Specialist upgrade', requiredFlightHours: 7, requiredCrewStars: 8 },
  { tier: 3, label: 'Advanced upgrade', requiredFlightHours: 12, requiredCrewStars: 15 },
  { tier: 4, label: 'Prestige upgrade', requiredFlightHours: 18, requiredCrewStars: 24 },
];

function percentage(part: number, total: number) {
  return total > 0 ? part / total : 0;
}

export function calculateWorldFlightReward(
  participants: WorldFlightRewardParticipant[],
  scores: WorldFlightRewardScore[],
): WorldFlightFlightReward {
  const studentToClient = new Map(
    participants
      .filter((participant) => participant.studentId)
      .map((participant) => [participant.studentId!, `client:${participant.clientId}`]),
  );
  const scoreIdentity = (score: WorldFlightRewardScore) => {
    if (score.clientId) return `client:${score.clientId}`;
    if (score.studentId) return studentToClient.get(score.studentId) ?? `student:${score.studentId}`;
    return null;
  };
  const meaningfulScores = scores.filter((score) => (
    score.responseType === 'remote_vote'
    || (score.countsForLeaderboard !== false && score.outcome !== 'invalid')
  ));
  const participantIds = new Set(
    participants.map((participant) => `client:${participant.clientId}`),
  );

  // Teacher-led lessons may score roster students without requiring controllers.
  // In that case, use the students who actually contributed as the onboard crew.
  if (participantIds.size === 0) {
    for (const score of meaningfulScores) {
      const identity = scoreIdentity(score);
      if (identity) participantIds.add(identity);
    }
  }

  const meaningfulParticipantIds = new Set(
    meaningfulScores.map(scoreIdentity).filter((identity): identity is string => Boolean(identity)),
  );
  const onTaskParticipantIds = new Set(
    scores
      .filter((score) => score.countsForLeaderboard !== false && (score.outcome === 'on-task' || score.outcome === 'standout'))
      .map(scoreIdentity)
      .filter((identity): identity is string => Boolean(identity)),
  );
  const accuracyScores = scores.filter((score) => score.countsForAccuracy === true);
  const correctScores = accuracyScores.filter((score) => score.accuracyStatus === 'correct');

  const participantCount = participantIds.size;
  const meaningfulParticipantCount = Array.from(meaningfulParticipantIds).filter((identity) => participantIds.has(identity)).length;
  const onTaskParticipantCount = Array.from(onTaskParticipantIds).filter((identity) => participantIds.has(identity)).length;
  const meaningfulParticipationRate = percentage(meaningfulParticipantCount, participantCount);
  const onTaskParticipationRate = percentage(onTaskParticipantCount, participantCount);
  const accuracyRate = accuracyScores.length > 0 ? correctScores.length / accuracyScores.length : null;
  const everyoneAboardEarned = participantCount > 0 && meaningfulParticipationRate >= 0.7;
  const strongLandingEarned = everyoneAboardEarned && (
    accuracyRate !== null
      ? accuracyRate >= 0.65
      : onTaskParticipationRate >= 0.6
  );

  return {
    flightHoursAwarded: 1,
    crewStarsAwarded: Number(everyoneAboardEarned) + Number(strongLandingEarned),
    snapshot: {
      participantCount,
      meaningfulParticipantCount,
      meaningfulParticipationRate,
      accuracyAttemptCount: accuracyScores.length,
      accuracyRate,
      onTaskParticipantCount,
      onTaskParticipationRate,
      everyoneAboardEarned,
      strongLandingEarned,
    },
  };
}

export function getWorldFlightProgression(
  flightHours: number,
  crewStars: number,
) {
  const unlockedMilestones = WORLD_FLIGHT_PROGRESSION_MILESTONES.filter((milestone) => (
    flightHours >= milestone.requiredFlightHours && crewStars >= milestone.requiredCrewStars
  ));
  const nextMilestone = WORLD_FLIGHT_PROGRESSION_MILESTONES.find((milestone) => (
    flightHours < milestone.requiredFlightHours || crewStars < milestone.requiredCrewStars
  )) ?? null;

  return {
    unlockedTier: unlockedMilestones.at(-1)?.tier ?? 0,
    latestUnlockedMilestone: unlockedMilestones.at(-1) ?? null,
    nextMilestone,
  };
}
