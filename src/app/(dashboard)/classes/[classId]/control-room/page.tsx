import { createServerSupabase } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Layers, Trophy, Users, Target, BarChart3 } from 'lucide-react';
import type { Session, Class, Student, Score, LeaderboardEntry, Teacher, Round } from '@/lib/supabase/types';
import { ClassAccuracyGauge } from '@/components/control-room/class-accuracy-gauge';
import { RoundsBreakdown } from '@/components/control-room/rounds-breakdown';

const TOP_ACCURACY_THRESHOLD = 80;

function accuracyColor(accuracy: number | null): string {
  if (accuracy === null) return 'text-lc-text3';
  if (accuracy >= TOP_ACCURACY_THRESHOLD) return 'text-lc-success';
  if (accuracy >= 50) return 'text-lc-warn';
  return 'text-lc-danger';
}

export default async function ClassControlRoomPage({
  params,
}: {
  params: { classId: string };
}) {
  const supabase = createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Step 1: class, students, teacher in parallel
  const [{ data: cls }, { data: students }, { data: teacher }] = await Promise.all([
    supabase.from('classes').select('*').eq('id', params.classId).single() as Promise<{ data: Class | null }>,
    supabase.from('students').select('*').eq('class_id', params.classId).order('name') as Promise<{ data: Student[] | null }>,
    supabase.from('teachers').select('subscription_status').eq('id', user.id).single() as Promise<{ data: Pick<Teacher, 'subscription_status'> | null }>,
  ]);

  if (!cls) notFound();
  if (cls.teacher_id !== user.id) notFound();

  // Step 2: sessions for this class
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('class_id', params.classId)
    .order('started_at', { ascending: false }) as { data: Session[] | null };

  const allSessions = sessions ?? [];
  const sessionIds = allSessions.map(s => s.id);

  // Step 3: scores, leaderboard, rounds across all sessions
  let allScores: Score[] = [];
  let allLeaderboard: LeaderboardEntry[] = [];
  let allRounds: Pick<Round, 'game_type' | 'round_number' | 'session_id'>[] = [];

  if (sessionIds.length > 0) {
    const [{ data: scores }, { data: leaderboard }, { data: rounds }] = await Promise.all([
      supabase.from('scores').select('*').in('session_id', sessionIds) as Promise<{ data: Score[] | null }>,
      supabase.from('session_leaderboard').select('*').in('session_id', sessionIds) as Promise<{ data: LeaderboardEntry[] | null }>,
      supabase.from('rounds').select('game_type, round_number, session_id').in('session_id', sessionIds) as Promise<{ data: Pick<Round, 'game_type' | 'round_number' | 'session_id'>[] | null }>,
    ]);
    allScores = scores ?? [];
    allLeaderboard = leaderboard ?? [];
    allRounds = rounds ?? [];
  }

  // Overall accuracy
  const scorableScores = allScores.filter(s => s.is_correct != null);
  const correctCount = scorableScores.filter(s => s.is_correct === true).length;
  const accuracy = scorableScores.length > 0 ? Math.round((correctCount / scorableScores.length) * 100) : null;

  // Total rounds
  const totalRounds = allRounds.length;

  // Cumulative leaderboard — group by student_id across all sessions
  const cumulativeMap = new Map<string, { name: string; totalPoints: number; correctCount: number; totalAttempts: number; bestStreak: number }>();
  for (const entry of allLeaderboard) {
    const key = String(entry.student_id);
    const existing = cumulativeMap.get(key) ?? { name: entry.student_name, totalPoints: 0, correctCount: 0, totalAttempts: 0, bestStreak: 0 };
    existing.totalPoints += entry.total_points;
    existing.correctCount += entry.correct_count;
    existing.totalAttempts += entry.total_attempts;
    existing.bestStreak = Math.max(existing.bestStreak, entry.best_streak);
    cumulativeMap.set(key, existing);
  }
  const cumulativeLeaderboard = Array.from(cumulativeMap.values())
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Game breakdown across all sessions
  const gameDataMap = new Map<string, { correct: number; total: number; rounds: number }>();
  for (const score of allScores) {
    const gameKey = (score.response_data as Record<string, unknown>)?.gameKey as string | undefined;
    if (!gameKey || score.is_correct == null) continue;
    const entry = gameDataMap.get(gameKey) ?? { correct: 0, total: 0, rounds: 0 };
    entry.total++;
    if (score.is_correct) entry.correct++;
    gameDataMap.set(gameKey, entry);
  }
  for (const r of allRounds) {
    const entry = gameDataMap.get(r.game_type);
    if (entry) {
      entry.rounds++;
    } else {
      gameDataMap.set(r.game_type, { correct: 0, total: 0, rounds: 1 });
    }
  }
  const roundsBreakdownRows = Array.from(gameDataMap.entries())
    .map(([gameType, data]) => ({
      gameType,
      rounds: data.rounds,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : null,
    }))
    .sort((a, b) => a.gameType.localeCompare(b.gameType));

  // Per-session summary rows
  const sessionRows = allSessions.map(s => {
    const sessionScores = allScores.filter(sc => sc.session_id === s.id);
    const scorable = sessionScores.filter(sc => sc.is_correct != null);
    const acc = scorable.length > 0
      ? Math.round(scorable.filter(sc => sc.is_correct === true).length / scorable.length * 100)
      : null;
    const sessionRounds = allRounds.filter(r => r.session_id === s.id);
    const roundCount = sessionRounds.length > 0 ? Math.max(...sessionRounds.map(r => r.round_number)) : 0;
    const durationMs = s.ended_at
      ? new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
      : null;
    const duration = durationMs ? Math.round(durationMs / 60000) : null;
    return { ...s, accuracy: acc, roundCount, duration };
  });

  const allStudents = students ?? [];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <Link href={`/classes/${params.classId}`} className="inline-flex items-center gap-1 text-sm text-lc-text3 hover:text-lc-blue transition-colors mb-3">
          ← {cls.name}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-lc-blue">Control Room</span>
            </div>
            <h1 className="text-2xl font-bold text-lc-text">{cls.name}</h1>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-lc-card rounded-2xl border border-lc-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-lc-text3" />
            <span className="text-xs text-lc-text3 uppercase tracking-wide font-medium">Sessions</span>
          </div>
          <p className="text-sm font-semibold text-lc-text">{allSessions.length || '—'}</p>
        </div>
        <div className="bg-lc-card rounded-2xl border border-lc-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-lc-text3" />
            <span className="text-xs text-lc-text3 uppercase tracking-wide font-medium">Students</span>
          </div>
          <p className="text-sm font-semibold text-lc-text">{allStudents.length || '—'}</p>
        </div>
        <div className="bg-lc-card rounded-2xl border border-lc-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-lc-text3" />
            <span className="text-xs text-lc-text3 uppercase tracking-wide font-medium">Accuracy</span>
          </div>
          <p className={`text-sm font-semibold ${accuracyColor(accuracy)}`}>
            {accuracy !== null ? `${accuracy}%` : '—'}
          </p>
        </div>
        <div className="bg-lc-card rounded-2xl border border-lc-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="w-3.5 h-3.5 text-lc-text3" />
            <span className="text-xs text-lc-text3 uppercase tracking-wide font-medium">Rounds</span>
          </div>
          <p className="text-sm font-semibold text-lc-text">{totalRounds || '—'}</p>
        </div>
      </div>

      {allSessions.length === 0 ? (
        <div className="bg-lc-card rounded-2xl border border-lc-border p-12 text-center">
          <span className="text-3xl mb-3 block">✈</span>
          <p className="text-lc-text font-medium">No sessions yet</p>
          <p className="text-sm text-lc-text3 mt-1">Data will appear here after your first session</p>
        </div>
      ) : (
        <>
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            {/* Left */}
            <div className="space-y-6">
              <ClassAccuracyGauge
                accuracy={accuracy}
                scorableAttempts={scorableScores.length}
                correctCount={correctCount}
              />
              <RoundsBreakdown rows={roundsBreakdownRows} />
            </div>

            {/* Right: all-time leaderboard */}
            <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-lc-text3 shrink-0" />
                <h2 className="font-semibold text-lc-text">All-Time Leaderboard</h2>
              </div>
              {cumulativeLeaderboard.length === 0 ? (
                <p className="text-lc-text3 text-sm">No scoring data yet</p>
              ) : (
                <div className="space-y-1">
                  {cumulativeLeaderboard.map((entry, i) => {
                    const entryAccuracy = entry.totalAttempts > 0
                      ? Math.round((entry.correctCount / entry.totalAttempts) * 100)
                      : null;
                    return (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-lc-border-subtle last:border-0">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          i === 1 ? 'bg-slate-400/20 text-slate-300' :
                          i === 2 ? 'bg-amber-600/20 text-amber-500' : 'bg-lc-surface text-lc-text3'
                        }`}>
                          {i + 1}
                        </span>
                        <span className="flex-1 text-sm font-medium text-lc-text truncate">{entry.name}</span>
                        <span className={`text-xs font-semibold w-10 text-right tabular-nums ${accuracyColor(entryAccuracy)}`}>
                          {entryAccuracy !== null ? `${entryAccuracy}%` : '—'}
                        </span>
                        {entry.bestStreak >= 2 && (
                          <span className="text-xs text-lc-warn">🔥{entry.bestStreak}</span>
                        )}
                        <span className="text-sm font-bold text-lc-blue w-16 text-right tabular-nums">
                          {entry.totalPoints} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sessions list */}
          <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-lc-text3 shrink-0" />
              <h2 className="font-semibold text-lc-text">Sessions</h2>
              <span className="ml-auto text-xs text-lc-text3">{allSessions.length} total</span>
            </div>
            <div className="space-y-0">
              {sessionRows.map(s => {
                const dateStr = new Date(s.started_at).toLocaleDateString([], {
                  month: 'short', day: 'numeric', year: 'numeric',
                });
                const isActive = s.status === 'active';
                return (
                  <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-lc-border-subtle last:border-0">
                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-lc-success' : 'bg-lc-border'}`} />
                    <span className="text-sm text-lc-text tabular-nums w-28 shrink-0">{dateStr}</span>
                    {s.duration !== null ? (
                      <span className="text-xs text-lc-text3 tabular-nums w-14 shrink-0">{s.duration} min</span>
                    ) : (
                      <span className="w-14 shrink-0" />
                    )}
                    {s.roundCount > 0 ? (
                      <span className="text-xs text-lc-text3 tabular-nums w-16 shrink-0">{s.roundCount} rounds</span>
                    ) : (
                      <span className="w-16 shrink-0" />
                    )}
                    {s.accuracy !== null && (
                      <span className={`text-xs font-semibold tabular-nums ${accuracyColor(s.accuracy)}`}>
                        {s.accuracy}%
                      </span>
                    )}
                    <span className="flex-1" />
                    {isActive ? (
                      <a
                        href={`/sessions/${s.id}`}
                        className="text-xs font-semibold text-lc-success hover:text-lc-success/80 uppercase tracking-wide shrink-0"
                      >
                        Live →
                      </a>
                    ) : (
                      <Link
                        href={`/classes/${params.classId}/sessions/${s.id}/control-room`}
                        className="text-xs text-lc-blue hover:text-lc-blue-hover shrink-0"
                      >
                        Debrief →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
