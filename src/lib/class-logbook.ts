import { countsForAccuracy, countsForLeaderboard, isCorrectScore, type ScoreReportingFields } from '@/lib/scoring-reporting';

export interface ClassLogbookSessionRow {
  id: string;
  status: string | null;
  started_at: string;
  ended_at: string | null;
  topic?: string | null;
  custom_topic?: string | null;
}

export interface ClassLogbookScoreRow extends ScoreReportingFields {
  session_id: string;
  points?: number | null;
  streak_count?: number | null;
}

export interface ClassLogbookSummary {
  classId: string;
  className: string;
  completedFlights: number;
  totalResponses: number;
  totalPoints: number;
  averageAccuracy: number | null;
  bestStreak: number;
  recentTopics: string[];
  lastTopic: string | null;
  lastFlightAt: string | null;
}

function isCompletedSession(session: ClassLogbookSessionRow) {
  return session.status === 'ended' || Boolean(session.ended_at);
}

function sessionTime(session: ClassLogbookSessionRow) {
  return new Date(session.ended_at ?? session.started_at).getTime();
}

function sessionTopic(session: ClassLogbookSessionRow) {
  const customTopic = session.custom_topic?.trim();
  if (customTopic) return customTopic;
  const topic = session.topic?.trim();
  return topic || null;
}

export function buildClassLogbookSummary({
  classId,
  className,
  sessions,
  scores,
}: {
  classId: string;
  className: string;
  sessions: ClassLogbookSessionRow[];
  scores: ClassLogbookScoreRow[];
}): ClassLogbookSummary {
  const completedSessions = sessions
    .filter(isCompletedSession)
    .sort((a, b) => sessionTime(b) - sessionTime(a));
  const completedSessionIds = new Set(completedSessions.map((session) => session.id));
  const countedScores = scores.filter((score) => completedSessionIds.has(score.session_id) && countsForLeaderboard(score));
  const accuracyScores = countedScores.filter(countsForAccuracy);
  const correctCount = accuracyScores.filter(isCorrectScore).length;
  const averageAccuracy = accuracyScores.length > 0
    ? Math.round((correctCount / accuracyScores.length) * 100)
    : null;

  const recentTopics: string[] = [];
  for (const session of completedSessions) {
    const topic = sessionTopic(session);
    if (topic && !recentTopics.includes(topic)) recentTopics.push(topic);
    if (recentTopics.length >= 4) break;
  }

  return {
    classId,
    className,
    completedFlights: completedSessions.length,
    totalResponses: countedScores.length,
    totalPoints: countedScores.reduce((sum, score) => sum + (score.points ?? 0), 0),
    averageAccuracy,
    bestStreak: countedScores.reduce((max, score) => Math.max(max, score.streak_count ?? 0), 0),
    recentTopics,
    lastTopic: recentTopics[0] ?? null,
    lastFlightAt: completedSessions[0]?.ended_at ?? completedSessions[0]?.started_at ?? null,
  };
}
