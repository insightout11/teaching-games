import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/mock/data';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';

// Teacher-only attendance feed. Mock mode reads the in-memory store; live mode
// uses the service client only after verifying that the teacher owns the session.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ participants: [] });
  }

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    mockStore.ensureSession(sessionId);

    const participants = mockStore
      .getSessionParticipants(sessionId)
      .map(({ id, student_id, display_name, avatar_seed, joined_at }) => ({
        id,
        student_id,
        display_name,
        avatar_seed,
        joined_at,
      }));

    return NextResponse.json({ participants }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id);
  if (ownership.error) return ownership.error;

  const service = createServiceClient();
  const { data, error } = await service
    .from('session_participants')
    .select('id, student_id, display_name, avatar_seed, joined_at')
    .eq('session_id', sessionId)
    .order('joined_at');

  if (error) {
    console.error('[api/student/participants] participant read failed:', error);
    return NextResponse.json({ error: 'Failed to load participants' }, { status: 500 });
  }

  return NextResponse.json({ participants: data ?? [] }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
