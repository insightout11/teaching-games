import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { SessionView } from '@/components/session/session-view';
import { mockStore } from '@/lib/mock/data';
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
        frozen: false,
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

    return (
      <SessionView
        session={session}
        cls={cls}
        students={students}
        existingScores={existingScores}
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

  return (
    <SessionView
      session={session}
      cls={cls}
      students={students ?? []}
      existingScores={existingScores ?? []}
    />
  );
}
