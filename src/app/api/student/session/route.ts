import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { countsForAccuracy, countsForLeaderboard, isCorrectScore } from '@/lib/scoring-reporting';

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

interface WonderQuestion {
  id: string;
  starter: string;
  content: string;
  displayName: string;
  answeredAt: string | null;
  voteCount: number;
  parentId: string | null;
}

interface VocabItem {
  word: string;
  definition: string;
}

interface ExpressionItem {
  phrase: string;
  example: string;
}

interface PersonalResults {
  totalPoints: number;
  accuracy: number | null;
  bestStreak: number;
  rank: number | null;
  totalParticipants: number | null;
}

interface LastResult {
  scoreId: string;
  outcome: string;
  points: number;
  accuracyStatus: string | null;
}

interface SessionPayload {
  isActive: boolean;
  activePoll: { pollId: string; question: string; options: string[]; metadata?: Record<string, unknown> | null } | null;
  inputSpec: unknown;
  frozen: boolean;
  publishedQuestions: PublishedQuestion[] | null;
  wonderQuestions: WonderQuestion[] | null;
  personalMission: string | null;
  topic: string;
  difficulty: string;
  grammarTarget: string | null;
  referenceVocab: VocabItem[] | null;
  referenceExpressions: ExpressionItem[] | null;
  latestFeedback: { feedback: string; points: number; submissionId: string } | null;
  personalResults: PersonalResults | null;
  lastResult: LastResult | null;
  sessionPoints: number;
  responseCount: number;
  sessionAccuracy: number | null;
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

    // Get wonder board questions with vote counts (for student upvoting)
    // Wrapped in try/catch — degrades gracefully if migration not yet applied
    let wonderQuestions: WonderQuestion[] | null = null;
    if (isActive) {
      try {
        const { data: wqs } = await supabase
          .from('wonder_questions')
          .select(`
            id,
            starter,
            content,
            display_name,
            answered_at,
            parent_id,
            wonder_votes(count)
          `)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (wqs && wqs.length > 0) {
          wonderQuestions = (wqs as Array<{
            id: string;
            starter: string;
            content: string;
            display_name: string;
            answered_at: string | null;
            parent_id: string | null;
            wonder_votes: { count: number }[];
          }>).map((q) => ({
            id: q.id,
            starter: q.starter,
            content: q.content,
            displayName: q.display_name,
            answeredAt: q.answered_at,
            parentId: q.parent_id,
            voteCount: q.wonder_votes?.[0]?.count ?? 0,
          }));
        }
      } catch {
        // Table not yet migrated — return null silently
      }
    }

    // Get latest AI feedback for this student (for private phone delivery).
    // Two pathways:
    // 1. Approval-queue games: feedback written to student_submissions.ai_feedback
    // 2. Race-mode games: feedback stored in scores.response_data.feedback (browser client
    //    cannot INSERT into student_submissions due to RLS — all writes are service-role only)
    let latestFeedback: SessionPayload['latestFeedback'] = null;
    if (isActive && clientId) {
      // Pathway 1: approval-queue games
      const { data: fb } = await supabase
        .from('student_submissions')
        .select('id, ai_feedback, ai_score')
        .eq('session_id', sessionId)
        .eq('client_id', clientId)
        .not('ai_feedback', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fb?.ai_feedback) {
        latestFeedback = { feedback: fb.ai_feedback, points: fb.ai_score ?? 0, submissionId: fb.id };
      }

      // Pathway 2: race-mode games (feedback in scores.response_data.feedback)
      if (!latestFeedback) {
        const { data: sc } = await supabase
          .from('scores')
          .select('id, points, response_data')
          .eq('session_id', sessionId)
          .eq('client_id', clientId)
          .not('response_data->>feedback', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (sc) {
          const rd = sc.response_data as Record<string, unknown> | null;
          const feedbackStr = typeof rd?.feedback === 'string' ? rd.feedback : null;
          if (feedbackStr) {
            latestFeedback = { feedback: feedbackStr, points: sc.points, submissionId: sc.id };
          }
        }
      }
    }

    // During-session personal stats: last scored result + running totals
    let lastResult: LastResult | null = null;
    let sessionPoints = 0;
    let responseCount = 0;
    let sessionAccuracy: number | null = null;
    if (isActive && clientId) {
      const { data: activeScores } = await supabase
        .from('scores')
        .select('id, outcome, points, accuracy_status, counts_for_accuracy')
        .eq('session_id', sessionId)
        .eq('client_id', clientId)
        .eq('scoring_version', 2)
        .eq('counts_for_leaderboard', true)
        .order('created_at', { ascending: false });

      type ActiveRow = { id: string; outcome: string | null; points: number; accuracy_status: string | null; counts_for_accuracy: boolean | null };
      const rows = (activeScores ?? []) as ActiveRow[];
      responseCount = rows.length;
      sessionPoints = rows.reduce((s, r) => s + (r.points ?? 0), 0);

      const scorable = rows.filter(r => r.counts_for_accuracy === true);
      const correct = scorable.filter(r => r.accuracy_status === 'correct').length;
      sessionAccuracy = scorable.length > 0 ? Math.round((correct / scorable.length) * 100) : null;

      const latest = rows.find((r) => r.outcome);
      if (latest) {
        lastResult = {
          scoreId: latest.id,
          outcome: latest.outcome!,
          points: latest.points,
          accuracyStatus: latest.accuracy_status ?? null,
        };
      }
    }

    // Get personal results when session has ended
    let personalResults: PersonalResults | null = null;
    if (!isActive && clientId) {
      const [{ data: myScores }, { data: lb }, { data: pref }] = await Promise.all([
        supabase
          .from('scores')
          .select('points, is_correct, accuracy_status, counts_for_accuracy, counts_for_leaderboard, scoring_version, streak_count')
          .eq('session_id', sessionId)
          .eq('client_id', clientId),
        supabase
          .from('session_leaderboard')
          .select('total_points')
          .eq('session_id', sessionId)
          .order('total_points', { ascending: false }),
        supabase
          .from('student_session_prefs')
          .select('score_visible')
          .eq('session_id', sessionId)
          .eq('client_id', clientId)
          .maybeSingle(),
      ]);

      const rows = (myScores ?? []) as Array<{
        points: number; is_correct: boolean; accuracy_status?: string | null;
        counts_for_accuracy?: boolean | null; counts_for_leaderboard?: boolean | null;
        scoring_version?: number | null; streak_count: number;
      }>;
      // Only count leaderboard rows for points (exclude proxy remote_vote rows)
      const leaderboardRows = rows.filter(countsForLeaderboard);
      const totalPoints = leaderboardRows.reduce((s, r) => s + (r.points ?? 0), 0);
      const scorable = leaderboardRows.filter(countsForAccuracy);
      const accuracy = scorable.length > 0
        ? Math.round(
            scorable.filter(isCorrectScore).length / scorable.length * 100
          )
        : null;
      const bestStreak = rows.length > 0 ? Math.max(...rows.map((r) => r.streak_count ?? 0)) : 0;

      const scoreVisible = pref?.score_visible !== false;
      const lbRows = lb ?? [];
      const rank = scoreVisible && lbRows.length > 0
        ? lbRows.filter((e) => e.total_points > totalPoints).length + 1
        : null;

      personalResults = {
        totalPoints,
        accuracy,
        bestStreak,
        rank,
        totalParticipants: scoreVisible ? lbRows.length : null,
      };
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
      wonderQuestions,
      personalMission,
      topic: (session.custom_topic as string | null) || (session.topic as string) || 'General',
      difficulty: (session.difficulty as string) || 'Intermediate',
      grammarTarget: (session.grammar_target as string | null) ?? null,
      referenceVocab: (session.reference_vocab as VocabItem[] | null) ?? null,
      referenceExpressions: (session.reference_expressions as ExpressionItem[] | null) ?? null,
      latestFeedback,
      personalResults,
      lastResult,
      sessionPoints,
      responseCount,
      sessionAccuracy,
    };

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('Session info error:', error);
    return NextResponse.json({ error: 'Failed to get session info' }, { status: 500 });
  }
}
