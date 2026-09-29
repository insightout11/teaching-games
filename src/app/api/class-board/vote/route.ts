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
const DOTS_PER_BOARD = 3;

type Service = ReturnType<typeof createServiceClient>;

/** How many dots this student has placed on the item's board (and whether one is on this item). */
async function dotsUsed(supabase: Service, sessionId: string, itemId: string, clientId: string) {
  const { data: item } = await supabase.from('class_board_items').select('board_key').eq('id', itemId).eq('session_id', sessionId).maybeSingle();
  const { data: boardItems } = await supabase
    .from('class_board_items')
    .select('id')
    .eq('session_id', sessionId)
    .eq('board_key', item?.board_key ?? '');
  const ids = (boardItems ?? []).map((r) => r.id as string);
  if (!ids.length) return { count: 0, onThisItem: false };
  const { data: votes } = await supabase
    .from('class_board_votes')
    .select('item_id')
    .eq('session_id', sessionId)
    .eq('client_id', clientId)
    .in('item_id', ids);
  const list = (votes ?? []).map((v) => v.item_id as string);
  return { count: list.length, onThisItem: list.includes(itemId) };
}

/** Take a dot back (so students can move it to a better idea). */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as VoteRequest;
    const { sessionId, itemId, clientId } = body;
    if (!sessionId || !itemId || !clientId || !uuidRegex.test(sessionId) || !uuidRegex.test(itemId) || !uuidRegex.test(clientId)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('class_board_votes')
      .delete()
      .eq('session_id', sessionId)
      .eq('item_id', itemId)
      .eq('client_id', clientId);
    if (error) return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
    const used = await dotsUsed(supabase, sessionId, itemId, clientId);
    return NextResponse.json({ success: true, dotsLeft: Math.max(0, DOTS_PER_BOARD - used.count) });
  } catch {
    return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
  }
}

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

    // Dot voting: each student has DOTS_PER_BOARD dots per board.
    const used = await dotsUsed(supabase, sessionId, itemId, clientId);
    if (used.onThisItem) return NextResponse.json({ success: true, dotsLeft: Math.max(0, DOTS_PER_BOARD - used.count) });
    if (used.count >= DOTS_PER_BOARD) {
      return NextResponse.json({ error: 'No dots left', dotsLeft: 0 }, { status: 409 });
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

    return NextResponse.json({ success: true, dotsLeft: DOTS_PER_BOARD - used.count - 1 });
  } catch (error) {
    console.error('Class Board vote route error:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}
