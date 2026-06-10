import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth-credits';

export const dynamic = 'force-dynamic';

// POST /api/session/demo
//
// Creates a real session against a hidden, per-teacher demo class so a teacher
// evaluating alone can experience the live loop. Demo sessions are FREE — they
// never consume a generation credit. Simulated students are driven entirely
// client-side via the real /api/student/join + /api/student/submit endpoints.
//
// The demo class is flagged is_demo so Control Room aggregates and class lists
// can exclude it.

const DEMO_CLASS_NAME = 'Demo Class';

export async function POST() {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const supabase = createServerSupabase();

  // Find-or-create the teacher's demo class (one per teacher).
  const { data: existing } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacher.id)
    .eq('is_demo', true)
    .limit(1)
    .maybeSingle();

  let classId = existing?.id;

  if (!classId) {
    const { data: created, error: createError } = await supabase
      .from('classes')
      .insert({ teacher_id: teacher.id, name: DEMO_CLASS_NAME, is_demo: true })
      .select('id')
      .single();

    if (createError || !created) {
      return NextResponse.json(
        { error: createError?.message ?? 'Failed to create demo class' },
        { status: 500 },
      );
    }
    classId = created.id;
  }

  // Create the session (no credit consumed — demos are free).
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({ class_id: classId })
    .select('id')
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: sessionError?.message ?? 'Failed to create demo session' },
      { status: 500 },
    );
  }

  return NextResponse.json({ sessionId: session.id });
}
