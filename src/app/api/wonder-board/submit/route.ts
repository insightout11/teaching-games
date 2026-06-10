import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isSessionStale } from '@/lib/session-freshness';

// POST /api/wonder-board/submit
// Student question submission for Wonder Board.
// Creates a wonder_questions record directly — no moderation queue.

interface SubmitRequest {
  sessionId: string;
  clientId: string;
  displayName: string;
  starter: string;
  content: string;
  parentId?: string | null;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_STARTERS = ['Why', 'How', 'What', 'When', 'Where', 'Should', 'What if'];
const MAX_QUESTIONS_PER_STUDENT = 10;
const MAX_CONTENT_LENGTH = 200;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SubmitRequest;
    const { sessionId, clientId, displayName, starter, content, parentId } = body;

    // Validate required fields
    if (!sessionId || !clientId || !displayName || !starter || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate UUIDs
    if (!uuidRegex.test(sessionId) || !uuidRegex.test(clientId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    if (parentId && !uuidRegex.test(parentId)) {
      return NextResponse.json({ error: 'Invalid parentId format' }, { status: 400 });
    }

    // Validate starter — follow-ups use 'Follow-up' which isn't in the normal list
    if (!parentId && !VALID_STARTERS.includes(starter)) {
      return NextResponse.json({ error: 'Invalid starter word' }, { status: 400 });
    }

    // Validate content length
    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Question cannot be empty' }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Question must be ${MAX_CONTENT_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify session is active
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

    // If parentId provided, verify the parent question exists, belongs to session, is answered, and is top-level
    if (parentId) {
      const { data: parent, error: parentError } = await supabase
        .from('wonder_questions')
        .select('id, session_id, parent_id, answer_text')
        .eq('id', parentId)
        .eq('session_id', sessionId)
        .single();

      if (parentError || !parent) {
        return NextResponse.json({ error: 'Parent question not found' }, { status: 404 });
      }

      if (!parent.answer_text) {
        return NextResponse.json({ error: 'Can only follow up on answered questions' }, { status: 400 });
      }

      if (parent.parent_id) {
        return NextResponse.json({ error: 'Cannot follow up on a follow-up (max depth: 1)' }, { status: 400 });
      }
    }

    // Rate limit: max questions per student per session
    const { count } = await supabase
      .from('wonder_questions')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('client_id', clientId);

    if ((count ?? 0) >= MAX_QUESTIONS_PER_STUDENT) {
      return NextResponse.json(
        { error: 'Question limit reached for this session' },
        { status: 429 }
      );
    }

    // Insert the question
    const { data: question, error: insertError } = await supabase
      .from('wonder_questions')
      .insert({
        session_id: sessionId,
        client_id: clientId,
        display_name: displayName,
        starter: parentId ? 'Follow-up' : starter,
        content: content.trim(),
        parent_id: parentId ?? null,
      })
      .select()
      .single();

    if (insertError || !question) {
      console.error('Wonder Board submit error:', insertError);
      return NextResponse.json({ error: 'Failed to submit question' }, { status: 500 });
    }

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Wonder Board submit error:', error);
    return NextResponse.json({ error: 'Failed to submit question' }, { status: 500 });
  }
}
