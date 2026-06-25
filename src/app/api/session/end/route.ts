import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { advanceWorldFlightExpedition, type WorldFlightExpeditionSnapshot } from '@/lib/world-flight/expeditions';
import {
  calculateWorldFlightReward,
  getWorldFlightUpgradeState,
  type WorldFlightProgressionRewardResult,
} from '@/lib/world-flight/progression';

export const dynamic = 'force-dynamic';

async function advanceActiveExpedition(classId: string, sessionId: string) {
  const service = createServiceClient();
  const [{ data: leg }, { data: run }] = await Promise.all([
    service
      .from('class_world_flight_legs')
      .select('destination_id')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .maybeSingle(),
    service
      .from('class_world_flight_expedition_runs')
      .select('id, expedition_snapshot, visited_destination_ids')
      .eq('class_id', classId)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  if (!leg || !run) return;
  const progress = advanceWorldFlightExpedition(
    run.expedition_snapshot as WorldFlightExpeditionSnapshot,
    run.visited_destination_ids ?? [],
    leg.destination_id,
  );
  if ((run.visited_destination_ids ?? []).length === progress.visitedDestinationIds.length) return;

  const now = new Date().toISOString();
  const { error } = await service
    .from('class_world_flight_expedition_runs')
    .update({
      visited_destination_ids: progress.visitedDestinationIds,
      status: progress.complete ? 'completed' : 'active',
      completed_at: progress.complete ? now : null,
      updated_at: now,
    })
    .eq('id', run.id)
    .eq('status', 'active');
  if (error) throw error;
}

async function awardWorldFlightProgression(
  classId: string,
  sessionId: string,
): Promise<WorldFlightProgressionRewardResult | null> {
  const service = createServiceClient();
  const [{ data: leg }, { data: participants }, { data: scores }] = await Promise.all([
    service
      .from('class_world_flight_legs')
      .select('id')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .maybeSingle(),
    service
      .from('session_participants')
      .select('client_id, student_id')
      .eq('session_id', sessionId),
    service
      .from('scores')
      .select('client_id, student_id, outcome, accuracy_status, counts_for_accuracy, counts_for_leaderboard, response_data')
      .eq('session_id', sessionId),
  ]);
  if (!leg) return null;

  const reward = calculateWorldFlightReward(
    (participants ?? []).map((participant) => ({
      clientId: participant.client_id,
      studentId: participant.student_id,
    })),
    (scores ?? []).map((score) => ({
      clientId: score.client_id,
      studentId: score.student_id,
      outcome: score.outcome,
      accuracyStatus: score.accuracy_status,
      countsForAccuracy: score.counts_for_accuracy,
      countsForLeaderboard: score.counts_for_leaderboard,
      responseType: typeof score.response_data?.type === 'string' ? score.response_data.type : null,
    })),
  );

  const { data, error } = await service.rpc('record_world_flight_reward', {
    p_class_id: classId,
    p_session_id: sessionId,
    p_leg_id: leg.id,
    p_flight_hours_awarded: reward.flightHoursAwarded,
    p_crew_stars_awarded: reward.crewStarsAwarded,
    p_everyone_aboard: reward.snapshot.everyoneAboardEarned,
    p_strong_landing: reward.snapshot.strongLandingEarned,
    p_reward_snapshot: reward.snapshot,
  });
  if (error) throw error;
  const totals = data as { flightHours?: number; crewStars?: number; alreadyRecorded?: boolean } | null;
  const { data: state } = await service
    .from('class_world_flight_state')
    .select('plane_tier, range_km, flight_hours, crew_stars')
    .eq('class_id', classId)
    .maybeSingle();
  const flightHours = state?.flight_hours ?? totals?.flightHours ?? 0;
  const crewStars = state?.crew_stars ?? totals?.crewStars ?? 0;

  return {
    ...reward,
    flightHours,
    crewStars,
    alreadyRecorded: totals?.alreadyRecorded ?? false,
    upgradeState: state
      ? getWorldFlightUpgradeState({
          planeTier: state.plane_tier,
          rangeKm: state.range_km,
          flightHours,
          crewStars,
        })
      : null,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = body?.sessionId;
  const completed = body?.completed;

  if (!sessionId || typeof sessionId !== 'string' || typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'sessionId and completed are required' }, { status: 400 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id);
  if (ownership.error) return ownership.error;

  const supabase = createServerSupabase();

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ legStatus: 'none', currentDestinationId: null });
  }

  const { data, error } = await supabase.rpc('finish_world_flight_session', {
    p_session_id: sessionId,
    p_completed: completed,
  });

  if (error) {
    console.error('[api/session/end] finish_world_flight_session error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let progressionReward: WorldFlightProgressionRewardResult | null = null;
  if ((data as { legStatus?: string } | null)?.legStatus === 'completed') {
    try {
      progressionReward = await awardWorldFlightProgression(ownership.session.class_id, sessionId);
    } catch (progressionError) {
      console.error('[api/session/end] World Flight collaborative progression error:', progressionError);
    }
    try {
      await advanceActiveExpedition(ownership.session.class_id, sessionId);
    } catch (expeditionError) {
      console.error('[api/session/end] expedition progress error:', expeditionError);
    }
  }

  // Course Builder: if this session was launched from a course lesson, mark that lesson
  // completed so the course's "Next up" advances. (v2: write end-of-session lesson_memory
  // here — vocab covered, struggles — to carry forward into the next lesson.)
  if (completed) {
    try {
      await supabase.from('course_lessons').update({ status: 'completed' }).eq('session_id', sessionId);
    } catch (courseError) {
      console.error('[api/session/end] course lesson completion error:', courseError);
    }
  }

  return NextResponse.json({
    ...(data ?? { legStatus: 'none', currentDestinationId: null }),
    progressionReward,
  });
}
