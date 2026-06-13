import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import {
  buildWorldFlightExpeditionSnapshot,
  getWorldFlightExpedition,
  type WorldFlightExpeditionRunSummary,
  type WorldFlightExpeditionStatus,
} from '@/lib/world-flight/expeditions';

export const dynamic = 'force-dynamic';

type ExpeditionAction = 'activate' | 'pause' | 'resume' | 'leave';

function toSummary(row: {
  id: string;
  expedition_id: string;
  status: WorldFlightExpeditionStatus;
  visited_destination_ids: string[] | null;
  activated_at: string;
  paused_at: string | null;
  completed_at: string | null;
  left_at: string | null;
}): WorldFlightExpeditionRunSummary {
  return {
    id: row.id,
    expeditionId: row.expedition_id,
    status: row.status,
    visitedDestinationIds: row.visited_destination_ids ?? [],
    activatedAt: row.activated_at,
    pausedAt: row.paused_at,
    completedAt: row.completed_at,
    leftAt: row.left_at,
  };
}

function mockRun(action: ExpeditionAction, expeditionId: string, runId?: string): WorldFlightExpeditionRunSummary {
  const now = new Date().toISOString();
  const status = action === 'pause' ? 'paused' : action === 'leave' ? 'left' : 'active';
  return {
    id: runId ?? crypto.randomUUID(),
    expeditionId,
    status,
    visitedDestinationIds: [],
    activatedAt: now,
    pausedAt: status === 'paused' ? now : null,
    completedAt: null,
    leftAt: status === 'left' ? now : null,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    classId?: unknown;
    action?: unknown;
    expeditionId?: unknown;
    runId?: unknown;
  } | null;
  const classId = typeof body?.classId === 'string' ? body.classId : '';
  const action = body?.action as ExpeditionAction | undefined;
  const expeditionId = typeof body?.expeditionId === 'string' ? body.expeditionId : '';
  const runId = typeof body?.runId === 'string' ? body.runId : undefined;

  if (!classId || !action || !['activate', 'pause', 'resume', 'leave'].includes(action)) {
    return NextResponse.json({ error: 'classId and a valid action are required' }, { status: 400 });
  }
  if (action === 'activate' && !getWorldFlightExpedition(expeditionId)) {
    return NextResponse.json({ error: 'Expedition not found' }, { status: 404 });
  }
  if (action !== 'activate' && (!runId || !expeditionId)) {
    return NextResponse.json({ error: 'runId and expeditionId are required' }, { status: 400 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ run: mockRun(action, expeditionId, runId) });
  }

  const service = createServiceClient();
  const { data: ownedClass } = await service
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', teacher.id)
    .maybeSingle();
  if (!ownedClass) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

  if (action === 'activate') {
    const expedition = getWorldFlightExpedition(expeditionId)!;
    const now = new Date().toISOString();
    const { error: leaveError } = await service
      .from('class_world_flight_expedition_runs')
      .update({ status: 'left', left_at: now, updated_at: now })
      .eq('class_id', classId)
      .in('status', ['active', 'paused']);
    if (leaveError) return NextResponse.json({ error: leaveError.message }, { status: 500 });

    const { data: row, error } = await service
      .from('class_world_flight_expedition_runs')
      .insert({
        class_id: classId,
        expedition_id: expedition.id,
        expedition_snapshot: buildWorldFlightExpeditionSnapshot(expedition),
      })
      .select('id, expedition_id, status, visited_destination_ids, activated_at, paused_at, completed_at, left_at')
      .single();
    if (error || !row) return NextResponse.json({ error: error?.message ?? 'Failed to activate expedition' }, { status: 500 });
    return NextResponse.json({ run: toSummary(row) });
  }

  const nextStatus: WorldFlightExpeditionStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'left';
  const now = new Date().toISOString();
  const updates = {
    status: nextStatus,
    paused_at: action === 'pause' ? now : null,
    left_at: action === 'leave' ? now : null,
    updated_at: now,
  };
  const { data: row, error } = await service
    .from('class_world_flight_expedition_runs')
    .update(updates)
    .eq('id', runId)
    .eq('class_id', classId)
    .eq('expedition_id', expeditionId)
    .in('status', action === 'resume' ? ['paused'] : ['active', 'paused'])
    .select('id, expedition_id, status, visited_destination_ids, activated_at, paused_at, completed_at, left_at')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Expedition run is not available for this action' }, { status: 409 });
  return NextResponse.json({ run: toSummary(row) });
}
