import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireAuthWithCredits, consumeCredit } from '@/lib/auth-credits';
import { getDestinationById, STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { DEFAULT_PLANE_KEY } from '@/lib/plane-progression';
import { distanceKm } from '@/lib/world-flight/geo';
import {
  buildWorldFlightEvidenceSnapshot,
  parseWorldFlightLaunchContext,
  resolveWorldFlightMovement,
  type WorldFlightSessionContext,
} from '@/lib/world-flight/journey';
import {
  buildWorldFlightDesignMissionContext,
  parseWorldFlightDesignMissionLaunchContext,
  type CompletedWorldFlightEvidence,
  type WorldFlightDesignMissionContext,
} from '@/lib/world-flight/investigations';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const classId = body?.classId;
  const launchContext = parseWorldFlightLaunchContext(body?.worldFlightContext);
  const designMissionLaunchContext = parseWorldFlightDesignMissionLaunchContext(body?.worldFlightDesignMissionContext);

  if (!classId || typeof classId !== 'string') {
    return NextResponse.json({ error: 'classId is required' }, { status: 400 });
  }
  if (body?.worldFlightContext != null && !launchContext) {
    return NextResponse.json({ error: 'Invalid World Flight context' }, { status: 400 });
  }
  if (body?.worldFlightDesignMissionContext != null && !designMissionLaunchContext) {
    return NextResponse.json({ error: 'Invalid World Flight design mission context' }, { status: 400 });
  }
  if (launchContext && designMissionLaunchContext) {
    return NextResponse.json({ error: 'A session cannot be both a flight and a design mission' }, { status: 400 });
  }

  // Credit gate: 1 credit = 1 session. Pro/developer users are unlimited.
  const { teacher, error: authError } = await requireAuthWithCredits();
  if (authError) return authError;

  const supabase = createServerSupabase();

  // Verify class exists and belongs to teacher (RLS enforces ownership)
  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .single();

  if (classError || !cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  let session: { id: string } | null = null;
  let sessionError: { message?: string } | null = null;
  let resolvedWorldFlightContext: WorldFlightSessionContext | null = null;
  let resolvedWorldFlightDesignMissionContext: WorldFlightDesignMissionContext | null = null;

  if (launchContext) {
    const destination = getDestinationById(launchContext.destinationId);
    const focus = destination?.focusOptions.find((option) => option.id === launchContext.focusId);

    if (!destination || !focus) {
      return NextResponse.json({ error: 'World Flight destination or source not found' }, { status: 400 });
    }

    const { data: state } = await supabase
      .from('class_world_flight_state')
      .select('current_destination_id, range_km, plane_key, plane_selection_required')
      .eq('class_id', classId)
      .maybeSingle();

    const persistedOrigin = state?.current_destination_id
      ? getDestinationById(state.current_destination_id)
      : null;
    const selectedDeparture = !persistedOrigin && launchContext.departureDestinationId
      ? getDestinationById(launchContext.departureDestinationId)
      : null;
    const origin = persistedOrigin ?? selectedDeparture;
    if (!persistedOrigin && launchContext.requestedMove && !selectedDeparture) {
      return NextResponse.json({ error: 'Choose a departure city before the first World Flight lesson' }, { status: 400 });
    }
    if (selectedDeparture?.id === destination.id && launchContext.requestedMove) {
      return NextResponse.json({ error: 'The first destination must be different from the departure city' }, { status: 400 });
    }
    if (state?.plane_selection_required && launchContext.requestedMove) {
      return NextResponse.json({ error: 'Choose the class aircraft in World Flight before moving to another city' }, { status: 409 });
    }
    const rangeKm = state?.range_km ?? STARTER_PLANE_RANGE_KM;
    const planeKey = state?.plane_key ?? DEFAULT_PLANE_KEY;
    const resolvedDistanceKm = origin ? distanceKm(origin, destination) : 0;
    const movement = resolveWorldFlightMovement({
      originDestinationId: origin?.id ?? null,
      destinationId: destination.id,
      distanceKm: resolvedDistanceKm,
      rangeKm,
      requestedMove: launchContext.requestedMove,
    });
    const evidenceSnapshot = buildWorldFlightEvidenceSnapshot(destination, focus);

    resolvedWorldFlightContext = {
      ...launchContext,
      originDestinationId: origin?.id ?? null,
      distanceKm: resolvedDistanceKm,
      rangeKm,
      planeKey,
      movesClass: movement.movesClass,
      evidenceSnapshot,
    };

    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      const result = await supabase
        .from('sessions')
        .insert({ class_id: classId, world_flight_context: resolvedWorldFlightContext })
        .select('id')
        .single();
      session = result.data;
      sessionError = result.error;
    } else {
      const result = await supabase.rpc('create_world_flight_session', {
        p_class_id: classId,
        p_world_flight_context: resolvedWorldFlightContext,
        p_origin_destination_id: resolvedWorldFlightContext.originDestinationId,
        p_destination_id: destination.id,
        p_focus_id: focus.id,
        p_distance_km: resolvedDistanceKm,
        p_moves_class: movement.movesClass,
        p_evidence_snapshot: evidenceSnapshot,
      });
      session = result.data ? { id: result.data as string } : null;
      sessionError = result.error;
    }
  } else if (designMissionLaunchContext) {
    const { data: completedLegs, error: completedLegsError } = await supabase
      .from('class_world_flight_legs')
      .select('destination_id, completed_at, evidence_snapshot')
      .eq('class_id', classId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (completedLegsError) {
      return NextResponse.json({ error: completedLegsError.message }, { status: 500 });
    }

    const completedEvidence = (completedLegs ?? []).map((leg: {
      destination_id: string;
      completed_at: string | null;
      evidence_snapshot: CompletedWorldFlightEvidence['evidenceSnapshot'];
    }) => ({
      destinationId: leg.destination_id,
      completedAt: leg.completed_at,
      evidenceSnapshot: leg.evidence_snapshot,
    })) as CompletedWorldFlightEvidence[];
    resolvedWorldFlightDesignMissionContext = buildWorldFlightDesignMissionContext(
      designMissionLaunchContext.investigationId,
      completedEvidence,
    );

    if (!resolvedWorldFlightDesignMissionContext) {
      return NextResponse.json({ error: 'This investigation does not yet have enough completed evidence' }, { status: 400 });
    }

    const { data: completedMission } = await supabase
      .from('class_world_flight_design_missions')
      .select('id')
      .eq('class_id', classId)
      .eq('investigation_id', designMissionLaunchContext.investigationId)
      .eq('status', 'completed')
      .maybeSingle();

    if (completedMission) {
      return NextResponse.json({ error: 'This design mission has already been completed' }, { status: 409 });
    }

    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      const result = await supabase
        .from('sessions')
        .insert({
          class_id: classId,
          world_flight_design_mission_context: resolvedWorldFlightDesignMissionContext,
        })
        .select('id')
        .single();
      session = result.data;
      sessionError = result.error;
    } else {
      const result = await supabase.rpc('create_world_flight_design_mission_session', {
        p_class_id: classId,
        p_mission_context: resolvedWorldFlightDesignMissionContext,
      });
      session = result.data ? { id: result.data as string } : null;
      sessionError = result.error;
    }
  } else {
    const result = await supabase
      .from('sessions')
      .insert({ class_id: classId })
      .select('id')
      .single();
    session = result.data;
    sessionError = result.error;
  }

  if (sessionError || !session) {
    return NextResponse.json(
      { error: sessionError?.message ?? 'Failed to create session' },
      { status: 500 },
    );
  }

  // Consume 1 credit for Standard-tier teachers (Pro/developer are unlimited)
  if (teacher && !teacher.isPro && !teacher.isDeveloper) {
    await consumeCredit(teacher.id);
  }

  return NextResponse.json({
    sessionId: session.id,
    ...(resolvedWorldFlightContext ? { worldFlightContext: resolvedWorldFlightContext } : {}),
    ...(resolvedWorldFlightDesignMissionContext
      ? { worldFlightDesignMissionContext: resolvedWorldFlightDesignMissionContext }
      : {}),
  });
}
