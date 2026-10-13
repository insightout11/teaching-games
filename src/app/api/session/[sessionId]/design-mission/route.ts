import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { buildWorldFlightDesignMissionContext, type CompletedWorldFlightEvidence } from '@/lib/world-flight/investigations';
import { getDestinationById } from '@/data/world-flight/destinations';
import { buildVisitOnlySnapshot, DESIGN_MISSION_FOCUS_ID } from '@/lib/world-flight/journey';

export const dynamic = 'force-dynamic';

/**
 * Start a World Flight Design mission inside the running Live Room session (the map page starts one by creating
 * a new session; the room already has one). The mission is built only from evidence the class really collected:
 * the city lessons it has done. Returns the mission and the Design Studio content to run it.
 */
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;
  const classId = owned.session.class_id;
  const body = await request.json().catch(() => null);
  const investigationId = typeof body?.investigationId === 'string' ? body.investigationId : '';
  if (!investigationId) return NextResponse.json({ error: 'investigationId is required' }, { status: 400 });

  const service = createServiceClient();
  const [{ data: legs, error: legsError }, { data: done }] = await Promise.all([
    service.from('class_world_flight_legs').select('destination_id, completed_at, evidence_snapshot').eq('class_id', classId).in('status', ['completed', 'taught']).order('completed_at', { ascending: true }),
    service.from('class_world_flight_design_missions').select('id').eq('class_id', classId).eq('investigation_id', investigationId).eq('status', 'completed').maybeSingle(),
  ]);
  if (legsError) return NextResponse.json({ error: legsError.message }, { status: 500 });
  if (done) return NextResponse.json({ error: 'This design mission has already been completed' }, { status: 409 });

  const mission = buildWorldFlightDesignMissionContext(
    investigationId,
    ((legs ?? []) as Array<{ destination_id: string; completed_at: string | null; evidence_snapshot: CompletedWorldFlightEvidence['evidenceSnapshot'] }>)
      .map((leg) => ({ destinationId: leg.destination_id, completedAt: leg.completed_at, evidenceSnapshot: leg.evidence_snapshot })),
  );
  if (!mission) return NextResponse.json({ error: 'This investigation does not yet have enough completed evidence' }, { status: 400 });

  const { error: sessionError } = await service.from('sessions').update({ world_flight_design_mission_context: mission }).eq('id', params.sessionId);
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });
  const { error: missionError } = await service.from('class_world_flight_design_missions').upsert(
    { class_id: classId, session_id: params.sessionId, investigation_id: investigationId, mission_context: mission, status: 'planned' },
    { onConflict: 'session_id' },
  );
  if (missionError) return NextResponse.json({ error: missionError.message }, { status: 500 });

  // The mission is a lesson like any other, so it earns its flight hour and stars: recorded as taught where the
  // class is (no move, no stamp, and no evidence of its own). Never replaces a flight this session already has.
  const { data: state } = await service.from('class_world_flight_state').select('current_destination_id').eq('class_id', classId).maybeSingle();
  const here = state?.current_destination_id ? getDestinationById(state.current_destination_id) : undefined;
  if (here) {
    const { error: legError } = await service.from('class_world_flight_legs').upsert(
      {
        class_id: classId,
        session_id: params.sessionId,
        origin_destination_id: here.id,
        destination_id: here.id,
        focus_id: DESIGN_MISSION_FOCUS_ID,
        distance_km: 0,
        evidence_snapshot: { ...buildVisitOnlySnapshot(here), focusId: DESIGN_MISSION_FOCUS_ID, focusTitle: `Design mission: ${mission.designMissionTitle}` },
        moves_class: false,
        status: 'planned',
      },
      { onConflict: 'session_id', ignoreDuplicates: true },
    );
    if (legError) console.error('[design-mission] flight record failed:', legError.message);
  }

  return NextResponse.json({
    mission,
    content: {
      activityKey: 'design-studio',
      topicContext: mission.designMissionTitle,
      challenge: `${mission.designMissionTitle}: ${mission.question}`,
      openingPrompt: 'What should the class design using what it learned across these cities?',
      successCriteria: mission.successCriteria,
      maxDecisions: 6,
      worldFlightMission: mission,
    },
  });
}
