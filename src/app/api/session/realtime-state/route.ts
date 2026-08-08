import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { getInputSpecRevision, type InputSpec } from '@/lib/input-spec';
import { SIDE_CHANNEL_KEY, type SideChannelItem } from '@/lib/side-channel';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Canonical cockpit state used after subscription/reconnect and as a safety poll.
export async function GET(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const sessionId = request.nextUrl.searchParams.get('sessionId') ?? '';
  if (!UUID_RE.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({
      inputSpec: null,
      inputSpecRevision: getInputSpecRevision(null),
      sideChannel: null,
      sideChannelRevision: null,
      serverNow: Date.now(),
    });
  }

  const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
  if (ownership.error) return ownership.error;

  const supabase = createServiceClient();
  const [sessionResult, sideChannelResult] = await Promise.all([
    supabase.from('sessions').select('input_spec').eq('id', sessionId).single(),
    supabase
      .from('session_private_state')
      .select('payload, updated_at')
      .eq('session_id', sessionId)
      .eq('key', SIDE_CHANNEL_KEY)
      .maybeSingle(),
  ]);

  if (sessionResult.error) {
    console.error('[realtime-state GET] session query failed:', sessionResult.error.message);
    return NextResponse.json({ error: 'Failed to load session state' }, { status: 500 });
  }
  if (sideChannelResult.error) {
    console.error('[realtime-state GET] side-channel query failed:', sideChannelResult.error.message);
    return NextResponse.json({ error: 'Failed to load side-channel state' }, { status: 500 });
  }

  const inputSpec = (sessionResult.data?.input_spec ?? null) as InputSpec | null;
  const sidePayload = sideChannelResult.data?.payload as { item?: SideChannelItem | null } | null;
  return NextResponse.json({
    inputSpec,
    inputSpecRevision: getInputSpecRevision(inputSpec),
    sideChannel: sidePayload?.item ?? null,
    sideChannelRevision: sideChannelResult.data?.updated_at ?? null,
    serverNow: Date.now(),
  });
}
