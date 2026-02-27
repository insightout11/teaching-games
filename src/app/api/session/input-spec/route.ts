import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// POST /api/session/input-spec
// Teacher calls this to broadcast an input spec to student devices.
// Uses service role so the write is guaranteed to reach the real DB —
// the same DB the student poll route reads from.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, spec } = body as { sessionId: string; spec: unknown };

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('sessions')
      .update({ input_spec: spec ?? null })
      .eq('id', sessionId)
      .select('id');

    if (error) {
      console.error('[input-spec POST] DB error:', error);
      return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[input-spec POST] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
