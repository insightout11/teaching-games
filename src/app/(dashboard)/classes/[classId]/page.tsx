import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RosterEditor } from '@/components/class/roster-editor';
import { ClassSettings } from '@/components/class/class-settings';
import { SessionStarter } from '@/components/class/session-starter';
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
    .limit(10) as { data: Session[] | null };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {students?.length ?? 0} students
          </p>
        </div>
        <SessionStarter classId={cls.id} studentCount={students?.length ?? 0} />
      </div>

      <div className="grid gap-6">
        <RosterEditor classId={cls.id} initialStudents={students ?? []} />
        <ClassSettings cls={cls} />

        {sessions && sessions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Recent Sessions</h2>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
                  <div>
                    <span className="text-sm font-medium">
                      {new Date(s.started_at).toLocaleDateString()} {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status}
                    </span>
                  </div>
                  {s.status === 'active' && (
                    <a href={`/sessions/${s.id}`} className="text-sm text-indigo-600 hover:underline">
                      Resume
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
