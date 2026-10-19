import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The teacher casts a vote for a student without a device (tap their seat, then the choice).
 * Counts exactly like a phone vote: one vote per student per poll, keyed by the student's id.
 */
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null) as { pollId?: unknown; studentId?: unknown; choice?: unknown } | null;
  const pollId = typeof body?.pollId === 'string' ? body.pollId : '';
  const studentId = typeof body?.studentId === 'string' ? body.studentId : '';
  const choice = typeof body?.choice === 'string' ? body.choice.trim().slice(0, 200) : '';
  if (!uuid.test(pollId) || !uuid.test(studentId) || !choice || !uuid.test(params.sessionId)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  const service = createServiceClient();
  const { data: poll } = await service.from('polls').select('id, options, is_active').eq('id', pollId).eq('session_id', params.sessionId).maybeSingle();
  if (!poll || !poll.is_active) return NextResponse.json({ error: 'Vote is closed' }, { status: 400 });
  if (!(poll.options as string[]).includes(choice)) return NextResponse.json({ error: 'Invalid choice' }, { status: 400 });

  const { data: session } = await service.from('sessions').select('class_id').eq('id', params.sessionId).maybeSingle();
  const { data: student } = await service.from('students').select('id, name').eq('id', studentId).eq('class_id', session?.class_id ?? '').maybeSingle();
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const { error } = await service.from('poll_votes').upsert(
    { poll_id: pollId, session_id: params.sessionId, client_id: student.id, display_name: student.name, choice },
    { onConflict: 'poll_id,client_id' },
  );
  if (error) return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  return NextResponse.json({ success: true });
}
