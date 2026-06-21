import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { getPlaneAsset, getPlaneRangeKm, isPlaneKeyInTier } from '@/lib/plane-progression';

export const dynamic = 'force-dynamic';

interface WorldFlightStateRow {
  class_id: string;
  current_destination_id: string | null;
  plane_tier: number;
  plane_key: string;
  plane_selection_required: boolean;
  range_km: number;
  flight_hours: number;
  crew_stars: number;
}

function toClassState(row: WorldFlightStateRow) {
  return {
    classId: row.class_id,
    currentDestinationId: row.current_destination_id,
    planeTier: row.plane_tier,
    planeKey: row.plane_key,
    planeSelectionRequired: row.plane_selection_required,
    rangeKm: row.range_km,
    flightHours: row.flight_hours,
    crewStars: row.crew_stars,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { classId?: unknown; planeKey?: unknown } | null;
  const classId = typeof body?.classId === 'string' ? body.classId : '';
  const planeKey = typeof body?.planeKey === 'string' ? body.planeKey : '';
  if (!classId) return NextResponse.json({ error: 'classId is required' }, { status: 400 });
  if (!planeKey) return NextResponse.json({ error: 'planeKey is required' }, { status: 400 });

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const plane = getPlaneAsset(planeKey);
    const rangeKm = getPlaneRangeKm(plane.key);
    return NextResponse.json({
      state: {
        classId,
        currentDestinationId: null,
        planeTier: 1,
        planeKey: plane.key,
        planeSelectionRequired: false,
        rangeKm,
        flightHours: 3,
        crewStars: 3,
      },
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
    .select('class_id, current_destination_id, plane_tier, plane_key, plane_selection_required, range_km, flight_hours, crew_stars')
    .eq('class_id', classId)
    .maybeSingle();
  if (stateError) return NextResponse.json({ error: stateError.message }, { status: 500 });
  if (!currentRow) return NextResponse.json({ error: 'World Flight state not found' }, { status: 404 });

  const currentState = currentRow as WorldFlightStateRow;
  const plane = getPlaneAsset(planeKey);
  if (!isPlaneKeyInTier(plane.key, currentState.plane_tier)) {
    return NextResponse.json({ error: 'Choose an aircraft from the current unlocked tier' }, { status: 400 });
  }

  const { data: updatedRow, error: updateError } = await service
    .from('class_world_flight_state')
    .update({
      plane_key: plane.key,
      range_km: getPlaneRangeKm(plane.key),
      plane_selection_required: false,
      updated_at: new Date().toISOString(),
    })
    .eq('class_id', classId)
    .select('class_id, current_destination_id, plane_tier, plane_key, plane_selection_required, range_km, flight_hours, crew_stars')
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!updatedRow) return NextResponse.json({ error: 'Failed to equip aircraft' }, { status: 500 });

  return NextResponse.json({ state: toClassState(updatedRow as WorldFlightStateRow) });
}
