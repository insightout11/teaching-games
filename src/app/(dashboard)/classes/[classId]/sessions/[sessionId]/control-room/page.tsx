import { createServerSupabase } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Clock, Layers } from 'lucide-react';
import type { Session, Class, Student, Score, SessionNote, StudentSessionNote, Teacher, Round } from '@/lib/supabase/types';
import { ClassAccuracyGauge } from '@/components/control-room/class-accuracy-gauge';
import { ParticipationGrid } from '@/components/control-room/participation-grid';
import { RoundsBreakdown } from '@/components/control-room/rounds-breakdown';
import { SessionNotesEditor } from '@/components/control-room/session-notes-editor';
import { Surface } from '@/components/ui/surface';
import { countsForAccuracy, getScoreModuleKey, isCorrectScore } from '@/lib/scoring-reporting';



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
    { data: teacher },
    { data: notes },
    { data: studentNotes },
  ] = await Promise.all([
    supabase.from('students').select('*').eq('class_id', cls.id).order('name') as Promise<{ data: Student[] | null }>,
    supabase.from('scores').select('*').eq('session_id', session.id).order('created_at') as Promise<{ data: Score[] | null }>,
    supabase.from('rounds').select('game_type, round_number').eq('session_id', session.id) as Promise<{ data: Pick<Round, 'game_type' | 'round_number'>[] | null }>,
    supabase.from('teachers').select('subscription_status, is_developer, promo_expires_at').eq('id', user.id).single() as Promise<{ data: Pick<Teacher, 'subscription_status'> & { is_developer: boolean; promo_expires_at: string | null } | null }>,
    supabase.from('session_notes').select('*').eq('session_id', session.id).eq('teacher_id', user.id).maybeSingle() as Promise<{ data: SessionNote | null }>,
    supabase.from('student_session_notes').select('*').eq('session_id', session.id) as Promise<{ data: StudentSessionNote[] | null }>,
  ]);

  const allScores = scores ?? [];
  const allStudents = students ?? [];
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

  const scorableScores = allScores.filter(countsForAccuracy);
  const scorableAttempts = scorableScores.length;
  const correctCount = scorableScores.filter(isCorrectScore).length;
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
    const scorable = studentScores.filter(countsForAccuracy);
    const studentAccuracy = scorable.length > 0
      ? Math.round((
          scorable.filter(isCorrectScore).length
          / scorable.length
        ) * 100)
      : null;
    return { studentId: student.id, name: student.name, attempts: studentScores.length, coverage, accuracy: studentAccuracy };
  });

  // Rounds breakdown — max round_number per game_type
  const roundCountMap = new Map<string, number>();
  for (const r of allRounds) {
    const prev = roundCountMap.get(r.game_type) ?? 0;
    if (r.round_number > prev) roundCountMap.set(r.game_type, r.round_number);
  }

  // Per-game accuracy — V2-aware
  const gameAccuracyMap = new Map<string, { correct: number; total: number }>();
  for (const score of allScores) {
    const gameKey = getScoreModuleKey(score);
    if (!gameKey || !countsForAccuracy(score)) continue;
    const entry = gameAccuracyMap.get(gameKey) ?? { correct: 0, total: 0 };
    entry.total++;
    if (isCorrectScore(score)) entry.correct++;
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


  // Student notes map: studentId → note body
  const studentNotesMap: Record<string, string> = {};
  for (const sn of studentNotes ?? []) {
    studentNotesMap[sn.student_id] = sn.note;
  }

  // Pro gate
  const isPro = teacher?.is_developer === true
    || teacher?.subscription_status === 'active'
    || teacher?.subscription_status === 'trial'
    || (teacher?.promo_expires_at != null && new Date(teacher.promo_expires_at) > new Date());

  const sessionDate = new Date(session.started_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <Link href={`/classes/${params.classId}#students`} className="inline-flex items-center gap-1 text-sm text-lc-text3 hover:text-lc-blue transition-colors mb-3">
          ← Class and students
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

        </div>

        {/* Right column */}
        <div className="space-y-6">
          <ParticipationGrid
            rows={participationRows}
            maxPromptIndex={maxPromptIndex}
            sessionId={session.id}
            classId={cls.id}
            teacherId={user.id}
            initialNotes={studentNotesMap}
          />

          {isPro ? (
            <SessionNotesEditor
              sessionId={session.id}
              teacherId={user.id}
              initialContent={notes?.content ?? ''}
            />
          ) : (
            <Surface variant="card">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lc-text">Debrief Notes</h2>
                <span className="text-xs text-lc-text3 bg-lc-surface px-2 py-0.5 rounded-full border border-lc-border">Pro</span>
              </div>
              <p className="text-sm text-lc-text3">Upgrade to Pro to add notes to your sessions.</p>
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}
