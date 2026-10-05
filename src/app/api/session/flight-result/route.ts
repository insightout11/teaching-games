import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { FLIGHT_BEFORE_KEY, FLIGHT_RESULT_KEY, sanitizeFlightResult } from '@/lib/flight-result';

export const dynamic = 'force-dynamic';

// /api/session/flight-result
// POST: a flight's landing saves its class-level before → after ('flight-result'), or a takeoff
// saves its "before" ('flight-before') so a mid-lesson refresh can't lose it. GET reads one back.
// Stored in session_private_state (no migration). Class counts only, never names.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEYS = new Set([FLIGHT_RESULT_KEY, FLIGHT_BEFORE_KEY]);
const MAX_BEFORE_BYTES = 20000;

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json() as { sessionId?: unknown; key?: unknown; result?: unknown };
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
    const key = typeof body.key === 'string' ? body.key : FLIGHT_RESULT_KEY;
    if (!sessionId || !UUID_RE.test(sessionId)) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    if (!KEYS.has(key)) return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') return NextResponse.json({ ok: true });

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id);
    if (ownership.error) return ownership.error;

    let payload: unknown;
    if (key === FLIGHT_RESULT_KEY) {
      payload = sanitizeFlightResult(body.result);
      if (!payload) return NextResponse.json({ error: 'Invalid result' }, { status: 400 });
    } else {
      // The takeoff "before": a small JSON object of class-level answers, kept as-is but bounded.
      if (!body.result || typeof body.result !== 'object' || JSON.stringify(body.result).length > MAX_BEFORE_BYTES) {
        return NextResponse.json({ error: 'Invalid before' }, { status: 400 });
      }
      payload = body.result;
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('session_private_state')
      .upsert({ session_id: sessionId, key, payload, updated_at: new Date().toISOString() }, { onConflict: 'session_id,key' });
    if (error) {
      console.error('[flight-result POST] upsert error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[flight-result POST] error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;
    const sessionId = request.nextUrl.searchParams.get('sessionId') ?? '';
    const key = request.nextUrl.searchParams.get('key') ?? FLIGHT_RESULT_KEY;
    if (!UUID_RE.test(sessionId) || !KEYS.has(key)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') return NextResponse.json({ payload: null });

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id);
    if (ownership.error) return ownership.error;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('session_private_state')
      .select('payload')
      .eq('session_id', sessionId)
      .eq('key', key)
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'Failed to read' }, { status: 500 });
    return NextResponse.json({ payload: data?.payload ?? null });
  } catch (err) {
    console.error('[flight-result GET] error:', err);
    return NextResponse.json({ error: 'Failed to read' }, { status: 500 });
  }
}
