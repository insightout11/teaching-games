import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { getDestinationById, STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { distanceKm } from '@/lib/world-flight/geo';
import { buildVisitOnlySnapshot, buildWorldFlightEvidenceSnapshot, NO_CITY_LESSON_FOCUS_ID, resolveWorldFlightMovement } from '@/lib/world-flight/journey';

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
    .select('current_destination_id, range_km, plane_selection_required, plane_key, next_destination_id')
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
    planeKey: (state as { plane_key?: string | null } | null)?.plane_key ?? null,
    // The city the class voted for after its last landing (today's default destination).
    nextDestinationId: (state as { next_destination_id?: string | null } | null)?.next_destination_id ?? null,
  });
}

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null);
  const destination = typeof body?.destinationId === 'string' ? getDestinationById(body.destinationId) : undefined;
  if (!destination) return NextResponse.json({ error: 'Unknown destination' }, { status: 400 });

  const ctx = await load(params.sessionId);
  if ('error' in ctx && ctx.error) return ctx.error;
  const { service, classId, state } = ctx as Exclude<typeof ctx, { error: unknown }>;

  // A class with no city yet may start its journey anywhere (the teacher's choice at the gate).
  const departure = !state?.current_destination_id && typeof body?.departureDestinationId === 'string'
    ? getDestinationById(body.departureDestinationId) ?? null
    : null;
  const origin = state?.current_destination_id ? getDestinationById(state.current_destination_id) ?? null : departure;
  const km = origin ? distanceKm(origin, destination) : 0;
  const movement = resolveWorldFlightMovement({
    originDestinationId: origin?.id ?? null,
    destinationId: destination.id,
    distanceKm: km,
    rangeKm: state?.range_km ?? STARTER_PLANE_RANGE_KM,
    // A plane choice that is still waiting never grounds the class: it keeps flying its current plane, at that
    // plane's range, until the new one is chosen.
    requestedMove: true,
  });
  // One of the city's own lessons, when the teacher chose one on the room map.
  const focus = typeof body?.focusId === 'string' ? destination.focusOptions.find((f) => f.id === body.focusId) : undefined;
  // Out of range (or already there) with a city lesson: the lesson counts, but the class stays where it is.
  const taughtOnly = !movement.movesClass && !!focus;
  if (!movement.movesClass && !taughtOnly) {
    return NextResponse.json({ movesClass: false, reason: origin?.id === destination.id ? 'same-city' : 'out-of-range' });
  }

  const { error } = await service.from('class_world_flight_legs').upsert(
    {
      class_id: classId,
      session_id: params.sessionId,
      origin_destination_id: origin?.id ?? null,
      destination_id: destination.id,
      // With no city lesson the flight is recorded as a visit only, never as one of the city's lessons (that
      // would be evidence the class never met). What is taught on the way is the teacher's choice.
      focus_id: focus?.id ?? NO_CITY_LESSON_FOCUS_ID,
      distance_km: taughtOnly ? 0 : Math.max(0, km),
      evidence_snapshot: focus ? buildWorldFlightEvidenceSnapshot(destination, focus) : buildVisitOnlySnapshot(destination),
      moves_class: !taughtOnly,
      status: 'planned',
    },
    { onConflict: 'session_id' },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // The class is on its way: last lesson's "where next?" choice has been used (or overruled).
  if (!taughtOnly) await service.from('class_world_flight_state').update({ next_destination_id: null }).eq('class_id', classId);
  return NextResponse.json({ movesClass: !taughtOnly, taughtOnly, cityLesson: !!focus, distanceKm: Math.round(km) });
}

/** Save the city the class chose for its next flight (the vote after landing). `null` clears it. */
export async function PUT(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null);
  const next = body?.nextDestinationId === null ? null : typeof body?.nextDestinationId === 'string' ? getDestinationById(body.nextDestinationId) : undefined;
  if (next === undefined) return NextResponse.json({ error: 'Unknown destination' }, { status: 400 });
  const ctx = await load(params.sessionId);
  if ('error' in ctx && ctx.error) return ctx.error;
  const { service, classId } = ctx as Exclude<typeof ctx, { error: unknown }>;
  const { error } = await service.from('class_world_flight_state').upsert({ class_id: classId, next_destination_id: next?.id ?? null }, { onConflict: 'class_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ nextDestinationId: next?.id ?? null });
}
