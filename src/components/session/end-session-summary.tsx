'use client';

import { useMemo, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowUpRight, Check, CheckCircle2, Clock3, Gauge, Loader2, Lock, Plane, PlaneLanding, Crown, Sparkles, Star, Users } from 'lucide-react';
import type { StudentSessionPref } from '@/lib/supabase/types';
import { countsForAccuracy, countsForLeaderboard, isCorrectScore } from '@/lib/scoring-reporting';
import type { WorldFlightProgressionRewardResult } from '@/lib/world-flight/progression';
import { formatDistance } from '@/lib/world-flight/geo';
import { getPlaneAsset, getPlaneTier, type PlaneEntry } from '@/lib/plane-progression';
import { play } from '@/lib/audio/manager';
import { ClassLogbookDepositCard } from '@/components/class/class-logbook-card';
import type { ClassLogbookSummary } from '@/lib/class-logbook';
import { trackEvent } from '@/lib/analytics/posthog';

export type EndSessionNextDestination =
  | {
      kind: 'course';
      href: string;
      label: string;
      description: string;
      nextLessonTitle?: string | null;
    }
  | {
      kind: 'world-flight';
      href: string;
      label: string;
      description: string;
    };

export function EndSessionSummary({
  classId,
  className,
  sessionId,
  flightCode,
  progressionReward,
  classLogbook,
  currentTopic,
  currentSessionAlreadyRecorded = false,
  teacherView = true,
  onLaunchBonusVote,
  previewMode = false,
  moduleCount,
  sessionStartedAt,
  nextDestination,
  arrivalMetricsPending = false,
}: {
  classId: string;
  className: string;
  sessionId: string;
  flightCode?: string;
  progressionReward?: WorldFlightProgressionRewardResult | null;
  classLogbook?: ClassLogbookSummary | null;
  currentTopic?: string | null;
  currentSessionAlreadyRecorded?: boolean;
  teacherView?: boolean;
  onLaunchBonusVote?: () => void;
  previewMode?: boolean;
  moduleCount?: number;
  sessionStartedAt?: string | null;
  nextDestination?: EndSessionNextDestination | null;
  arrivalMetricsPending?: boolean;
}) {
  const students = useSessionStore((s) => s.students);
  const scores = useSessionStore((s) => s.scores);
  const reset = useSessionStore((s) => s.reset);
  // Solo 1:1 session: skip the "class ceremony" framing (Captain of the Day
  // crown reveal over a field of one) in favor of a personal recap. Logic
  // (scores, crew stars) is unchanged — copy/layout only.
  const isSolo = students.length === 1;

  // The arrival chord is cut so its peak lands ~1.36s in, which is where the stat
  // tiles finish settling — so it plays from mount with no offset (§9).
  useEffect(() => {
    if (previewMode) return;
    return play('arrivalResolve');
  }, [previewMode]);

  useEffect(() => {
    if (previewMode) return;
    trackEvent('session_completed', {
      sessionId,
      moduleCount: moduleCount ?? null,
      durationSeconds: sessionStartedAt
        ? Math.round((Date.now() - new Date(sessionStartedAt).getTime()) / 1000)
        : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const [prefsMap, setPrefsMap] = useState<Map<string, boolean>>(new Map()); // client_id → score_visible
  const [showAllNames, setShowAllNames] = useState(false);
  // Arrival ceremony beat (teacher-advanced, skippable — locked design). 0-based
  // index into the adaptive beat list built below.
  const [beatIndex, setBeatIndex] = useState(0);

  useEffect(() => {
    if (previewMode) return;
    const supabase = createClient();
    supabase
      .from('student_session_prefs')
      .select('client_id, score_visible')
      .eq('session_id', sessionId)
      .then(({ data }: { data: Pick<StudentSessionPref, 'client_id' | 'score_visible'>[] | null }) => {
        if (!data) return;
        setPrefsMap(new Map(data.map((p) => [p.client_id, p.score_visible])));
      });
  }, [sessionId, previewMode]);

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

  // Travel arc: what the class actually did on the trip — retold in the arrival beat.
  const tripLog = useSessionStore((s) => s.tripLog);
  // Captain's Flight: lesson memory written by key beats — recapped here on landing.
  const flightLog = useSessionStore((s) => s.flightLog);

  // Collective "class" stats for the arrival celebration
  const bestStreak = summary.length > 0 ? Math.max(...summary.map((s) => s.bestStreak)) : 0;
  const responders = summary.filter((s) => s.responses > 0).length;
  const rosterTotal = students.length || responders;

  // Student beat — "Captain of the Day" (top scorer; only when there's a real winner)
  const captain = summary[0];
  const captainTies = captain ? summary.filter((s) => s.total === captain.total).length : 0;
  const rewardSnapshot = progressionReward?.snapshot ?? null;
  // The activity shell can unmount before its final score reconciliation finishes.
  // Once ending returns, use its database-backed metrics instead of stale browser totals.
  const arrivalResponders = rewardSnapshot?.meaningfulParticipantCount ?? responders;
  const arrivalRosterTotal = rewardSnapshot?.participantCount ?? rosterTotal;
  const arrivalResponses = progressionReward?.sessionResponseCount ?? totalResponses;
  const arrivalAccuracy = progressionReward?.sessionAccuracyRate !== undefined
    ? progressionReward.sessionAccuracyRate === null
      ? null
      : Math.round(progressionReward.sessionAccuracyRate * 100)
    : overallAccuracy;
  const arrivalBestStreak = progressionReward?.sessionBestStreak ?? bestStreak;
  const everyoneAboardDetail = rewardSnapshot
    ? rewardSnapshot.participantCount === 0
      ? 'Connect student devices to earn this star. Teacher-scored work can still earn Strong Landing.'
      : rewardSnapshot.everyoneAboardEarned
        ? `${rewardSnapshot.meaningfulParticipantCount}/${rewardSnapshot.participantCount} connected crew members contributed. Earns 1 crew star.`
        : `${rewardSnapshot.meaningfulParticipantCount}/${rewardSnapshot.participantCount} connected crew members contributed. Needs 70% to earn this star.`
    : '';
  const strongLandingDetail = rewardSnapshot
    ? rewardSnapshot.accuracyRate !== null
      ? rewardSnapshot.strongLandingEarned
        ? `${Math.round(rewardSnapshot.accuracyRate * 100)}% class accuracy. Earns 1 crew star.`
        : `${Math.round(rewardSnapshot.accuracyRate * 100)}% class accuracy. Needs 65% to earn this star.`
      : rewardSnapshot.strongLandingEarned
        ? `${Math.round(rewardSnapshot.onTaskParticipationRate * 100)}% made an on-task contribution. Earns 1 crew star.`
        : rewardSnapshot.onTaskParticipantCount > 0
          ? `${Math.round(rewardSnapshot.onTaskParticipationRate * 100)}% made an on-task contribution. Needs 60% to earn this star.`
          : 'Score on-task work or class accuracy to earn this star.'
    : '';

  // Adaptive beat list: Captain beat only exists when there's a real winner
  // among 2+ students — a solo student doesn't need a "beat the field" reveal.
  const hasCaptainBeat = !!(captain && captain.total > 0) && !isSolo;
  const beats: readonly ('arrival' | 'captain' | 'debrief')[] = hasCaptainBeat
    ? ['arrival', 'captain', 'debrief']
    : ['arrival', 'debrief'];
  const currentBeat = beats[Math.min(beatIndex, beats.length - 1)];
  const isLastBeat = beatIndex >= beats.length - 1;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <AnimatePresence mode="wait">
        {/* ── Beat 1: Arrival — the whole class has landed ── */}
        {currentBeat === 'arrival' && (
          <motion.div
            key="arrival"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
          >
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
        <p className="text-center text-lc-text3 mb-8">{className} · lesson complete</p>

        {/* Travel arc — retell the trip the class just took */}
        {tripLog.length > 0 && (
          <motion.div
            className="glass rounded-2xl border border-lc-border p-4 mb-8"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <p className="text-[11px] uppercase tracking-wider text-lc-text2 mb-2">The trip</p>
            <ul className="space-y-1.5">
              {tripLog.map((entry) => (
                <li key={entry.stageId} className="flex items-start gap-2 text-sm text-lc-text">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
                  {entry.text}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Captain's Flight — recap the lesson's key beats (kept out of Travel's trip block) */}
        {flightLog.length > 0 && tripLog.length === 0 && (
          <motion.div
            className="glass rounded-2xl border border-lc-border p-4 mb-8"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <p className="text-[11px] uppercase tracking-wider text-lc-text2 mb-2">The flight log</p>
            <ul className="space-y-1.5">
              {flightLog.map((entry) => (
                <li key={entry.beat} className="flex items-start gap-2 text-sm text-lc-text">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
                  {entry.text}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Stat tiles land like passport stamps — staggered thunks, each settling
            at its own slight angle (animate-passport-stamp / --stamp-rotation). */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { v: arrivalMetricsPending ? '…' : `${arrivalResponders}/${arrivalRosterTotal}`, l: 'Aboard', c: 'text-cyan-300', r: '-1.6deg' },
            { v: arrivalMetricsPending ? '…' : arrivalResponses, l: 'Responses', c: 'text-sky-300', r: '1.2deg' },
            { v: arrivalMetricsPending ? '…' : arrivalAccuracy !== null ? `${arrivalAccuracy}%` : '—', l: 'Accuracy', c: 'text-emerald-300', r: '-1deg' },
            { v: arrivalMetricsPending ? '…' : arrivalBestStreak, l: 'Best Streak', c: 'text-amber-300', r: '1.8deg' },
          ].map((s, i) => (
            <div
              key={s.l}
              className="glass animate-passport-stamp rounded-2xl border border-lc-border p-4 text-center"
              style={{
                '--stamp-rotation': s.r,
                animationDelay: `${0.25 + i * 0.16}s`,
              } as React.CSSProperties}
            >
              <p className={`text-3xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-[11px] text-lc-text2 mt-0.5 uppercase tracking-wider">{s.l}</p>
            </div>
          ))}
        </div>
          </motion.div>
        )}

        {/* ── Beat 2: Captain of the Day — full-stage reveal ── */}
        {currentBeat === 'captain' && captain && (
          <motion.div
            key="captain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-3xl text-center"
          >
            {/* Stage glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(245,158,11,0.14) 0%, transparent 70%)',
              }}
            />
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="font-instrument relative text-sm font-semibold uppercase tracking-[0.32em] text-amber-300/90"
            >
              Captain of the Day
            </motion.p>
            <motion.div
              initial={{ scale: 0, rotate: -25, y: -30 }}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 13, delay: 0.85 }}
              className="relative mt-7 flex h-24 w-24 items-center justify-center rounded-3xl border border-amber-400/35 bg-amber-400/15 shadow-[0_0_60px_-10px_rgba(245,158,11,0.55)]"
            >
              <Crown className="h-12 w-12 text-amber-300" strokeWidth={1.5} />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 1.05 }}
              className="relative mt-6 max-w-full truncate px-4 text-5xl font-extrabold tracking-tight text-lc-text"
            >
              {isHidden(captain.key) ? 'Anonymous Captain' : captain.name}
              {captainTies > 1 && <span className="text-2xl font-medium text-lc-text3"> +{captainTies - 1}</span>}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.35 }}
              className="relative mt-3 text-base text-lc-text2"
            >
              {captain.total} pts
              {captain.accuracyAttempts > 0 && <> · {captain.correct}/{captain.accuracyAttempts} correct</>}
              {captain.bestStreak >= 2 && <> · {captain.bestStreak} streak</>}
            </motion.p>
          </motion.div>
        )}

        {/* ── Beat 3: Debrief — the working summary ── */}
        {currentBeat === 'debrief' && (
          <motion.div
            key="debrief"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
        <div className="mb-8 text-center">
          <p className="font-instrument text-[11px] uppercase tracking-[0.26em] text-cyan-300/80">Lesson debrief</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-lc-text">{className} · lesson complete</h1>
        </div>

        {classLogbook && (
          <ClassLogbookDepositCard
            summary={classLogbook}
            sessionResponses={totalResponses}
            sessionAccuracy={overallAccuracy}
            sessionBestStreak={bestStreak}
            currentTopic={currentTopic}
            alreadyRecorded={currentSessionAlreadyRecorded}
          />
        )}

        {progressionReward && (
          <motion.section
            className="mb-8 overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-950/60 text-left backdrop-blur-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">World Flight rewards</p>
                <p className="mt-1 text-xs leading-relaxed text-lc-text3">
                  Game points decide today&apos;s standings. World Flight upgrades use class totals: flight hours plus crew stars.
                </p>
                <p className="mt-1 text-lg font-bold text-lc-text">+1 Flight Hour · +{progressionReward.crewStarsAwarded} Crew Stars</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] uppercase tracking-wide text-lc-text3">Journey total</p>
                <p className="mt-1 text-sm font-semibold text-cyan-100">{progressionReward.flightHours} hours · {progressionReward.crewStars} stars</p>
              </div>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-2">
              <ProgressionResult
                earned
                icon={<Clock3 className="h-4 w-4" aria-hidden />}
                title="Flight Hour"
                detail="Every completed World Flight lesson adds one class flight hour."
              />
              <ProgressionResult
                earned={progressionReward.crewStarsAwarded > 0}
                icon={<Star className="h-4 w-4" aria-hidden />}
                title="Crew Stars"
                detail={`This lesson earned ${progressionReward.crewStarsAwarded}/2 possible crew stars.`}
              />
              <ProgressionResult
                earned={progressionReward.snapshot.everyoneAboardEarned}
                icon={<Users className="h-4 w-4" aria-hidden />}
                title="Everyone Aboard"
                detail={everyoneAboardDetail}
              />
              <ProgressionResult
                earned={progressionReward.snapshot.strongLandingEarned}
                icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
                title="Strong Landing"
                detail={strongLandingDetail}
              />
            </div>
            <WorldFlightUpgradeProgress reward={progressionReward} classId={classId} sessionId={sessionId} teacherView={teacherView} previewMode={previewMode} />
          </motion.section>
        )}

        {/* ── Student beat — Captain of the Day (class) / Nice Work (solo) ── */}
        {captain && captain.total > 0 && (
          <motion.div
            className={`relative glass rounded-2xl border p-5 mb-6 overflow-hidden ${isSolo ? 'border-cyan-400/30' : 'border-amber-400/30'}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${isSolo ? 'from-cyan-400/10' : 'from-amber-400/10'} via-transparent to-transparent`} />
            <div className="relative flex items-center gap-4">
              <motion.div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${isSolo ? 'border-cyan-400/30 bg-cyan-400/15' : 'border-amber-400/30 bg-amber-400/15'}`}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.66, type: 'spring', stiffness: 380, damping: 14 }}
              >
                {isSolo
                  ? <Sparkles className="h-7 w-7 text-cyan-300" strokeWidth={1.75} />
                  : <Crown className="h-7 w-7 text-amber-300" strokeWidth={1.75} />}
              </motion.div>
              <div className="min-w-0">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isSolo ? 'text-cyan-300/80' : 'text-amber-300/80'}`}>
                  {isSolo ? 'Nice Work' : 'Captain of the Day'}
                </p>
                <p className="text-2xl font-bold text-lc-text truncate">
                  {isHidden(captain.key) ? (isSolo ? 'Anonymous pilot' : 'Anonymous Captain') : captain.name}
                  {!isSolo && captainTies > 1 && <span className="text-lc-text3 font-medium"> +{captainTies - 1}</span>}
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
            <h2 className="font-semibold text-lc-text">{isSolo ? 'Your Results' : 'Final Standings'}</h2>
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
                      isSolo ? 'bg-lc-surface text-lc-text3' :
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

        {nextDestination && (
          <div className="mt-8 rounded-2xl border border-cyan-300/25 bg-slate-950/60 p-4 text-center backdrop-blur-md">
            <p className="text-sm font-semibold text-cyan-100">{nextDestination.description}</p>
            {nextDestination.kind === 'course' && nextDestination.nextLessonTitle && (
              <p className="mt-1 text-xs text-lc-text3">Next up: {nextDestination.nextLessonTitle}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {nextDestination && (
            <Link href={nextDestination.href}>
              <Button variant="primary" onClick={reset}>
                {nextDestination.label}
                <ArrowUpRight className="ml-2 h-3.5 w-3.5" aria-hidden />
              </Button>
            </Link>
          )}
          <Link href={`/classes/${classId}`}>
            <Button variant="secondary" onClick={reset}>{nextDestination ? 'Class page' : 'Back to Class'}</Button>
          </Link>
          <Link
            href={`/classes/${classId}/sessions/${sessionId}/control-room`}
            className="inline-flex items-center justify-center rounded-xl border border-lc-border bg-lc-surface px-4 py-2 text-sm font-medium text-lc-text2 transition-all hover:bg-lc-card focus:outline-none focus:ring-2 focus:ring-lc-blue-glow"
          >
            View Control Room
          </Link>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat controls — teacher-advanced ceremony, skippable */}
      {!isLastBeat && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setBeatIndex((b) => b + 1)}
            className="rounded-lg bg-cyan-500 px-7 py-2.5 text-sm font-semibold text-slate-950 ring-2 ring-cyan-200 ring-offset-2 ring-offset-[#0d1117] shadow-[0_0_18px_rgba(34,211,238,0.45)] transition-all hover:bg-cyan-400"
          >
            {beats[beatIndex + 1] === 'captain' ? 'Reveal Captain of the Day' : 'Continue to debrief'}
          </button>
          <button
            type="button"
            onClick={() => setBeatIndex(beats.length - 1)}
            className="text-xs text-lc-text3 transition-colors hover:text-lc-text2"
          >
            Skip ceremony
          </button>
        </div>
      )}

      {/* Beat progress dots */}
      <div className="mt-6 flex justify-center gap-2" aria-hidden>
        {beats.map((b, i) => (
          <span
            key={b}
            className={`h-1.5 rounded-full transition-all ${
              i === beatIndex ? 'w-5 bg-cyan-300' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

type UpgradeActionStatus = 'idle' | 'claiming' | 'ready' | 'equipping' | 'equipped' | 'error';

interface UpgradeClaimResponse {
  error?: string;
  state?: {
    planeTier: number;
    planeKey: string;
    planeSelectionRequired: boolean;
    rangeKm: number;
    flightHours: number;
    crewStars: number;
  };
}

interface PlaneEquipResponse {
  error?: string;
  state?: {
    planeTier: number;
    planeKey: string;
    rangeKm: number;
  };
}

function WorldFlightUpgradeProgress({
  reward,
  classId,
  sessionId,
  teacherView,
  previewMode,
}: {
  reward: WorldFlightProgressionRewardResult;
  classId: string;
  sessionId: string;
  teacherView: boolean;
  previewMode: boolean;
}) {
  const [choiceTier, setChoiceTier] = useState<number | null>(null);
  const [equippedPlane, setEquippedPlane] = useState<PlaneEntry | null>(null);
  const [equippedRangeKm, setEquippedRangeKm] = useState<number | null>(null);
  const [actionStatus, setActionStatus] = useState<UpgradeActionStatus>('idle');
  const upgradeState = reward.upgradeState;

  useEffect(() => {
    setChoiceTier(null);
    setEquippedPlane(null);
    setEquippedRangeKm(null);
    setActionStatus('idle');
  }, [reward.flightHours, reward.crewStars, upgradeState?.claimableTier, reward.planeSelectionRequired, reward.planeTier]);

  if (!upgradeState) {
    return (
      <div className="border-t border-white/10 px-5 py-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-lc-text2">
          World Flight progress is saved after the class completes a city lesson.
        </div>
      </div>
    );
  }

  const claimableTier = upgradeState.claimableTier;
  const pendingChoiceTier = reward.planeSelectionRequired && typeof reward.planeTier === 'number'
    ? reward.planeTier
    : null;
  const hasPendingPlaneChoice = pendingChoiceTier !== null;
  const targetMilestone = claimableTier || hasPendingPlaneChoice
    ? upgradeState.latestUnlockedMilestone
    : upgradeState.nextMilestone;
  const hourTarget = targetMilestone?.requiredFlightHours ?? Math.max(reward.flightHours, 1);
  const starTarget = targetMilestone?.requiredCrewStars ?? Math.max(reward.crewStars, 1);
  const upgradeReady = claimableTier !== null && upgradeState.claimableRangeKm !== null;
  const aircraftChoiceReady = upgradeReady || hasPendingPlaneChoice;
  const pendingRangeKm = pendingChoiceTier === null ? null : getPlaneTier(pendingChoiceTier).rangeKm;
  const targetRangeKm = upgradeState.claimableRangeKm ?? pendingRangeKm ?? upgradeState.nextRangeTier?.rangeKm ?? upgradeState.currentRangeKm;
  const previousFlightHours = Math.max(0, reward.flightHours - reward.flightHoursAwarded);
  const previousCrewStars = Math.max(0, reward.crewStars - reward.crewStarsAwarded);
  const activeChoiceTier = choiceTier ?? pendingChoiceTier;
  const choicePlaneTier = activeChoiceTier === null ? null : getPlaneTier(activeChoiceTier);
  const planeChoices = choicePlaneTier?.choices ?? [];
  const shownRangeKm = equippedRangeKm ?? upgradeState.claimableRangeKm ?? targetRangeKm;

  async function claimUpgradeForChoice() {
    if (!upgradeReady || !teacherView) return;

    if (previewMode) {
      setChoiceTier(claimableTier);
      setActionStatus('ready');
      return;
    }

    setActionStatus('claiming');
    try {
      const response = await fetch('/api/world-flight/upgrades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });
      const result = await response.json().catch(() => null) as UpgradeClaimResponse | null;
      const state = result?.state;
      if (!response.ok && !state?.planeSelectionRequired) {
        throw new Error(result?.error ?? 'Failed to claim upgrade');
      }
      const tier = state?.planeTier ?? claimableTier;
      if (!tier) throw new Error('No aircraft tier returned');
      setChoiceTier(tier);
      setActionStatus('ready');
    } catch (error) {
      console.error('Failed to claim World Flight upgrade:', error);
      setActionStatus('error');
    }
  }

  async function equipPlane(planeKey: string) {
    if (!activeChoiceTier || !teacherView) return;

    const plane = getPlaneAsset(planeKey);
    if (previewMode) {
      setEquippedPlane(plane);
      setEquippedRangeKm(getPlaneTier(activeChoiceTier).rangeKm);
      setActionStatus('equipped');
      return;
    }

    setActionStatus('equipping');
    try {
      const response = await fetch('/api/world-flight/planes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, sessionId, planeKey: plane.key }),
      });
      const result = await response.json().catch(() => null) as PlaneEquipResponse | null;
      if (!response.ok || !result?.state) {
        throw new Error(result?.error ?? 'Failed to equip aircraft');
      }
      const selected = getPlaneAsset(result.state.planeKey);
      setEquippedPlane(selected);
      setEquippedRangeKm(result.state.rangeKm);
      setActionStatus('equipped');
    } catch (error) {
      console.error('Failed to equip World Flight aircraft:', error);
      setActionStatus('error');
    }
  }

  return (
    <div className="border-t border-white/10 px-5 py-5">
      <div className={`rounded-2xl border p-4 ${
        aircraftChoiceReady
          ? 'border-lc-amber/35 bg-lc-amber/[0.07]'
          : 'border-cyan-200/18 bg-cyan-300/[0.045]'
      }`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">
              <Gauge className="h-4 w-4" aria-hidden />
              Range upgrade progress
            </p>
            <h3 className="mt-1 text-lg font-bold text-lc-text">
              {aircraftChoiceReady
                ? `Tier ${activeChoiceTier ?? upgradeState.claimableTier} upgrade unlocked`
                : upgradeState.fullyUpgraded
                  ? 'Maximum range active'
                  : `Next range: ${formatDistance(targetRangeKm)}`}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-lc-text3">
              {hasPendingPlaneChoice
                ? 'The class already unlocked this tier. Choose a new aircraft now to activate the expanded range.'
                : upgradeReady
                  ? 'The class reached both requirements. Choose a new aircraft to activate the expanded range.'
                : upgradeState.fullyUpgraded
                  ? 'The class has reached the current top range tier.'
                  : `These bars fill after each completed World Flight lesson. ${formatUpgradeNeeds(upgradeState.needsFlightHours, upgradeState.needsCrewStars)}`}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-lc-text3">Current range</p>
            <p className="mt-0.5 text-sm font-bold text-cyan-100">
              {formatDistance(upgradeState.currentRangeKm)}
              {targetRangeKm > upgradeState.currentRangeKm && (
                <span className="text-lc-amber"> to {formatDistance(targetRangeKm)}</span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <UpgradeMeter
            icon={<Clock3 className="h-4 w-4" aria-hidden />}
            label="Flight Hours"
            previousValue={previousFlightHours}
            value={reward.flightHours}
            target={hourTarget}
          />
          <UpgradeMeter
            icon={<Star className="h-4 w-4" aria-hidden />}
            label="Crew Stars"
            previousValue={previousCrewStars}
            value={reward.crewStars}
            target={starTarget}
          />
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lc-text2">How upgrades work</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-lc-text3">
            <li>Complete a World Flight lesson: +1 flight hour.</li>
            <li>Earn crew stars as a class: +1 for Everyone Aboard, +1 for Strong Landing.</li>
            <li>When both totals reach the next tier, the class chooses a new aircraft.</li>
          </ul>
        </div>

        {!aircraftChoiceReady && !upgradeState.fullyUpgraded && (
          <motion.div
            className="mt-4 rounded-2xl border border-white/15 bg-slate-950/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.38, ease: 'easeOut' }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lc-amber/25 bg-lc-amber/[0.08] text-lc-amber">
                  <Lock className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lc-amber">Aircraft Upgrade Locked</p>
                  <h4 className="mt-1 text-base font-bold text-lc-text">
                    Choose a {formatDistance(targetRangeKm)} aircraft here
                  </h4>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-lc-text3">
                    {formatUpgradeNeeds(upgradeState.needsFlightHours, upgradeState.needsCrewStars)} When both bars are full, this slot becomes the aircraft reveal and chooser.
                  </p>
                </div>
              </div>
              <div className="grid min-w-[180px] gap-2 text-xs">
                <RequirementPill
                  label="Flight Hours"
                  value={reward.flightHours}
                  target={hourTarget}
                  complete={upgradeState.needsFlightHours === 0}
                />
                <RequirementPill
                  label="Crew Stars"
                  value={reward.crewStars}
                  target={starTarget}
                  complete={upgradeState.needsCrewStars === 0}
                />
              </div>
            </div>
          </motion.div>
        )}

        {aircraftChoiceReady && (
          <motion.div
            className="relative mt-4 overflow-hidden rounded-2xl border border-lc-amber/30 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.22),transparent_38%),linear-gradient(145deg,rgba(14,116,144,0.18),rgba(245,158,11,0.10))] px-4 py-4"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.05, type: 'spring', stiffness: 190, damping: 18 }}
          >
            <UpgradeCloudReveal />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-lc-amber">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {hasPendingPlaneChoice ? 'Aircraft Choice Ready' : 'Range Upgrade Unlocked'}
                </p>
                <h4 className="mt-1 text-xl font-bold text-lc-text">
                  {formatDistance(upgradeState.currentRangeKm)} to {formatDistance(shownRangeKm)}
                </h4>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-lc-text3">
                  {hasPendingPlaneChoice
                    ? 'The upgrade is waiting for the class choice. Pick the aircraft that should represent this new range tier.'
                    : 'The class earned enough flight hours and crew stars. Pick the aircraft that represents this new range tier.'}
                </p>
              </div>
              {equippedPlane && (
                <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200">Equipped</p>
                  <p className="mt-0.5 text-sm font-bold text-lc-text">{equippedPlane.name}</p>
                </div>
              )}
            </div>

            <UpgradeRangeCeremony
              currentRangeKm={upgradeState.currentRangeKm}
              targetRangeKm={shownRangeKm}
              active={aircraftChoiceReady}
            />

            {!teacherView ? (
              <Link
                href="/world-flight"
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-lc-amber/35 bg-lc-amber/15 px-4 text-xs font-semibold uppercase tracking-wide text-lc-amber transition-colors hover:bg-lc-amber/20"
              >
                Open World Flight
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            ) : choicePlaneTier ? (
              <div className="relative mt-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {planeChoices.map((plane) => (
                    <UpgradePlaneCard
                      key={plane.key}
                      plane={plane}
                      tier={choicePlaneTier.tier}
                      selected={equippedPlane?.key === plane.key}
                      disabled={actionStatus === 'equipping' || actionStatus === 'equipped'}
                      onSelect={() => void equipPlane(plane.key)}
                    />
                  ))}
                </div>
                {actionStatus === 'equipping' && (
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-cyan-100">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Equipping aircraft...
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void claimUpgradeForChoice()}
                disabled={actionStatus === 'claiming'}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-lc-amber/35 bg-lc-amber/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-lc-amber transition-colors hover:bg-lc-amber/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionStatus === 'claiming'
                  ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  : <Plane className="h-4 w-4" aria-hidden />}
                Choose New Aircraft
              </button>
            )}

            {actionStatus === 'error' && (
              <p className="mt-3 text-xs font-semibold text-red-300">Could not update the aircraft choice. Refresh and try again.</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function UpgradeMeter({
  icon,
  label,
  previousValue,
  value,
  target,
}: {
  icon: ReactNode;
  label: string;
  previousValue?: number;
  value: number;
  target: number;
}) {
  const previousProgress = percent(previousValue ?? value, target);
  const progress = percent(value, target);
  const changed = previousValue !== undefined && previousValue !== value;
  const requirementAlreadyMet = previousValue !== undefined && previousValue >= target && value >= target;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-lc-text">
          {icon}
          {label}
        </p>
        <p className="text-sm font-bold text-cyan-100">
          {changed && !requirementAlreadyMet ? `${previousValue}/${target} -> ` : ''}
          {value}/{target}
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-lc-amber"
          initial={{ width: `${previousProgress}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.1, delay: 0.62, ease: 'easeOut' }}
        />
      </div>
      {changed && (
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-lc-amber">
          {requirementAlreadyMet ? 'Requirement already met' : `+${value - (previousValue ?? value)} this lesson`}
        </p>
      )}
    </div>
  );
}

function UpgradeRangeCeremony({
  currentRangeKm,
  targetRangeKm,
  active,
}: {
  currentRangeKm: number;
  targetRangeKm: number;
  active: boolean;
}) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(103,232,249,0.18),transparent_32%),radial-gradient(circle_at_82%_26%,rgba(245,158,11,0.20),transparent_34%)]" />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/60">Current Range</p>
          <p className="mt-0.5 text-lg font-bold text-cyan-100">{formatDistance(currentRangeKm)}</p>
        </div>
        <motion.div
          className="hidden h-px flex-1 bg-gradient-to-r from-cyan-300/30 via-white/45 to-lc-amber/60 sm:block"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: active ? 1 : 0, opacity: active ? 1 : 0 }}
          transition={{ duration: 1.15, delay: 1.18, ease: 'easeOut' }}
          style={{ transformOrigin: 'left center' }}
        />
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-lc-amber/80">New Reach</p>
          <motion.p
            className="mt-0.5 text-lg font-bold text-lc-amber"
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.34, type: 'spring', stiffness: 260, damping: 14 }}
          >
            {formatDistance(targetRangeKm)}
          </motion.p>
        </div>
      </div>

      <div className="relative mt-4 h-12">
        <div className="absolute left-2 right-2 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/10" />
        <motion.div
          className="absolute left-2 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-300 via-sky-200 to-lc-amber"
          initial={{ width: '18%' }}
          animate={{ width: 'calc(100% - 1rem)' }}
          transition={{ duration: 1.25, delay: 1.28, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-lc-amber/40 bg-slate-950/85 text-lc-amber shadow-[0_0_24px_rgba(245,158,11,0.35)]"
          initial={{ left: '8%', scale: 0.85, rotate: -8 }}
          animate={{ left: 'calc(100% - 3rem)', scale: 1, rotate: 0 }}
          transition={{ duration: 1.25, delay: 1.28, ease: 'easeInOut' }}
        >
          <Plane className="h-5 w-5 rotate-45" aria-hidden />
        </motion.div>
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="absolute top-1/2 h-1.5 w-1.5 rounded-full bg-lc-amber"
            style={{ left: `${34 + index * 18}%` }}
            initial={{ opacity: 0, scale: 0.4, y: -4 }}
            animate={{ opacity: [0, 1, 0.35], scale: [0.4, 1.4, 1], y: [-4, -18, -10] }}
            transition={{ duration: 1.2, delay: 1.55 + index * 0.12, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  );
}

function RequirementPill({
  label,
  value,
  target,
  complete,
}: {
  label: string;
  value: number;
  target: number;
  complete: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
      complete
        ? 'border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100'
        : 'border-lc-amber/25 bg-lc-amber/[0.08] text-lc-amber'
    }`}>
      <span className="flex items-center gap-2 font-semibold">
        {complete ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <Lock className="h-3.5 w-3.5" aria-hidden />}
        {label}
      </span>
      <span className="font-bold">{value}/{target}</span>
    </div>
  );
}

function UpgradeCloudReveal() {
  const clouds: Array<{ top: string; left?: string; right?: string; width: number; x: number; delay: number }> = [
    { top: '8%', left: '-16%', width: 210, x: -48, delay: 0.08 },
    { top: '42%', left: '-10%', width: 150, x: -36, delay: 0.18 },
    { top: '12%', right: '-18%', width: 230, x: 54, delay: 0.12 },
    { top: '48%', right: '-12%', width: 165, x: 40, delay: 0.25 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.15),transparent_34%)]" />
      {clouds.map((cloud, index) => (
        <motion.span
          key={`${cloud.top}-${index}`}
          className="absolute h-14 rounded-full bg-white/18 blur-xl"
          style={{
            top: cloud.top,
            left: cloud.left,
            right: cloud.right,
            width: cloud.width,
          }}
          initial={{ opacity: 0.66, x: 0, scale: 1 }}
          animate={{ opacity: 0.12, x: cloud.x, scale: 1.16 }}
          transition={{ duration: 1.35, delay: cloud.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function UpgradePlaneCard({
  plane,
  tier,
  selected,
  disabled,
  onSelect,
}: {
  plane: PlaneEntry;
  tier: number;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group relative flex min-h-[172px] flex-col overflow-hidden rounded-xl border bg-slate-950/55 p-3 text-left transition ${
        selected
          ? 'border-emerald-300/60 shadow-[0_0_0_1px_rgba(110,231,183,0.25)]'
          : 'border-white/10 hover:border-cyan-200/45 hover:bg-cyan-300/[0.06]'
      } disabled:cursor-default`}
    >
      <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-black/20">
        <motion.img
          src={plane.front3qWebp ?? plane.webp}
          alt=""
          draggable={false}
          className="h-16 w-auto object-contain transition-transform group-hover:scale-105"
          initial={selected ? { x: -18, opacity: 0.75, scale: 0.94 } : false}
          animate={selected ? { x: 0, opacity: 1, scale: 1.08 } : { x: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 230, damping: 17 }}
        />
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-sm font-bold text-lc-text">{plane.name}</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-100/60">
          Tier {tier} aircraft
        </p>
        <span className={`mt-auto inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold uppercase tracking-wide ${
          selected
            ? 'border-emerald-300/35 bg-emerald-300/[0.10] text-emerald-200'
            : 'border-cyan-200/20 bg-cyan-300/[0.06] text-cyan-100'
        }`}>
          {selected ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Plane className="h-3.5 w-3.5" aria-hidden />}
          {selected ? 'Selected' : 'Choose'}
        </span>
      </div>
    </button>
  );
}

function percent(value: number, target: number) {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

function formatUpgradeNeeds(flightHours: number, crewStars: number) {
  const needs: string[] = [];
  if (flightHours > 0) {
    needs.push(`${flightHours} more flight hour${flightHours === 1 ? '' : 's'}`);
  }
  if (crewStars > 0) {
    needs.push(`${crewStars} more crew star${crewStars === 1 ? '' : 's'}`);
  }
  if (needs.length === 0) {
    return 'The class has met the requirements; choose an aircraft to activate the range.';
  }
  return `Need ${needs.join(' and ')} to unlock the next aircraft choice.`;
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
