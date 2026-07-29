'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown } from 'lucide-react';
import type { ActivityProps } from '../types';
import { ActivityStatus, type RankItContent, type RankItChallenge } from './types';
import { useSessionStore } from '@/stores/session-store';

/**
 * Combine every student's submitted order into one class ranking by mean position
 * (a Borda-style aggregate): the lower an item's average slot across all submissions,
 * the higher it ranks. Items missing from a submission are simply skipped for that
 * submission; ties fall back to the original item order for a stable result.
 */
function aggregateRankings(submissions: string[][], allIds: string[]): string[] {
  const tally = new Map<string, { sum: number; count: number }>();
  allIds.forEach((id) => tally.set(id, { sum: 0, count: 0 }));
  submissions.forEach((sub) => {
    sub.forEach((id, idx) => {
      const t = tally.get(id);
      if (t) {
        t.sum += idx;
        t.count += 1;
      }
    });
  });
  return [...allIds].sort((a, b) => {
    const ta = tally.get(a)!;
    const tb = tally.get(b)!;
    const avgA = ta.count ? ta.sum / ta.count : Infinity;
    const avgB = tb.count ? tb.sum / tb.count : Infinity;
    if (avgA !== avgB) return avgA - avgB;
    return allIds.indexOf(a) - allIds.indexOf(b);
  });
}

/**
 * Teacher-paced reveal of the AI's suggested "ideal" order — only rendered for challenges
 * that carry a correctOrder (factual prompts). Opinion prompts never reach here.
 */
function SuggestedRanking({ challenge }: { challenge: RankItChallenge }) {
  const [open, setOpen] = useState(false);
  const order = challenge.correctOrder ?? [];
  if (order.length === 0) return null;

  const nameFor = (id: string) => challenge.items.find((item) => item.id === id)?.name ?? id;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-game text-sm hover:bg-emerald-500/20 transition-all"
      >
        <Trophy className="w-4 h-4" />
        REVEAL SUGGESTED RANKING
        <ChevronDown className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="glass p-4 rounded-xl border-2 border-emerald-500/30 space-y-3">
      <div className="flex items-center gap-2 text-emerald-400">
        <Trophy className="w-4 h-4" />
        <p className="text-sm uppercase tracking-widest font-semibold">Suggested Ranking</p>
      </div>
      <div className="space-y-2">
        {order.map((id, index) => (
          <div key={id} className="flex items-center gap-3 text-sm">
            <span className="w-7 h-7 rounded-full bg-emerald-500/80 flex items-center justify-center font-bold shrink-0">
              {index + 1}
            </span>
            <span>{nameFor(id)}</span>
          </div>
        ))}
      </div>
      {challenge.correctRationale && (
        <p className="text-sm opacity-70 pt-1 border-t border-white/10">{challenge.correctRationale}</p>
      )}
      <p className="text-xs opacity-40">There&apos;s no wrong opinion — this is just the fact-based order.</p>
    </div>
  );
}

export function RankItActivity({
  generatedContent,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  isMicroEvent,
}: ActivityProps) {
  const content = generatedContent as RankItContent;

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [classRanking, setClassRanking] = useState<string[]>([]);
  const [revealedFacts, setRevealedFacts] = useState<number[]>([]);
  const [hasReRanked, setHasReRanked] = useState(false);
  // Per-student submissions (clientId → ranked item ids). Aggregated into classRanking so
  // every submission counts, rather than the last one overwriting the shared list.
  const [studentRankings, setStudentRankings] = useState<Record<string, string[]>>({});
  // Once the teacher hand-sorts with the arrows, stop auto-aggregating so their arrangement sticks.
  const teacherAdjustedRef = useRef(false);
  const addFlightLogEntry = useSessionStore((s) => s.addFlightLogEntry);

  const currentChallenge: RankItChallenge | undefined = content.challenges?.[currentChallengeIndex];
  const submissionCount = Object.keys(studentRankings).length;

  // Register input spec for student controller
  useEffect(() => {
    if ((status === ActivityStatus.RANKING || status === ActivityStatus.RE_RANKING) && currentChallenge) {
      onSetInputSpec?.({
        type: 'ranking',
        gameKey: 'rank-it',
        prompt: currentChallenge.prompt,
        options: currentChallenge.items.map(item => item.name),
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentChallenge, onSetInputSpec]);

  // Register remote vote handler to receive votes from student devices. Each student's
  // submission is stored under their clientId (re-submits replace their own entry only);
  // the shared class ranking is recomputed from the aggregate in the effect below.
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (status !== ActivityStatus.RANKING && status !== ActivityStatus.RE_RANKING) return;
      if (!currentChallenge) return;

      try {
        const rankedNames: string[] = JSON.parse(vote.choice);
        const rankedIds = rankedNames
          .map((name) => currentChallenge.items.find((item) => item.name === name)?.id)
          .filter((id): id is string => id !== undefined);

        if (rankedIds.length > 0) {
          setStudentRankings((prev) => ({ ...prev, [vote.clientId]: rankedIds }));
        }
      } catch {
        // Invalid JSON, ignore
      }
    });

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, currentChallenge, onRegisterRemoteVoteHandler]);

  // Recompute the shared ranking from all student submissions whenever they change —
  // unless the teacher has taken manual control of the order.
  useEffect(() => {
    if (teacherAdjustedRef.current) return;
    const submissions = Object.values(studentRankings);
    if (submissions.length === 0 || !currentChallenge) return;
    setClassRanking(aggregateRankings(submissions, currentChallenge.items.map((item) => item.id)));
  }, [studentRankings, currentChallenge]);

  const startActivity = useCallback(() => {
    if (currentChallenge) {
      setClassRanking(currentChallenge.items.map((item) => item.id));
    }
    setStudentRankings({});
    teacherAdjustedRef.current = false;
    setStatus(ActivityStatus.RANKING);
    onPhaseChange?.('ranking');
  }, [currentChallenge, onPhaseChange]);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    teacherAdjustedRef.current = true;
    setClassRanking((prev) => {
      const newRanking = [...prev];
      const [removed] = newRanking.splice(fromIndex, 1);
      newRanking.splice(toIndex, 0, removed);
      return newRanking;
    });
  }, []);

  const finishRanking = useCallback(() => {
    setStatus(ActivityStatus.DISCUSSING);
    onPhaseChange?.('discussing');
  }, [onPhaseChange]);

  const startRevealing = useCallback(() => {
    setStatus(ActivityStatus.REVEALING);
    setRevealedFacts([]);
    onPhaseChange?.('revealing');
  }, [onPhaseChange]);

  const revealNextFact = useCallback(() => {
    if (!currentChallenge) return;

    const nextIndex = revealedFacts.length;
    if (nextIndex < currentChallenge.items.length) {
      setRevealedFacts((prev) => [...prev, nextIndex]);
    }
  }, [currentChallenge, revealedFacts.length]);

  const offerReRank = useCallback(() => {
    // Fresh round of student input now that the facts are out — start aggregation over,
    // keeping the current (locked) order on screen until new submissions arrive.
    setStudentRankings({});
    teacherAdjustedRef.current = false;
    setStatus(ActivityStatus.RE_RANKING);
    setHasReRanked(false);
    onPhaseChange?.('re-ranking');
  }, [onPhaseChange]);

  const finishReRanking = useCallback(() => {
    setHasReRanked(true);
    setStatus(ActivityStatus.DISCUSSING);
    onPhaseChange?.('discussing');
  }, [onPhaseChange]);

  const nextChallenge = useCallback(() => {
    if (!isMicroEvent && currentChallengeIndex < (content.challenges?.length || 0) - 1) {
      setCurrentChallengeIndex((prev) => prev + 1);
      const nextChallenge = content.challenges?.[currentChallengeIndex + 1];
      if (nextChallenge) {
        setClassRanking(nextChallenge.items.map((item) => item.id));
      }
      setStudentRankings({});
      teacherAdjustedRef.current = false;
      setRevealedFacts([]);
      setHasReRanked(false);
      setStatus(ActivityStatus.RANKING);
      onPhaseChange?.('ranking');
    } else {
      // Flight log (Captain's Flight): record the class's top pick for the Final Word debrief.
      // addFlightLogEntry self-guards to Captain's, so this no-ops in other presets.
      const topItem = currentChallenge?.items.find((item) => item.id === classRanking[0]);
      if (topItem && currentChallenge) {
        addFlightLogEntry({
          beat: 'opinion-pulse',
          text: `Ranked "${topItem.name}" #1 in "${currentChallenge.prompt}".`,
          callback: `You ranked "${topItem.name}" first — would you still?`,
        });
      }
      setStatus(ActivityStatus.FINISHED);
      onPhaseChange?.('finished');
    }
  }, [isMicroEvent, currentChallengeIndex, content.challenges, onPhaseChange, currentChallenge, classRanking, addFlightLogEntry]);

  const restartActivity = useCallback(() => {
    setCurrentChallengeIndex(0);
    if (content.challenges?.[0]) {
      setClassRanking(content.challenges[0].items.map((item) => item.id));
    }
    setStudentRankings({});
    teacherAdjustedRef.current = false;
    setRevealedFacts([]);
    setHasReRanked(false);
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [content.challenges, onPhaseChange]);

  const getItemById = (id: string) => currentChallenge?.items.find((item) => item.id === id);

  if (!content.challenges || content.challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">No challenges available. Please regenerate content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-amber-400">Rank It!</h3>
          {customTopic && customTopic !== 'General' && (
            <p className="text-xs opacity-60">Topic: {customTopic}</p>
          )}
        </div>
        {!isMicroEvent && (
          <div className="text-sm opacity-60">
            Challenge {currentChallengeIndex + 1} / {content.challenges.length}
          </div>
        )}
      </div>

      {/* IDLE State */}
      {status === ActivityStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-xl mb-2 opacity-90">Rank & Debate!</p>
          <p className="opacity-60 text-sm mb-8">
            Work together to rank items, then learn facts that might change your mind.
          </p>
          <button
            onClick={startActivity}
            className="px-12 py-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START
          </button>
        </motion.div>
      )}

      {/* RANKING / RE_RANKING State */}
      {(status === ActivityStatus.RANKING || status === ActivityStatus.RE_RANKING) && currentChallenge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-lg font-semibold">{currentChallenge.prompt}</p>
            {status === ActivityStatus.RE_RANKING && (
              <p className="text-sm text-amber-400 mt-2">
                Now that you know the facts, would you change your ranking?
              </p>
            )}
            <p className="text-xs opacity-50 mt-2">
              {submissionCount > 0
                ? `Aggregated from ${submissionCount} submission${submissionCount !== 1 ? 's' : ''}${teacherAdjustedRef.current ? ' · manually adjusted' : ''}`
                : 'Waiting for students to submit their rankings…'}
            </p>
          </div>

          <div className="space-y-3">
            {classRanking.map((itemId, index) => {
              const item = getItemById(itemId);
              if (!item) return null;

              const isRevealed = status === ActivityStatus.RE_RANKING;

              return (
                <motion.div
                  key={itemId}
                  layout
                  className="glass p-4 rounded-xl border-2 border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      {isRevealed && (
                        <p className="text-sm text-amber-300 mt-1">{item.hiddenFact}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => index > 0 && moveItem(index, index - 1)}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-white/10 disabled:opacity-20"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => index < classRanking.length - 1 && moveItem(index, index + 1)}
                        disabled={index === classRanking.length - 1}
                        className="p-1 rounded hover:bg-white/10 disabled:opacity-20"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={status === ActivityStatus.RE_RANKING ? finishReRanking : finishRanking}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {status === ActivityStatus.RE_RANKING ? 'CONFIRM NEW RANKING' : 'LOCK IN RANKING'}
            </button>
          </div>
        </motion.div>
      )}

      {/* DISCUSSING State */}
      {status === ActivityStatus.DISCUSSING && currentChallenge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-2">Your Ranking</p>
            <p className="text-lg font-semibold">{currentChallenge.prompt}</p>
          </div>

          <div className="space-y-2">
            {classRanking.map((itemId, index) => {
              const item = getItemById(itemId);
              if (!item) return null;

              return (
                <div key={itemId} className="glass p-3 rounded-xl flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span>{item.name}</span>
                </div>
              );
            })}
          </div>

          <div className="glass p-4 rounded-xl border-2 border-cyan-500/30">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-2">Discussion Prompt</p>
            <p>Why did you rank them this way? What criteria did you use?</p>
          </div>

          {/* Only present when the AI marked this challenge as having a factual ideal order. */}
          <SuggestedRanking challenge={currentChallenge} />

          <div className="flex gap-3 justify-center">
            {!hasReRanked && (
              <button
                onClick={startRevealing}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                REVEAL FACTS
              </button>
            )}
            <button
              onClick={nextChallenge}
              className="px-6 py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/20"
            >
              {currentChallengeIndex < content.challenges.length - 1 ? 'NEXT CHALLENGE' : 'FINISH'}
            </button>
          </div>
        </motion.div>
      )}

      {/* REVEALING State */}
      {status === ActivityStatus.REVEALING && currentChallenge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="text-center mb-4">
            <p className="text-sm uppercase tracking-widest opacity-50">
              Revealing Hidden Facts...
            </p>
          </div>

          <div className="space-y-3">
            {currentChallenge.items.map((item, index) => {
              const isRevealed = revealedFacts.includes(index);
              const rankPosition = classRanking.indexOf(item.id) + 1;

              return (
                <motion.div
                  key={item.id}
                  className={`glass p-4 rounded-xl border-2 transition-all ${
                    isRevealed ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold shrink-0">
                      #{rankPosition}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <AnimatePresence>
                        {isRevealed && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-sm text-amber-300 mt-2"
                          >
                            {item.hiddenFact}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            {revealedFacts.length < currentChallenge.items.length ? (
              <button
                onClick={revealNextFact}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                REVEAL NEXT ({revealedFacts.length + 1}/{currentChallenge.items.length})
              </button>
            ) : (
              <button
                onClick={offerReRank}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                WOULD YOU RE-RANK?
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* FINISHED State */}
      {status === ActivityStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-2xl font-game text-amber-400 mb-4">Great Ranking!</p>
          <p className="opacity-70 mb-8">
            You completed {content.challenges.length} ranking challenges
          </p>
          <button
            onClick={restartActivity}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            PLAY AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
}
