import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// POST /api/world-flight/share
// Body: { classId: string, enabled: boolean }
//
// Toggles public sharing for a class's World Flight journey and returns the
// share token so the teacher can copy the link. Verifies the class belongs to
// the requesting teacher. Creates the journey-state row on demand so a teacher
// can enable sharing as soon as they have a class.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const body = await request.json().catch(() => null);
  const classId = body?.classId;
  const enabled = body?.enabled !== false; // default to enabling

  if (!classId || typeof classId !== 'string' || !UUID_RE.test(classId)) {
    return NextResponse.json({ error: 'Valid classId is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Ownership check — sessions.class_id → classes.teacher_id.
  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', teacher.id)
    .maybeSingle();

  if (!cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Upsert the journey-state row, flipping share_enabled. The default
  // share_token is generated on insert; existing rows keep theirs.
  const { data: state, error: upsertError } = await supabase
    .from('class_world_flight_state')
    .upsert(
      { class_id: classId, share_enabled: enabled },
      { onConflict: 'class_id' },
    )
    .select('share_token, share_enabled')
    .single();

  if (upsertError || !state) {
    return NextResponse.json(
      { error: upsertError?.message ?? 'Failed to update sharing' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    shareEnabled: state.share_enabled,
    shareToken: state.share_token,
  });
}
