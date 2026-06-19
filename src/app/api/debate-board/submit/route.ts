import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isSessionStale } from '@/lib/session-freshness';

// POST /api/debate-board/submit
// Student adds a point to their team's prep board. No moderation queue —
// inserts a debate_points record directly (mirrors Wonder Board).

interface SubmitRequest {
  sessionId: string;
  clientId: string;
  displayName: string;
  side: string;        // 'for' | 'against'
  content: string;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_POINTS_PER_STUDENT = 20;
const MAX_CONTENT_LENGTH = 200;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SubmitRequest;
    const { sessionId, clientId, displayName, side, content } = body;

    if (!sessionId || !clientId || !displayName || !side || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!uuidRegex.test(sessionId) || !uuidRegex.test(clientId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }
    if (side !== 'for' && side !== 'against') {
      return NextResponse.json({ error: 'Side must be "for" or "against"' }, { status: 400 });
    }
    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Point cannot be empty' }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `Point must be ${MAX_CONTENT_LENGTH} characters or fewer` }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status, started_at')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.status !== 'active' || isSessionStale(session.started_at)) {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // Rate limit: cap points per student per session
    const { count } = await supabase
      .from('debate_points')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('client_id', clientId);

    if ((count ?? 0) >= MAX_POINTS_PER_STUDENT) {
      return NextResponse.json({ error: 'Point limit reached for this session' }, { status: 429 });
    }

    const { data: point, error: insertError } = await supabase
      .from('debate_points')
      .insert({
        session_id: sessionId,
        client_id: clientId,
        display_name: displayName,
        side,
        content: content.trim(),
      })
      .select()
      .single();

    if (insertError || !point) {
      console.error('Debate board submit error:', insertError);
      return NextResponse.json({ error: 'Failed to submit point' }, { status: 500 });
    }

    return NextResponse.json({ success: true, point });
  } catch (error) {
    console.error('Debate board submit error:', error);
    return NextResponse.json({ error: 'Failed to submit point' }, { status: 500 });
  }
}
