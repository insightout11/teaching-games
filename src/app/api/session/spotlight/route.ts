import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import {
  ANONYMOUS_CREW_NAME,
  isSpotlightTag,
  spotlightPrefKey,
  type SpotlightPayload,
} from '@/lib/spotlight';

export const dynamic = 'force-dynamic';

// POST /api/session/spotlight
// Teacher calls this to spotlight a student submission on the shared screen.
// Flow: approve the submission → upsert spotlight payload into session_private_state.
// The shared screen subscribes to realtime UPDATE on session_private_state and shows
// the Captain's Pick card when a new spotlight arrives.
// The student's name preference (session_private_state key 'spotlight-pref:<clientId>')
// decides whether the card shows their name or "A crew member".

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json() as {
      sessionId: string;
      submissionId: string;
      studentName: string;
      text: string;
      label?: string;
      tag?: string;
      highlight?: string;
    };

    const { sessionId, submissionId, studentName, text, label = 'Captain\'s Pick' } = body;

    if (!sessionId || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }
    if (!submissionId || !UUID_RE.test(submissionId)) {
      return NextResponse.json({ error: 'Invalid submissionId' }, { status: 400 });
    }
    if (!studentName || typeof studentName !== 'string') {
      return NextResponse.json({ error: 'studentName is required' }, { status: 400 });
    }
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
    if (ownership.error) return ownership.error;

    const supabase = createServiceClient();

    // Approve the submission first so it doesn't surface as raw pending content
    const { data: submission, error: approveError } = await supabase
      .from('student_submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId)
      .eq('session_id', sessionId)
      .select('id, display_name, content, client_id')
      .maybeSingle();

    if (approveError) {
      console.error('[spotlight POST] approve error:', approveError);
      return NextResponse.json({ error: 'Failed to approve submission' }, { status: 500 });
    }
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Student name preference — named by default, anonymity is opt-in.
    let anonymous = false;
    if (submission.client_id) {
      const { data: prefRow } = await supabase
        .from('session_private_state')
        .select('payload')
        .eq('session_id', sessionId)
        .eq('key', spotlightPrefKey(submission.client_id as string))
        .maybeSingle();
      anonymous = (prefRow?.payload as { named?: boolean } | null)?.named === false;
    }

    // Pull the current question from the session's live input spec so the Captain's Pick card
    // shows what the contribution was answering — a bare quote is confusing out of context.
    const { data: sessionRow } = await supabase
      .from('sessions')
      .select('input_spec')
      .eq('id', sessionId)
      .maybeSingle();
    const promptRaw = (sessionRow?.input_spec as { prompt?: unknown } | null)?.prompt;
    const promptText = typeof promptRaw === 'string'
      ? promptRaw.replace(/\s+/g, ' ').trim().slice(0, 180) || null
      : null;

    const finalText = submission.content || text;
    const tag = isSpotlightTag(body.tag) ? body.tag : undefined;
    // Highlight must be an exact phrase of the shown text, or it's dropped.
    const rawHighlight = typeof body.highlight === 'string' ? body.highlight.trim().slice(0, 60) : '';
    const highlight = rawHighlight && finalText.toLowerCase().includes(rawHighlight.toLowerCase())
      ? rawHighlight
      : null;

    // Upsert spotlight payload — UNIQUE on (session_id, key) so this replaces any prior spotlight
    const payload: SpotlightPayload = {
      type: 'spotlight',
      label,
      studentName: anonymous ? ANONYMOUS_CREW_NAME : (submission.display_name || studentName),
      text: finalText,
      ...(tag ? { tag } : {}),
      highlight,
      ...(promptText ? { prompt: promptText } : {}),
      anonymous,
      createdAt: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('session_private_state')
      .upsert(
        { session_id: sessionId, key: 'spotlight', payload, updated_at: new Date().toISOString() },
        { onConflict: 'session_id,key' }
      );

    if (upsertError) {
      console.error('[spotlight POST] upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to write spotlight' }, { status: 500 });
    }

    // Return what was shown so the cockpit can offer follow-ups quoting it.
    return NextResponse.json({ ok: true, shownName: payload.studentName, text: finalText });
  } catch (error) {
    console.error('[spotlight POST] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
