'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Plane } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { PredictionRoundContent, PredictionRoundQuestion } from '../types';
import { useSessionStore, type PredictionResult } from '@/stores/session-store';

type Phase = 'idle' | 'prompting' | 'revealing' | 'summary' | 'locked';

interface PredictionVote {
  studentId: string | null;
  clientId: string;
  displayName: string;
  choice: string;
}

// votes[questionIndex][clientId] = vote metadata
type VoteMap = Record<number, Record<string, PredictionVote>>;

interface PredictionRoundRuntimeState {
  phase: Phase;
  currentIndex: number;
  questions: PredictionRoundQuestion[];
  deferReveal: boolean;
  votes: VoteMap;
  timeLeft: number;
  activityInstance: { id: string; startedAt: number } | null;
  scoredVoteKeys: string[];
}

function recoverPredictionRuntime(
  value: unknown,
  fallbackQuestions: PredictionRoundQuestion[],
  fallbackDeferReveal: boolean,
): PredictionRoundRuntimeState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<PredictionRoundRuntimeState>;
  const questions = Array.isArray(candidate.questions) && candidate.questions.length > 0
    ? candidate.questions
    : fallbackQuestions;
  if (!['prompting', 'revealing', 'summary', 'locked'].includes(candidate.phase ?? '')) return null;
  if (!Number.isInteger(candidate.currentIndex) || (candidate.currentIndex ?? -1) < 0 || (candidate.currentIndex ?? 0) >= questions.length) return null;
  if (!candidate.votes || typeof candidate.votes !== 'object') return null;
  if (typeof candidate.timeLeft !== 'number' || candidate.timeLeft < 0) return null;
  const instance = candidate.activityInstance;
  if (!instance || typeof instance.id !== 'string' || typeof instance.startedAt !== 'number') return null;
  if (!Array.isArray(candidate.scoredVoteKeys)) return null;
  return {
    ...candidate,
    questions,
    deferReveal: typeof candidate.deferReveal === 'boolean'
      ? candidate.deferReveal
      : fallbackDeferReveal,
  } as PredictionRoundRuntimeState;
}

function PredictionChart({
  question,
  votes,
  showAnswer,
}: {
  question: PredictionRoundQuestion;
  votes: Record<string, PredictionVote>;
  showAnswer: boolean;
}) {
  const countA = Object.values(votes).filter((v) => v.choice === question.optionA).length;
  const countB = Object.values(votes).filter((v) => v.choice === question.optionB).length;
  const total = countA + countB;

  const pctA = total > 0 ? Math.round((countA / total) * 100) : 0;
  const pctB = total > 0 ? Math.round((countB / total) * 100) : 0;

  const correctA = question.correctAnswer === 'A';
  const correctB = question.correctAnswer === 'B';

  return (
    <div className="glass p-5 rounded-2xl space-y-4">
      <p className="font-semibold text-lg">{question.text}</p>

      <div className="space-y-3">
        {/* Option A */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className={`inline-flex items-center gap-1 ${showAnswer && correctA ? 'text-emerald-400 font-bold' : 'opacity-70'}`}>
              {question.optionA}
              {showAnswer && correctA && <Check className="w-3.5 h-3.5" />}
            </span>
            <span>{countA} ({pctA}%)</span>
          </div>
          <div className="bg-white/10 rounded-full h-6 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                showAnswer && correctA ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
              style={{ width: `${pctA}%` }}
            />
          </div>
        </div>

        {/* Option B */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className={`inline-flex items-center gap-1 ${showAnswer && correctB ? 'text-emerald-400 font-bold' : 'opacity-70'}`}>
              {question.optionB}
              {showAnswer && correctB && <Check className="w-3.5 h-3.5" />}
            </span>
            <span>{countB} ({pctB}%)</span>
          </div>
          <div className="bg-white/10 rounded-full h-6 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                showAnswer && correctB ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
              style={{ width: `${pctB}%` }}
            />
          </div>
        </div>
      </div>

      {showAnswer && (
        <div className="bg-white/5 rounded-xl p-3 text-sm opacity-80 border border-white/10">
          {question.revealFact}
        </div>
      )}

      <p className="text-xs opacity-40">{total} response{total !== 1 ? 's' : ''}</p>
    </div>
  );
}

export function PredictionRoundActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  initialRuntimeState,
  onRuntimeStateChange,
}: ActivityProps) {
  const content = generatedContent as PredictionRoundContent;
  const generatedDeferReveal = content.deferReveal ?? false;
  const recoveredRuntimeRef = useRef(recoverPredictionRuntime(
    initialRuntimeState,
    content.questions,
    generatedDeferReveal,
  ));
  const recoveredRuntime = recoveredRuntimeRef.current;
  const questions = recoveredRuntime?.questions ?? content.questions;
  const questionCount = questions.length; // always 3
  // "Listen for it" mode (Captain's Flight, source lessons): collect predictions at takeoff but hold
  // the answers back until AFTER the briefing, where the reveal panel pays them off.
  const deferReveal = recoveredRuntime?.deferReveal ?? generatedDeferReveal;
  const setPredictionResults = useSessionStore((s) => s.setPredictionResults);
  const addFlightLogEntry = useSessionStore((s) => s.addFlightLogEntry);

  const [phase, setPhase] = useState<Phase>(recoveredRuntime?.phase ?? 'idle');
  const [currentIndex, setCurrentIndex] = useState(recoveredRuntime?.currentIndex ?? 0);
  const [votes, setVotes] = useState<VoteMap>(recoveredRuntime?.votes ?? { 0: {}, 1: {}, 2: {} });
  const [timeLeft, setTimeLeft] = useState(recoveredRuntime?.timeLeft ?? 0);
  const instanceCounterRef = useRef(0);
  const activityInstanceRef = useRef<{ id: string; startedAt: number } | null>(recoveredRuntime?.activityInstance ?? null);

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const votesRef = useRef(votes);
  votesRef.current = votes;
  const scoredVotesRef = useRef<Set<string>>(new Set(recoveredRuntime?.scoredVoteKeys ?? []));

  const timerSeconds = sessionSettings.timerSeconds ?? 30;

  useEffect(() => {
    if (phase === 'idle') {
      onRuntimeStateChange?.(null);
      return;
    }
    onRuntimeStateChange?.({
      phase,
      currentIndex,
      questions,
      deferReveal,
      votes,
      timeLeft,
      activityInstance: activityInstanceRef.current,
      scoredVoteKeys: Array.from(scoredVotesRef.current),
    } satisfies PredictionRoundRuntimeState);
  }, [phase, currentIndex, questions, deferReveal, votes, timeLeft, onRuntimeStateChange]);

  useEffect(() => {
    if (recoveredRuntime?.phase) onPhaseChange?.(recoveredRuntime.phase);
  }, [onPhaseChange, recoveredRuntime]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'prompting' || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  // Auto-advance to revealing when timer hits 0
  useEffect(() => {
    if (phase === 'prompting' && timeLeft === 0) {
      handleReveal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // Register remote vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'prompting') return;
      const idx = currentIndexRef.current;
      const instance = activityInstanceRef.current;
      const expectedRoundId = instance ? `${instance.id}:question-${idx + 1}` : null;
      if (!vote.roundId || !expectedRoundId || vote.roundId !== expectedRoundId) return;
      const alreadyVoted = votesRef.current[idx]?.[vote.clientId];
      if (!alreadyVoted) {
        setVotes((prev) => ({
          ...prev,
          [idx]: {
            ...prev[idx],
            [vote.clientId]: {
              studentId: vote.studentId ?? null,
              clientId: vote.clientId,
              displayName: vote.displayName,
              choice: vote.choice,
            },
          },
        }));
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore]);

  // Set input spec when prompting
  useEffect(() => {
    if (phase !== 'prompting') {
      const instance = activityInstanceRef.current;
      onSetInputSpec?.(null, instance ? {
        id: instance.id,
        startedAt: instance.startedAt,
        sequence: currentIndex * 2 + 1,
      } : null);
      return;
    }
    const q = questions[currentIndex];
    if (!q) return;
    const instance = activityInstanceRef.current;
    if (!instance) return;
    onSetInputSpec?.({
      type: 'binary',
      gameKey: 'prediction-round',
      prompt: q.text,
      optionLabels: [q.optionA, q.optionB],
      activityInstanceId: instance.id,
      activityInstanceStartedAt: instance.startedAt,
      activitySequence: currentIndex * 2,
      roundId: `${instance.id}:question-${currentIndex + 1}`,
    });
  }, [phase, currentIndex, questions, onSetInputSpec]);

  const handleStart = useCallback(() => {
    const startedAt = Date.now();
    instanceCounterRef.current += 1;
    activityInstanceRef.current = {
      id: `prediction-round:${startedAt}:${instanceCounterRef.current}`,
      startedAt,
    };
    setCurrentIndex(0);
    setVotes({ 0: {}, 1: {}, 2: {} });
    scoredVotesRef.current = new Set();
    setTimeLeft(timerSeconds);
    setPhase('prompting');
    onPhaseChange?.('prompting');
  }, [timerSeconds, onPhaseChange]);

  const scoreCurrentVotes = useCallback(() => {
    if (!onScore) return;
    const idx = currentIndexRef.current;
    const question = questions[idx];
    if (!question) return;
    Object.values(votesRef.current[idx] ?? {}).forEach((vote) => {
      const scoreKey = `${idx}:${vote.clientId}`;
      if (scoredVotesRef.current.has(scoreKey)) return;
      scoredVotesRef.current.add(scoreKey);
      const isCorrect = (
        (question.correctAnswer === 'A' && vote.choice === question.optionA)
        || (question.correctAnswer === 'B' && vote.choice === question.optionB)
      );
      void onScore({
        studentId: vote.studentId,
        clientId: vote.clientId,
        displayName: vote.displayName,
        promptIndex: idx + 1,
        points: isCorrect ? 3 : 1,
        isCorrect,
      });
    });
  }, [onScore, questions]);

  // Deferred mode: predictions locked. Stash the class's split + held-back answers for the briefing
  // reveal, then land on the "locked" screen (no answers shown here — that's the point).
  const finishDeferred = useCallback(() => {
    const results: PredictionResult[] = questions.map((q, i) => {
      const qv = Object.values(votesRef.current[i] ?? {});
      return {
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        correctAnswer: q.correctAnswer,
        revealFact: q.revealFact,
        countA: qv.filter((v) => v.choice === q.optionA).length,
        countB: qv.filter((v) => v.choice === q.optionB).length,
      };
    });
    setPredictionResults(results);
    // Flight log (Captain's Flight): record how the class did by majority, for the Final Word debrief.
    // addFlightLogEntry self-guards to Captain's, so this no-ops in other presets.
    const correctByMajority = results.filter((r) => {
      if (r.countA === r.countB) return false;
      const majority = r.countA > r.countB ? 'A' : 'B';
      return majority === r.correctAnswer;
    }).length;
    addFlightLogEntry({
      beat: 'prediction',
      text: `Predicted ${correctByMajority}/${results.length} right at takeoff.`,
      callback: `You predicted ${correctByMajority} of ${results.length} right at takeoff — what surprised you most?`,
    });
    setPhase('locked');
    onPhaseChange?.('locked');
    const instance = activityInstanceRef.current;
    onSetInputSpec?.(null, instance ? {
      id: instance.id,
      startedAt: instance.startedAt,
      sequence: currentIndexRef.current * 2 + 1,
    } : null);
  }, [questions, setPredictionResults, addFlightLogEntry, onPhaseChange, onSetInputSpec]);

  const handleReveal = useCallback(() => {
    scoreCurrentVotes();
    if (deferReveal) {
      // Score, then move straight to the next prediction (or lock) — the answer stays hidden.
      const nextIndex = currentIndexRef.current + 1;
      if (nextIndex >= questionCount) {
        finishDeferred();
      } else {
        setCurrentIndex(nextIndex);
        setTimeLeft(timerSeconds);
        setPhase('prompting');
        onPhaseChange?.('prompting');
      }
      return;
    }
    setPhase('revealing');
    onPhaseChange?.('revealing');
  }, [scoreCurrentVotes, deferReveal, questionCount, timerSeconds, finishDeferred, onPhaseChange]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questionCount) {
      setPhase('summary');
      onPhaseChange?.('summary');
    } else {
      setCurrentIndex(nextIndex);
      setTimeLeft(timerSeconds);
      setPhase('prompting');
      onPhaseChange?.('prompting');
    }
  }, [currentIndex, questionCount, timerSeconds, onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
    const instance = activityInstanceRef.current;
    onSetInputSpec?.(null, instance ? {
      id: instance.id,
      startedAt: instance.startedAt,
      sequence: currentIndex * 2 + 1,
    } : null);
  }, [currentIndex, onPhaseChange, onSetInputSpec]);

  const currentQuestion = questions[currentIndex];
  const currentVotes = votes[currentIndex] ?? {};
  const totalVotes = Object.keys(currentVotes).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-400">Prediction Round</h3>
        {phase !== 'idle' && phase !== 'summary' && phase !== 'locked' && (
          <span className="text-sm opacity-60">
            Question {currentIndex + 1} of {questionCount}
          </span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-xl opacity-90">3 predictions — vote before you know the answer.</p>
          <p className="text-sm opacity-50">
            {deferReveal
              ? 'Students commit to a prediction — the answers are in the briefing ahead. Reveal them after the briefing.'
              : 'Students commit to a prediction, then you reveal the truth.'}
          </p>
          <button
            onClick={handleStart}
            className="px-12 py-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START
          </button>
        </div>
      )}

      {/* PROMPTING */}
      {phase === 'prompting' && currentQuestion && (
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border-2 border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full uppercase tracking-widest opacity-60">
                Make your prediction
              </span>
            </div>
            <p className="text-xl font-semibold">{currentQuestion.text}</p>
            <div className="flex gap-3 text-sm opacity-60">
              <span className="px-3 py-1 bg-sky-500/20 rounded-lg">{currentQuestion.optionA}</span>
              <span className="px-3 py-1 bg-sky-500/20 rounded-lg">{currentQuestion.optionB}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-game ${timeLeft <= 5 ? 'text-red-400' : 'text-amber-400'}`}>
                {timeLeft}s
              </div>
              <button onClick={() => setTimeLeft(prev => prev + 30)} className="px-2 py-1 rounded-lg text-xs font-game bg-white/10 hover:bg-white/20 text-slate-300 transition-all border border-white/10">+30s</button>
              <div className="text-sm opacity-50">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</div>
            </div>
            <button
              onClick={handleReveal}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {deferReveal
                ? (currentIndex < questionCount - 1 ? 'LOCK & NEXT' : 'LOCK PREDICTIONS')
                : 'REVEAL ANSWER'}
            </button>
          </div>
        </div>
      )}

      {/* REVEALING */}
      {phase === 'revealing' && currentQuestion && (
        <div className="space-y-6">
          <PredictionChart
            question={currentQuestion}
            votes={currentVotes}
            showAnswer
          />

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentIndex < questionCount - 1 ? 'NEXT QUESTION' : 'VIEW SUMMARY'}
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {phase === 'summary' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {questions.map((q, i) => (
              <PredictionChart
                key={i}
                question={q}
                votes={votes[i] ?? {}}
                showAnswer
              />
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleEnd}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              END ACTIVITY
            </button>
          </div>
        </div>
      )}

      {/* LOCKED — deferred "Listen for it" mode: predictions are in, answers held for the briefing */}
      {phase === 'locked' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-2xl font-semibold inline-flex items-center justify-center gap-2">
            Predictions locked
            <Plane className="w-6 h-6 text-amber-400 -rotate-45" />
          </p>
          <p className="text-base opacity-80 max-w-md mx-auto">
            The answers are in the briefing ahead. Watch and listen for them — we&apos;ll reveal how the
            class did afterward.
          </p>
          <div className="flex justify-center pt-4">
            <button
              onClick={handleEnd}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              START BRIEFING
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
