import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServerSupabase } from '@/lib/supabase/server';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import type { DesignStudioBrief, DesignStudioState } from '@/activities/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    sessionId?: unknown;
    designState?: unknown;
    brief?: unknown;
  } | null;

  if (
    typeof body?.sessionId !== 'string'
    || !body.designState
    || typeof body.designState !== 'object'
    || !body.brief
    || typeof body.brief !== 'object'
  ) {
    return NextResponse.json({ error: 'sessionId, designState, and brief are required' }, { status: 400 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ownership = await verifyTeacherOwnsSession(body.sessionId, teacher.id);
  if (ownership.error) return ownership.error;

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ missionStatus: 'completed' });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('complete_world_flight_design_mission', {
    p_session_id: body.sessionId,
    p_design_state: body.designState as DesignStudioState,
    p_brief: body.brief as DesignStudioBrief,
  });

  if (error) {
    console.error('[api/world-flight/design-mission/complete] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? { missionStatus: 'none' });
}
