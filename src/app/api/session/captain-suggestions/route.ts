import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import {
  buildCaptainSuggestionsPrompt,
  buildFallbackCaptainSuggestions,
  captainSuggestionsSchema,
  sanitizeCaptainSuggestions,
  type CaptainSuggestionPollResult,
  type CaptainSuggestionScoreSignal,
  type CaptainSuggestionSourceSubmission,
  type CaptainSuggestionsAIResponse,
} from '@/lib/captain-suggestions';
import { getStageLabelForKey } from '@/lib/stage-labels';
import { normalizeReferenceVocab } from '@/lib/reference-materials';
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

function getInputGameKey(inputSpec: unknown): string | null {
  if (!inputSpec || typeof inputSpec !== 'object') return null;
  const gameKey = (inputSpec as { gameKey?: unknown }).gameKey;
  return cleanText(gameKey, 80) || null;
}

interface LessonBriefPayload {
  goal?: string;
  stages?: Array<{ key: string; label: string }>;
  sourceTitle?: string;
  sourceSummary?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json() as { sessionId?: unknown; auto?: unknown };
    const sessionId = cleanText(body.sessionId, 80);
    const isAuto = body.auto === true;

    if (!sessionId || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      return NextResponse.json({
        suggestions: buildFallbackCaptainSuggestions({ topic: '', difficulty: 'Intermediate', submissions: [] }),
        source: 'fallback',
        generatedAt: new Date().toISOString(),
      });
    }

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
    if (ownership.error) return ownership.error;

    const supabase = createServiceClient();

    // Auto-generated standby packs are a Pro feature; the manual tap stays free.
    if (isAuto) {
      const { data: tierRows } = await supabase.rpc('get_teacher_credits', { teacher_id: teacher.id });
      const tier = tierRows?.[0] as { is_pro?: boolean; is_developer?: boolean } | undefined;
      if (!tier?.is_pro && !tier?.is_developer) {
        return NextResponse.json(
          { error: 'Auto suggestions require Pro.', code: 'PRO_REQUIRED' },
          { status: 403 },
        );
      }
    }

    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, class_id, topic, difficulty, custom_topic, input_spec, grammar_target, reference_vocab')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('[captain-suggestions POST] session read error:', sessionError);
      return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // No 'General' placeholder here — an empty topic tells the prompt builder
    // to make the model infer the topic from the student writing instead.
    const topic = cleanText(session.custom_topic, 100) || cleanText(session.topic, 100);
    const difficulty = cleanText(session.difficulty, 40) || 'Intermediate';
    const currentPrompt = getInputPrompt(session.input_spec);
    const currentGameKey = getInputGameKey(session.input_spec);

    // Gather live lesson telemetry in parallel. Each source degrades to empty
    // on error — suggestions must never fail because one signal is missing.
    const [submissionsRes, briefRes, scoresRes, rosterRes, pollRes] = await Promise.all([
      supabase
        .from('student_submissions')
        .select('id, display_name, content, status, game_key, created_at')
        .eq('session_id', sessionId)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(24),
      supabase
        .from('session_private_state')
        .select('payload')
        .eq('session_id', sessionId)
        .eq('key', 'lesson-brief')
        .maybeSingle(),
      supabase
        .from('scores')
        .select('display_name, outcome, accuracy_status')
        .eq('session_id', sessionId)
        .eq('counts_for_leaderboard', true)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('students')
        .select('name')
        .eq('class_id', session.class_id)
        .limit(40),
      supabase
        .from('polls')
        .select('id, question, options')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (submissionsRes.error) {
      console.error('[captain-suggestions POST] submissions read error:', submissionsRes.error);
      return NextResponse.json({ error: 'Failed to load submissions' }, { status: 500 });
    }

    const submissions: CaptainSuggestionSourceSubmission[] = (submissionsRes.data ?? [])
      .map((row) => ({
        id: cleanText(row.id, 80),
        displayName: cleanText(row.display_name, 50) || 'Student',
        content: cleanText(row.content, 500),
        status: cleanText(row.status, 24) || null,
        gameKey: cleanText(row.game_key, 80) || null,
        createdAt: cleanText(row.created_at, 40) || null,
      }))
      .filter((row) => row.id && row.content.length >= 4);

    const brief = (briefRes.data?.payload ?? null) as LessonBriefPayload | null;

    const recentScores: CaptainSuggestionScoreSignal[] = (scoresRes.data ?? [])
      .map((row) => ({
        studentName: cleanText(row.display_name, 50) || 'Student',
        outcome: cleanText(row.outcome, 24) || null,
        accuracyStatus: cleanText(row.accuracy_status, 24) || null,
      }));

    // Quiet students: roster names with no recent scored answer or submission.
    // Heuristic name match — display names usually mirror roster names.
    const activeNames = new Set<string>();
    for (const score of recentScores) activeNames.add(score.studentName.toLowerCase());
    for (const sub of submissions) activeNames.add(sub.displayName.toLowerCase());
    const quietStudents = (rosterRes.data ?? [])
      .map((row) => cleanText((row as { name?: unknown }).name, 40))
      .filter((name) => name && !activeNames.has(name.toLowerCase()))
      .slice(0, 6);

    // Latest poll with vote tallies (any status — a just-closed poll is still signal).
    let lastPoll: CaptainSuggestionPollResult | null = null;
    if (pollRes.data) {
      const options = Array.isArray(pollRes.data.options) ? (pollRes.data.options as string[]) : [];
      const { data: votes } = await supabase
        .from('poll_votes')
        .select('choice')
        .eq('poll_id', pollRes.data.id);
      const tally = new Map<string, number>();
      for (const vote of votes ?? []) {
        const choice = cleanText((vote as { choice?: unknown }).choice, 42);
        if (choice) tally.set(choice, (tally.get(choice) ?? 0) + 1);
      }
      if ((votes ?? []).length > 0) {
        lastPoll = {
          question: cleanText(pollRes.data.question, 200),
          results: options.map((option) => ({ option, votes: tally.get(option) ?? 0 })),
        };
      }
    }

    // Stage now + next: current from input_spec, next from the lesson brief's plan.
    const stageLabel = getStageLabelForKey(currentGameKey);
    let nextStageLabel: string | null = null;
    if (brief?.stages && currentGameKey) {
      const idx = brief.stages.findIndex((stage) => stage.key === currentGameKey);
      if (idx >= 0 && idx + 1 < brief.stages.length) {
        nextStageLabel = brief.stages[idx + 1].label;
      }
    }

    const vocab = normalizeReferenceVocab(session.reference_vocab).map((item) => item.word);

    const context = {
      topic,
      difficulty,
      currentPrompt,
      submissions,
      goal: brief?.goal ?? null,
      stageLabel,
      nextStageLabel,
      grammarTarget: cleanText(session.grammar_target, 60) || null,
      vocab,
      sourceTitle: brief?.sourceTitle ?? null,
      sourceSummary: brief?.sourceSummary ?? null,
      quietStudents,
      recentScores,
      lastPoll,
    };

    const fallback = buildFallbackCaptainSuggestions(context);

    if (submissions.length === 0 && recentScores.length === 0) {
      return NextResponse.json({
        suggestions: fallback,
        source: 'fallback',
        generatedAt: new Date().toISOString(),
      });
    }

    try {
      const prompt = buildCaptainSuggestionsPrompt(context);
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
