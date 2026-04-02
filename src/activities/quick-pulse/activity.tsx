'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { QuickPulseContent, QuickPulsePrompt } from '../types';

type Phase = 'idle' | 'prompting' | 'revealing' | 'summary';

// votes[promptIndex][clientId] = choice
type VoteMap = Record<number, Record<string, string>>;

function DistributionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-6 text-right opacity-70">{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm w-10 text-right">{count}</span>
      <span className="text-xs opacity-50 w-8">{pct}%</span>
    </div>
  );
}

function LikertChart({ votes }: { votes: Record<string, string> }) {
  const counts = [1, 2, 3, 4, 5].map((n) =>
    Object.values(votes).filter((v) => v === String(n)).length
  );
  const total = Object.keys(votes).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-emerald-400'];
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((n, i) => (
        <DistributionBar key={n} label={String(n)} count={counts[i]} total={total} color={colors[i]} />
      ))}
      <p className="text-xs opacity-50 mt-1">{total} response{total !== 1 ? 's' : ''} · 1 = disagree, 5 = agree</p>
    </div>
  );
}

function YesNoChart({ votes }: { votes: Record<string, string> }) {
  const yesCount = Object.values(votes).filter((v) => v === 'Yes').length;
  const noCount = Object.values(votes).filter((v) => v === 'No').length;
  const total = yesCount + noCount;
  return (
    <div className="space-y-2">
      <DistributionBar label="Yes" count={yesCount} total={total} color="bg-emerald-400" />
      <DistributionBar label="No" count={noCount} total={total} color="bg-rose-400" />
      <p className="text-xs opacity-50 mt-1">{total} response{total !== 1 ? 's' : ''}</p>
    </div>
  );
}

function PromptChart({ prompt, votes }: { prompt: QuickPulsePrompt; votes: Record<string, string> }) {
  return (
    <div className="glass p-5 rounded-2xl space-y-4">
      <p className="font-semibold">{prompt.text}</p>
      {prompt.type === 'likert' ? (
        <LikertChart votes={votes} />
      ) : (
        <YesNoChart votes={votes} />
      )}
    </div>
  );
}

export function QuickPulseActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as QuickPulseContent;
  const prompts = content.prompts;

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<VoteMap>({ 0: {}, 1: {}, 2: {} });
  const [timeLeft, setTimeLeft] = useState(0);

  // Use a ref for currentIndex so the vote handler closure always sees the latest value
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
    const prompt = prompts[currentIndex];
    if (!prompt) return;
    if (prompt.type === 'likert') {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'quick-pulse',
        prompt: prompt.text,
        options: ['1', '2', '3', '4', '5'],
        optionLabels: ['1 – Strongly Disagree', '2', '3', '4', '5 – Strongly Agree'],
      });
    } else {
      onSetInputSpec?.({
        type: 'binary',
        gameKey: 'quick-pulse',
        prompt: prompt.text,
        optionLabels: ['Yes', 'No'],
      });
    }
  }, [phase, currentIndex, prompts, onSetInputSpec]);

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
    if (nextIndex >= 3) {
      setPhase('summary');
      onPhaseChange?.('summary');
    } else {
      setCurrentIndex(nextIndex);
      setTimeLeft(timerSeconds);
      setPhase('prompting');
      onPhaseChange?.('prompting');
    }
  }, [currentIndex, timerSeconds, onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
    onSetInputSpec?.(null);
  }, [onPhaseChange, onSetInputSpec]);

  const currentPrompt = prompts[currentIndex];
  const currentVotes = votes[currentIndex] ?? {};
  const totalVotes = Object.keys(currentVotes).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-cyan-400">Quick Pulse</h3>
        {phase !== 'idle' && phase !== 'summary' && (
          <span className="text-sm opacity-60">
            Prompt {currentIndex + 1} of 3
          </span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-xl opacity-90">3 quick prompts — instant results.</p>
          <p className="text-sm opacity-50">Students respond simultaneously on their devices.</p>
          <button
            onClick={handleStart}
            className="px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START
          </button>
        </div>
      )}

      {/* PROMPTING */}
      {phase === 'prompting' && currentPrompt && (
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border-2 border-cyan-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full uppercase tracking-widest opacity-60">
                {currentPrompt.type === 'likert' ? 'Rate 1–5' : 'Yes / No'}
              </span>
            </div>
            <p className="text-xl font-semibold">{currentPrompt.text}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-game ${timeLeft <= 5 ? 'text-red-400' : 'text-cyan-400'}`}>
                {timeLeft}s
              </div>
              <div className="text-sm opacity-50">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</div>
            </div>
            <button
              onClick={handleReveal}
              className="px-6 py-3 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              REVEAL NOW
            </button>
          </div>
        </div>
      )}

      {/* REVEALING */}
      {phase === 'revealing' && currentPrompt && (
        <div className="space-y-6">
          <PromptChart prompt={currentPrompt} votes={currentVotes} />

          <div className="flex justify-end">
            {currentIndex < 2 ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                NEXT PROMPT
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                VIEW SUMMARY
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {phase === 'summary' && (
        <div className="space-y-6">
          <div className="grid gap-4">
            {prompts.map((prompt, i) => (
              <PromptChart key={i} prompt={prompt} votes={votes[i] ?? {}} />
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleEnd}
              className="px-8 py-3 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              END MODULE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
