'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { PredictionRoundContent, PredictionRoundQuestion } from '../types';

type Phase = 'idle' | 'prompting' | 'revealing' | 'summary';

// votes[questionIndex][clientId] = 'A' | 'B'
type VoteMap = Record<number, Record<string, string>>;

function PredictionChart({
  question,
  votes,
  showAnswer,
}: {
  question: PredictionRoundQuestion;
  votes: Record<string, string>;
  showAnswer: boolean;
}) {
  const countA = Object.values(votes).filter((v) => v === question.optionA).length;
  const countB = Object.values(votes).filter((v) => v === question.optionB).length;
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
            <span className={showAnswer && correctA ? 'text-emerald-400 font-bold' : 'opacity-70'}>
              {question.optionA}
              {showAnswer && correctA && ' ✓'}
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
            <span className={showAnswer && correctB ? 'text-emerald-400 font-bold' : 'opacity-70'}>
              {question.optionB}
              {showAnswer && correctB && ' ✓'}
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
}: ActivityProps) {
  const content = generatedContent as PredictionRoundContent;
  const questions = content.questions;
  const questionCount = questions.length; // always 3

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<VoteMap>({ 0: {}, 1: {}, 2: {} });
  const [timeLeft, setTimeLeft] = useState(0);

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const votesRef = useRef(votes);
  votesRef.current = votes;

  const timerSeconds = sessionSettings.timerSeconds ?? 30;

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
      const alreadyVoted = votesRef.current[idx]?.[vote.clientId];
      if (!alreadyVoted) {
        setVotes((prev) => ({
          ...prev,
          [idx]: { ...prev[idx], [vote.clientId]: vote.choice },
        }));
        onScore?.({
          studentId: vote.studentId ?? null,
          clientId: vote.clientId,
          displayName: vote.displayName,
          promptIndex: idx + 1,
          points: 1,
          isCorrect: null,
        });
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore]);

  // Set input spec when prompting
  useEffect(() => {
    if (phase !== 'prompting') {
      onSetInputSpec?.(null);
      return;
    }
    const q = questions[currentIndex];
    if (!q) return;
    onSetInputSpec?.({
      type: 'binary',
      gameKey: 'prediction-round',
      prompt: q.text,
      optionLabels: [q.optionA, q.optionB],
    });
  }, [phase, currentIndex, questions, onSetInputSpec]);

  const handleStart = useCallback(() => {
    setCurrentIndex(0);
    setVotes({ 0: {}, 1: {}, 2: {} });
    setTimeLeft(timerSeconds);
    setPhase('prompting');
    onPhaseChange?.('prompting');
  }, [timerSeconds, onPhaseChange]);

  const handleReveal = useCallback(() => {
    setPhase('revealing');
    onPhaseChange?.('revealing');
  }, [onPhaseChange]);

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
    onSetInputSpec?.(null);
  }, [onPhaseChange, onSetInputSpec]);

  const currentQuestion = questions[currentIndex];
  const currentVotes = votes[currentIndex] ?? {};
  const totalVotes = Object.keys(currentVotes).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-400">Prediction Round</h3>
        {phase !== 'idle' && phase !== 'summary' && (
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
            Students commit to a prediction, then you reveal the truth.
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
              REVEAL ANSWER
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
              END MODULE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
