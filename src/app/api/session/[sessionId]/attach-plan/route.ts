import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { parseLessonPlanPayload } from '@/lib/lesson-plan-payload';

export const dynamic = 'force-dynamic';

/**
 * Launch a flight INTO a running Live Room session, so students who already
 * joined stay on board. No credit: the session was paid for when it opened.
 * Replaces any earlier room flight's plan. World Flight / design missions
 * still go through session creation (they need their leg RPCs).
 */
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null);
  const raw = body?.lessonPlanContent;
  if (raw == null) return NextResponse.json({ error: 'lessonPlanContent is required' }, { status: 400 });
  if (JSON.stringify(raw).length > 1_500_000) {
    return NextResponse.json({ error: 'Lesson plan is too large' }, { status: 413 });
  }
  const plan = parseLessonPlanPayload(raw);
  if (!plan) return NextResponse.json({ error: 'Invalid lesson plan' }, { status: 400 });
  if (plan.worldFlightContext || plan.worldFlightDesignMissionContext || plan.destinationId) {
    return NextResponse.json({ error: 'World Flight lessons start as a new session' }, { status: 400 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id, { requireActive: true });
  if (owned.error) return owned.error;

  const { data, error } = await createServiceClient()
    .from('sessions')
    .update({
      topic: 'General',
      custom_topic: plan.customTopic,
      difficulty: plan.difficulty ?? 'Intermediate',
      lesson_plan_content: plan,
    })
    .eq('id', params.sessionId)
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  return NextResponse.json({ sessionId: params.sessionId });
}

/** Flight over (or exited): back to a plan-free room, so a refresh reopens the room. */
export async function DELETE(_request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  const { error } = await createServiceClient()
    .from('sessions')
    .update({ lesson_plan_content: null })
    .eq('id', params.sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessionId: params.sessionId });
}
