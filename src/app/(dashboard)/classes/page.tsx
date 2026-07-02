import { createServerSupabase } from '@/lib/supabase/server';
import { ClassList } from '@/components/class/class-list';
import type { ClassCardSummary } from '@/components/class/class-list';
import type { Class } from '@/lib/supabase/types';
import { Plane } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClassesPage() {
  const supabase = createServerSupabase();
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('is_demo', false) // hide the hidden demo class from the roster list
    .order('created_at', { ascending: false }) as { data: Class[] | null };

  const classRows = classes ?? [];
  let summaries: ClassCardSummary[] = classRows.map((cls) => ({
    id: cls.id,
    crewCount: 0,
    flightCount: 0,
    lastFlightAt: null,
    currentDestinationId: null,
    planeTier: 0,
    stampCount: 0,
  }));

  if (classRows.length > 0) {
    const classIds = classRows.map((cls) => cls.id);
    const [studentsResult, sessionsResult, stateResult, legsResult] = await Promise.all([
      supabase.from('students').select('class_id').in('class_id', classIds),
      supabase
        .from('sessions')
        .select('class_id, started_at')
        .in('class_id', classIds)
        .order('started_at', { ascending: false }),
      supabase
        .from('class_world_flight_state')
        .select('class_id, current_destination_id, plane_tier')
        .in('class_id', classIds),
      supabase
        .from('class_world_flight_legs')
        .select('class_id')
        .in('class_id', classIds)
        .eq('status', 'completed'),
    ]);

    const crewCountByClass = new Map<string, number>();
    for (const row of studentsResult.data ?? []) {
      crewCountByClass.set(row.class_id, (crewCountByClass.get(row.class_id) ?? 0) + 1);
    }

    const flightCountByClass = new Map<string, number>();
    const lastFlightByClass = new Map<string, string>();
    for (const row of (sessionsResult.data ?? []) as Array<{ class_id: string; started_at: string }>) {
      flightCountByClass.set(row.class_id, (flightCountByClass.get(row.class_id) ?? 0) + 1);
      if (!lastFlightByClass.has(row.class_id)) {
        lastFlightByClass.set(row.class_id, row.started_at);
      }
    }

    const stateByClass = new Map(
      ((stateResult.data ?? []) as Array<{
        class_id: string;
        current_destination_id: string | null;
        plane_tier: number;
      }>).map((row) => [row.class_id, row]),
    );

    const stampCountByClass = new Map<string, number>();
    for (const row of (legsResult.data ?? []) as Array<{ class_id: string }>) {
      stampCountByClass.set(row.class_id, (stampCountByClass.get(row.class_id) ?? 0) + 1);
    }

    summaries = classRows.map((cls) => {
      const state = stateByClass.get(cls.id);
      return {
        id: cls.id,
        crewCount: crewCountByClass.get(cls.id) ?? 0,
        flightCount: flightCountByClass.get(cls.id) ?? 0,
        lastFlightAt: lastFlightByClass.get(cls.id) ?? null,
        currentDestinationId: state?.current_destination_id ?? null,
        planeTier: state?.plane_tier ?? 0,
        stampCount: stampCountByClass.get(cls.id) ?? 0,
      };
    });
  }

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 pt-6 lg:px-8 lg:pt-8 pb-12 min-h-full">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-0.5">
          <Plane className="w-4 h-4 text-lc-blue shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-widest text-lc-blue">Hangar</span>
        </div>
        <h1 className="text-2xl font-bold text-lc-text">Your Classes</h1>
      </div>
      <ClassList initialClasses={classRows} summaries={summaries} />
    </div>
  );
}
