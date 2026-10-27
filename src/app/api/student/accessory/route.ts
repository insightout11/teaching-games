import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isSessionStale } from '@/lib/session-freshness';
import { parseAccessory } from '@/lib/accessories';

export const dynamic = 'force-dynamic';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/student/accessory { sessionId, clientId, pollId, accessory }: a student picks one of the accessories the
// room offered (the market pick poll) and wears it from now on. Only students on the class list can keep one.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { sessionId?: unknown; clientId?: unknown; pollId?: unknown; accessory?: unknown } | null;
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
  const clientId = typeof body?.clientId === 'string' ? body.clientId : '';
  const pollId = typeof body?.pollId === 'string' ? body.pollId : '';
  const accessory = parseAccessory(body?.accessory);
  if (!uuid.test(sessionId) || !uuid.test(clientId) || !uuid.test(pollId) || !accessory) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const service = createServiceClient();
  const { data: session } = await service.from('sessions').select('class_id, status, started_at').eq('id', sessionId).maybeSingle();
  if (!session || session.status !== 'active' || isSessionStale(session.started_at)) return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
  // the accessory must be one the room actually offered in this session
  const { data: poll } = await service.from('polls').select('session_id, is_active, metadata').eq('id', pollId).maybeSingle();
  const offered = ((poll?.metadata as { accessories?: unknown[] } | null)?.accessories ?? []).map(parseAccessory).filter(Boolean);
  if (!poll || poll.session_id !== sessionId || !poll.is_active || !offered.some((a) => a!.id === accessory.id)) return NextResponse.json({ error: 'Not on offer' }, { status: 400 });
  const { data: me } = await service.from('session_participants').select('student_id').eq('session_id', sessionId).eq('client_id', clientId).maybeSingle();
  const studentId = (me as { student_id?: string | null } | null)?.student_id;
  if (!studentId) return NextResponse.json({ error: 'not_on_class_list' }, { status: 403 });
  const chosen = offered.find((a) => a!.id === accessory.id)!;
  await service.from('student_accessories').update({ worn: false }).eq('student_id', studentId).eq('worn', true);
  const { error } = await service.from('student_accessories').upsert(
    { class_id: session.class_id, student_id: studentId, accessory_id: chosen.id, accessory: chosen, session_id: sessionId, worn: true },
    { onConflict: 'student_id,accessory_id' },
  );
  if (error) return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  return NextResponse.json({ accessory: chosen });
}
