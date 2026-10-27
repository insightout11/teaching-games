import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getDestinationById } from '@/data/world-flight/destinations';
import { postcardPrompts } from '@/lib/world-flight/souvenirs';

export const dynamic = 'force-dynamic';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Postcards can be sent for three days after the lesson started (homework, not forever). */
const OPEN_MS = 3 * 24 * 3600_000;

type Ctx = { classId: string; destinationId: string; city: string; studentId: string | null; name: string };

async function context(sessionId: string, clientId: string): Promise<Ctx | { error: string; status: number }> {
  const service = createServiceClient();
  const [{ data: session }, { data: leg }, { data: me }] = await Promise.all([
    service.from('sessions').select('class_id, started_at').eq('id', sessionId).maybeSingle(),
    service.from('class_world_flight_legs').select('destination_id').eq('session_id', sessionId).maybeSingle(),
    service.from('session_participants').select('student_id, display_name').eq('session_id', sessionId).eq('client_id', clientId).maybeSingle(),
  ]);
  const s = session as { class_id: string; started_at: string } | null;
  if (!s) return { error: 'Session not found', status: 404 };
  if (Date.now() - new Date(s.started_at).getTime() > OPEN_MS) return { error: 'closed', status: 400 };
  const p = me as { student_id: string | null; display_name: string } | null;
  if (!p) return { error: 'Not in this class', status: 403 };
  const destinationId = (leg as { destination_id?: string } | null)?.destination_id ?? '';
  const city = getDestinationById(destinationId)?.city;
  if (!city) return { error: 'no_city', status: 400 };
  return { classId: s.class_id, destinationId, city, studentId: p.student_id, name: p.display_name.slice(0, 60) };
}

// GET /api/student/postcard?sessionId&clientId: the city, prompts, whether this phone already sent one, and the
// student's postcard stamps (all lessons).
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId') ?? '';
  const clientId = request.nextUrl.searchParams.get('clientId') ?? '';
  if (!uuid.test(sessionId) || !uuid.test(clientId)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const ctx = await context(sessionId, clientId);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const service = createServiceClient();
  const [{ data: mine }, { data: stamps }] = await Promise.all([
    service.from('student_postcards').select('message').eq('session_id', sessionId).eq('client_id', clientId).maybeSingle(),
    ctx.studentId
      ? service.from('student_postcards').select('destination_id, created_at').eq('student_id', ctx.studentId).order('created_at', { ascending: true }).limit(60)
      : service.from('student_postcards').select('destination_id, created_at').eq('client_id', clientId).order('created_at', { ascending: true }).limit(60),
  ]);
  return NextResponse.json({
    city: ctx.city,
    prompts: postcardPrompts(ctx.destinationId),
    sent: (mine as { message?: string } | null)?.message ?? null,
    stamps: ((stamps ?? []) as Array<{ destination_id: string; created_at: string }>).map((r) => ({ city: getDestinationById(r.destination_id)?.city ?? r.destination_id, at: r.created_at })),
  });
}

// POST /api/student/postcard { sessionId, clientId, message }: send the postcard (one per phone per lesson).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { sessionId?: unknown; clientId?: unknown; message?: unknown } | null;
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
  const clientId = typeof body?.clientId === 'string' ? body.clientId : '';
  const message = typeof body?.message === 'string' ? body.message.replace(/\s+/g, ' ').trim().slice(0, 600) : '';
  if (!uuid.test(sessionId) || !uuid.test(clientId)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  if (message.length < 3) return NextResponse.json({ error: 'Write your postcard first' }, { status: 400 });
  const ctx = await context(sessionId, clientId);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const { error } = await createServiceClient().from('student_postcards').upsert(
    { class_id: ctx.classId, session_id: sessionId, student_id: ctx.studentId, client_id: clientId, name: ctx.name, destination_id: ctx.destinationId, message },
    { onConflict: 'session_id,client_id' },
  );
  if (error) return NextResponse.json({ error: 'Could not send yet' }, { status: 503 });
  return NextResponse.json({ ok: true, city: ctx.city });
}
