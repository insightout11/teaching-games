import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { RATE_LIMITS, VALIDATION } from '@/lib/config/rate-limits';
import { isSessionStale } from '@/lib/session-freshness';

interface VoteRequest {
  pollId: string;
  sessionId: string;
  clientId: string;
  displayName: string;
  choice: string;
  team?: 'red' | 'blue' | null;
}

// POST /api/student/vote
// Submit or update poll vote with rate limiting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VoteRequest;
    const { pollId, sessionId, clientId, displayName, choice, team } = body;

    // Validate required fields
    if (!pollId || !sessionId || !clientId || !displayName || !choice) {
      return NextResponse.json(
        { error: 'Missing required fields: pollId, sessionId, clientId, displayName, choice' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pollId) || !uuidRegex.test(sessionId) || !uuidRegex.test(clientId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    // Trim and validate
    const trimmedName = displayName.trim();
    const trimmedChoice = choice.trim();

    if (!trimmedName || trimmedName.length > VALIDATION.DISPLAY_NAME_MAX) {
      return NextResponse.json(
        { error: `Display name must be 1-${VALIDATION.DISPLAY_NAME_MAX} characters` },
        { status: 400 }
      );
    }

    if (!trimmedChoice) {
      return NextResponse.json({ error: 'Choice is required' }, { status: 400 });
    }

    // Validate team if provided
    if (team && team !== 'red' && team !== 'blue') {
      return NextResponse.json({ error: 'Team must be "red" or "blue"' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, session_id, options, is_active')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (!poll.is_active) {
      return NextResponse.json({ error: 'Poll is not active' }, { status: 400 });
    }

    if (poll.session_id !== sessionId) {
      return NextResponse.json({ error: 'Poll does not belong to this session' }, { status: 400 });
    }

    // Verify session is active and not stale
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

    // Validate choice is one of the poll options
    const options = poll.options as string[];
    if (!options.includes(trimmedChoice)) {
      return NextResponse.json({ error: 'Invalid choice' }, { status: 400 });
    }

    // Check rate limit
    const { data: rateLimit } = await supabase
      .from('submission_rate_limits')
      .select('last_poll_vote')
      .eq('session_id', sessionId)
      .eq('client_id', clientId)
      .single();

    if (rateLimit?.last_poll_vote) {
      const lastVote = new Date(rateLimit.last_poll_vote);
      const now = new Date();
      const secondsSince = (now.getTime() - lastVote.getTime()) / 1000;

      if (secondsSince < RATE_LIMITS.POLL_VOTE_SECONDS) {
        const waitSeconds = Math.ceil(RATE_LIMITS.POLL_VOTE_SECONDS - secondsSince);
        return NextResponse.json(
          { error: 'rate_limited', waitSeconds },
          { status: 429 }
        );
      }
    }

    // Upsert vote (ON CONFLICT poll_id, client_id)
    const { error: upsertError } = await supabase
      .from('poll_votes')
      .upsert(
        {
          poll_id: pollId,
          session_id: sessionId,
          client_id: clientId,
          display_name: trimmedName,
          team: team || null,
          choice: trimmedChoice,
        },
        { onConflict: 'poll_id,client_id' }
      );

    if (upsertError) {
      console.error('Upsert vote error:', upsertError);
      return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }

    // Update rate limit timestamp
    await supabase
      .from('submission_rate_limits')
      .upsert(
        {
          session_id: sessionId,
          client_id: clientId,
          last_poll_vote: new Date().toISOString(),
        },
        { onConflict: 'session_id,client_id' }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
