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
  planeTier?: number | null;
  planeKey?: string | null;
  planeSelectionRequired?: boolean;
  rangeKm?: number | null;
  upgradeState?: WorldFlightUpgradeState | null;
}

export interface WorldFlightProgressionMilestone {
  tier: number;
  label: string;
  requiredFlightHours: number;
  requiredCrewStars: number;
}

export interface WorldFlightRangeTier {
  tier: number;
  label: string;
  rangeKm: number;
}

export const WORLD_FLIGHT_PROGRESSION_MILESTONES: WorldFlightProgressionMilestone[] = [
  { tier: 1, label: 'First upgrade', requiredFlightHours: 3, requiredCrewStars: 3 },
  { tier: 2, label: 'Specialist upgrade', requiredFlightHours: 7, requiredCrewStars: 8 },
  { tier: 3, label: 'Advanced upgrade', requiredFlightHours: 12, requiredCrewStars: 15 },
  { tier: 4, label: 'Prestige upgrade', requiredFlightHours: 18, requiredCrewStars: 24 },
];

export const WORLD_FLIGHT_RANGE_TIERS: WorldFlightRangeTier[] = [
  { tier: 0, label: 'Starter range', rangeKm: 5200 },
  { tier: 1, label: 'Regional reach', rangeKm: 6800 },
  { tier: 2, label: 'Ocean reach', rangeKm: 8500 },
  { tier: 3, label: 'Intercontinental reach', rangeKm: 10500 },
  { tier: 4, label: 'Global reach', rangeKm: 13000 },
];

export interface WorldFlightUpgradeState {
  currentTier: number;
  currentRangeKm: number;
  unlockedTier: number;
  claimableTier: number | null;
  claimableRangeKm: number | null;
  nextMilestone: WorldFlightProgressionMilestone | null;
  latestUnlockedMilestone: WorldFlightProgressionMilestone | null;
  nextRangeTier: WorldFlightRangeTier | null;
  needsFlightHours: number;
  needsCrewStars: number;
  maxTier: number;
  fullyUpgraded: boolean;
}

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

export function getWorldFlightRangeForTier(tier: number) {
  const maxTier = WORLD_FLIGHT_RANGE_TIERS.at(-1)?.tier ?? 0;
  const clampedTier = Math.max(0, Math.min(Math.floor(tier), maxTier));
  return WORLD_FLIGHT_RANGE_TIERS.find((rangeTier) => rangeTier.tier === clampedTier) ?? WORLD_FLIGHT_RANGE_TIERS[0];
}

export function getWorldFlightUpgradeState({
  planeTier,
  rangeKm,
  flightHours,
  crewStars,
}: {
  planeTier: number;
  rangeKm?: number | null;
  flightHours: number;
  crewStars: number;
}): WorldFlightUpgradeState {
  const progression = getWorldFlightProgression(flightHours, crewStars);
  const maxTier = WORLD_FLIGHT_RANGE_TIERS.at(-1)?.tier ?? 0;
  const currentTier = Math.max(0, Math.min(Math.floor(planeTier), maxTier));
  const currentRange = rangeKm && rangeKm > 0 ? rangeKm : getWorldFlightRangeForTier(currentTier).rangeKm;
  const claimableTier = progression.unlockedTier > currentTier
    ? Math.min(progression.unlockedTier, maxTier)
    : null;
  const nextMilestone = progression.nextMilestone;
  const nextTier = claimableTier ?? nextMilestone?.tier ?? (currentTier < maxTier ? currentTier + 1 : null);
  const nextRangeTier = nextTier === null ? null : getWorldFlightRangeForTier(nextTier);

  return {
    currentTier,
    currentRangeKm: currentRange,
    unlockedTier: progression.unlockedTier,
    claimableTier,
    claimableRangeKm: claimableTier === null ? null : getWorldFlightRangeForTier(claimableTier).rangeKm,
    nextMilestone,
    latestUnlockedMilestone: progression.latestUnlockedMilestone,
    nextRangeTier,
    needsFlightHours: nextMilestone ? Math.max(0, nextMilestone.requiredFlightHours - flightHours) : 0,
    needsCrewStars: nextMilestone ? Math.max(0, nextMilestone.requiredCrewStars - crewStars) : 0,
    maxTier,
    fullyUpgraded: currentTier >= maxTier,
  };
}
