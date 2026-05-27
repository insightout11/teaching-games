import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { RATE_LIMITS, VALIDATION } from '@/lib/config/rate-limits';

interface SubmitRequest {
  sessionId: string;
  clientId: string;
  displayName: string;
  content: string;
  team?: 'red' | 'blue' | null;
  gameKey?: string | null;
  inputType?: string | null; // 'choice', 'binary', 'text', etc.
  studentId?: string | null;
  /** When true, skip deleting previous submissions from this student (allows multiple per session) */
  allowMultiple?: boolean;
  /** When set to approval, text/textarea submissions are saved for teacher review. */
  reviewMode?: 'approval' | 'direct';
}

// POST /api/student/submit
// Create text submission with rate limiting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SubmitRequest;
    const { sessionId, clientId, displayName, content, team, gameKey, inputType, studentId, allowMultiple, reviewMode } = body;

    // Validate required fields
    if (!sessionId || !clientId || !displayName || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, clientId, displayName, content' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId) || !uuidRegex.test(clientId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    // Trim and validate string lengths
    const trimmedName = displayName.trim();
    const trimmedContent = content.trim();

    if (!trimmedName || trimmedName.length > VALIDATION.DISPLAY_NAME_MAX) {
      return NextResponse.json(
        { error: `Display name must be 1-${VALIDATION.DISPLAY_NAME_MAX} characters` },
        { status: 400 }
      );
    }

    if (!trimmedContent || trimmedContent.length > VALIDATION.CONTENT_MAX) {
      return NextResponse.json(
        { error: `Content must be 1-${VALIDATION.CONTENT_MAX} characters` },
        { status: 400 }
      );
    }

    // Validate team if provided
    if (team && team !== 'red' && team !== 'blue') {
      return NextResponse.json({ error: 'Team must be "red" or "blue"' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify session is active
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // For simple choices (binary, choice, ranking), bypass approval and create score directly.
    // Decision Council text must always go through student_submissions so the council
    // activity can build proposal/challenge cards from real submission IDs.
    const isDecisionCouncilText =
      gameKey === 'decision-council' && (inputType === 'text' || inputType === 'textarea');
    const shouldReviewText = reviewMode === 'approval' || isDecisionCouncilText;
    const isDirectSubmission =
      inputType === 'binary' ||
      inputType === 'choice' ||
      inputType === 'ranking' ||
      inputType === 'multi-select' ||
      inputType === 'error-correction' ||
      inputType === 'sequence' ||
      inputType === 'confirm' ||
      inputType === 'shuffleboard' ||
      inputType === 'cabin-question' ||
      inputType === 'cabin-vote' ||
      (!shouldReviewText && inputType === 'text' && !!gameKey) ||
      (!shouldReviewText && inputType === 'textarea' && !!gameKey);

    if (isDirectSubmission) {
      // Delete any previous vote from this student for this game to prevent duplicates
      // Skip delete when allowMultiple is set (e.g. problem-solvers allows multiple per student)
      if (gameKey && !allowMultiple) {
        await supabase
          .from('scores')
          .delete()
          .eq('session_id', sessionId)
          .eq('client_id', clientId)
          .contains('response_data', { gameKey: gameKey });
      }

      // Parse structured JSON content (e.g. { choice, resourcesUsed }) if present
      let choiceContent = trimmedContent;
      let resourcesUsed: string[] | undefined;
      try {
        const parsed = JSON.parse(trimmedContent) as { choice?: string; resourcesUsed?: string[] };
        if (typeof parsed?.choice === 'string') {
          choiceContent = parsed.choice;
          if (Array.isArray(parsed.resourcesUsed)) {
            resourcesUsed = parsed.resourcesUsed;
          }
        }
      } catch {
        // plain text content — use as-is
      }

      // Create score directly - this will be picked up by realtime subscriptions
      const { error: scoreError } = await supabase
        .from('scores')
        .insert({
          session_id: sessionId,
          student_id: studentId || null,
          points: 0,
          streak_count: 0,
          streak_bonus: 0,
          is_correct: false,
          counts_for_leaderboard: false,
          counts_for_accuracy: false,
          scoring_version: 1,
          response_data: {
            type: 'remote_vote',
            gameKey: gameKey,
            inputType: inputType,
            choice: choiceContent,
            ...(resourcesUsed ? { resourcesUsed } : {}),
          },
          team: team || null,
          client_id: clientId,
          display_name: trimmedName,
        });

      if (scoreError) {
        console.error('Insert score error:', scoreError);
        return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
      }

      return NextResponse.json({ success: true, direct: true });
    }

    // Check rate limit (only for text submissions that need approval)
    const { data: rateLimit } = await supabase
      .from('submission_rate_limits')
      .select('last_text_submission')
      .eq('session_id', sessionId)
      .eq('client_id', clientId)
      .single();

    if (rateLimit?.last_text_submission) {
      const lastSubmission = new Date(rateLimit.last_text_submission);
      const now = new Date();
      const secondsSince = (now.getTime() - lastSubmission.getTime()) / 1000;

      if (secondsSince < RATE_LIMITS.TEXT_SUBMISSION_SECONDS) {
        const waitSeconds = Math.ceil(RATE_LIMITS.TEXT_SUBMISSION_SECONDS - secondsSince);
        return NextResponse.json(
          { error: 'rate_limited', waitSeconds },
          { status: 429 }
        );
      }
    }

    // Insert submission
    const { error: insertError } = await supabase
      .from('student_submissions')
      .insert({
        session_id: sessionId,
        client_id: clientId,
        display_name: trimmedName,
        team: team || null,
        submission_type: 'text',
        content: trimmedContent,
        status: 'pending',
        game_key: gameKey || null,
      });

    if (insertError) {
      console.error('Insert submission error:', insertError);
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
    }

    // Update rate limit timestamp (upsert)
    await supabase
      .from('submission_rate_limits')
      .upsert(
        {
          session_id: sessionId,
          client_id: clientId,
          last_text_submission: new Date().toISOString(),
        },
        { onConflict: 'session_id,client_id' }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
