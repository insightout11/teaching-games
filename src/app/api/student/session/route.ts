import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// GET /api/student/session?sessionId=xxx
// Public read-only endpoint for student controller
// Returns session status, active poll, input spec, frozen flag, and published questions

// ---------------------------------------------------------------------------
// Server-side in-memory cache (per Lambda instance)
// Reduces DB load when many students poll simultaneously.
// TTL is intentionally short (2s) so state changes reach students within 7s.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 2000;

interface PublishedQuestion {
  id: string;
  content: string;
  publishedAt: string;
  voteCount: number;
}

interface CacheEntry {
  expiresAt: number;
  payload: SessionPayload;
}

interface SessionPayload {
  isActive: boolean;
  activePoll: { pollId: string; question: string; options: string[] } | null;
  inputSpec: unknown;
  frozen: boolean;
  publishedQuestions: PublishedQuestion[] | null;
}

const sessionCache = new Map<string, CacheEntry>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
    }

    // Check cache
    const now = Date.now();
    const cached = sessionCache.get(sessionId);
    if (cached && now < cached.expiresAt) {
      return NextResponse.json(cached.payload, {
        headers: { 'X-LC-Cache': 'HIT', 'Cache-Control': 'private, max-age=0' },
      });
    }

    // Stale entry — remove it before querying (prevents unbounded Map growth)
    if (cached) sessionCache.delete(sessionId);

    const supabase = createServiceClient();

    // Check if session exists and is active, including input_spec and frozen flag
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status, input_spec, frozen')
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
        .select('id, question, options')
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

    const payload: SessionPayload = {
      isActive,
      activePoll,
      inputSpec: session.input_spec || null,
      frozen: session.frozen ?? false,
      publishedQuestions,
    };

    // Store in cache (only on success — never cache errors)
    sessionCache.set(sessionId, { expiresAt: now + CACHE_TTL_MS, payload });

    return NextResponse.json(payload, {
      headers: { 'X-LC-Cache': 'MISS', 'Cache-Control': 'private, max-age=0' },
    });
  } catch (error) {
    console.error('Session info error:', error);
    return NextResponse.json({ error: 'Failed to get session info' }, { status: 500 });
  }
}
