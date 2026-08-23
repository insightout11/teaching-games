import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { RATE_LIMITS, VALIDATION } from '@/lib/config/rate-limits';
import { isSessionStale } from '@/lib/session-freshness';
import { mockStore } from '@/lib/mock/data';
import type { InputSpec } from '@/lib/input-spec';
import { validateRoundSubmission, verifiedParticipantStudentId } from '@/lib/direct-submission';

interface SubmitRequest {
  sessionId: string;
  clientId: string;
  displayName: string;
  content: string;
  team?: 'red' | 'blue' | null;
  gameKey?: string | null;
  inputType?: string | null; // 'choice', 'binary', 'text', etc.
  roundId?: string | null;
  studentId?: string | null;
  /** When true, skip deleting previous submissions from this student (allows multiple per session) */
  allowMultiple?: boolean;
  /** When set to approval, text/textarea submissions are saved for teacher review. */
  reviewMode?: 'approval' | 'direct';
}

// POST /api/student/submit
// Create text submission with rate limiting
export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const body = await request.json() as SubmitRequest;
    const { sessionId, clientId, displayName, content, team, gameKey, inputType, roundId, studentId, allowMultiple, reviewMode } = body;

    // Validate required fields
    if (!sessionId || !clientId || !displayName || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, clientId, displayName, content' },
        { status: 400 }
      );
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

    if (
      process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
      && (inputType === 'choice' || inputType === 'binary')
    ) {
      const session = mockStore.ensureSession(sessionId);
      if (!session || session.status !== 'active') {
        return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
      }
      const roundError = validateRoundSubmission(
        ((session as { input_spec?: unknown }).input_spec ?? null) as InputSpec | null,
        { gameKey, inputType, roundId },
      );
      if (roundError) return NextResponse.json({ error: roundError }, { status: 409 });
      const existing = roundId
        ? mockStore.getScores(sessionId).find((score) => {
            const data = score.response_data as Record<string, unknown> | null;
            return score.client_id === clientId
              && data?.gameKey === gameKey
              && data?.roundId === roundId;
          })
        : undefined;
      if (existing) {
        const data = existing.response_data as Record<string, unknown> | null;
        return NextResponse.json({
          success: true,
          direct: true,
          deduplicated: true,
          choice: typeof data?.choice === 'string' ? data.choice : trimmedContent,
        });
      }
      mockStore.createScore({
        session_id: sessionId,
        student_id: studentId ?? null,
        client_id: clientId,
        display_name: trimmedName,
        response_data: {
          type: 'remote_vote',
          gameKey: gameKey ?? null,
          inputType: inputType ?? null,
          ...(roundId ? { roundId } : {}),
          choice: trimmedContent,
        },
      });
      return NextResponse.json({ success: true, direct: true });
    }

    // Validate UUID format in production after the deterministic mock-backend path.
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId) || !uuidRegex.test(clientId) || (studentId && !uuidRegex.test(studentId))) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify session is active
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status, started_at, input_spec')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    let verifiedStudentId = studentId || null;
    if (isSessionStale(session.started_at)) {
      const staleRoundError = validateRoundSubmission(
        (session.input_spec ?? null) as InputSpec | null,
        { gameKey, inputType, roundId },
      );
      if (!roundId || staleRoundError) {
        return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
      }
      const { data: participant, error: participantError } = await supabase
        .from('session_participants')
        .select('student_id')
        .eq('session_id', sessionId)
        .eq('client_id', clientId)
        .maybeSingle();
      const verification = verifiedParticipantStudentId(participant, studentId);
      if (participantError || !verification.allowed) {
        return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
      }
      verifiedStudentId = verification.studentId;
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
      inputType === 'geo-point' ||
      inputType === 'cabin-question' ||
      inputType === 'cabin-vote' ||
      (!shouldReviewText && inputType === 'text' && !!gameKey) ||
      (!shouldReviewText && inputType === 'textarea' && !!gameKey);

    if (isDirectSubmission) {
      const roundError = validateRoundSubmission(
        (session.input_spec ?? null) as InputSpec | null,
        { gameKey, inputType, roundId },
      );
      if (roundError) return NextResponse.json({ error: roundError }, { status: 409 });

      // A structured round ID is the idempotency key for multi-prompt activities.
      // Keep prior rounds so refresh can hydrate durable confirmation, but never
      // insert the same student's response twice for the current round.
      if (gameKey && roundId) {
          const { data: existingRoundResponse, error: existingRoundError } = await supabase
            .from('scores')
            .select('id, response_data')
            .eq('session_id', sessionId)
            .eq('client_id', clientId)
            .contains('response_data', { gameKey, roundId })
            .limit(1)
            .maybeSingle();
          if (existingRoundError) {
            console.error('Direct response lookup failed', {
              correlationId,
              code: existingRoundError.code,
              gameKey,
              roundId,
            });
            return NextResponse.json({ error: 'Signal failed', requestId: correlationId }, { status: 500 });
          }
          if (existingRoundResponse) {
            const responseData = existingRoundResponse.response_data as { choice?: unknown } | null;
            return NextResponse.json({
              success: true,
              direct: true,
              deduplicated: true,
              choice: typeof responseData?.choice === 'string' ? responseData.choice : trimmedContent,
            });
          }
      } else if (gameKey && !allowMultiple) {
        // Legacy single-round inputs retain replacement semantics.
        await supabase
          .from('scores')
          .delete()
          .eq('session_id', sessionId)
          .eq('client_id', clientId)
          .contains('response_data', { gameKey });
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
          student_id: verifiedStudentId,
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
            ...(roundId ? { roundId } : {}),
            choice: choiceContent,
            ...(resourcesUsed ? { resourcesUsed } : {}),
          },
          team: team || null,
          client_id: clientId,
          display_name: trimmedName,
        });

      if (scoreError) {
        if (scoreError.code === '23505' && gameKey && roundId) {
          const { data: winningResponse } = await supabase
            .from('scores')
            .select('response_data')
            .eq('session_id', sessionId)
            .eq('client_id', clientId)
            .contains('response_data', { gameKey, roundId })
            .limit(1)
            .maybeSingle();
          const responseData = winningResponse?.response_data as { choice?: unknown } | null;
          if (winningResponse) {
            return NextResponse.json({
              success: true,
              direct: true,
              deduplicated: true,
              choice: typeof responseData?.choice === 'string' ? responseData.choice : choiceContent,
            });
          }
        }
        console.error('Direct response insert failed', {
          correlationId,
          code: scoreError.code,
          details: scoreError.details,
          hint: scoreError.hint,
          gameKey,
          inputType,
          roundId,
        });
        return NextResponse.json({ error: 'Signal failed', requestId: correlationId }, { status: 500 });
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
    console.error('Student submit failed', { correlationId, error });
    return NextResponse.json({ error: 'Signal failed', requestId: correlationId }, { status: 500 });
  }
}
