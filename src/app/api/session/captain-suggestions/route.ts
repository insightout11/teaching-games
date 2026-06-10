import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import {
  buildCaptainSuggestionsPrompt,
  buildFallbackCaptainSuggestions,
  captainSuggestionsSchema,
  sanitizeCaptainSuggestions,
  type CaptainSuggestionSourceSubmission,
  type CaptainSuggestionsAIResponse,
} from '@/lib/captain-suggestions';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function getInputPrompt(inputSpec: unknown): string | null {
  if (!inputSpec || typeof inputSpec !== 'object') return null;
  const prompt = (inputSpec as { prompt?: unknown }).prompt;
  return cleanText(prompt, 180) || null;
}

function fallbackResponse(topic = 'General', difficulty = 'Intermediate') {
  return NextResponse.json({
    suggestions: buildFallbackCaptainSuggestions({ topic, difficulty, submissions: [] }),
    source: 'fallback',
    generatedAt: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json() as { sessionId?: unknown };
    const sessionId = cleanText(body.sessionId, 80);

    if (!sessionId || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      return fallbackResponse();
    }

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
    if (ownership.error) return ownership.error;

    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    const supabase = createServiceClient();
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, topic, difficulty, custom_topic, input_spec')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('[captain-suggestions POST] session read error:', sessionError);
      return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const topic = cleanText(session.custom_topic, 100) || cleanText(session.topic, 100) || 'General';
    const difficulty = cleanText(session.difficulty, 40) || 'Intermediate';
    const currentPrompt = getInputPrompt(session.input_spec);

    const { data: rows, error: submissionsError } = await supabase
      .from('student_submissions')
      .select('id, display_name, content, status, game_key, created_at')
      .eq('session_id', sessionId)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(24);

    if (submissionsError) {
      console.error('[captain-suggestions POST] submissions read error:', submissionsError);
      return NextResponse.json({ error: 'Failed to load submissions' }, { status: 500 });
    }

    const submissions: CaptainSuggestionSourceSubmission[] = (rows ?? [])
      .map((row) => ({
        id: cleanText(row.id, 80),
        displayName: cleanText(row.display_name, 50) || 'Student',
        content: cleanText(row.content, 500),
        status: cleanText(row.status, 24) || null,
        gameKey: cleanText(row.game_key, 80) || null,
        createdAt: cleanText(row.created_at, 40) || null,
      }))
      .filter((row) => row.id && row.content.length >= 4);

    const fallback = buildFallbackCaptainSuggestions({ topic, difficulty, currentPrompt, submissions });

    if (submissions.length === 0) {
      return NextResponse.json({
        suggestions: fallback,
        source: 'fallback',
        generatedAt: new Date().toISOString(),
      });
    }

    try {
      const prompt = buildCaptainSuggestionsPrompt({ topic, difficulty, currentPrompt, submissions });
      const generated = await generateJSON<CaptainSuggestionsAIResponse>(prompt, captainSuggestionsSchema, {
        taskClass: 'activity-facilitation',
        temperature: 0.4,
        _route: 'session/captain-suggestions',
      });
      const suggestions = sanitizeCaptainSuggestions(generated.suggestions, submissions, fallback);

      return NextResponse.json({
        suggestions,
        source: 'ai',
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[captain-suggestions POST] generation fallback:', error);
      return NextResponse.json({
        suggestions: fallback,
        source: 'fallback',
        generatedAt: new Date().toISOString(),
        warning: 'AI suggestions unavailable',
      });
    }
  } catch (error) {
    console.error('[captain-suggestions POST] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
