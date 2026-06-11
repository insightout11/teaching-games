import { WorldFlightPage } from '@/components/world-flight/world-flight-page';
import { STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { createServerSupabase } from '@/lib/supabase/server';
import type { WorldFlightClassSummary } from '@/lib/world-flight/journey';
import {
  deriveWorldFlightInvestigationProgress,
  type CompletedWorldFlightEvidence,
} from '@/lib/world-flight/investigations';

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
  }> = [];
  let completedLegRows: Array<{
    class_id: string;
    destination_id: string;
    completed_at: string | null;
    evidence_snapshot: CompletedWorldFlightEvidence['evidenceSnapshot'];
  }> = [];

  if (process.env.NEXT_PUBLIC_MOCK_MODE !== 'true' && classRows.length > 0) {
    const classIds = classRows.map((cls) => cls.id);
    const [stateResult, legsResult] = await Promise.all([
      supabase
        .from('class_world_flight_state')
        .select('class_id, current_destination_id, plane_tier, plane_key, range_km')
        .in('class_id', classIds),
      supabase
        .from('class_world_flight_legs')
        .select('class_id, destination_id, completed_at, evidence_snapshot')
        .in('class_id', classIds)
        .eq('status', 'completed')
        .order('completed_at', { ascending: true }),
    ]);
    stateRows = (stateResult.data ?? []) as typeof stateRows;
    completedLegRows = (legsResult.data ?? []) as typeof completedLegRows;
  }

  const stateByClass = new Map(stateRows.map((state) => [state.class_id, state]));
  const completedEvidenceByClass = new Map<string, CompletedWorldFlightEvidence[]>();
  for (const leg of completedLegRows) {
    const entries = completedEvidenceByClass.get(leg.class_id) ?? [];
    entries.push({
      destinationId: leg.destination_id,
      completedAt: leg.completed_at,
      evidenceSnapshot: leg.evidence_snapshot,
    });
    completedEvidenceByClass.set(leg.class_id, entries);
  }
  const initialClasses: WorldFlightClassSummary[] = classRows.map((cls) => {
    const state = stateByClass.get(cls.id);
    return {
      id: cls.id,
      name: cls.name,
      currentDestinationId: state?.current_destination_id ?? null,
      planeTier: state?.plane_tier ?? 0,
      planeKey: state?.plane_key ?? 'starter-biplane',
      rangeKm: state?.range_km ?? STARTER_PLANE_RANGE_KM,
      investigations: deriveWorldFlightInvestigationProgress(completedEvidenceByClass.get(cls.id) ?? []),
    };
  });

  return <WorldFlightPage initialClasses={initialClasses} />;
}
