import { createServerSupabase } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { CockpitView } from '@/components/session/cockpit/cockpit-view';
import { mockStore } from '@/lib/mock/data';
import type { Session, Class, Student } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';

function isMockModeServer(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
}

type SessionWithInputSpec = Session & { input_spec?: InputSpec | null };

export default async function CockpitPage({
  params,
}: {
  params: { sessionId: string };
}) {
  if (isMockModeServer()) {
    const session = mockStore.getSession(params.sessionId);
    if (!session) {
      return (
        <div className="p-8 text-center">
          <p className="text-lc-text3">Session not found.</p>
        </div>
      );
    }

    const cls = mockStore.getClass(session.class_id);
    if (!cls) {
      return (
        <div className="p-8 text-center">
          <p className="text-lc-text3">Class not found.</p>
        </div>
      );
    }

    const students = mockStore.getStudents(cls.id);

    return (
      <CockpitView
        session={session as SessionWithInputSpec}
        cls={cls}
        students={students}
        initialInputSpec={null}
      />
    );
  }

  const supabase = createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.sessionId)
    .single() as { data: SessionWithInputSpec | null };

  if (!session) notFound();

  const { data: cls } = await supabase
    .from('classes')
    .select('*')
    .eq('id', session.class_id)
    .single() as { data: Class | null };

  if (!cls) notFound();
  if (cls.teacher_id !== user.id) notFound();

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', cls.id)
    .order('name') as { data: Student[] | null };

  return (
    <CockpitView
      session={session}
      cls={cls}
      students={students ?? []}
      initialInputSpec={session.input_spec ?? null}
    />
  );
}
