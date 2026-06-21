import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import {
  getWorldFlightRangeForTier,
  getWorldFlightUpgradeState,
  type WorldFlightUpgradeState,
} from '@/lib/world-flight/progression';

export const dynamic = 'force-dynamic';

interface WorldFlightStateRow {
  class_id: string;
  current_destination_id: string | null;
  plane_tier: number;
  plane_key: string;
  range_km: number;
  flight_hours: number;
  crew_stars: number;
}

interface WorldFlightUpgradeClassState {
  classId: string;
  currentDestinationId: string | null;
  planeTier: number;
  planeKey: string;
  rangeKm: number;
  flightHours: number;
  crewStars: number;
}

function toClassState(row: WorldFlightStateRow): WorldFlightUpgradeClassState {
  return {
    classId: row.class_id,
    currentDestinationId: row.current_destination_id,
    planeTier: row.plane_tier,
    planeKey: row.plane_key,
    rangeKm: row.range_km,
    flightHours: row.flight_hours,
    crewStars: row.crew_stars,
  };
}

function upgradeStateFor(row: WorldFlightStateRow): WorldFlightUpgradeState {
  return getWorldFlightUpgradeState({
    planeTier: row.plane_tier,
    rangeKm: row.range_km,
    flightHours: row.flight_hours,
    crewStars: row.crew_stars,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { classId?: unknown } | null;
  const classId = typeof body?.classId === 'string' ? body.classId : '';
  if (!classId) return NextResponse.json({ error: 'classId is required' }, { status: 400 });

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const mockRange = getWorldFlightRangeForTier(1).rangeKm;
    const state: WorldFlightUpgradeClassState = {
      classId,
      currentDestinationId: null,
      planeTier: 1,
      planeKey: 'starter-biplane',
      rangeKm: mockRange,
      flightHours: 3,
      crewStars: 3,
    };
    return NextResponse.json({
      state,
      upgradeState: getWorldFlightUpgradeState({
        planeTier: state.planeTier,
        rangeKm: state.rangeKm,
        flightHours: state.flightHours,
        crewStars: state.crewStars,
      }),
    });
  }

  const service = createServiceClient();
  const { data: ownedClass } = await service
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', teacher.id)
    .maybeSingle();
  if (!ownedClass) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

  const { data: currentRow, error: stateError } = await service
    .from('class_world_flight_state')
    .select('class_id, current_destination_id, plane_tier, plane_key, range_km, flight_hours, crew_stars')
    .eq('class_id', classId)
    .maybeSingle();
  if (stateError) return NextResponse.json({ error: stateError.message }, { status: 500 });
  if (!currentRow) {
    return NextResponse.json({ error: 'Complete a World Flight lesson before claiming upgrades' }, { status: 409 });
  }

  const currentState = currentRow as WorldFlightStateRow;
  const currentUpgradeState = upgradeStateFor(currentState);
  if (currentUpgradeState.claimableTier === null) {
    return NextResponse.json({
      error: 'No range upgrade is ready yet',
      state: toClassState(currentState),
      upgradeState: currentUpgradeState,
    }, { status: 409 });
  }

  const nextRangeTier = getWorldFlightRangeForTier(currentUpgradeState.claimableTier);
  const { data: updatedRow, error: updateError } = await service
    .from('class_world_flight_state')
    .update({
      plane_tier: nextRangeTier.tier,
      range_km: nextRangeTier.rangeKm,
      updated_at: new Date().toISOString(),
    })
    .eq('class_id', classId)
    .eq('plane_tier', currentState.plane_tier)
    .select('class_id, current_destination_id, plane_tier, plane_key, range_km, flight_hours, crew_stars')
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!updatedRow) {
    return NextResponse.json({ error: 'Upgrade state changed. Refresh and try again.' }, { status: 409 });
  }

  const updatedState = updatedRow as WorldFlightStateRow;
  return NextResponse.json({
    state: toClassState(updatedState),
    upgradeState: upgradeStateFor(updatedState),
  });
}
