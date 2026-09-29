import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { getDestinationById, STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { distanceKm } from '@/lib/world-flight/geo';
import { buildWorldFlightEvidenceSnapshot, resolveWorldFlightMovement } from '@/lib/world-flight/journey';

export const dynamic = 'force-dynamic';

/**
 * Live Room flights are World Flight legs: the class departs from its current
 * World Flight city (or LC International on its first flight), within the
 * plane's range. GET reports where the class is; POST attaches a planned leg to
 * this running session at take-off. The existing end-of-session step completes
 * the leg, moves the class and awards flight hours / crew stars.
 */
async function load(sessionId: string) {
  const { teacher, error } = await requireAuth();
  if (error) return { error };
  if (!teacher) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const owned = await verifyTeacherOwnsSession(sessionId, teacher.id);
  if (owned.error) return { error: owned.error };
  const service = createServiceClient();
  const { data: state } = await service
    .from('class_world_flight_state')
    .select('current_destination_id, range_km, plane_selection_required')
    .eq('class_id', owned.session.class_id)
    .maybeSingle();
  return { service, classId: owned.session.class_id, state };
}

export async function GET(_request: Request, { params }: { params: { sessionId: string } }) {
  const ctx = await load(params.sessionId);
  if ('error' in ctx && ctx.error) return ctx.error;
  const { state, service, classId } = ctx as Exclude<typeof ctx, { error: unknown }>;
  // The class's journey so far, oldest first, for the landing map.
  const { data: legs } = await service
    .from('class_world_flight_legs')
    .select('origin_destination_id, destination_id')
    .eq('class_id', classId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: true })
    .limit(50);
  return NextResponse.json({
    journey: (legs ?? []).map((l) => ({ from: l.origin_destination_id ?? null, to: l.destination_id })),
    currentDestinationId: state?.current_destination_id ?? null,
    rangeKm: state?.range_km ?? STARTER_PLANE_RANGE_KM,
    planeSelectionRequired: state?.plane_selection_required ?? false,
  });
}

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null);
  const destination = typeof body?.destinationId === 'string' ? getDestinationById(body.destinationId) : undefined;
  if (!destination) return NextResponse.json({ error: 'Unknown destination' }, { status: 400 });

  const ctx = await load(params.sessionId);
  if ('error' in ctx && ctx.error) return ctx.error;
  const { service, classId, state } = ctx as Exclude<typeof ctx, { error: unknown }>;

  const origin = state?.current_destination_id ? getDestinationById(state.current_destination_id) ?? null : null;
  const km = origin ? distanceKm(origin, destination) : 0;
  const movement = resolveWorldFlightMovement({
    originDestinationId: origin?.id ?? null,
    destinationId: destination.id,
    distanceKm: km,
    rangeKm: state?.range_km ?? STARTER_PLANE_RANGE_KM,
    requestedMove: !state?.plane_selection_required,
  });
  if (!movement.movesClass) {
    return NextResponse.json({ movesClass: false, reason: state?.plane_selection_required ? 'plane-selection-required' : 'out-of-range' });
  }

  const focus = destination.focusOptions[0];
  const { error } = await service.from('class_world_flight_legs').upsert(
    {
      class_id: classId,
      session_id: params.sessionId,
      origin_destination_id: origin?.id ?? null,
      destination_id: destination.id,
      focus_id: focus?.id ?? 'live-room',
      distance_km: Math.max(0, km),
      evidence_snapshot: focus ? buildWorldFlightEvidenceSnapshot(destination, focus) : {},
      status: 'planned',
    },
    { onConflict: 'session_id' },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ movesClass: true, distanceKm: Math.round(km) });
}
