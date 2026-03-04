'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ActivityProps } from '../types';
import {
  ActivityStatus,
  type VoteRecord,
  type FinaleSubmission,
  type ScenarioSimulatorContent,
  type ScenarioRound,
  type ScenarioChoice,
  type FinaleOption,
} from './types';

// Pure outcome logic — defined outside component
const GOAL_SUCCESS = 3;
const DANGER_FAIL = 3;

function calculateOutcome(
  goalTotal: number,
  dangerTotal: number,
  finalTag: 'bold' | 'safe' | 'risky',
): { isSuccess: boolean; narrow: boolean; isComeback: boolean } {
  const goalBonus = finalTag === 'bold' ? 2 : finalTag === 'safe' ? 1 : 0;
  const effGoal = goalTotal + goalBonus;

  const dangerFail = dangerTotal >= DANGER_FAIL;
  const isComeback = dangerFail && finalTag === 'bold' && goalTotal >= 1;

  if (dangerFail && !isComeback) return { isSuccess: false, narrow: false, isComeback: false };

  const isSuccess = effGoal >= GOAL_SUCCESS || isComeback;
  const narrow = isSuccess && effGoal < GOAL_SUCCESS + 3;
  return { isSuccess, narrow, isComeback };
}

function outcomeReason(
  title: string,
  isSuccess: boolean,
  narrow: boolean,
  isComeback: boolean,
  goalTotal: number,
): string {
  if (isComeback) return 'Against all odds, one brilliant move turned the tide at the last second.';
  if (isSuccess && !narrow) return `${title} — sharp decisions all the way through sealed the win.`;
  if (isSuccess && narrow) return 'A strong run, and a decisive final call closed the deal.';
  if (goalTotal >= 0) return 'So close — one different call could have changed everything.';
  return 'The choices made here compounded into an unwinnable situation.';
}

function fallbackPicks(subs: FinaleSubmission[]): FinaleOption[] {
  const labels: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
  const tags: ('bold' | 'safe' | 'risky')[] = ['bold', 'safe', 'risky'];
  return labels.map((label, i) => ({ label, text: subs[i]?.text ?? `Option ${label}`, tag: tags[i] }));
}

// Meter bar component
function MeterBar({ label, value, maxVal, colorClass }: { label: string; value: number; maxVal: number; colorClass: string }) {
  const pct = Math.max(0, Math.min(100, ((value + maxVal) / (maxVal * 2)) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs opacity-60 w-20 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colorClass}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function ScenarioSimulatorActivity({
  students,
  generatedContent,
  onPhaseChange,
  customTopic,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onContinue,
}: ActivityProps) {
  const content = generatedContent as ScenarioSimulatorContent;

  const [status, setStatus] = useState(ActivityStatus.IDLE);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [goalTotal, setGoalTotal] = useState(0);
  const [dangerTotal, setDangerTotal] = useState(1);
  const [dynamicRounds, setDynamicRounds] = useState<ScenarioRound[]>([]);
  const [isGeneratingRound, setIsGeneratingRound] = useState(false);
  const [lastConsequence, setLastConsequence] = useState('');
  const [lastWinner, setLastWinner] = useState<ScenarioChoice | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finaleSubmissions, setFinaleSubmissions] = useState<FinaleSubmission[]>([]);
  const [top3Picks, setTop3Picks] = useState<FinaleOption[]>([]);
  const [finaleVotes, setFinaleVotes] = useState<VoteRecord[]>([]);
  const [outcome, setOutcome] = useState<{ isSuccess: boolean; narrow: boolean; isComeback: boolean; finalTag: string } | null>(null);

  // Refs for use in callbacks/effects
  const statusRef = useRef(status);           statusRef.current = status;
  const currentRoundRef = useRef(currentRound); currentRoundRef.current = currentRound;
  const votesRef = useRef(votes);             votesRef.current = votes;
  const finaleSubsRef = useRef(finaleSubmissions); finaleSubsRef.current = finaleSubmissions;
  const finaleVotesRef = useRef(finaleVotes); finaleVotesRef.current = finaleVotes;
  const goalTotalRef = useRef(goalTotal);     goalTotalRef.current = goalTotal;
  const dangerTotalRef = useRef(dangerTotal); dangerTotalRef.current = dangerTotal;
  const readerIndexRef = useRef(0);           // persists across rounds for equal-turn distribution
  const pickingRef = useRef(false);           // prevents double-trigger of pick-top3
  const top3PicksRef = useRef(top3Picks);     top3PicksRef.current = top3Picks;
  const lastWinnerRef = useRef(lastWinner);   lastWinnerRef.current = lastWinner;
  const roundWinnersRef = useRef<ScenarioChoice[]>([]);

  // allRounds = static Round 1 + dynamically generated rounds 2–5
  const allRounds = [...(content.rounds ?? []), ...dynamicRounds];
  const allRoundsRef = useRef(allRounds);     allRoundsRef.current = allRounds;

  // ── Timer tick ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const timed = [ActivityStatus.VOTING, ActivityStatus.FINALE_VOTE, ActivityStatus.FINALE_SUBMIT];
    if (!timed.includes(status) || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [status, timeLeft]);

  // ── Auto-advance on timer=0 ──────────────────────────────────────────────────
  useEffect(() => {
    if (status === ActivityStatus.VOTING && timeLeft === 0) handleVotingEnd();
    if (status === ActivityStatus.FINALE_VOTE && timeLeft === 0) handleFinaleVoteEnd();
    if (status === ActivityStatus.FINALE_SUBMIT && timeLeft === 0) handlePickTop3();
  }, [timeLeft, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── InputSpec ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const r = allRoundsRef.current[currentRound];
    if (status === ActivityStatus.VOTING && r) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'scenario-simulator',
        prompt: r.situation,
        options: r.choices.map((c) => `${c.label}. ${c.text}`),
      });
    } else if (status === ActivityStatus.FINALE_SUBMIT) {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'scenario-simulator',
        prompt: content.finalePrompt + ' (max 15 words)',
        maxLength: 80,
        placeholder: 'Your final move — 15 words max...',
      });
    } else if (status === ActivityStatus.FINALE_VOTE && top3PicksRef.current.length === 3) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'scenario-simulator',
        prompt: 'Choose the best final move:',
        options: top3PicksRef.current.map((p) => `${p.label}. ${p.text}`),
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentRound, top3Picks, content, onSetInputSpec]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Remote vote handler ──────────────────────────────────────────────────────
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (statusRef.current === ActivityStatus.VOTING) {
        if (votesRef.current.some((v) => v.clientId === vote.clientId)) return;
        setVotes((prev) => [...prev, { clientId: vote.clientId, studentId: vote.studentId ?? null, displayName: vote.displayName, choice: vote.choice }]);
        onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: currentRoundRef.current + 1, points: 1, isCorrect: null });
      }

      if (statusRef.current === ActivityStatus.FINALE_SUBMIT) {
        if (finaleSubsRef.current.some((f) => f.clientId === vote.clientId)) return;
        setFinaleSubmissions((prev) => {
          const next = [...prev, { clientId: vote.clientId, displayName: vote.displayName, text: vote.choice }];
          const allIn = next.length >= students.length && students.length > 0;
          if (allIn && !pickingRef.current) setTimeout(() => handlePickTop3(), 800);
          return next;
        });
        onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: 6, points: 1, isCorrect: null });
      }

      if (statusRef.current === ActivityStatus.FINALE_VOTE) {
        if (finaleVotesRef.current.some((v) => v.clientId === vote.clientId)) return;
        setFinaleVotes((prev) => [...prev, { clientId: vote.clientId, studentId: vote.studentId ?? null, displayName: vote.displayName, choice: vote.choice }]);
        onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: 7, points: 1, isCorrect: null });
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, onScore]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleVotingEnd = useCallback(() => {
    const r = allRoundsRef.current[currentRoundRef.current];
    if (!r) return;
    const tally: Record<string, number> = {};
    votesRef.current.forEach((v) => {
      const label = v.choice.charAt(0);
      tally[label] = (tally[label] ?? 0) + 1;
    });
    const winner = (['A', 'B', 'C'] as const).reduce((best, cur) =>
      (tally[cur] ?? 0) > (tally[best] ?? 0) ? cur : best, 'A' as const);
    const winChoice = r.choices.find((c) => c.label === winner) ?? r.choices[0];

    roundWinnersRef.current = [...roundWinnersRef.current, winChoice];
    setGoalTotal((g) => g + winChoice.goalDelta);
    setDangerTotal((d) => d + winChoice.dangerDelta);
    goalTotalRef.current = goalTotalRef.current + winChoice.goalDelta;
    dangerTotalRef.current = dangerTotalRef.current + winChoice.dangerDelta;
    setLastConsequence(winChoice.consequence);
    setLastWinner(winChoice);
    setStatus(ActivityStatus.CONSEQUENCE);
    onPhaseChange?.('consequence');
  }, [onPhaseChange]);

  const handlePickTop3 = useCallback(async () => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    setStatus(ActivityStatus.FINALE_PICKING);
    onPhaseChange?.('finale-picking');
    try {
      const res = await onContinue?.({
        sessionId: '',
        activityKey: 'scenario-simulator',
        topicContext: customTopic ?? content.title,
        requestType: 'pick-top3',
        studentResponse: JSON.stringify(finaleSubsRef.current.map((s) => ({ text: s.text }))),
        previousExchanges: [],
      });
      const picks = res?.top3Picks?.length === 3 ? res.top3Picks : fallbackPicks(finaleSubsRef.current);
      setTop3Picks(picks);
      top3PicksRef.current = picks;
    } catch {
      const picks = fallbackPicks(finaleSubsRef.current);
      setTop3Picks(picks);
      top3PicksRef.current = picks;
    }
    setFinaleVotes([]);
    setTimeLeft(15);
    setStatus(ActivityStatus.FINALE_VOTE);
    onPhaseChange?.('finale-vote');
  }, [onContinue, customTopic, content.title, onPhaseChange]);

  const handleFinaleVoteEnd = useCallback(() => {
    const tally: Record<string, number> = {};
    finaleVotesRef.current.forEach((v) => {
      const label = v.choice.charAt(0);
      tally[label] = (tally[label] ?? 0) + 1;
    });
    const winner = (['A', 'B', 'C'] as const).reduce((best, cur) =>
      (tally[cur] ?? 0) > (tally[best] ?? 0) ? cur : best, 'A' as const);
    const winPick = top3PicksRef.current.find((p) => p.label === winner) ?? top3PicksRef.current[0];
    const tag = (winPick?.tag ?? 'safe') as 'bold' | 'safe' | 'risky';
    const result = calculateOutcome(goalTotalRef.current, dangerTotalRef.current, tag);
    setOutcome({ ...result, finalTag: tag });
    setStatus(ActivityStatus.OUTCOME);
    onPhaseChange?.('outcome');
  }, [onPhaseChange]);

  const handleBegin = useCallback(() => {
    setStatus(ActivityStatus.READING);
    setCurrentRound(0);
    setCurrentLineIndex(0);
    readerIndexRef.current = 0;
    onPhaseChange?.('reading');
  }, [onPhaseChange]);

  const handleNextLine = useCallback(() => {
    const r = allRoundsRef.current[currentRoundRef.current];
    if (!r) return;
    if (currentLineIndex < r.readLines.length - 1) {
      setCurrentLineIndex((i) => i + 1);
    }
  }, [currentLineIndex]);

  const handleStartVote = useCallback(() => {
    setVotes([]);
    setTimeLeft(20);
    setStatus(ActivityStatus.VOTING);
    onPhaseChange?.('voting');
  }, [onPhaseChange]);

  const handleNextRound = useCallback(async () => {
    const r = allRoundsRef.current[currentRoundRef.current];
    readerIndexRef.current += r?.readLines.length ?? 3;
    const nextIndex = currentRoundRef.current + 1;

    // Build round history string for AI context
    const history = roundWinnersRef.current
      .map((w, i) => `Round ${i + 1}: chose "${w.text}"`)
      .join('\n');

    setIsGeneratingRound(true);
    try {
      const res = await onContinue?.({
        sessionId: '',
        activityKey: 'scenario-simulator',
        topicContext: customTopic ?? content.title,
        requestType: 'generate-round',
        studentResponse: JSON.stringify({
          storyContext: content.storyContext,
          roundNumber: nextIndex + 1,  // 1-based for the prompt
          choiceText: lastWinnerRef.current?.text ?? '',
          consequence: lastWinnerRef.current?.consequence ?? '',
          tone: content.tone,
          goalLabel: content.goalLabel,
          dangerLabel: content.dangerLabel,
          goalTotal: goalTotalRef.current,
          dangerTotal: dangerTotalRef.current,
          roundHistory: history,
          difficulty: sessionSettings.difficulty,
        }),
        previousExchanges: [],
      });
      if (res?.generatedRound) {
        setDynamicRounds((prev) => [...prev, res.generatedRound!]);
      }
    } catch {
      // Fallback: reuse last round's structure with incremented id
      if (r) {
        setDynamicRounds((prev) => [...prev, { ...r, id: nextIndex + 1 }]);
      }
    } finally {
      setIsGeneratingRound(false);
    }

    setCurrentRound(nextIndex);
    setCurrentLineIndex(0);
    setVotes([]);
    setStatus(ActivityStatus.READING);
    onPhaseChange?.('reading');
  }, [content, customTopic, onContinue, onPhaseChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoToFinale = useCallback(() => {
    setFinaleSubmissions([]);
    pickingRef.current = false;
    setTimeLeft(30);
    setStatus(ActivityStatus.FINALE_SUBMIT);
    onPhaseChange?.('finale-submit');
  }, [onPhaseChange]);

  const handleRestart = useCallback(() => {
    setStatus(ActivityStatus.IDLE);
    setCurrentRound(0);
    setCurrentLineIndex(0);
    setVotes([]);
    setGoalTotal(0);
    setDangerTotal(1);
    goalTotalRef.current = 0;
    dangerTotalRef.current = 1;
    setLastConsequence('');
    setLastWinner(null);
    setTimeLeft(0);
    setFinaleSubmissions([]);
    setTop3Picks([]);
    top3PicksRef.current = [];
    setFinaleVotes([]);
    setOutcome(null);
    setDynamicRounds([]);
    setIsGeneratingRound(false);
    readerIndexRef.current = 0;
    pickingRef.current = false;
    roundWinnersRef.current = [];
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  // ── Reader assignment ─────────────────────────────────────────────────────────
  function getReader(lineOffset: number) {
    if (!students.length) return null;
    const idx = (readerIndexRef.current + lineOffset) % students.length;
    return students[idx] ?? null;
  }

  // ── Stale content guard (after all hooks) ────────────────────────────────────
  if (!content.rounds || content.rounds.length < 1) {
    return (
      <div className="text-center py-12">
        <p className="text-amber-400 text-sm">Content needs to be regenerated for the updated Scenario Simulator.</p>
      </div>
    );
  }

  const round = allRounds[currentRound];

  // ── Meter bounds: internal raw range is roughly -10 to +10 across 5 rounds ──
  const METER_MAX = 10;

  const timerUrgent = timeLeft <= 5 && timeLeft > 0;

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-lc-blue">Scenario Simulator</h3>
          {customTopic && <p className="text-xs opacity-60">Topic: {customTopic}</p>}
        </div>
        {status !== ActivityStatus.IDLE && status !== ActivityStatus.OUTCOME && (
          <span className="text-sm opacity-50">Round {currentRound + 1} / 5</span>
        )}
      </div>

      {/* ── IDLE ─────────────────────────────────────────────────────────────── */}
      {status === ActivityStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-10 space-y-6"
        >
          <p className="text-2xl font-bold leading-snug max-w-lg mx-auto">{content.hook}</p>
          <p className="text-sm opacity-50 uppercase tracking-widest">{content.title}</p>
          {content.openingLines?.length > 0 && (
            <div className="glass p-4 rounded-xl space-y-2 text-left max-w-md mx-auto">
              {content.openingLines.map((line, i) => (
                <p key={i} className="text-base opacity-80">{line}</p>
              ))}
            </div>
          )}
          <button
            onClick={handleBegin}
            className="px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            BEGIN
          </button>
        </motion.div>
      )}

      {/* ── READING ──────────────────────────────────────────────────────────── */}
      {status === ActivityStatus.READING && round && (
        <motion.div
          key={`reading-${currentRound}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Meters (after round 0) */}
          {currentRound > 0 && (
            <div className="glass p-4 rounded-xl space-y-2">
              <MeterBar label={content.goalLabel} value={goalTotal} maxVal={METER_MAX} colorClass="bg-emerald-400" />
              <MeterBar label={content.dangerLabel} value={dangerTotal} maxVal={METER_MAX} colorClass="bg-red-400" />
            </div>
          )}

          {/* Lines */}
          <div className="space-y-3">
            {round.readLines.map((line, i) => {
              const reader = getReader(i);
              const isActive = i === currentLineIndex;
              const isPast = i < currentLineIndex;
              return (
                <motion.div
                  key={i}
                  className={`glass p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-lc-blue/60 bg-lc-blue/10'
                      : isPast
                      ? 'border-white/5 opacity-40'
                      : 'border-white/10 opacity-50'
                  }`}
                >
                  {reader && (
                    <p className="text-xs opacity-50 mb-1">({reader.name}) reads:</p>
                  )}
                  <p className={`text-lg ${isActive ? 'font-semibold' : ''}`}>{line}</p>
                </motion.div>
              );
            })}
          </div>

          <p className="text-xs opacity-40 text-center">{round.situation}</p>

          <div className="flex gap-3 justify-center">
            {currentLineIndex < round.readLines.length - 1 ? (
              <button
                onClick={handleNextLine}
                className="px-6 py-3 glass border border-white/20 rounded-xl font-game hover:bg-white/10 transition-all"
              >
                NEXT LINE
              </button>
            ) : (
              <button
                onClick={handleStartVote}
                className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                START VOTE
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── VOTING ───────────────────────────────────────────────────────────── */}
      {status === ActivityStatus.VOTING && round && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest opacity-50">Vote now</p>
            <span className={`text-2xl font-game tabular-nums ${timerUrgent ? 'text-red-400 animate-pulse' : 'opacity-60'}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="space-y-3">
            {round.choices.map((choice) => (
              <div key={choice.label} className="glass p-4 rounded-xl border border-white/10 flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-lc-blue/20 text-lc-blue flex items-center justify-center font-bold shrink-0 text-lg">
                  {choice.label}
                </span>
                <p className="text-lg pt-1">{choice.text}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm opacity-50">{votes.length} / {students.length || '?'} voted</span>
            <button
              onClick={handleVotingEnd}
              className="px-5 py-2 glass border border-white/20 rounded-xl text-sm font-game hover:bg-white/10 transition-all"
            >
              END VOTE NOW
            </button>
          </div>
        </motion.div>
      )}

      {/* ── CONSEQUENCE ──────────────────────────────────────────────────────── */}
      {status === ActivityStatus.CONSEQUENCE && lastWinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5"
        >
          {/* Vote tally */}
          <div className="flex gap-3 justify-center">
            {round?.choices.map((choice) => {
              const count = votes.filter((v) => v.choice.startsWith(choice.label)).length;
              const isWinner = choice.label === lastWinner.label;
              return (
                <div
                  key={choice.label}
                  className={`glass px-4 py-2 rounded-xl text-center ${isWinner ? 'border-2 border-emerald-400/60 bg-emerald-400/10' : 'border border-white/10'}`}
                >
                  <div className="font-bold text-lg">{choice.label}</div>
                  <div className="text-sm opacity-60">{count}</div>
                </div>
              );
            })}
          </div>

          {/* Consequence */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass p-6 rounded-2xl border-2 border-yellow-500/30"
          >
            <p className="text-xl text-center">{lastConsequence}</p>
          </motion.div>

          {/* Meters */}
          <div className="glass p-4 rounded-xl space-y-2">
            <MeterBar label={content.goalLabel} value={goalTotal} maxVal={METER_MAX} colorClass="bg-emerald-400" />
            <MeterBar label={content.dangerLabel} value={dangerTotal} maxVal={METER_MAX} colorClass="bg-red-400" />
          </div>

          <div className="flex justify-center">
            {currentRound < 4 ? (
              <button
                onClick={handleNextRound}
                disabled={isGeneratingRound}
                className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-50 disabled:cursor-wait"
              >
                {isGeneratingRound ? 'BUILDING NEXT ROUND…' : 'NEXT ROUND'}
              </button>
            ) : (
              <button
                onClick={handleGoToFinale}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                GO TO FINALE
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── FINALE_SUBMIT ─────────────────────────────────────────────────────── */}
      {status === ActivityStatus.FINALE_SUBMIT && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="glass p-6 rounded-2xl border-2 border-amber-500/30 text-center">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-2">Final Move</p>
            <p className="text-xl">{content.finalePrompt}</p>
            <p className="text-sm opacity-40 mt-1">(max 15 words)</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm opacity-50">{finaleSubmissions.length} submissions received</span>
            <span className={`text-2xl font-game tabular-nums ${timerUrgent ? 'text-red-400 animate-pulse' : 'opacity-60'}`}>
              {timeLeft}s
            </span>
          </div>

          {finaleSubmissions.length > 0 && (
            <div className="space-y-2">
              {finaleSubmissions.map((s) => (
                <div key={s.clientId} className="glass px-4 py-2 rounded-xl text-sm flex gap-2">
                  <span className="opacity-40 shrink-0">{s.displayName}:</span>
                  <span className="opacity-80">{s.text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handlePickTop3}
              disabled={finaleSubmissions.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              PICK TOP 3 NOW
            </button>
          </div>
        </motion.div>
      )}

      {/* ── FINALE_PICKING ────────────────────────────────────────────────────── */}
      {status === ActivityStatus.FINALE_PICKING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-lc-blue border-t-transparent rounded-full mx-auto"
          />
          <p className="text-lg opacity-70">AI is picking the top 3…</p>
        </motion.div>
      )}

      {/* ── FINALE_VOTE ───────────────────────────────────────────────────────── */}
      {status === ActivityStatus.FINALE_VOTE && top3Picks.length === 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest opacity-50">Choose the best final move</p>
            <span className={`text-2xl font-game tabular-nums ${timerUrgent ? 'text-red-400 animate-pulse' : 'opacity-60'}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="space-y-3">
            {top3Picks.map((pick) => (
              <div key={pick.label} className="glass p-4 rounded-xl border border-white/10 flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold shrink-0 text-lg">
                  {pick.label}
                </span>
                <div className="pt-1">
                  <p className="text-lg">{pick.text}</p>
                  <span className={`text-xs mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                    pick.tag === 'bold' ? 'bg-amber-500/20 text-amber-300' :
                    pick.tag === 'risky' ? 'bg-red-500/20 text-red-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>{pick.tag}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm opacity-50">{finaleVotes.length} / {students.length || '?'} voted</span>
            <button
              onClick={handleFinaleVoteEnd}
              className="px-5 py-2 glass border border-white/20 rounded-xl text-sm font-game hover:bg-white/10 transition-all"
            >
              REVEAL OUTCOME
            </button>
          </div>
        </motion.div>
      )}

      {/* ── OUTCOME ───────────────────────────────────────────────────────────── */}
      {status === ActivityStatus.OUTCOME && outcome && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`glass p-8 rounded-2xl border-4 ${
              outcome.isSuccess
                ? 'border-emerald-400/60 bg-emerald-400/10'
                : 'border-red-400/60 bg-red-400/10'
            }`}
          >
            <p className={`text-3xl font-game mb-3 ${outcome.isSuccess ? 'text-emerald-300' : 'text-red-300'}`}>
              {outcome.isSuccess ? content.successBanner : content.failureBanner}
            </p>
            <p className="opacity-70 text-lg">
              {outcomeReason(content.title, outcome.isSuccess, outcome.narrow, outcome.isComeback, goalTotalRef.current)}
            </p>
          </motion.div>

          {/* Final meter state */}
          <div className="glass p-4 rounded-xl space-y-2">
            <MeterBar label={content.goalLabel} value={goalTotal} maxVal={METER_MAX} colorClass="bg-emerald-400" />
            <MeterBar label={content.dangerLabel} value={dangerTotal} maxVal={METER_MAX} colorClass="bg-red-400" />
          </div>

          <button
            onClick={handleRestart}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            TRY AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
}
