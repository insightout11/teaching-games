import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { toLesson } from '../../route';

export const dynamic = 'force-dynamic';

interface PatchBody {
  status?: 'planned' | 'launched' | 'completed';
  sessionId?: string | null;
}

// PATCH — update a course lesson's launch state (status + linked session).
// Called after the client writes the lesson payload to sessionStorage and creates the session.
export async function PATCH(request: NextRequest, { params }: { params: { lessonId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const supabase = createServiceClient();
  // Ownership: the lesson's course must belong to this teacher.
  const { data: lesson } = await supabase
    .from('course_lessons')
    .select('id, course_id, courses!inner(teacher_id)')
    .eq('id', params.lessonId)
    .maybeSingle();
  const ownerId = (lesson as { courses?: { teacher_id?: string | null } } | null)?.courses?.teacher_id;
  if (!lesson || ownerId !== teacher.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (body.status && ['planned', 'launched', 'completed'].includes(body.status)) update.status = body.status;
  if (body.sessionId !== undefined) update.session_id = body.sessionId;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data: updated, error: updErr } = await supabase
    .from('course_lessons')
    .update(update)
    .eq('id', params.lessonId)
    .select('*')
    .single();
  if (updErr || !updated) return NextResponse.json({ error: updErr?.message ?? 'Update failed' }, { status: 500 });
  return NextResponse.json(toLesson(updated));
}
