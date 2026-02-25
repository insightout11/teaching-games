import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/class-questions/vote
// Student upvote on a published class question.
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

    // 1. Validate required fields
    if (!sessionId || !questionId || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, questionId, clientId' },
        { status: 400 }
      );
    }

    // 2. Validate UUID format
    if (!uuidRegex.test(sessionId) || !uuidRegex.test(questionId) || !uuidRegex.test(clientId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 3. Verify question exists, belongs to session, and is published
    const { data: question, error: questionError } = await supabase
      .from('student_submissions')
      .select('id, session_id, published_to_class')
      .eq('id', questionId)
      .eq('session_id', sessionId)
      .eq('published_to_class', true)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found or not published' },
        { status: 404 }
      );
    }

    // 4. Verify session is still active
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // 5. Upsert vote — ignoreDuplicates makes conflicts a silent no-op
    const { error: insertError } = await supabase
      .from('question_votes')
      .upsert(
        { question_id: questionId, session_id: sessionId, client_id: clientId },
        { onConflict: 'question_id,client_id', ignoreDuplicates: true }
      );

    if (insertError) {
      console.error('Insert vote error:', insertError);
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
