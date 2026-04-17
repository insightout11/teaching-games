import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/student/prefs?sessionId=X&clientId=Y
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const clientId = searchParams.get('clientId');

  if (!sessionId || !clientId) {
    return NextResponse.json({ error: 'Missing sessionId or clientId' }, { status: 400 });
  }
  if (!UUID_REGEX.test(sessionId) || !UUID_REGEX.test(clientId)) {
    return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('student_session_prefs')
    .select('score_visible, scoring_mode')
    .eq('session_id', sessionId)
    .eq('client_id', clientId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ score_visible: data?.score_visible ?? true, scoring_mode: data?.scoring_mode ?? null });
}

// PATCH /api/student/prefs
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as { sessionId: string; clientId: string; score_visible: boolean; scoring_mode?: string | null };
    const { sessionId, clientId, score_visible, scoring_mode } = body;

    if (!sessionId || !clientId || typeof score_visible !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!UUID_REGEX.test(sessionId) || !UUID_REGEX.test(clientId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }
    if (scoring_mode !== undefined && scoring_mode !== null && !['competitive', 'participation'].includes(scoring_mode)) {
      return NextResponse.json({ error: 'Invalid scoring_mode value' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('student_session_prefs')
      .upsert(
        { session_id: sessionId, client_id: clientId, score_visible, scoring_mode: scoring_mode ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'session_id,client_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, prefs: data });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
