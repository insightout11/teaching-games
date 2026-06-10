import { createServiceClient } from '@/lib/supabase/service';
import { countsForAccuracy, countsForLeaderboard, isCorrectScore } from '@/lib/scoring-reporting';
import { PlaneLanding, Trophy, Target, Flame, Medal } from 'lucide-react';

export const dynamic = 'force-dynamic';

const DEBRIEF_MAX_AGE_DAYS = 30;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface VocabItem {
  word: string;
  definition: string;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-10 max-w-md px-4">
      <div className="rounded-2xl border border-cyan-300/15 bg-[#070b14]/70 p-6 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

export default async function DebriefPage({ params }: { params: { token: string } }) {
  const token = params.token;

  if (!UUID_RE.test(token)) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold text-lc-text">Results link not found</h1>
        <p className="mt-2 text-sm text-lc-text3">This link doesn&apos;t look right. Double-check it and try again.</p>
      </Shell>
    );
  }

  const supabase = createServiceClient();

  const { data: participant } = await supabase
    .from('session_participants')
    .select('session_id, client_id, display_name')
    .eq('debrief_token', token)
    .maybeSingle();

  if (!participant) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold text-lc-text">Results not found</h1>
        <p className="mt-2 text-sm text-lc-text3">We couldn&apos;t find results for this link.</p>
      </Shell>
    );
  }

  const { data: session } = await supabase
    .from('sessions')
    .select('topic, custom_topic, ended_at, reference_vocab')
    .eq('id', participant.session_id)
    .maybeSingle();

  // Expiry: links are valid for 30 days after the session ends.
  if (session?.ended_at) {
    const ageMs = Date.now() - new Date(session.ended_at).getTime();
    if (ageMs > DEBRIEF_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
      return (
        <Shell>
          <h1 className="text-lg font-semibold text-lc-text">This link has expired</h1>
          <p className="mt-2 text-sm text-lc-text3">
            Results links are available for {DEBRIEF_MAX_AGE_DAYS} days after a lesson. Ask your teacher to run another!
          </p>
        </Shell>
      );
    }
  }

  // Compute the same personal results the student saw at session end.
  const [{ data: myScores }, { data: lb }] = await Promise.all([
    supabase
      .from('scores')
      .select('points, is_correct, accuracy_status, counts_for_accuracy, counts_for_leaderboard, scoring_version, streak_count')
      .eq('session_id', participant.session_id)
      .eq('client_id', participant.client_id),
    supabase
      .from('session_leaderboard')
      .select('total_points')
      .eq('session_id', participant.session_id)
      .order('total_points', { ascending: false }),
  ]);

  const rows = (myScores ?? []) as Array<{
    points: number; is_correct: boolean; accuracy_status?: string | null;
    counts_for_accuracy?: boolean | null; counts_for_leaderboard?: boolean | null;
    scoring_version?: number | null; streak_count: number;
  }>;
  const leaderboardRows = rows.filter(countsForLeaderboard);
  const totalPoints = leaderboardRows.reduce((s, r) => s + (r.points ?? 0), 0);
  const scorable = leaderboardRows.filter(countsForAccuracy);
  const accuracy = scorable.length > 0
    ? Math.round((scorable.filter(isCorrectScore).length / scorable.length) * 100)
    : null;
  const bestStreak = rows.length > 0 ? Math.max(...rows.map((r) => r.streak_count ?? 0)) : 0;

  const lbRows = lb ?? [];
  const rank = lbRows.length > 0 ? lbRows.filter((e) => e.total_points > totalPoints).length + 1 : null;

  const vocab = ((session?.reference_vocab as VocabItem[] | null) ?? []).slice(0, 10);
  const topic = session?.custom_topic || session?.topic || 'your lesson';
  const name = participant.display_name || 'Student';

  const stats = [
    { label: 'Points', value: String(totalPoints), Icon: Trophy, color: 'text-amber-300' },
    { label: 'Accuracy', value: accuracy === null ? '—' : `${accuracy}%`, Icon: Target, color: 'text-emerald-300' },
    { label: 'Best streak', value: String(bestStreak), Icon: Flame, color: 'text-orange-300' },
    { label: 'Rank', value: rank ? `#${rank}${lbRows.length ? ` / ${lbRows.length}` : ''}` : '—', Icon: Medal, color: 'text-cyan-300' },
  ];

  return (
    <Shell>
      <div className="flex items-center gap-2 text-cyan-300">
        <PlaneLanding className="h-5 w-5" aria-hidden />
        <span className="font-instrument text-[11px] uppercase tracking-[0.2em]">Flight debrief</span>
      </div>
      <h1 className="mt-3 text-xl font-bold text-lc-text">Nice flying, {name}!</h1>
      <p className="mt-1 text-sm text-lc-text3">Here&apos;s how you did on {topic}.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-1.5">
              <Icon className={`h-4 w-4 ${color}`} aria-hidden />
              <span className="font-instrument text-[10px] uppercase tracking-wider text-lc-text3">{label}</span>
            </div>
            <p className="mt-1 text-lg font-bold text-lc-text">{value}</p>
          </div>
        ))}
      </div>

      {vocab.length > 0 && (
        <div className="mt-6">
          <h2 className="font-instrument mb-2 text-[11px] uppercase tracking-[0.2em] text-lc-text3">
            Words from this lesson
          </h2>
          <ul className="space-y-2">
            {vocab.map((v) => (
              <li key={v.word} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <span className="text-sm font-semibold text-lc-text">{v.word}</span>
                <span className="block text-xs text-lc-text3">{v.definition}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-center font-instrument text-[10px] uppercase tracking-wider text-lc-text3">
        Powered by LessonCaptain — live lessons that fly
      </p>
    </Shell>
  );
}
