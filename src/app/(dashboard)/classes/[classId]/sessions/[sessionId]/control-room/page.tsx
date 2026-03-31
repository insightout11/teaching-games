import { createServerSupabase } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Clock, Layers, Trophy } from 'lucide-react';
import type { Session, Class, Student, Score, LeaderboardEntry, SessionNote, Teacher, Round } from '@/lib/supabase/types';
import { ClassAccuracyGauge } from '@/components/control-room/class-accuracy-gauge';
import { ParticipationGrid } from '@/components/control-room/participation-grid';
import { RoundsBreakdown } from '@/components/control-room/rounds-breakdown';
import { SessionNotesEditor } from '@/components/control-room/session-notes-editor';

const TOP_ACCURACY_THRESHOLD = 80;

function accuracyColor(accuracy: number | null): string {
  if (accuracy === null) return 'text-lc-text3';
  if (accuracy >= TOP_ACCURACY_THRESHOLD) return 'text-lc-success';
  if (accuracy >= 50) return 'text-lc-warn';
  return 'text-lc-danger';
}

export default async function ControlRoomPage({
  params,
}: {
  params: { classId: string; sessionId: string };
}) {
  const supabase = createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.sessionId)
    .single() as { data: Session | null };

  if (!session) notFound();

  const { data: cls } = await supabase
    .from('classes')
    .select('*')
    .eq('id', session.class_id)
    .single() as { data: Class | null };

  if (!cls) notFound();
  if (cls.teacher_id !== user.id) notFound();

  const [
    { data: students },
    { data: scores },
    { data: rounds },
    { data: leaderboard },
    { data: teacher },
    { data: notes },
  ] = await Promise.all([
    supabase.from('students').select('*').eq('class_id', cls.id).order('name') as Promise<{ data: Student[] | null }>,
    supabase.from('scores').select('*').eq('session_id', session.id).order('created_at') as Promise<{ data: Score[] | null }>,
    supabase.from('rounds').select('game_type, round_number').eq('session_id', session.id) as Promise<{ data: Pick<Round, 'game_type' | 'round_number'>[] | null }>,
    supabase.from('session_leaderboard').select('*').eq('session_id', session.id).order('total_points', { ascending: false }) as Promise<{ data: LeaderboardEntry[] | null }>,
    supabase.from('teachers').select('subscription_status').eq('id', user.id).single() as Promise<{ data: Pick<Teacher, 'subscription_status'> | null }>,
    supabase.from('session_notes').select('*').eq('session_id', session.id).eq('teacher_id', user.id).maybeSingle() as Promise<{ data: SessionNote | null }>,
  ]);

  const allScores = scores ?? [];
  const allStudents = students ?? [];
  const allLeaderboard = leaderboard ?? [];
  const allRounds = rounds ?? [];

  // Session meta
  const durationMs = session.ended_at
    ? new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
    : null;
  const durationMinutes = durationMs ? Math.round(durationMs / 60000) : null;

  // prompt_index range
  const scoredPrompts = allScores.filter(s => s.prompt_index != null);
  const maxPromptIndex = scoredPrompts.length > 0
    ? Math.max(...scoredPrompts.map(s => s.prompt_index!))
    : null;

  // Class accuracy
  const scorableScores = allScores.filter(s => s.is_correct != null);
  const scorableAttempts = scorableScores.length;
  const correctCount = scorableScores.filter(s => s.is_correct === true).length;
  const accuracy = scorableAttempts > 0 ? Math.round((correctCount / scorableAttempts) * 100) : null;

  // Participation + per-student accuracy
  const participationRows = allStudents.map(student => {
    const studentScores = allScores.filter(
      s => s.student_id === student.id ||
           (!s.student_id && s.display_name === student.name)
    );
    const uniquePromptIndices = new Set(
      studentScores.filter(s => s.prompt_index != null).map(s => s.prompt_index!)
    );
    const coverage = maxPromptIndex
      ? Math.round((uniquePromptIndices.size / maxPromptIndex) * 100)
      : null;
    const scorable = studentScores.filter(s => s.is_correct != null);
    const studentAccuracy = scorable.length > 0
      ? Math.round((scorable.filter(s => s.is_correct === true).length / scorable.length) * 100)
      : null;
    return { studentId: student.id, name: student.name, attempts: studentScores.length, coverage, accuracy: studentAccuracy };
  });

  // Rounds breakdown — max round_number per game_type
  const roundCountMap = new Map<string, number>();
  for (const r of allRounds) {
    const prev = roundCountMap.get(r.game_type) ?? 0;
    if (r.round_number > prev) roundCountMap.set(r.game_type, r.round_number);
  }

  // Per-game accuracy — derived from response_data.gameKey on existing scores
  const gameAccuracyMap = new Map<string, { correct: number; total: number }>();
  for (const score of allScores) {
    const gameKey = (score.response_data as Record<string, unknown>)?.gameKey as string | undefined;
    if (!gameKey || score.is_correct == null) continue;
    const entry = gameAccuracyMap.get(gameKey) ?? { correct: 0, total: 0 };
    entry.total++;
    if (score.is_correct) entry.correct++;
    gameAccuracyMap.set(gameKey, entry);
  }

  const roundsBreakdownRows = Array.from(roundCountMap.entries())
    .map(([gameType, roundCount]) => {
      const acc = gameAccuracyMap.get(gameType);
      return {
        gameType,
        rounds: roundCount,
        accuracy: acc && acc.total > 0 ? Math.round((acc.correct / acc.total) * 100) : null,
      };
    })
    .sort((a, b) => a.gameType.localeCompare(b.gameType));

  // Leaderboard with computed accuracy
  const leaderboardWithAccuracy = allLeaderboard.map(entry => ({
    ...entry,
    accuracy: entry.total_attempts > 0
      ? Math.round((entry.correct_count / entry.total_attempts) * 100)
      : null,
  }));

  // Pro gate
  const isPro = teacher?.subscription_status === 'active' || teacher?.subscription_status === 'trial';

  const sessionDate = new Date(session.started_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <Link href={`/classes/${params.classId}/control-room`} className="inline-flex items-center gap-1 text-sm text-lc-text3 hover:text-lc-blue transition-colors mb-3">
          ← Control Room
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-lc-blue">Debrief</span>
            </div>
            <h1 className="text-2xl font-bold text-lc-text">Session Debrief</h1>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full mt-1 ${
            session.status === 'active'
              ? 'bg-lc-success/15 text-lc-success'
              : 'bg-lc-surface text-lc-text3 border border-lc-border'
          }`}>
            {session.status}
          </span>
        </div>
      </div>

      {/* Session meta row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-lc-card rounded-2xl border border-lc-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-lc-text3" />
            <span className="text-xs text-lc-text3 uppercase tracking-wide font-medium">Date</span>
          </div>
          <p className="text-sm font-semibold text-lc-text">{sessionDate}</p>
        </div>
        <div className="bg-lc-card rounded-2xl border border-lc-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-lc-text3" />
            <span className="text-xs text-lc-text3 uppercase tracking-wide font-medium">Duration</span>
          </div>
          <p className="text-sm font-semibold text-lc-text">
            {durationMinutes !== null ? `${durationMinutes} min` : '—'}
          </p>
        </div>
        <div className="bg-lc-card rounded-2xl border border-lc-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="w-3.5 h-3.5 text-lc-text3" />
            <span className="text-xs text-lc-text3 uppercase tracking-wide font-medium">Rounds</span>
          </div>
          <p className="text-sm font-semibold text-lc-text">{maxPromptIndex ?? '—'}</p>
        </div>
      </div>

      {/* Two-column layout: left = accuracy + games + leaderboard, right = participation + notes */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-6">
          <ClassAccuracyGauge
            accuracy={accuracy}
            scorableAttempts={scorableAttempts}
            correctCount={correctCount}
          />

          <RoundsBreakdown rows={roundsBreakdownRows} />

          {/* Leaderboard */}
          <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-lc-text3 shrink-0" />
              <h2 className="font-semibold text-lc-text">Leaderboard</h2>
              <span className="ml-auto text-xs text-lc-text3">
                Top accuracy ≥{TOP_ACCURACY_THRESHOLD}%
              </span>
            </div>
            {leaderboardWithAccuracy.length === 0 ? (
              <p className="text-lc-text3 text-sm">No scoring data yet</p>
            ) : (
              <div className="space-y-1">
                {leaderboardWithAccuracy.map((entry, i) => (
                  <div key={entry.student_id} className="flex items-center gap-3 py-2 border-b border-lc-border-subtle last:border-0">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      i === 1 ? 'bg-slate-400/20 text-slate-300' :
                      i === 2 ? 'bg-amber-600/20 text-amber-500' : 'bg-lc-surface text-lc-text3'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-lc-text">{entry.student_name}</span>
                    <span className="text-xs text-lc-text3 tabular-nums">{entry.correct_count}/{entry.total_attempts}</span>
                    <span className={`text-xs font-semibold w-10 text-right tabular-nums ${accuracyColor(entry.accuracy)}`}>
                      {entry.accuracy !== null ? `${entry.accuracy}%` : '—'}
                    </span>
                    {entry.best_streak >= 2 && (
                      <span className="text-xs text-lc-warn">🔥{entry.best_streak}</span>
                    )}
                    <span className="text-sm font-bold text-lc-blue w-16 text-right tabular-nums">{entry.total_points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <ParticipationGrid rows={participationRows} maxPromptIndex={maxPromptIndex} />

          {isPro ? (
            <SessionNotesEditor
              sessionId={session.id}
              teacherId={user.id}
              initialContent={notes?.content ?? ''}
            />
          ) : (
            <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lc-text">Debrief Notes</h2>
                <span className="text-xs text-lc-text3 bg-lc-surface px-2 py-0.5 rounded-full border border-lc-border">Pro</span>
              </div>
              <p className="text-sm text-lc-text3">Upgrade to Pro to add notes to your sessions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
