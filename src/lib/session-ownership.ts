import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

interface VerifyOptions {
  requireActive?: boolean;
}

interface OwnedSession {
  id: string;
  class_id: string;
  status: string;
}

export async function verifyTeacherOwnsSession(
  sessionId: string,
  teacherId: string,
  options: VerifyOptions = {},
): Promise<{ session: OwnedSession; error: null } | { session: null; error: NextResponse }> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return { session: { id: sessionId, class_id: 'mock-class', status: 'active' }, error: null };
  }

  const service = createServiceClient();
  const { data: session } = await service
    .from('sessions')
    .select('id, class_id, status')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return { session: null, error: NextResponse.json({ error: 'Session not found' }, { status: 404 }) };
  }

  if (options.requireActive && session.status !== 'active') {
    return { session: null, error: NextResponse.json({ error: 'Session not active' }, { status: 400 }) };
  }

  const { data: cls } = await service
    .from('classes')
    .select('teacher_id')
    .eq('id', session.class_id)
    .single();

  if (!cls || cls.teacher_id !== teacherId) {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session, error: null };
}
