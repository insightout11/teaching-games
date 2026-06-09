import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServerSupabase } from '@/lib/supabase/server';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = body?.sessionId;
  const completed = body?.completed;

  if (!sessionId || typeof sessionId !== 'string' || typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'sessionId and completed are required' }, { status: 400 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id);
  if (ownership.error) return ownership.error;

  const supabase = createServerSupabase();

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ legStatus: 'none', currentDestinationId: null });
  }

  const { data, error } = await supabase.rpc('finish_world_flight_session', {
    p_session_id: sessionId,
    p_completed: completed,
  });

  if (error) {
    console.error('[api/session/end] finish_world_flight_session error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? { legStatus: 'none', currentDestinationId: null });
}
