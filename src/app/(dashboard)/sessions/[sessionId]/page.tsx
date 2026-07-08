import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { SessionView } from '@/components/session/session-view';
import { mockStore } from '@/lib/mock/data';
import {
  buildClassLogbookSummary,
  type ClassLogbookScoreRow,
  type ClassLogbookSessionRow,
} from '@/lib/class-logbook';
import type { Session, Class, Student, Score } from '@/lib/supabase/types';

function isMockModeServer(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
}

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
  // In mock mode, handle the client/server store mismatch
  if (isMockModeServer()) {
    // Try to find the session in the server's mock store
    let session = mockStore.getSession(params.sessionId);

    // If not found, the session was created on the client side
    // Create it on the server side using the first available class
    if (!session) {
      const classes = mockStore.classes;
      if (classes.length === 0) {
        return (
          <div className="max-w-md mx-auto mt-20 text-center">
            <h1 className="text-2xl font-bold text-lc-text mb-2">Session not found</h1>
            <p className="text-lc-text3 mb-4">This session doesn&apos;t exist or has expired.</p>
            <a href="/classes" className="text-lc-blue hover:underline">
              Back to Classes
            </a>
          </div>
        );
      }

      // Create a mock session for the first class
      const targetClass = classes[0];
      session = {
        id: params.sessionId,
        class_id: targetClass.id,
        status: 'active',
        started_at: new Date().toISOString(),
        ended_at: null,
      };
      // Add to store so it persists for this server instance
      mockStore.sessions.push(session);
    }

    const cls = mockStore.getClass(session.class_id);
    if (!cls) {
      return (
        <div className="max-w-md mx-auto mt-20 text-center">
          <h1 className="text-2xl font-bold text-lc-text mb-2">Class not found</h1>
          <p className="text-lc-text3 mb-4">The class for this session no longer exists.</p>
          <a href="/classes" className="text-lc-blue hover:underline">
            Back to Classes
          </a>
        </div>
      );
    }

    const students = mockStore.getStudents(cls.id);
    const existingScores = mockStore.getScores(session.id);
    const classSessions = mockStore.getSessions(cls.id);
    const classScores = classSessions.flatMap((classSession) => mockStore.getScores(classSession.id));
    const classLogbook = buildClassLogbookSummary({
      classId: cls.id,
      className: cls.name,
      sessions: classSessions,
      scores: classScores,
    });

    return (
      <SessionView
        session={session}
        cls={cls}
        students={students}
        existingScores={existingScores}
        classLogbook={classLogbook}
        priorSessionCount={Math.max(0, classSessions.length - 1)}
      />
    );
  }

  // Non-mock mode: use Supabase
  const supabase = createServerSupabase();

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

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', cls.id)
    .order('name') as { data: Student[] | null };

  const { data: existingScores } = await supabase
    .from('scores')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at') as { data: Score[] | null };

  const { data: classSessions } = await supabase
    .from('sessions')
    .select('id, status, started_at, ended_at, topic, custom_topic')
    .eq('class_id', cls.id)
    .order('started_at', { ascending: false })
    .limit(40) as { data: ClassLogbookSessionRow[] | null };

  const classSessionIds = (classSessions ?? []).map((classSession) => classSession.id);
  let classScores: ClassLogbookScoreRow[] = [];
  if (classSessionIds.length > 0) {
    const { data } = await supabase
      .from('scores')
      .select('session_id, points, streak_count, is_correct, accuracy_status, counts_for_accuracy, counts_for_leaderboard, scoring_version, response_data')
      .in('session_id', classSessionIds) as { data: ClassLogbookScoreRow[] | null };
    classScores = data ?? [];
  }

  const classLogbook = buildClassLogbookSummary({
    classId: cls.id,
    className: cls.name,
    sessions: classSessions ?? [],
    scores: classScores,
  });

  // First-flight onboarding gate: how many sessions has this teacher run before
  // this one? Ownership routes through class_id → classes.teacher_id (sessions has
  // no teacher_id), so count sessions across all of the teacher's classes.
  let priorSessionCount = 99;
  {
    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', cls.teacher_id) as { data: Array<{ id: string }> | null };
    const teacherClassIds = (teacherClasses ?? []).map((c) => c.id);
    if (teacherClassIds.length > 0) {
      const { count } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .in('class_id', teacherClassIds);
      // Exclude the current session; clamp so a failed count doesn't trigger onboarding.
      priorSessionCount = count == null ? 99 : Math.max(0, count - 1);
    }
  }

  return (
    <SessionView
      session={session}
      cls={cls}
      students={students ?? []}
      existingScores={existingScores ?? []}
      classLogbook={classLogbook}
      priorSessionCount={priorSessionCount}
    />
  );
}
