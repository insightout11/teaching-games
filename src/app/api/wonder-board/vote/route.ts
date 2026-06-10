import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isSessionStale } from '@/lib/session-freshness';

// POST /api/wonder-board/vote
// Student upvote on a wonder board question.
// Uses ON CONFLICT DO NOTHING — duplicate votes are silent no-ops.

interface VoteRequest {
  sessionId: string;
  questionId: string;
  clientId: string;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VoteRequest;
    const { sessionId, questionId, clientId } = body;

    if (!sessionId || !questionId || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, questionId, clientId' },
        { status: 400 }
      );
    }

    if (!uuidRegex.test(sessionId) || !uuidRegex.test(questionId) || !uuidRegex.test(clientId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify question exists and belongs to this session
    const { data: question, error: questionError } = await supabase
      .from('wonder_questions')
      .select('id, session_id')
      .eq('id', questionId)
      .eq('session_id', sessionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Verify session is active
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

    // Verify the voter actually joined this session (anti-inflation).
    // Without this, anyone can vote repeatedly with fresh client-minted UUIDs.
    const { data: participant } = await supabase
      .from('session_participants')
      .select('client_id')
      .eq('session_id', sessionId)
      .eq('client_id', clientId)
      .maybeSingle();
    if (!participant) {
      return NextResponse.json({ error: 'Join the session first' }, { status: 403 });
    }

    // Upsert vote — conflicts are silent no-ops
    const { error: insertError } = await supabase
      .from('wonder_votes')
      .upsert(
        { question_id: questionId, session_id: sessionId, client_id: clientId },
        { onConflict: 'question_id,client_id', ignoreDuplicates: true }
      );

    if (insertError) {
      console.error('Wonder Board vote error:', insertError);
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wonder Board vote error:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
