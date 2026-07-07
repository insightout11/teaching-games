import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { spotlightPrefKey } from '@/lib/spotlight';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Student session preferences.
// - score_visible lives in student_session_prefs (migration 022).
// - spotlight_named lives in session_private_state key 'spotlight-pref:<clientId>'
//   (no migration needed; the spotlight route reads it when a pick is sent).

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
  const [{ data, error }, { data: spotlightRow }] = await Promise.all([
    supabase
      .from('student_session_prefs')
      .select('score_visible')
      .eq('session_id', sessionId)
      .eq('client_id', clientId)
      .maybeSingle(),
    supabase
      .from('session_private_state')
      .select('payload')
      .eq('session_id', sessionId)
      .eq('key', spotlightPrefKey(clientId))
      .maybeSingle(),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    score_visible: data?.score_visible ?? true,
    spotlight_named: (spotlightRow?.payload as { named?: boolean } | null)?.named !== false,
  });
}

// PATCH /api/student/prefs
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as {
      sessionId: string;
      clientId: string;
      score_visible?: boolean;
      spotlight_named?: boolean;
    };
    const { sessionId, clientId, score_visible, spotlight_named } = body;

    const hasScorePref = typeof score_visible === 'boolean';
    const hasSpotlightPref = typeof spotlight_named === 'boolean';
    if (!sessionId || !clientId || (!hasScorePref && !hasSpotlightPref)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!UUID_REGEX.test(sessionId) || !UUID_REGEX.test(clientId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    const supabase = createServiceClient();

    if (hasScorePref) {
      const { error } = await supabase
        .from('student_session_prefs')
        .upsert(
          { session_id: sessionId, client_id: clientId, score_visible, updated_at: new Date().toISOString() },
          { onConflict: 'session_id,client_id' }
        );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (hasSpotlightPref) {
      const { error } = await supabase
        .from('session_private_state')
        .upsert(
          {
            session_id: sessionId,
            key: spotlightPrefKey(clientId),
            payload: { named: spotlight_named },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'session_id,key' }
        );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
