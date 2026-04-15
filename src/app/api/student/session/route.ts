import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// GET /api/student/session?sessionId=xxx
// Public read-only endpoint for student controller
// Returns session status, active poll, input spec, frozen flag, and published questions

interface PublishedQuestion {
  id: string;
  content: string;
  publishedAt: string;
  voteCount: number;
}

interface VocabItem {
  word: string;
  definition: string;
}

interface ExpressionItem {
  phrase: string;
  example: string;
}

interface SessionPayload {
  isActive: boolean;
  activePoll: { pollId: string; question: string; options: string[]; metadata?: Record<string, unknown> | null } | null;
  inputSpec: unknown;
  frozen: boolean;
  publishedQuestions: PublishedQuestion[] | null;
  personalMission: string | null;
  topic: string;
  difficulty: string;
  grammarTarget: string | null;
  referenceVocab: VocabItem[] | null;
  referenceExpressions: ExpressionItem[] | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const clientId = searchParams.get('clientId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check if session exists and is active, including input_spec and frozen flag
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status, input_spec, frozen, topic, difficulty, custom_topic, grammar_target, reference_vocab, reference_expressions')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const isActive = session.status === 'active';

    // Get active poll if any
    let activePoll: SessionPayload['activePoll'] = null;
    if (isActive) {
      const { data: poll } = await supabase
        .from('polls')
        .select('id, question, options, metadata')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (poll) {
        activePoll = {
          pollId: poll.id,
          question: poll.question,
          options: poll.options as string[],
          metadata: poll.metadata as Record<string, unknown> | null,
        };
      }
    }

    // Get published questions with vote counts
    let publishedQuestions: PublishedQuestion[] | null = null;
    if (isActive) {
      const { data: questions } = await supabase
        .from('student_submissions')
        .select(`
          id,
          content,
          published_at,
          question_votes(count)
        `)
        .eq('session_id', sessionId)
        .eq('published_to_class', true);

      if (questions && questions.length > 0) {
        publishedQuestions = (questions as Array<{
          id: string;
          content: string;
          published_at: string;
          question_votes: { count: number }[];
        }>)
          .map((q) => ({
            id: q.id,
            content: q.content,
            publishedAt: q.published_at,
            voteCount: q.question_votes?.[0]?.count ?? 0,
          }))
          .sort(
            (a, b) =>
              b.voteCount - a.voteCount ||
              b.publishedAt.localeCompare(a.publishedAt)
          );
      }
    }

    // Get personal mission for this student if clientId provided
    let personalMission: string | null = null;
    if (isActive && clientId) {
      const { data: missionRow } = await supabase
        .from('session_missions')
        .select('mission_text')
        .eq('session_id', sessionId)
        .eq('client_id', clientId)
        .maybeSingle();
      personalMission = missionRow?.mission_text ?? null;
    }

    const payload: SessionPayload = {
      isActive,
      activePoll,
      inputSpec: session.input_spec || null,
      frozen: session.frozen ?? false,
      publishedQuestions,
      personalMission,
      topic: (session.custom_topic as string | null) || (session.topic as string) || 'General',
      difficulty: (session.difficulty as string) || 'Intermediate',
      grammarTarget: (session.grammar_target as string | null) ?? null,
      referenceVocab: (session.reference_vocab as VocabItem[] | null) ?? null,
      referenceExpressions: (session.reference_expressions as ExpressionItem[] | null) ?? null,
    };

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('Session info error:', error);
    return NextResponse.json({ error: 'Failed to get session info' }, { status: 500 });
  }
}
