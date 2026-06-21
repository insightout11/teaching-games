import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isSessionStale } from '@/lib/session-freshness';

export const dynamic = 'force-dynamic';

interface VoteRequest {
  sessionId: string;
  itemId: string;
  clientId: string;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VoteRequest;
    const { sessionId, itemId, clientId } = body;

    if (!sessionId || !itemId || !clientId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!uuidRegex.test(sessionId) || !uuidRegex.test(itemId) || !uuidRegex.test(clientId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: item, error: itemError } = await supabase
      .from('class_board_items')
      .select('id, session_id, visibility')
      .eq('id', itemId)
      .eq('session_id', sessionId)
      .eq('visibility', 'visible')
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Board item not found or not visible' }, { status: 404 });
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('status, started_at')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.status !== 'active' || isSessionStale(session.started_at)) {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    const { data: participant } = await supabase
      .from('session_participants')
      .select('client_id')
      .eq('session_id', sessionId)
      .eq('client_id', clientId)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: 'Join the session first' }, { status: 403 });
    }

    const { error: insertError } = await supabase
      .from('class_board_votes')
      .upsert(
        { item_id: itemId, session_id: sessionId, client_id: clientId },
        { onConflict: 'item_id,client_id', ignoreDuplicates: true }
      );

    if (insertError) {
      console.error('Class Board vote error:', insertError);
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Class Board vote route error:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}
