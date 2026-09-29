import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isSessionStale } from '@/lib/session-freshness';

export const dynamic = 'force-dynamic';

/**
 * POST /api/student/poll-reason
 * A student's reason for their poll answer ("Mumbai, because…"). Stored as a
 * student_submissions row tagged `poll-reason:<pollId>` (status answered, so it
 * never enters the Messages or approval queues). One reason per student per
 * poll: a new one replaces the old, so students can change their mind.
 */
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REASON = 200;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { pollId?: string; sessionId?: string; clientId?: string; displayName?: string; choice?: string; reason?: string } | null;
  const pollId = body?.pollId ?? '';
  const sessionId = body?.sessionId ?? '';
  const clientId = body?.clientId ?? '';
  const name = (body?.displayName ?? '').trim().slice(0, 40);
  const choice = (body?.choice ?? '').trim();
  const reason = (body?.reason ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_REASON);
  if (!uuid.test(pollId) || !uuid.test(sessionId) || !uuid.test(clientId) || !name || !choice || !reason) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: poll } = await supabase.from('polls').select('id, session_id, options, is_active').eq('id', pollId).maybeSingle();
  if (!poll || poll.session_id !== sessionId || !poll.is_active) return NextResponse.json({ error: 'Poll is not active' }, { status: 400 });
  if (!(poll.options as string[]).includes(choice)) return NextResponse.json({ error: 'Invalid choice' }, { status: 400 });

  const { data: session } = await supabase.from('sessions').select('status, started_at').eq('id', sessionId).maybeSingle();
  if (!session || session.status !== 'active' || isSessionStale(session.started_at)) {
    return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
  }
  const { data: participant } = await supabase.from('session_participants').select('client_id').eq('session_id', sessionId).eq('client_id', clientId).maybeSingle();
  if (!participant) return NextResponse.json({ error: 'Join the session first' }, { status: 403 });

  const key = `poll-reason:${pollId}`;
  await supabase.from('student_submissions').delete().eq('session_id', sessionId).eq('client_id', clientId).eq('game_key', key);
  const { error } = await supabase.from('student_submissions').insert({
    session_id: sessionId,
    client_id: clientId,
    display_name: name,
    submission_type: 'text',
    content: JSON.stringify({ choice, reason }),
    status: 'answered',
    game_key: key,
  });
  if (error) return NextResponse.json({ error: 'Failed to save reason' }, { status: 500 });
  return NextResponse.json({ success: true });
}
