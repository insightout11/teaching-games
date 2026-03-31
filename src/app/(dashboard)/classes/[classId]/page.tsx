import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RosterEditor } from '@/components/class/roster-editor';
import { ClassHeader } from '@/components/class/class-header';
import { RecentSessions } from '@/components/class/recent-sessions';
import type { Class, Student, Session } from '@/lib/supabase/types';

export default async function ClassDetailPage({ params }: { params: { classId: string } }) {
  const supabase = createServerSupabase();

  const { data: cls } = await supabase
    .from('classes')
    .select('*')
    .eq('id', params.classId)
    .single() as { data: Class | null };

  if (!cls) notFound();

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', cls.id)
    .order('name') as { data: Student[] | null };

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('class_id', cls.id)
    .order('started_at', { ascending: false })
    .limit(20) as { data: Session[] | null };

  return (
    <div className="max-w-6xl">
      <ClassHeader cls={cls} studentCount={students?.length ?? 0} />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <RosterEditor classId={cls.id} initialStudents={students ?? []} />
        <RecentSessions sessions={sessions ?? []} classId={params.classId} />
      </div>
    </div>
  );
}
