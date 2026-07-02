import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RosterEditor } from '@/components/class/roster-editor';
import { ClassHeader } from '@/components/class/class-header';
import { RecentSessions } from '@/components/class/recent-sessions';
import { ClassJourneyCard } from '@/components/class/class-journey-card';
import { ClassAnalyticsCard } from '@/components/class/class-analytics-card';
import { ClassDefaultsCard } from '@/components/class/class-defaults-card';
import { ClassLogbookHubCard } from '@/components/class/class-logbook-hub-card';
import type { Class, Student, Session } from '@/lib/supabase/types';
import { countsForAccuracy, isCorrectScore } from '@/lib/scoring-reporting';
import { buildClassLogbookSummary, type ClassLogbookScoreRow } from '@/lib/class-logbook';

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

  let moduleCountBySession = new Map<string, number>();
  let accuracy: number | null = null;
  let topStreak = 0;
  let classScores: ClassLogbookScoreRow[] = [];

  if (sessionIds.length > 0) {
    const [roundsResult, scoresResult] = await Promise.all([
      supabase.from('rounds').select('session_id, round_number').in('session_id', sessionIds),
      supabase
        .from('scores')
        .select('session_id, points, streak_count, is_correct, accuracy_status, counts_for_accuracy, counts_for_leaderboard, scoring_version, response_data')
        .in('session_id', sessionIds) as Promise<{
          data: Array<{
            session_id: string;
            points: number;
            streak_count: number;
            is_correct: boolean;
            accuracy_status: string | null;
            counts_for_accuracy: boolean | null;
            counts_for_leaderboard: boolean | null;
            scoring_version: number | null;
            response_data: Record<string, unknown>;
          }> | null;
        }>,
    ]);

    const maxRoundBySession = new Map<string, number>();
    for (const r of (roundsResult.data ?? []) as Array<{ session_id: string; round_number: number }>) {
      maxRoundBySession.set(r.session_id, Math.max(maxRoundBySession.get(r.session_id) ?? 0, r.round_number));
    }
    moduleCountBySession = maxRoundBySession;

    const scores = scoresResult.data ?? [];
    classScores = scores;
    const scorable = scores.filter(countsForAccuracy);
    accuracy = scorable.length > 0
      ? Math.round((scorable.filter(isCorrectScore).length / scorable.length) * 100)
      : null;
    topStreak = scores.reduce((max, s) => Math.max(max, s.streak_count ?? 0), 0);
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
    sessions: allSessions,
    scores: classScores,
  });

  return (
    <div className="max-w-7xl mx-auto">
      <ClassHeader cls={cls} studentCount={students?.length ?? 0} />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <ClassLogbookHubCard
          summary={classLogbook}
          shareEnabled={cls.logbook_share_enabled}
          shareToken={cls.logbook_share_token}
        />
        <ClassJourneyCard
          classId={cls.id}
          currentDestinationId={wfState?.current_destination_id ?? null}
          planeTier={wfState?.plane_tier ?? 0}
          stampCount={completedLegs?.length ?? 0}
          shareEnabled={wfState?.share_enabled ?? false}
          shareToken={wfState?.share_token ?? null}
        />
        <ClassAnalyticsCard
          classId={cls.id}
          accuracy={accuracy}
          flightCount={allSessions.length}
          topStreak={topStreak}
        />
        <ClassDefaultsCard
          classId={cls.id}
          initialDifficulty={cls.default_difficulty}
          initialTone={cls.default_tone}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <RosterEditor classId={cls.id} initialStudents={students ?? []} />
        <RecentSessions sessions={allSessions} classId={params.classId} moduleCountBySession={moduleCountBySession} />
      </div>
    </div>
  );
}
