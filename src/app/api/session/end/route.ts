import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { advanceWorldFlightExpedition, type WorldFlightExpeditionSnapshot } from '@/lib/world-flight/expeditions';
import {
  calculateWorldFlightSessionMetrics,
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
      .select('client_id, student_id, outcome, accuracy_status, counts_for_accuracy, counts_for_leaderboard, response_data, streak_count')
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
    .select('plane_tier, plane_key, plane_selection_required, range_km, flight_hours, crew_stars')
    .eq('class_id', classId)
    .maybeSingle();
  const flightHours = state?.flight_hours ?? totals?.flightHours ?? 0;
  const crewStars = state?.crew_stars ?? totals?.crewStars ?? 0;
  const sessionMetrics = calculateWorldFlightSessionMetrics((scores ?? []).map((score) => ({
    clientId: score.client_id,
    studentId: score.student_id,
    countsForLeaderboard: score.counts_for_leaderboard,
    countsForAccuracy: score.counts_for_accuracy,
    accuracyStatus: score.accuracy_status,
    streakCount: score.streak_count,
    responseData: score.response_data,
  })));

  return {
    ...reward,
    flightHours,
    crewStars,
    alreadyRecorded: totals?.alreadyRecorded ?? false,
    sessionResponseCount: sessionMetrics.responseCount,
    sessionAccuracyRate: sessionMetrics.accuracyRate,
    sessionBestStreak: sessionMetrics.bestStreak,
    planeTier: state?.plane_tier ?? null,
    planeKey: state?.plane_key ?? null,
    planeSelectionRequired: state?.plane_selection_required ?? false,
    rangeKm: state?.range_km ?? null,
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

/**
 * Captain of the Day: crown the session's top scorer(s) among roster students so they can wear
 * the wings insignia next session. Ties → every tied student is crowned. Leaves the previous
 * captain(s) untouched when this session has no roster winner (no scores, or only anonymous
 * joiners), so the honor persists rather than vanishing after a scoreless meeting.
 */
async function persistCaptainOfTheDay(classId: string, sessionId: string) {
  const service = createServiceClient();
  const { data: scores } = await service
    .from('scores')
    .select('student_id, points, streak_bonus, counts_for_leaderboard')
    .eq('session_id', sessionId);
  if (!scores || scores.length === 0) return;

  const totals = new Map<string, number>();
  for (const score of scores) {
    if (!score.student_id) continue; // roster students only — insignia needs a durable identity
    if (score.counts_for_leaderboard === false) continue;
    const pts = (score.points ?? 0) + (score.streak_bonus ?? 0);
    totals.set(score.student_id, (totals.get(score.student_id) ?? 0) + pts);
  }
  if (totals.size === 0) return;

  const max = Math.max(...Array.from(totals.values()));
  if (max <= 0) return; // nobody scored positively — keep the reigning captain

  const winners = Array.from(totals.entries()).filter(([, v]) => v === max).map(([id]) => id);

  // Clear the whole class, then crown the new captain(s). Single teacher ends a session, so
  // the two writes don't race.
  await service.from('students').update({ is_captain_of_the_day: false }).eq('class_id', classId);
  await service.from('students').update({ is_captain_of_the_day: true }).in('id', winners);
}

async function getCompletedCourseContext(sessionId: string) {
  const service = createServiceClient();
  const { data: lesson, error } = await service
    .from('course_lessons')
    .select('id, course_id, order_index, title')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!lesson) return null;

  const { data: nextLesson, error: nextError } = await service
    .from('course_lessons')
    .select('id, order_index, title')
    .eq('course_id', lesson.course_id)
    .eq('status', 'planned')
    .gt('order_index', lesson.order_index)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (nextError) throw nextError;

  return {
    courseId: lesson.course_id as string,
    completedLessonId: lesson.id as string,
    completedLessonTitle: lesson.title as string,
    nextLesson: nextLesson
      ? {
          id: nextLesson.id as string,
          title: nextLesson.title as string,
          orderIndex: nextLesson.order_index as number,
        }
      : null,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = body?.sessionId;
  const completed = body?.completed;
  const tripSummary = typeof body?.tripSummary === 'string' && body.tripSummary.trim()
    ? body.tripSummary.trim().slice(0, 600)
    : null;

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
    // Travel arc: fold the trip log into the completed leg's evidence snapshot so the
    // journey (stamps, share page, design missions) remembers what the class actually did.
    if (tripSummary) {
      try {
        const service = createServiceClient();
        const { data: leg } = await service
          .from('class_world_flight_legs')
          .select('id, evidence_snapshot')
          .eq('session_id', sessionId)
          .eq('status', 'completed')
          .maybeSingle();
        if (leg) {
          await service
            .from('class_world_flight_legs')
            .update({ evidence_snapshot: { ...(leg.evidence_snapshot ?? {}), tripSummary } })
            .eq('id', leg.id);
        }
      } catch (tripError) {
        console.error('[api/session/end] trip summary merge error:', tripError);
      }
    }
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
  let courseContext: Awaited<ReturnType<typeof getCompletedCourseContext>> = null;
  if (completed) {
    try {
      await supabase.from('course_lessons').update({ status: 'completed' }).eq('session_id', sessionId);
      courseContext = await getCompletedCourseContext(sessionId);
    } catch (courseError) {
      console.error('[api/session/end] course lesson completion error:', courseError);
    }
  }

  // Crown Captain of the Day for the next session (best-effort; never blocks ending).
  try {
    await persistCaptainOfTheDay(ownership.session.class_id, sessionId);
  } catch (captainError) {
    console.error('[api/session/end] captain of the day error:', captainError);
  }

  const worldFlightData = data as { legStatus?: string; currentDestinationId?: string | null } | null;
  return NextResponse.json({
    ...(data ?? { legStatus: 'none', currentDestinationId: null }),
    progressionReward,
    courseContext,
    worldFlightContext: worldFlightData?.legStatus === 'completed'
      ? {
          completed: true,
          currentDestinationId: worldFlightData.currentDestinationId ?? null,
        }
      : null,
  });
}
