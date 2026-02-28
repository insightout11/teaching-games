import { createServerSupabase } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Session, Class, Student, Score, LeaderboardEntry, SessionNote, Teacher } from '@/lib/supabase/types';
import { ClassAccuracyGauge } from '@/components/control-room/class-accuracy-gauge';
import { ParticipationGrid } from '@/components/control-room/participation-grid';
import { SessionNotesEditor } from '@/components/control-room/session-notes-editor';

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
    { data: leaderboard },
    { data: teacher },
    { data: notes },
  ] = await Promise.all([
    supabase.from('students').select('*').eq('class_id', cls.id).order('name') as Promise<{ data: Student[] | null }>,
    supabase.from('scores').select('*').eq('session_id', session.id).order('created_at') as Promise<{ data: Score[] | null }>,
    supabase.from('session_leaderboard').select('*').eq('session_id', session.id).order('total_points', { ascending: false }) as Promise<{ data: LeaderboardEntry[] | null }>,
    supabase.from('teachers').select('subscription_status').eq('id', user.id).single() as Promise<{ data: Pick<Teacher, 'subscription_status'> | null }>,
    supabase.from('session_notes').select('*').eq('session_id', session.id).eq('teacher_id', user.id).maybeSingle() as Promise<{ data: SessionNote | null }>,
  ]);

  const allScores = scores ?? [];
  const allStudents = students ?? [];
  const allLeaderboard = leaderboard ?? [];

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

  // Participation
  const participationRows = allStudents.map(student => {
    const studentScores = allScores.filter(s => s.student_id === student.id);
    const uniquePromptIndices = new Set(
      studentScores.filter(s => s.prompt_index != null).map(s => s.prompt_index!)
    );
    const coverage = maxPromptIndex
      ? Math.round((uniquePromptIndices.size / maxPromptIndex) * 100)
      : null;
    return { studentId: student.id, name: student.name, attempts: studentScores.length, coverage };
  });

  // Pro gate
  const isPro = teacher?.subscription_status === 'active' || teacher?.subscription_status === 'trial';

  const sessionDate = new Date(session.started_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link href={`/classes/${params.classId}`} className="text-sm text-lc-blue hover:text-lc-blue-hover mb-2 inline-block">
          ← Back to Class
        </Link>
        <h1 className="text-2xl font-bold text-lc-text">{cls.name} — Control Room</h1>
      </div>

      {/* Session meta row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-lc-card rounded-2xl border border-lc-border p-4 text-center">
          <p className="text-sm font-medium text-lc-text">{sessionDate}</p>
          <p className="text-xs text-lc-text3 mt-1">Date</p>
        </div>
        <div className="bg-lc-card rounded-2xl border border-lc-border p-4 text-center">
          <p className="text-sm font-medium text-lc-text">
            {durationMinutes !== null ? `${durationMinutes} min` : '—'}
          </p>
          <p className="text-xs text-lc-text3 mt-1">Duration</p>
        </div>
        <div className="bg-lc-card rounded-2xl border border-lc-border p-4 text-center">
          <p className="text-sm font-medium text-lc-text">{maxPromptIndex ?? 'N/A'}</p>
          <p className="text-xs text-lc-text3 mt-1">Total Rounds</p>
        </div>
      </div>

      {/* Class Accuracy */}
      <ClassAccuracyGauge
        accuracy={accuracy}
        scorableAttempts={scorableAttempts}
        correctCount={correctCount}
      />

      {/* Participation */}
      <ParticipationGrid rows={participationRows} maxPromptIndex={maxPromptIndex} />

      {/* Leaderboard summary */}
      <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
        <h2 className="font-semibold text-lc-text mb-4">Leaderboard</h2>
        {allLeaderboard.length === 0 ? (
          <p className="text-lc-text3 text-sm">No scoring data yet</p>
        ) : (
          <div className="space-y-2">
            {allLeaderboard.map((entry, i) => (
              <div key={entry.student_id} className="flex items-center gap-3 py-2 border-b border-lc-border-subtle last:border-0">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  i === 1 ? 'bg-lc-text3/20 text-lc-text3' :
                  i === 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-lc-surface text-lc-text3'
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-lc-text">{entry.student_name}</span>
                <span className="text-xs text-lc-text3">{entry.correct_count}/{entry.total_attempts}</span>
                {entry.best_streak >= 2 && (
                  <span className="text-xs text-lc-warn">🔥{entry.best_streak}</span>
                )}
                <span className="text-sm font-bold text-lc-blue w-16 text-right">{entry.total_points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Notes */}
      {isPro ? (
        <SessionNotesEditor
          sessionId={session.id}
          teacherId={user.id}
          initialContent={notes?.content ?? ''}
        />
      ) : (
        <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lc-text">Session Notes</h2>
            <span className="text-xs text-lc-text3 bg-lc-surface px-2 py-0.5 rounded-full">Pro feature</span>
          </div>
          <p className="text-sm text-lc-text3">Upgrade to Pro to add notes to your sessions.</p>
        </div>
      )}
    </div>
  );
}
