import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import {
  SIDE_CHANNEL_KEY,
  sanitizeSideChannelDraft,
  type SideChannelItem,
} from '@/lib/side-channel';

export const dynamic = 'force-dynamic';

// POST /api/session/side-channel
// Teacher pushes one prompt to Crew Radio — the non-interrupting side panel on
// student devices. `item: null` clears the channel. 'choice' items create a
// poll row (metadata.channel='side') so votes reuse the existing poll
// infrastructure; the student controller hides side polls from the main poll
// card and renders them inside Crew Radio instead.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json() as { sessionId?: unknown; item?: unknown };
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';

    if (!sessionId || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      return NextResponse.json({ ok: true, item: null });
    }

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
    if (ownership.error) return ownership.error;

    const supabase = createServiceClient();

    // Clear the channel
    if (body.item === null || body.item === undefined) {
      const { error } = await supabase
        .from('session_private_state')
        .upsert(
          { session_id: sessionId, key: SIDE_CHANNEL_KEY, payload: { item: null }, updated_at: new Date().toISOString() },
          { onConflict: 'session_id,key' },
        );
      if (error) {
        console.error('[side-channel POST] clear error:', error);
        return NextResponse.json({ error: 'Failed to clear side channel' }, { status: 500 });
      }
      return NextResponse.json({ ok: true, item: null });
    }

    const draft = sanitizeSideChannelDraft(body.item);
    if (!draft) {
      return NextResponse.json({ error: 'Invalid side channel item' }, { status: 400 });
    }

    let pollId: string | undefined;
    if (draft.kind === 'choice') {
      // One active poll per session — close any current one, like the poll route does.
      const { error: closeError } = await supabase
        .from('polls')
        .update({ is_active: false })
        .eq('session_id', sessionId)
        .eq('is_active', true);
      if (closeError) {
        console.error('[side-channel POST] close poll error:', closeError);
        return NextResponse.json({ error: 'Failed to close active poll' }, { status: 500 });
      }

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          session_id: sessionId,
          question: draft.prompt,
          options: draft.options,
          is_active: true,
          metadata: { channel: 'side' },
        })
        .select('id')
        .single();
      if (pollError || !poll) {
        console.error('[side-channel POST] create poll error:', pollError);
        return NextResponse.json({ error: 'Failed to create side poll' }, { status: 500 });
      }
      pollId = poll.id as string;
    }

    const item: SideChannelItem = {
      id: randomUUID(),
      ...draft,
      ...(pollId ? { pollId } : {}),
      createdAt: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('session_private_state')
      .upsert(
        { session_id: sessionId, key: SIDE_CHANNEL_KEY, payload: { item }, updated_at: new Date().toISOString() },
        { onConflict: 'session_id,key' },
      );

    if (upsertError) {
      console.error('[side-channel POST] upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to write side channel' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    console.error('[side-channel POST] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
