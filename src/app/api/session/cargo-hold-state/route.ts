import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cargo Hold's authoritative round state, for recovery after a teacher refresh.
 *
 * Stored in `cargo_hold_state` (migration 056) rather than `session_private_state`:
 * that table grants anonymous SELECT to every row, and this payload contains who
 * played which card before the anonymous reveal. `cargo_hold_state` has no RLS policy
 * at all, so only the service role behind this teacher-authenticated route can read it.
 */
const TABLE = 'cargo_hold_state';
const SAVE_RPC = 'cargo_hold_state_save';

/** Guards against a runaway payload; a 12-player game is well under this. */
const MAX_PAYLOAD_BYTES = 256_000;

export async function GET(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const sessionId = request.nextUrl.searchParams.get('sessionId') ?? '';
  if (!UUID_RE.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ state: null, sequence: 0 });
  }

  const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
  if (ownership.error) return ownership.error;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('payload, sequence')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) {
    // Before migration 056 is applied the table does not exist. Recovery is simply
    // unavailable; the live round must not be taken down by it.
    console.error('[cargo-hold-state GET] query failed:', error.message);
    return NextResponse.json({ state: null, sequence: 0, unavailable: true });
  }

  return NextResponse.json({ state: data?.payload ?? null, sequence: data?.sequence ?? 0 });
}

export async function PUT(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  let body: { sessionId?: string; state?: unknown; sequence?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const sessionId = body.sessionId ?? '';
  if (!UUID_RE.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  const sequence = Number.isFinite(body.sequence) ? Math.floor(body.sequence as number) : 0;

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ success: true, applied: true, sequence });
  }

  const serialized = JSON.stringify(body.state ?? null);
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'State too large' }, { status: 413 });
  }

  const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
  if (ownership.error) return ownership.error;

  const supabase = createServiceClient();

  // Compare-and-set happens inside the statement (migration 056). Reading the sequence
  // here and comparing it in JS would let two saves both read the same value, and the
  // older payload could commit last â€” exactly the rollback this guards against.
  const { data, error } = await supabase.rpc(SAVE_RPC, {
    p_session_id: sessionId,
    p_sequence: sequence,
    p_payload: body.state ?? null,
  });

  if (error) {
    // Until migration 056 is applied the function does not exist. Recovery is
    // unavailable; the live round must not be taken down by it.
    console.error('[cargo-hold-state PUT] save failed:', error.message);
    return NextResponse.json({ success: false, unavailable: true });
  }

  const result = (Array.isArray(data) ? data[0] : data) as
    | { applied?: boolean; current_sequence?: number }
    | null;
  const applied = result?.applied === true;

  return NextResponse.json({
    success: true,
    applied,
    ...(applied ? {} : { stale: true }),
    sequence: result?.current_sequence ?? sequence,
  });
}
