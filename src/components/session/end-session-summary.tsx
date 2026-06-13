'use client';

import { useMemo, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PlaneLanding, Crown, Star, Users } from 'lucide-react';
import type { StudentSessionPref } from '@/lib/supabase/types';
import { countsForAccuracy, countsForLeaderboard, isCorrectScore } from '@/lib/scoring-reporting';
import type { WorldFlightProgressionRewardResult } from '@/lib/world-flight/progression';

export function EndSessionSummary({
  classId,
  className,
  sessionId,
  flightCode,
  progressionReward,
  teacherView = true,
  onLaunchBonusVote,
}: {
  classId: string;
  className: string;
  sessionId: string;
  flightCode?: string;
  progressionReward?: WorldFlightProgressionRewardResult | null;
  teacherView?: boolean;
  onLaunchBonusVote?: () => void;
}) {
  const students = useSessionStore((s) => s.students);
  const scores = useSessionStore((s) => s.scores);
  const reset = useSessionStore((s) => s.reset);

  const [prefsMap, setPrefsMap] = useState<Map<string, boolean>>(new Map()); // client_id → score_visible
  const [showAllNames, setShowAllNames] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('student_session_prefs')
      .select('client_id, score_visible')
      .eq('session_id', sessionId)
      .then(({ data }: { data: Pick<StudentSessionPref, 'client_id' | 'score_visible'>[] | null }) => {
        if (!data) return;
        setPrefsMap(new Map(data.map((p) => [p.client_id, p.score_visible])));
      });
  }, [sessionId]);

  // Map student_id → client_id from scores (for roster student lookups)
  const studentIdToClientId = useMemo(() => {
    const m = new Map<string, string>();
    scores.forEach((sc) => {
      if (sc.student_id && sc.client_id) m.set(sc.student_id, sc.client_id);
    });
    return m;
  }, [scores]);

  const isHidden = (key: string): boolean => {
    if (teacherView || showAllNames) return false;
    const clientId = studentIdToClientId.get(key) ?? key;
    return prefsMap.get(clientId) === false;
  };

  const summary = useMemo(() => {
    const map = new Map<string, { name: string; total: number; correct: number; accuracyAttempts: number; responses: number; bestStreak: number; key: string }>();

    // Add roster students
    students.forEach((s) => {
      map.set(s.id, { key: s.id, name: s.name, total: 0, correct: 0, accuracyAttempts: 0, responses: 0, bestStreak: 0 });
    });

    // Process scores, including remote students
    scores.filter(countsForLeaderboard).forEach((sc) => {
      const key = sc.student_id || sc.client_id;
      if (!key) return;

      let entry = map.get(key);
      if (!entry && sc.display_name) {
        entry = { key, name: sc.display_name, total: 0, correct: 0, accuracyAttempts: 0, responses: 0, bestStreak: 0 };
        map.set(key, entry);
      }
      if (!entry) return;

      entry.total += sc.points;
      entry.responses++;
      if (countsForAccuracy(sc)) {
        entry.accuracyAttempts++;
        if (isCorrectScore(sc)) entry.correct++;
      }
      if (sc.streak_count > entry.bestStreak) entry.bestStreak = sc.streak_count;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [students, scores]);

  const leaderboardScores = scores.filter(countsForLeaderboard);
  const totalResponses = leaderboardScores.length;
  const accuracyRows = leaderboardScores.filter(countsForAccuracy);
  const overallAccuracy = accuracyRows.length > 0
    ? Math.round((
        accuracyRows.filter(isCorrectScore).length
        / accuracyRows.length
      ) * 100)
    : null;

  // Collective "class" stats for the arrival celebration
  const bestStreak = summary.length > 0 ? Math.max(...summary.map((s) => s.bestStreak)) : 0;
  const responders = summary.filter((s) => s.responses > 0).length;
  const rosterTotal = students.length || responders;

  // Student beat — "Captain of the Day" (top scorer; only when there's a real winner)
  const captain = summary[0];
  const captainTies = captain ? summary.filter((s) => s.total === captain.total).length : 0;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* ── Class arrival beat — the whole class has landed ── */}
        <motion.div
          className="text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 }}
        >
          <PlaneLanding className="mx-auto h-11 w-11 text-cyan-300" strokeWidth={1.5} />
        </motion.div>
        {flightCode && (
          <p className="text-center text-[11px] font-mono tracking-[0.2em] text-amber-400/50 mt-2">{flightCode} · ARRIVED</p>
        )}
        <h1 className="text-4xl font-extrabold text-center text-lc-text tracking-tight mt-1">You&apos;ve Landed!</h1>
        <p className="text-center text-lc-text3 mb-8">{className} · flight complete</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { v: `${responders}/${rosterTotal}`, l: 'Aboard', c: 'text-cyan-300' },
            { v: totalResponses, l: 'Responses', c: 'text-sky-300' },
            { v: overallAccuracy !== null ? `${overallAccuracy}%` : '—', l: 'Accuracy', c: 'text-emerald-300' },
            { v: bestStreak, l: 'Best Streak', c: 'text-amber-300' },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              className="glass rounded-2xl border border-lc-border p-4 text-center"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + i * 0.08 }}
            >
              <p className={`text-3xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-[11px] text-lc-text2 mt-0.5 uppercase tracking-wider">{s.l}</p>
            </motion.div>
          ))}
        </div>

        {progressionReward && (
          <motion.section
            className="mb-8 overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-950/60 text-left backdrop-blur-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">Crew progression</p>
                <p className="mt-1 text-lg font-bold text-lc-text">+1 Flight Hour · +{progressionReward.crewStarsAwarded} Crew Stars</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] uppercase tracking-wide text-lc-text3">Journey total</p>
                <p className="mt-1 text-sm font-semibold text-cyan-100">{progressionReward.flightHours} hours · {progressionReward.crewStars} stars</p>
              </div>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-2">
              <ProgressionResult
                earned={progressionReward.snapshot.everyoneAboardEarned}
                icon={<Users className="h-4 w-4" aria-hidden />}
                title="Everyone Aboard"
                detail={`${progressionReward.snapshot.meaningfulParticipantCount}/${progressionReward.snapshot.participantCount} crew members contributed`}
              />
              <ProgressionResult
                earned={progressionReward.snapshot.strongLandingEarned}
                icon={<Star className="h-4 w-4" aria-hidden />}
                title="Strong Landing"
                detail={progressionReward.snapshot.accuracyRate !== null
                  ? `${Math.round(progressionReward.snapshot.accuracyRate * 100)}% class accuracy`
                  : `${Math.round(progressionReward.snapshot.onTaskParticipationRate * 100)}% made an on-task contribution`}
              />
            </div>
          </motion.section>
        )}

        {/* ── Student beat — Captain of the Day ── */}
        {captain && captain.total > 0 && (
          <motion.div
            className="relative glass rounded-2xl border border-amber-400/30 p-5 mb-6 overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-400/10 via-transparent to-transparent" />
            <div className="relative flex items-center gap-4">
              <motion.div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/15"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.66, type: 'spring', stiffness: 380, damping: 14 }}
              >
                <Crown className="h-7 w-7 text-amber-300" strokeWidth={1.75} />
              </motion.div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">Captain of the Day</p>
                <p className="text-2xl font-bold text-lc-text truncate">
                  {isHidden(captain.key) ? 'Anonymous Captain' : captain.name}
                  {captainTies > 1 && <span className="text-lc-text3 font-medium"> +{captainTies - 1}</span>}
                </p>
                <p className="text-sm text-lc-text3 mt-0.5">
                  {captain.total} pts
                  {captain.accuracyAttempts > 0 && <> · {captain.correct}/{captain.accuracyAttempts} correct</>}
                  {captain.bestStreak >= 2 && <> · {captain.bestStreak} streak</>}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="glass rounded-2xl border border-lc-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lc-text">Final Standings</h2>
            {teacherView && prefsMap.size > 0 && Array.from(prefsMap.values()).some((v) => !v) && (
              <button
                onClick={() => setShowAllNames((v) => !v)}
                className="text-xs text-lc-text3 hover:text-lc-text underline"
              >
                {showAllNames ? 'Respect privacy settings' : 'Show all names'}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {summary.map((entry, i) => {
              const hidden = isHidden(entry.key);
              return (
                <motion.div
                  key={entry.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-2 border-b border-lc-border-subtle last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      i === 1 ? 'bg-lc-text3/20 text-lc-text3' :
                      i === 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-lc-surface text-lc-text3'
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`font-medium ${hidden ? 'text-lc-text3 italic' : 'text-lc-text'}`}>
                      {hidden ? 'Anonymous pilot' : entry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {hidden ? (
                      <span className="text-lc-text3 text-xs">— —</span>
                    ) : (
                      <>
                        <span className="text-lc-text3">
                          {entry.accuracyAttempts > 0 ? `${entry.correct}/${entry.accuracyAttempts}` : '—'}
                        </span>
                        {entry.bestStreak >= 2 && <span className="text-lc-warn">🔥{entry.bestStreak}</span>}
                        <span className="font-bold text-lc-blue w-16 text-right">{entry.total} pts</span>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {teacherView && onLaunchBonusVote && (
          <div className="mt-6 p-4 bg-slate-950/55 backdrop-blur-md border border-cyan-400/30 rounded-2xl text-center">
            <p className="text-sm text-white/80 mb-3">Got time to spare? Let the class pick a bonus game.</p>
            <button
              onClick={onLaunchBonusVote}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-sm text-white shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              Bonus Round?
            </button>
          </div>
        )}

        <div className="flex justify-center gap-3 mt-8">
          <Link href={`/classes/${classId}`}>
            <Button variant="secondary" onClick={reset}>Back to Class</Button>
          </Link>
          <Link href={`/classes/${classId}/sessions/${sessionId}/control-room`}>
            <Button variant="secondary">View Control Room</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function ProgressionResult({
  earned,
  icon,
  title,
  detail,
}: {
  earned: boolean;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="bg-slate-950/70 px-5 py-4">
      <p className={`flex items-center gap-2 text-sm font-semibold ${earned ? 'text-emerald-200' : 'text-lc-text2'}`}>
        {icon}
        {title}
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide">{earned ? 'Earned' : 'Not yet'}</span>
      </p>
      <p className="mt-1.5 text-xs text-lc-text3">{detail}</p>
    </div>
  );
}
