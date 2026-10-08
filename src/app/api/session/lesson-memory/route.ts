import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { sanitizeLessonMemory } from '@/lib/lesson-memory';

export const dynamic = 'force-dynamic';

// /api/session/lesson-memory: the lesson record (live memory step 1). Teacher-only table `session_memory`
// (migration 058). If the table isn't there yet, saves fail quietly: the lesson is never affected.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;
  const body = (await request.json().catch(() => null)) as { sessionId?: unknown; memory?: unknown } | null;
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
  if (!UUID_RE.test(sessionId)) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  const memory = sanitizeLessonMemory(body?.memory);
  if (!memory) return NextResponse.json({ error: 'Nothing to save' }, { status: 400 });
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') return NextResponse.json({ ok: true });
  const owned = await verifyTeacherOwnsSession(sessionId, teacher.id);
  if (owned.error) return owned.error;
  const { error: upErr } = await createServiceClient()
    .from('session_memory')
    .upsert({ session_id: sessionId, payload: memory, updated_at: new Date().toISOString() }, { onConflict: 'session_id' });
  if (upErr) {
    console.warn('[lesson-memory POST] not saved:', upErr.message);
    return NextResponse.json({ ok: false }, { status: 202 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;
  const sessionId = request.nextUrl.searchParams.get('sessionId') ?? '';
  if (!UUID_RE.test(sessionId)) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') return NextResponse.json({ memory: null });
  const owned = await verifyTeacherOwnsSession(sessionId, teacher.id);
  if (owned.error) return owned.error;
  const service = createServiceClient();

  // ?previous=1: the same class's most recent EARLIER lesson that has a record ("Last time", step 3).
  if (request.nextUrl.searchParams.get('previous') === '1') {
    const { data: current } = await service.from('sessions').select('class_id, started_at').eq('id', sessionId).maybeSingle();
    if (!current) return NextResponse.json({ memory: null });
    const { data: earlier } = await service
      .from('sessions')
      .select('id, started_at')
      .eq('class_id', current.class_id)
      .lt('started_at', current.started_at)
      .order('started_at', { ascending: false })
      .limit(10);
    const ids = ((earlier ?? []) as Array<{ id: string; started_at: string }>).map((e) => e.id);
    if (!ids.length) return NextResponse.json({ memory: null });
    const { data: rows } = await service.from('session_memory').select('session_id, payload').in('session_id', ids);
    const byId = new Map(((rows ?? []) as Array<{ session_id: string; payload: unknown }>).map((r) => [r.session_id, r.payload]));
    for (const e of (earlier ?? []) as Array<{ id: string; started_at: string }>) {
      const memory = sanitizeLessonMemory(byId.get(e.id) ?? null);
      if (memory) return NextResponse.json({ memory, at: e.started_at });
    }
    return NextResponse.json({ memory: null });
  }

  const { data } = await service.from('session_memory').select('payload').eq('session_id', sessionId).maybeSingle();
  return NextResponse.json({ memory: sanitizeLessonMemory(data?.payload ?? null) });
}
