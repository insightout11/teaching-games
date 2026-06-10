import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/auth-credits';
import { ensureDemoClass } from '@/lib/demo-class';

export const dynamic = 'force-dynamic';

// POST /api/session/demo
//
// Creates an open session against the teacher's hidden demo class so they can
// test INDIVIDUAL modules: launch anything from the module browser and the
// demo crew (5 simulated students driven through the real student endpoints)
// answers it. Full-lesson testing goes through the Captain's Flight launcher
// ("Test flight with demo crew"), which uses the normal preset launch path.
//
// Demo sessions are free — no generation happens until the teacher launches a
// module, and those calls sit behind the per-teacher AI cap.

export async function POST() {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const service = createServiceClient();
  const { classId, error: classError } = await ensureDemoClass(service, teacher.id);

  if (classError || !classId) {
    return NextResponse.json({ error: classError ?? 'Failed to resolve demo class' }, { status: 500 });
  }

  // Create the session via the teacher's own client (RLS) — consistent with
  // how real sessions are owned.
  const supabase = createServerSupabase();
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
