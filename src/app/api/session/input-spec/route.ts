import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/auth-credits';
import { mockStore } from '@/lib/mock/data';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import {
  getActivityInstanceIdentity,
  getInputSpecRevision,
  shouldApplyActivityInstanceUpdate,
  stampTimedSpec,
  type ActivityInstanceIdentity,
  type InputSpec,
} from '@/lib/input-spec';
import type { Session } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

// POST /api/session/input-spec
// Teacher calls this to broadcast an input spec to student devices.
// Uses service role so the write is guaranteed to reach the real DB —
// the same DB the student poll route reads from.

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json();
    const { sessionId, spec, activityInstanceIdentity } = body as {
      sessionId: string;
      spec: unknown;
      activityInstanceIdentity?: ActivityInstanceIdentity | null;
    };

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      const session = mockStore.ensureSession(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const existing = (session as { input_spec?: unknown }).input_spec ?? null;
      const currentIdentity = getActivityInstanceIdentity(existing as InputSpec | null);
      if (
        activityInstanceIdentity
        && (
          (currentIdentity && !shouldApplyActivityInstanceUpdate(currentIdentity, activityInstanceIdentity))
          || (!currentIdentity && existing !== null && spec === null)
        )
      ) {
        return NextResponse.json({
          ok: true,
          applied: false,
          spec: existing,
          inputSpecRevision: getInputSpecRevision(existing),
          serverNow: Date.now(),
          activityInstanceIdentity: currentIdentity,
        }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
      }
      const stamped = stampTimedSpec(spec, existing);
      const updates = { input_spec: stamped ?? null } as Partial<Session> & { input_spec?: unknown };
      mockStore.updateSession(sessionId, updates);

      const payloadSpec = stamped ?? null;
      return NextResponse.json({
        ok: true,
        applied: true,
        spec: payloadSpec,
        inputSpecRevision: getInputSpecRevision(payloadSpec),
        serverNow: Date.now(),
        activityInstanceIdentity:
          getActivityInstanceIdentity(payloadSpec as InputSpec | null) ?? activityInstanceIdentity ?? null,
      }, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
    }

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
    if (ownership.error) return ownership.error;

    const supabase = createServiceClient();

    // Read the canonical value before every activity-instance write. This makes
    // stale clears from an unmounted/previous activity run harmless even when they
    // arrive from another browser task after the new prompt has already persisted.
    const { data: currentSession } = await supabase
      .from('sessions')
      .select('input_spec')
      .eq('id', sessionId)
      .single();
    const currentInputSpec = currentSession?.input_spec ?? null;
    const currentIdentity = getActivityInstanceIdentity(currentInputSpec as InputSpec | null);
    if (
      activityInstanceIdentity
      && (
        (currentIdentity && !shouldApplyActivityInstanceUpdate(currentIdentity, activityInstanceIdentity))
        || (!currentIdentity && currentInputSpec !== null && spec === null)
      )
    ) {
      console.info('[input-spec POST] stale activity update rejected', {
        sessionId,
        currentInstanceId: currentIdentity?.id ?? 'non-instance-input',
        currentSequence: currentIdentity?.sequence ?? null,
        incomingInstanceId: activityInstanceIdentity.id,
        incomingSequence: activityInstanceIdentity.sequence,
      });
      return NextResponse.json({
        ok: true,
        applied: false,
        spec: currentInputSpec,
        inputSpecRevision: getInputSpecRevision(currentInputSpec),
        serverNow: Date.now(),
        activityInstanceIdentity: currentIdentity,
      });
    }

    // Timed specs get server-authoritative startedAt/answersOpenAt. Same-round
    // rewrites (lock updates, reveals) keep the original stamp.
    let toWrite: unknown = spec ?? null;
    if (spec && typeof spec === 'object' && typeof (spec as { timerSeconds?: unknown }).timerSeconds === 'number') {
      toWrite = stampTimedSpec(spec, currentInputSpec);
    }

    let updateQuery = supabase
      .from('sessions')
      .update({ input_spec: toWrite })
      .eq('id', sessionId);
    // Compare-and-set closes the remaining cross-request race: if a newer prompt
    // lands after our read but before this update, the stale write affects zero rows.
    if (activityInstanceIdentity) {
      updateQuery = currentInputSpec === null
        ? updateQuery.is('input_spec', null)
        : updateQuery.eq('input_spec', currentInputSpec);
    }
    const { data, error } = await updateQuery.select('id');

    if (error) {
      console.error('[input-spec POST] DB error:', error);
      return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      if (activityInstanceIdentity) {
        const { data: latestSession } = await supabase
          .from('sessions')
          .select('input_spec')
          .eq('id', sessionId)
          .single();
        const latestSpec = latestSession?.input_spec ?? null;
        return NextResponse.json({
          ok: true,
          applied: false,
          spec: latestSpec,
          inputSpecRevision: getInputSpecRevision(latestSpec),
          serverNow: Date.now(),
          activityInstanceIdentity: getActivityInstanceIdentity(latestSpec as InputSpec | null),
        });
      }
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Echo the stamped spec + server clock so the teacher's own timers can anchor
    // to the exact same timestamps students receive from the poll.
    return NextResponse.json({
      ok: true,
      applied: true,
      spec: toWrite,
      inputSpecRevision: getInputSpecRevision(toWrite),
      serverNow: Date.now(),
      activityInstanceIdentity:
        getActivityInstanceIdentity(toWrite as InputSpec | null) ?? activityInstanceIdentity ?? null,
    });
  } catch (error) {
    console.error('[input-spec POST] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
