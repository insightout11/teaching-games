import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { parseMascotLook } from '@/lib/mascot';

export const dynamic = 'force-dynamic';

type Row = { id: string; name: string; look: unknown; session_id: string | null; created_at: string };
const shape = (r: Row) => ({ id: r.id, name: r.name, look: parseMascotLook(r.look), sessionId: r.session_id });

// The class's mascots (its collection) and the one flying this session. Empty before migration 070.
export async function GET(_request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;
  const { data } = await createServiceClient().from('class_mascots').select('id, name, look, session_id, created_at')
    .eq('class_id', owned.session.class_id).order('created_at', { ascending: false }).limit(30);
  const mascots = ((data ?? []) as Row[]).map(shape).filter((m) => m.look);
  return NextResponse.json({ mascots, current: mascots.find((m) => m.sessionId === params.sessionId) ?? null });
}

// Board a mascot for this flight: a new one ({ name, look }) or one from the collection ({ id }). One per flight.
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null) as { id?: unknown; name?: unknown; look?: unknown } | null;
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;
  const service = createServiceClient();
  const classId = owned.session.class_id;
  // only one mascot flies per session: whichever was flying steps off
  await service.from('class_mascots').update({ session_id: null }).eq('class_id', classId).eq('session_id', params.sessionId);
  if (typeof body?.id === 'string') {
    const { data, error: e } = await service.from('class_mascots').update({ session_id: params.sessionId }).eq('id', body.id).eq('class_id', classId).select('id, name, look, session_id, created_at').single();
    if (e || !data) return NextResponse.json({ error: 'Mascot not found' }, { status: 404 });
    return NextResponse.json({ mascot: shape(data as Row) });
  }
  const look = parseMascotLook(body?.look);
  const name = typeof body?.name === 'string' ? body.name.replace(/\s+/g, ' ').trim().slice(0, 40) : '';
  if (!look || !name) return NextResponse.json({ error: 'Invalid mascot' }, { status: 400 });
  const { data, error: e } = await service.from('class_mascots').insert({ class_id: classId, name, look, session_id: params.sessionId }).select('id, name, look, session_id, created_at').single();
  if (e || !data) return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  return NextResponse.json({ mascot: shape(data as Row) });
}
