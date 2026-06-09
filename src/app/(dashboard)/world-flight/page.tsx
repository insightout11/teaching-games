import { WorldFlightPage } from '@/components/world-flight/world-flight-page';
import { STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { createServerSupabase } from '@/lib/supabase/server';
import type { WorldFlightClassSummary } from '@/lib/world-flight/journey';

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

  if (process.env.NEXT_PUBLIC_MOCK_MODE !== 'true' && classRows.length > 0) {
    const { data } = await supabase
      .from('class_world_flight_state')
      .select('class_id, current_destination_id, plane_tier, plane_key, range_km')
      .in('class_id', classRows.map((cls) => cls.id)) as {
        data: typeof stateRows | null;
      };
    stateRows = data ?? [];
  }

  const stateByClass = new Map(stateRows.map((state) => [state.class_id, state]));
  const initialClasses: WorldFlightClassSummary[] = classRows.map((cls) => {
    const state = stateByClass.get(cls.id);
    return {
      id: cls.id,
      name: cls.name,
      currentDestinationId: state?.current_destination_id ?? null,
      planeTier: state?.plane_tier ?? 0,
      planeKey: state?.plane_key ?? 'starter-biplane',
      rangeKm: state?.range_km ?? STARTER_PLANE_RANGE_KM,
    };
  });

  return <WorldFlightPage initialClasses={initialClasses} />;
}
