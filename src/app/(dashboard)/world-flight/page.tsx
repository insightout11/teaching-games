import { WorldFlightPage } from '@/components/world-flight/world-flight-page';
import { STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  deriveVisitedDestinationIds,
  type WorldFlightClassSummary,
  type WorldFlightCompletedLegSummary,
} from '@/lib/world-flight/journey';
import {
  deriveInvestigationTags,
  deriveWorldFlightInvestigationProgress,
  type CompletedWorldFlightEvidence,
} from '@/lib/world-flight/investigations';
import type { WorldFlightExpeditionRunSummary, WorldFlightExpeditionStatus } from '@/lib/world-flight/expeditions';

export const dynamic = 'force-dynamic';

export default async function WorldFlightRoutePage() {
  const supabase = createServerSupabase();
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .order('created_at', { ascending: false }) as {
      data: Array<{ id: string; name: string }> | null;
    };

  const classRows = classes ?? [];
  let stateRows: Array<{
    class_id: string;
    current_destination_id: string | null;
    plane_tier: number;
    plane_key: string;
    range_km: number;
    flight_hours: number;
    crew_stars: number;
  }> = [];
  let completedLegRows: Array<{
    id: string;
    class_id: string;
    origin_destination_id: string | null;
    destination_id: string;
    focus_id: string;
    distance_km: number;
    completed_at: string | null;
    evidence_snapshot: CompletedWorldFlightEvidence['evidenceSnapshot'];
  }> = [];
  let completedMissionRows: Array<{
    class_id: string;
    investigation_id: string;
    completed_at: string | null;
    brief_snapshot: { title?: string };
  }> = [];
  let expeditionRunRows: Array<{
    id: string;
    class_id: string;
    expedition_id: string;
    status: WorldFlightExpeditionStatus;
    visited_destination_ids: string[];
    activated_at: string;
    paused_at: string | null;
    completed_at: string | null;
    left_at: string | null;
  }> = [];

  if (process.env.NEXT_PUBLIC_MOCK_MODE !== 'true' && classRows.length > 0) {
    const classIds = classRows.map((cls) => cls.id);
    const [stateResult, legsResult, missionsResult, expeditionsResult] = await Promise.all([
      supabase
        .from('class_world_flight_state')
        .select('class_id, current_destination_id, plane_tier, plane_key, range_km, flight_hours, crew_stars')
        .in('class_id', classIds),
      supabase
        .from('class_world_flight_legs')
        .select('id, class_id, origin_destination_id, destination_id, focus_id, distance_km, completed_at, evidence_snapshot')
        .in('class_id', classIds)
        .eq('status', 'completed')
        .order('completed_at', { ascending: true }),
      supabase
        .from('class_world_flight_design_missions')
        .select('class_id, investigation_id, completed_at, brief_snapshot')
        .in('class_id', classIds)
        .eq('status', 'completed')
        .order('completed_at', { ascending: true }),
      supabase
        .from('class_world_flight_expedition_runs')
        .select('id, class_id, expedition_id, status, visited_destination_ids, activated_at, paused_at, completed_at, left_at')
        .in('class_id', classIds)
        .order('activated_at', { ascending: false }),
    ]);
    stateRows = (stateResult.data ?? []) as typeof stateRows;
    completedLegRows = (legsResult.data ?? []) as typeof completedLegRows;
    completedMissionRows = (missionsResult.data ?? []) as typeof completedMissionRows;
    expeditionRunRows = (expeditionsResult.data ?? []) as typeof expeditionRunRows;
  }

  const stateByClass = new Map(stateRows.map((state) => [state.class_id, state]));
  const completedEvidenceByClass = new Map<string, CompletedWorldFlightEvidence[]>();
  const completedLegsByClass = new Map<string, WorldFlightCompletedLegSummary[]>();
  const completedMissionsByClass = new Map<string, Map<string, typeof completedMissionRows[number]>>();
  const expeditionRunsByClass = new Map<string, WorldFlightExpeditionRunSummary[]>();
  for (const run of expeditionRunRows) {
    const runs = expeditionRunsByClass.get(run.class_id) ?? [];
    runs.push({
      id: run.id,
      expeditionId: run.expedition_id,
      status: run.status,
      visitedDestinationIds: run.visited_destination_ids ?? [],
      activatedAt: run.activated_at,
      pausedAt: run.paused_at,
      completedAt: run.completed_at,
      leftAt: run.left_at,
    });
    expeditionRunsByClass.set(run.class_id, runs);
  }
  for (const mission of completedMissionRows) {
    const missions = completedMissionsByClass.get(mission.class_id) ?? new Map();
    missions.set(mission.investigation_id, mission);
    completedMissionsByClass.set(mission.class_id, missions);
  }
  for (const leg of completedLegRows) {
    const entries = completedEvidenceByClass.get(leg.class_id) ?? [];
    entries.push({
      destinationId: leg.destination_id,
      completedAt: leg.completed_at,
      evidenceSnapshot: leg.evidence_snapshot,
    });
    completedEvidenceByClass.set(leg.class_id, entries);

    const legs = completedLegsByClass.get(leg.class_id) ?? [];
    legs.push({
      id: leg.id,
      originDestinationId: leg.origin_destination_id,
      destinationId: leg.destination_id,
      focusId: leg.focus_id,
      focusTitle: leg.evidence_snapshot?.focusTitle ?? null,
      focusKind: leg.evidence_snapshot?.focusKind ?? null,
      publisher: leg.evidence_snapshot?.publisher ?? null,
      skills: Array.isArray(leg.evidence_snapshot?.skills) ? leg.evidence_snapshot.skills : [],
      fieldNotes: deriveInvestigationTags(
        Array.isArray(leg.evidence_snapshot?.skills) ? leg.evidence_snapshot.skills : [],
        Array.isArray(leg.evidence_snapshot?.investigationTags) ? leg.evidence_snapshot.investigationTags : [],
      ),
      keyIdea: leg.evidence_snapshot?.keyIdea ?? null,
      distanceKm: leg.distance_km ?? 0,
      completedAt: leg.completed_at,
    });
    completedLegsByClass.set(leg.class_id, legs);
  }
  const initialClasses: WorldFlightClassSummary[] = classRows.map((cls) => {
    const state = stateByClass.get(cls.id);
    const completedLegs = completedLegsByClass.get(cls.id) ?? [];
    const currentDestinationId = state?.current_destination_id ?? null;
    const completedMissions = completedMissionsByClass.get(cls.id) ?? new Map();
    return {
      id: cls.id,
      name: cls.name,
      currentDestinationId,
      planeTier: state?.plane_tier ?? 0,
      planeKey: state?.plane_key ?? 'starter-biplane',
      rangeKm: state?.range_km ?? STARTER_PLANE_RANGE_KM,
      flightHours: state?.flight_hours ?? 0,
      crewStars: state?.crew_stars ?? 0,
      visitedDestinationIds: deriveVisitedDestinationIds(currentDestinationId, completedLegs),
      completedLegCount: completedLegs.length,
      completedLegs,
      recentLegs: completedLegs.slice(-5).reverse(),
      investigations: deriveWorldFlightInvestigationProgress(completedEvidenceByClass.get(cls.id) ?? [])
        .map((investigation) => {
          const mission = completedMissions.get(investigation.id);
          return mission
            ? {
                ...investigation,
                designMissionStatus: 'completed' as const,
                completedDesignTitle: mission.brief_snapshot?.title ?? investigation.designMissionTitle,
                designMissionCompletedAt: mission.completed_at,
              }
            : investigation;
        }),
      expeditionRuns: expeditionRunsByClass.get(cls.id) ?? [],
    };
  });

  return <WorldFlightPage initialClasses={initialClasses} />;
}
