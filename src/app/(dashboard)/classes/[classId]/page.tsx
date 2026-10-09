import { FLIGHT_RESULT_KEY, sanitizeFlightResult, type FlightResult } from '@/lib/flight-result';
import { lessonEntry, sanitizeLessonMemory, type LessonEntry } from '@/lib/lesson-memory';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RosterEditor } from '@/components/class/roster-editor';
import { ClassHeader } from '@/components/class/class-header';
import { ClassTimeline, type TimelineItem } from '@/components/class/class-timeline';
import { flightNumber, gateFor } from '@/lib/home-board';
import { FLAP_FONT } from '@/components/ui/split-flap';
import { ClassJourneyCard } from '@/components/class/class-journey-card';
import { ClassDefaultsCard } from '@/components/class/class-defaults-card';
import type { Class, Student, Session } from '@/lib/supabase/types';
import { countsForAccuracy, isCorrectScore } from '@/lib/scoring-reporting';
import { buildClassLogbookSummary, type ClassLogbookScoreRow, type ClassLogbookSessionRow } from '@/lib/class-logbook';

export default async function ClassDetailPage({ params }: { params: { classId: string } }) {
  const supabase = createServerSupabase();

  const { data: cls } = await supabase
    .from('classes')
    .select('*')
    .eq('id', params.classId)
    .single() as { data: Class | null };

  if (!cls) notFound();

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', cls.id)
    .order('name') as { data: Student[] | null };

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('class_id', cls.id)
    .order('started_at', { ascending: false })
    .limit(20) as { data: Session[] | null };

  const allSessions = sessions ?? [];
  const sessionIds = allSessions.map((s) => s.id);

  const { data: logbookSessions } = await supabase
    .from('sessions')
    .select('id, status, started_at, ended_at, topic, custom_topic')
    .eq('class_id', cls.id)
    .order('started_at', { ascending: false })
    .limit(200) as { data: ClassLogbookSessionRow[] | null };

  const logbookSessionRows = logbookSessions ?? [];
  const logbookSessionIds = logbookSessionRows.map((s) => s.id);

  // Flight results (each flight's before → after), newest session first. Teacher-only.
  const resultBySession = new Map<string, FlightResult>();
  if (logbookSessionIds.length > 0) {
    const recentIds = logbookSessionIds.slice(0, 40);
    const { data: resultRows } = await supabase
      .from('session_private_state')
      .select('session_id, payload')
      .eq('key', FLIGHT_RESULT_KEY)
      .in('session_id', recentIds) as { data: Array<{ session_id: string; payload: unknown }> | null };
    for (const row of resultRows ?? []) {
      const r = sanitizeFlightResult(row.payload);
      if (r) resultBySession.set(row.session_id, r);
    }
  }

  // What recent lessons covered (live memory). The table is server-only; these session ids came from the
  // teacher's own RLS-checked query above, so reading them with the service client is safe.
  const entryBySession = new Map<string, LessonEntry>();
  if (logbookSessionIds.length > 0) {
    const recentIds = logbookSessionIds.slice(0, 20);
    const { data: memoryRows } = await createServiceClient()
      .from('session_memory')
      .select('session_id, payload')
      .in('session_id', recentIds) as { data: Array<{ session_id: string; payload: unknown }> | null };
    for (const row of memoryRows ?? []) {
      const e = lessonEntry(sanitizeLessonMemory(row.payload));
      if (e) entryBySession.set(row.session_id, e);
    }
  }

  let moduleCountBySession = new Map<string, number>();
  let accuracy: number | null = null;
  let classScores: ClassLogbookScoreRow[] = [];

  if (sessionIds.length > 0) {
    const [roundsResult] = await Promise.all([
      supabase.from('rounds').select('session_id, round_number').in('session_id', sessionIds),
    ]);

    const maxRoundBySession = new Map<string, number>();
    for (const r of (roundsResult.data ?? []) as Array<{ session_id: string; round_number: number }>) {
      maxRoundBySession.set(r.session_id, Math.max(maxRoundBySession.get(r.session_id) ?? 0, r.round_number));
    }
    moduleCountBySession = maxRoundBySession;
  }

  if (logbookSessionIds.length > 0) {
    const { data } = await supabase
      .from('scores')
      .select('session_id, points, streak_count, is_correct, accuracy_status, counts_for_accuracy, counts_for_leaderboard, scoring_version, response_data')
      .in('session_id', logbookSessionIds) as { data: ClassLogbookScoreRow[] | null };

    const scores = data ?? [];
    classScores = scores;
    const scorable = scores.filter(countsForAccuracy);
    accuracy = scorable.length > 0
      ? Math.round((scorable.filter(isCorrectScore).length / scorable.length) * 100)
      : null;
  }

  const [{ data: wfState }, { data: completedLegs }] = await Promise.all([
    supabase
      .from('class_world_flight_state')
      .select('current_destination_id, plane_tier, share_enabled, share_token')
      .eq('class_id', cls.id)
      .maybeSingle() as Promise<{
        data: { current_destination_id: string | null; plane_tier: number; share_enabled: boolean; share_token: string | null } | null;
      }>,
    supabase
      .from('class_world_flight_legs')
      .select('id')
      .eq('class_id', cls.id)
      .eq('status', 'completed'),
  ]);
  const classLogbook = buildClassLogbookSummary({
    classId: cls.id,
    className: cls.name,
    sessions: logbookSessionRows,
    scores: classScores,
  });

  // The class's gate and flight number, the same as on Home and Classes (gate by creation order).
  const { data: ownClasses } = await supabase
    .from('classes')
    .select('id, created_at')
    .eq('teacher_id', cls.teacher_id)
    .eq('is_demo', false)
    .order('created_at', { ascending: true }) as { data: Array<{ id: string }> | null };
  const gate = gateFor(Math.max(0, (ownClasses ?? []).findIndex((c) => c.id === cls.id)));

  const timeline: TimelineItem[] = allSessions.map((s) => ({
    id: s.id,
    at: s.started_at,
    active: s.status === 'active',
    topic: s.custom_topic || s.topic || null,
    activities: moduleCountBySession.get(s.id) ?? 0,
    entry: entryBySession.get(s.id) ?? null,
    result: resultBySession.get(s.id) ?? null,
  }));
  const wordsMet = Array.from(entryBySession.values()).reduce((n, e) => n + e.words.length + e.moreWords, 0);

  const stats = [
    { n: classLogbook.completedFlights.toLocaleString(), l: 'lessons flown' },
    { n: accuracy === null ? '-' : `${accuracy}%`, l: 'answers right (class)' },
    { n: wordsMet.toLocaleString(), l: 'words met (recent lessons)' },
    { n: String(completedLegs?.length ?? 0), l: 'World Flight stamps' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      <ClassHeader cls={cls} studentCount={students?.length ?? 0} gate={gate} flight={flightNumber(cls.id)} />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((st) => (
          <div key={st.l} className="rounded-xl border border-white/[0.07] bg-[#0a121e]/85 px-4 py-3">
            <dd className="text-2xl font-bold text-[#fff4dc]" style={{ fontFamily: FLAP_FONT }}>{st.n}</dd>
            <dt className="text-[12.5px] text-white/50">{st.l}</dt>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ClassTimeline classId={cls.id} items={timeline} shareEnabled={cls.logbook_share_enabled} shareToken={cls.logbook_share_token} />
        <div className="flex min-w-0 flex-col gap-5">
          <RosterEditor classId={cls.id} initialStudents={students ?? []} />
          <ClassJourneyCard
            classId={cls.id}
            currentDestinationId={wfState?.current_destination_id ?? null}
            planeTier={wfState?.plane_tier ?? 0}
            stampCount={completedLegs?.length ?? 0}
            shareEnabled={wfState?.share_enabled ?? false}
            shareToken={wfState?.share_token ?? null}
          />
          <ClassDefaultsCard
            classId={cls.id}
            initialDifficulty={cls.default_difficulty}
            initialTone={cls.default_tone}
            initialStudentDeviceMode={cls.student_device_mode}
            initialJunior={cls.junior === true}
          />
        </div>
      </div>
    </div>
  );
}
