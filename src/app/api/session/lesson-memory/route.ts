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
  const { data } = await createServiceClient().from('session_memory').select('payload').eq('session_id', sessionId).maybeSingle();
  return NextResponse.json({ memory: sanitizeLessonMemory(data?.payload ?? null) });
}
