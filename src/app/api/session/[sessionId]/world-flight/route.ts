import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { getDestinationById, STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { deriveWorldFlightInvestigationProgress, type CompletedWorldFlightEvidence } from '@/lib/world-flight/investigations';
import { deriveWorldFlightExpeditionProgress, getWorldFlightExpedition, WORLD_FLIGHT_EXPEDITIONS } from '@/lib/world-flight/expeditions';
import { NO_CITY_LESSON_FOCUS_ID } from '@/lib/world-flight/journey';
import { calculateWorldFlightReward, getWorldFlightUpgradeState } from '@/lib/world-flight/progression';
import { DEFAULT_PLANE_KEY, getPlaneTier } from '@/lib/plane-progression';

export const dynamic = 'force-dynamic';

/**
 * The class's World Flight record, for the Live Room's Passport and Hangar and for the landing card: stamps, the
 * flight log, progress on investigations and the active expedition, hours, stars and the plane. Read-only. Nothing
 * here names a student, so it is safe on the shared screen.
 *
 * `landing`: what THIS lesson has earned so far (worked out from the scores, not yet saved; the end of the session
 * records it).
 */
export async function GET(_request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;
  const classId = owned.session.class_id;
  const service = createServiceClient();

  const [{ data: state }, { data: legRows }, { data: missions }, { data: run }, { data: participants }, { data: scores }, { count: rosterCount }] = await Promise.all([
    service.from('class_world_flight_state').select('current_destination_id, plane_tier, plane_key, plane_selection_required, range_km, flight_hours, crew_stars').eq('class_id', classId).maybeSingle(),
    service.from('class_world_flight_legs').select('session_id, origin_destination_id, destination_id, focus_id, distance_km, completed_at, evidence_snapshot, status, moves_class').eq('class_id', classId).in('status', ['completed', 'taught', 'planned']).order('completed_at', { ascending: true }).limit(400),
    service.from('class_world_flight_design_missions').select('investigation_id, completed_at').eq('class_id', classId).eq('status', 'completed'),
    service.from('class_world_flight_expedition_runs').select('id, expedition_id, status, visited_destination_ids').eq('class_id', classId).in('status', ['active', 'paused']).order('activated_at', { ascending: false }).limit(1).maybeSingle(),
    service.from('session_participants').select('client_id, student_id').eq('session_id', params.sessionId),
    service.from('scores').select('client_id, student_id, outcome, accuracy_status, counts_for_accuracy, counts_for_leaderboard, response_data').eq('session_id', params.sessionId),
    service.from('students').select('id', { count: 'exact', head: true }).eq('class_id', classId),
  ]);

  type LegRow = { session_id: string; origin_destination_id: string | null; destination_id: string; focus_id: string; distance_km: number | null; completed_at: string | null; evidence_snapshot: CompletedWorldFlightEvidence['evidenceSnapshot'] | null; status: string; moves_class: boolean | null };
  const rows = (legRows ?? []) as LegRow[];
  const done = rows.filter((l) => l.status !== 'planned');
  const thisLeg = rows.find((l) => l.session_id === params.sessionId) ?? null;

  const flights = done.map((l) => ({
    destinationId: l.destination_id,
    city: getDestinationById(l.destination_id)?.city ?? l.evidence_snapshot?.city ?? l.destination_id,
    from: l.origin_destination_id ? getDestinationById(l.origin_destination_id)?.city ?? null : null,
    lesson: l.focus_id === NO_CITY_LESSON_FOCUS_ID ? null : l.evidence_snapshot?.focusTitle ?? null,
    // 'taught' = the city's lesson was done without flying there: no stamp.
    flew: l.status === 'completed',
    km: Math.round(l.distance_km ?? 0),
    at: l.completed_at,
  }));
  const stamps = Array.from(new Map(flights.filter((f) => f.flew).map((f) => [f.destinationId, { destinationId: f.destinationId, city: f.city, at: f.at }])).values());

  const completedMissionIds = new Set(((missions ?? []) as Array<{ investigation_id: string }>).map((m) => m.investigation_id));
  const investigations = deriveWorldFlightInvestigationProgress(
    done.filter((l) => l.evidence_snapshot).map((l) => ({ destinationId: l.destination_id, completedAt: l.completed_at, evidenceSnapshot: l.evidence_snapshot as CompletedWorldFlightEvidence['evidenceSnapshot'] })),
  ).map((inv) => ({
    id: inv.id,
    title: inv.title,
    question: inv.question,
    found: inv.completedCount,
    total: inv.totalCount,
    designDone: completedMissionIds.has(inv.id),
    clues: inv.requirements.map((r) => ({ label: r.label, done: r.complete, where: r.evidence ? `${r.evidence.city}: ${r.evidence.focusTitle}` : null })),
  }));

  const expeditionRow = run as { id: string; expedition_id: string; status: string; visited_destination_ids: string[] | null } | null;
  const expeditionDef = expeditionRow ? getWorldFlightExpedition(expeditionRow.expedition_id) : null;
  const expeditionProgress = expeditionDef ? deriveWorldFlightExpeditionProgress(expeditionDef, expeditionRow?.visited_destination_ids ?? []) : null;
  const expedition = expeditionDef && expeditionProgress && expeditionRow ? {
    runId: expeditionRow.id,
    expeditionId: expeditionDef.id,
    paused: expeditionRow.status === 'paused',
    title: expeditionDef.title,
    question: expeditionDef.centralQuestion,
    done: expeditionProgress.completedStopCount,
    needed: expeditionProgress.requiredStopCount,
    remaining: expeditionProgress.remainingDestinationIds.map((id) => getDestinationById(id)?.city ?? id),
  } : null;

  // Every expedition the class could start, with how many of its stops it has already stamped.
  const expeditions = WORLD_FLIGHT_EXPEDITIONS.map((e) => ({
    id: e.id,
    title: e.title,
    subtitle: e.subtitle,
    lessons: e.estimatedLessons,
    needed: e.requiredStopCount,
    stops: e.stops.map((stop) => getDestinationById(stop.destinationId)?.city ?? stop.destinationId),
  }));

  const flightHours = state?.flight_hours ?? 0;
  const crewStars = state?.crew_stars ?? 0;
  const planeTier = state?.plane_tier ?? 0;
  const rangeKm = state?.range_km ?? STARTER_PLANE_RANGE_KM;
  const upgradeNow = getWorldFlightUpgradeState({ planeTier, rangeKm, flightHours, crewStars });
  // The planes the class may choose between right now (an upgrade is ready, or a choice is still waiting).
  const choiceTier = state?.plane_selection_required ? planeTier : upgradeNow.claimableTier;
  const hangar = {
    planeChoices: choiceTier !== null && choiceTier !== undefined ? getPlaneTier(choiceTier).choices.map((plane) => plane.name) : [],
    flightHours,
    crewStars,
    planeTier,
    planeKey: state?.plane_key ?? DEFAULT_PLANE_KEY,
    planeSelectionRequired: state?.plane_selection_required ?? false,
    rangeKm,
    upgradeState: upgradeNow,
  };

  // This lesson so far. Only a lesson with a flight record earns (it took off, or it is a city lesson taught from here).
  const reward = calculateWorldFlightReward(
    ((participants ?? []) as Array<{ client_id: string; student_id: string | null }>).map((p) => ({ clientId: p.client_id, studentId: p.student_id })),
    ((scores ?? []) as Array<{ client_id: string | null; student_id: string | null; outcome: string | null; accuracy_status: string | null; counts_for_accuracy: boolean | null; counts_for_leaderboard: boolean | null; response_data: Record<string, unknown> | null }>).map((s) => ({
      clientId: s.client_id,
      studentId: s.student_id,
      outcome: s.outcome,
      accuracyStatus: s.accuracy_status,
      countsForAccuracy: s.counts_for_accuracy,
      countsForLeaderboard: s.counts_for_leaderboard,
      responseType: typeof s.response_data?.type === 'string' ? s.response_data.type : null,
    })),
    rosterCount ?? 0,
  );
  const alreadySaved = thisLeg ? thisLeg.status !== 'planned' : false;
  const landing = thisLeg ? {
    city: getDestinationById(thisLeg.destination_id)?.city ?? thisLeg.destination_id,
    moves: thisLeg.status !== 'taught' && thisLeg.moves_class !== false,
    newCity: !done.some((l) => l.status === 'completed' && l.destination_id === thisLeg.destination_id && l.session_id !== params.sessionId),
    lesson: thisLeg.focus_id === NO_CITY_LESSON_FOCUS_ID ? null : thisLeg.evidence_snapshot?.focusTitle ?? null,
    everyoneAboard: reward.snapshot.everyoneAboardEarned,
    strongLanding: reward.snapshot.strongLandingEarned,
    stars: reward.crewStarsAwarded,
    // Totals as they will stand once this lesson is saved.
    after: getWorldFlightUpgradeState({ planeTier, rangeKm, flightHours: flightHours + (alreadySaved ? 0 : 1), crewStars: crewStars + (alreadySaved ? 0 : reward.crewStarsAwarded) }),
    hoursAfter: flightHours + (alreadySaved ? 0 : 1),
    starsAfter: crewStars + (alreadySaved ? 0 : reward.crewStarsAwarded),
  } : null;

  return NextResponse.json({ classId, currentCity: state?.current_destination_id ? getDestinationById(state.current_destination_id)?.city ?? null : null, stamps, flights: flights.reverse(), investigations, expedition, expeditions, hangar, landing });
}
