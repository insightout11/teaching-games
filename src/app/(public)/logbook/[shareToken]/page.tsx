import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BookOpen, CalendarDays, CheckCircle2, Flame, Globe2, MessageSquareText, PlaneTakeoff, Target } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service';
import {
  buildClassLogbookSummary,
  type ClassLogbookScoreRow,
  type ClassLogbookSessionRow,
  type ClassLogbookSummary,
} from '@/lib/class-logbook';
import { countsForAccuracy, countsForLeaderboard, isCorrectScore } from '@/lib/scoring-reporting';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LogbookEntry {
  id: string;
  topic: string;
  completedAt: string;
  responses: number;
  accuracy: number | null;
  bestStreak: number;
}

interface PublicLogbookData {
  className: string;
  summary: ClassLogbookSummary;
  entries: LogbookEntry[];
  worldFlightShareToken: string | null;
}

function topicFor(session: ClassLogbookSessionRow) {
  return session.custom_topic?.trim() || session.topic?.trim() || 'Class lesson';
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Recently';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildEntries(sessions: ClassLogbookSessionRow[], scores: ClassLogbookScoreRow[]): LogbookEntry[] {
  const scoresBySession = new Map<string, ClassLogbookScoreRow[]>();
  for (const score of scores) {
    const rows = scoresBySession.get(score.session_id) ?? [];
    rows.push(score);
    scoresBySession.set(score.session_id, rows);
  }

  return sessions
    .filter((session) => session.status === 'ended' || session.ended_at)
    .slice(0, 12)
    .map((session) => {
      const rows = scoresBySession.get(session.id) ?? [];
      const counted = rows.filter(countsForLeaderboard);
      const accuracyRows = counted.filter(countsForAccuracy);
      const accuracy = accuracyRows.length > 0
        ? Math.round((accuracyRows.filter(isCorrectScore).length / accuracyRows.length) * 100)
        : null;
      return {
        id: session.id,
        topic: topicFor(session),
        completedAt: session.ended_at ?? session.started_at,
        responses: counted.length,
        accuracy,
        bestStreak: counted.reduce((max, score) => Math.max(max, score.streak_count ?? 0), 0),
      };
    });
}

async function loadPublicLogbook(shareToken: string): Promise<PublicLogbookData | null> {
  if (!UUID_RE.test(shareToken)) return null;

  const supabase = createServiceClient();
  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, logbook_share_enabled')
    .eq('logbook_share_token', shareToken)
    .maybeSingle();

  if (!cls || !cls.logbook_share_enabled) return null;

  const [sessionsResult, worldFlightStateResult] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, status, started_at, ended_at, topic, custom_topic')
      .eq('class_id', cls.id)
      .order('started_at', { ascending: false })
      .limit(80),
    supabase
      .from('class_world_flight_state')
      .select('share_enabled, share_token')
      .eq('class_id', cls.id)
      .maybeSingle(),
  ]);
  const sessions = (sessionsResult.data ?? []) as ClassLogbookSessionRow[];
  const worldFlightState = worldFlightStateResult.data as { share_enabled: boolean; share_token: string | null } | null;

  const completedSessionIds = sessions
    .filter((session) => session.status === 'ended' || session.ended_at)
    .map((session) => session.id);
  let scores: ClassLogbookScoreRow[] = [];
  if (completedSessionIds.length > 0) {
    const { data } = await supabase
      .from('scores')
      .select('session_id, points, streak_count, is_correct, accuracy_status, counts_for_accuracy, counts_for_leaderboard, scoring_version, response_data')
      .in('session_id', completedSessionIds) as { data: ClassLogbookScoreRow[] | null };
    scores = data ?? [];
  }

  const summary = buildClassLogbookSummary({
    classId: cls.id,
    className: cls.name,
    sessions,
    scores,
  });

  return {
    className: cls.name,
    summary,
    entries: buildEntries(sessions, scores),
    worldFlightShareToken: worldFlightState?.share_enabled ? worldFlightState.share_token : null,
  };
}

export async function generateMetadata({ params }: { params: { shareToken: string } }): Promise<Metadata> {
  const data = await loadPublicLogbook(params.shareToken);
  if (!data) return { title: 'Class logbook not found - LessonCaptain' };

  return {
    title: `${data.className} class logbook - LessonCaptain`,
    description: `${data.className} has completed ${data.summary.completedFlights} LessonCaptain flights with ${data.summary.totalResponses} class responses.`,
    robots: { index: true, follow: true },
  };
}

export default async function PublicClassLogbookPage({ params }: { params: { shareToken: string } }) {
  const data = await loadPublicLogbook(params.shareToken);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-cyan-200/15 bg-[#0b1728] px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lessoncaptain-logo-on-dark.svg" alt="LessonCaptain" className="h-7 w-auto" />
          <span className="font-instrument text-[11px] uppercase tracking-[0.16em] text-cyan-100/75">Public class logbook</span>
        </div>
      </header>

      <section className="border-b border-cyan-200/15 bg-[#0b1728] px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-cyan-100">
            <BookOpen className="h-5 w-5" aria-hidden />
            <span className="font-instrument text-[11px] font-semibold uppercase tracking-[0.16em]">Class Logbook</span>
          </div>
          <h1 className="font-display mt-3 max-w-3xl text-4xl leading-tight text-white sm:text-5xl">
            {data.className} has completed {data.summary.completedFlights.toLocaleString()} learning flights
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70">
            A shared, privacy-safe record of class lessons, participation, and recent topics.
          </p>
          {data.worldFlightShareToken && (
            <a
              href={`/journey/${data.worldFlightShareToken}`}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-cyan-200/25 bg-cyan-300/[0.08] px-4 text-sm font-bold text-cyan-100 transition-colors hover:bg-cyan-300/[0.14]"
            >
              <Globe2 className="h-4 w-4" aria-hidden />
              View World Flight map
            </a>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 py-8">
        <section className="grid gap-px overflow-hidden rounded-lg border border-cyan-200/15 bg-cyan-200/15 sm:grid-cols-2 lg:grid-cols-4">
          <LogbookStat icon={<PlaneTakeoff className="h-4 w-4" />} label="Learning flights" value={data.summary.completedFlights.toLocaleString()} />
          <LogbookStat icon={<MessageSquareText className="h-4 w-4" />} label="Class responses" value={data.summary.totalResponses.toLocaleString()} />
          <LogbookStat icon={<Target className="h-4 w-4" />} label="Average accuracy" value={data.summary.averageAccuracy === null ? '-' : `${data.summary.averageAccuracy}%`} />
          <LogbookStat icon={<Flame className="h-4 w-4" />} label="Best streak" value={data.summary.bestStreak.toLocaleString()} />
        </section>

        {data.summary.recentTopics.length > 0 && (
          <section className="mt-8 rounded-lg border border-cyan-200/15 bg-[#0e1d31] px-5 py-5">
            <p className="font-instrument text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/70">Recent topics</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.summary.recentTopics.map((topic) => (
                <span key={topic} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-sm font-semibold text-cyan-50/85">
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-cyan-200" aria-hidden />
            <h2 className="font-display text-2xl text-white">Recent flights</h2>
          </div>

          {data.entries.length > 0 ? (
            <ol className="mt-4 space-y-3">
              {data.entries.map((entry, index) => (
                <li key={entry.id} className="rounded-lg border border-cyan-200/15 bg-[#0e1d31] px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-instrument text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/60">
                        Flight {data.summary.completedFlights - index} - {formatDate(entry.completedAt)}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-bold text-white">{entry.topic}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[270px]">
                      <EntryStat label="responses" value={entry.responses.toLocaleString()} />
                      <EntryStat label="accuracy" value={entry.accuracy === null ? '-' : `${entry.accuracy}%`} />
                      <EntryStat label="streak" value={entry.bestStreak.toLocaleString()} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-4 rounded-lg border border-cyan-200/15 bg-[#0e1d31] px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-cyan-200/75" aria-hidden />
              <p className="mt-3 text-sm text-white/65">Completed lessons will appear here soon.</p>
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-white/10 py-7 text-center">
          <p className="text-sm text-white/65">Class progress becomes a shared record students can revisit.</p>
          <a href="/" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-[#07111f] transition-colors hover:bg-cyan-200">
            Build your class logbook
          </a>
        </footer>
      </div>
    </main>
  );
}

function LogbookStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#0e1d31] px-5 py-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-100/70">{icon}{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function EntryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] px-2 py-2">
      <p className="text-sm font-bold text-cyan-100">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">{label}</p>
    </div>
  );
}
