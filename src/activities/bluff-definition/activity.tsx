'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ActivityProps } from '../types';
import type { BluffDefinitionContent } from '../types';

type Phase = 'idle' | 'submitting' | 'voting' | 'reveal' | 'done';

interface ShuffledOption {
  text: string;
  isReal: boolean;
  authorClientId: string | null;
  authorStudentId: string | null;
  authorName: string | null;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function BluffDefinitionActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as BluffDefinitionContent;

  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIdx, setRoundIdx] = useState(0);
  const [submissions, setSubmissions] = useState<Record<string, { text: string; displayName: string; studentId: string | null }>>({});
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([]);
  const [votes, setVotes] = useState<Record<string, string>>({}); // clientId → chosen option text
  const [scoredSubmitters, setScoredSubmitters] = useState<Set<string>>(new Set());

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const roundIdxRef = useRef(roundIdx);
  roundIdxRef.current = roundIdx;
  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;
  const scoredSubmittersRef = useRef(scoredSubmitters);
  scoredSubmittersRef.current = scoredSubmitters;
  // participantInfo lets us score voters who may not have submitted
  const participantInfoRef = useRef<Record<string, { displayName: string; studentId: string | null }>>({});

  const currentRound = content.rounds?.[roundIdx] ?? content.rounds?.[0];
  const hasNextRound = roundIdx + 1 < (content.rounds?.length ?? 0);
  // Voting needs at least 2 fake definitions plus the real one to be a real "spot it" choice.
  const enoughStudents = students.length >= 2;

  // ─── Input spec ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'submitting' && currentRound) {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'bluff-definition',
        prompt: `Write a convincing fake definition for "${currentRound.word}". Don't use the word itself.`,
        placeholder: 'Your fake definition…',
        maxLength: 150,
      });
    } else if (phase === 'voting' && shuffledOptions.length > 0) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'bluff-definition',
        prompt: 'Which one is the REAL definition?',
        options: shuffledOptions.map((o) => o.text),
      });
    } else {
      onSetInputSpec?.(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, shuffledOptions]);

  // ─── Remote vote handler ─────────────────────────────────────────────────────
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      participantInfoRef.current[vote.clientId] = {
        displayName: vote.displayName,
        studentId: vote.studentId ?? null,
      };

      if (phaseRef.current === 'submitting') {
        const text = vote.choice.trim();
        if (!text) return;
        // Always overwrite with latest submission text
        setSubmissions((prev) => ({
          ...prev,
          [vote.clientId]: { text, displayName: vote.displayName, studentId: vote.studentId ?? null },
        }));
        // Award participation point once per round per student
        if (!scoredSubmittersRef.current.has(vote.clientId)) {
          setScoredSubmitters((prev) => new Set(Array.from(prev).concat([vote.clientId])));
          void onScore?.({
            studentId: vote.studentId ?? null,
            clientId: vote.clientId,
            displayName: vote.displayName,
            promptIndex: roundIdxRef.current * 3 + 1,
            points: 1,
            isCorrect: null,
          });
        }
      } else if (phaseRef.current === 'voting') {
        const text = vote.choice.trim();
        if (!text) return;
        setVotes((prev) => ({ ...prev, [vote.clientId]: text }));
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleStartRound = useCallback(() => {
    setSubmissions({});
    setShuffledOptions([]);
    setVotes({});
    setScoredSubmitters(new Set());
    setPhase('submitting');
    onPhaseChange?.('submitting');
  }, [onPhaseChange]);

  const handleGoToVoting = useCallback(() => {
    if (!currentRound) return;
    const subs = submissionsRef.current;
    const fakes: ShuffledOption[] = Object.entries(subs).map(([clientId, sub]) => ({
      text: sub.text,
      isReal: false,
      authorClientId: clientId,
      authorStudentId: sub.studentId,
      authorName: sub.displayName,
    }));
    const realOption: ShuffledOption = {
      text: currentRound.correctDefinition,
      isReal: true,
      authorClientId: null,
      authorStudentId: null,
      authorName: null,
    };
    setShuffledOptions(shuffle([...fakes, realOption]));
    setPhase('voting');
    onPhaseChange?.('voting');
  }, [currentRound, onPhaseChange]);

  const handleReveal = useCallback(async () => {
    const currentVotes = votes;
    const options = shuffledOptions;
    const ri = roundIdx;

    // Award correct-vote points (+1 each for identifying the real definition)
    for (const [clientId, chosenText] of Object.entries(currentVotes)) {
      const option = options.find((o) => o.text === chosenText);
      if (option?.isReal) {
        const info = participantInfoRef.current[clientId];
        await onScore?.({
          studentId: info?.studentId ?? null,
          clientId,
          displayName: info?.displayName ?? 'Student',
          promptIndex: ri * 3 + 2,
          points: 1,
          isCorrect: null,
        });
      }
    }

    // Award fool points (+2 per person fooled) to each fake author
    for (const option of options) {
      if (option.isReal || !option.authorClientId) continue;
      const foolCount = Object.values(currentVotes).filter((v) => v === option.text).length;
      if (foolCount > 0) {
        await onScore?.({
          studentId: option.authorStudentId,
          clientId: option.authorClientId,
          displayName: option.authorName ?? 'Student',
          promptIndex: ri * 3 + 3,
          points: foolCount * 2,
          isCorrect: null,
        });
      }
    }

    setPhase('reveal');
    onPhaseChange?.('reveal');
  }, [votes, shuffledOptions, roundIdx, onScore, onPhaseChange]);

  const handleNextRound = useCallback(() => {
    setRoundIdx((i) => i + 1);
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('done');
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  const submittedCount = Object.keys(submissions).length;
  const voteCount = Object.keys(votes).length;
  const voteTally = shuffledOptions.map((o) =>
    Object.values(votes).filter((v) => v === o.text).length
  );

  // ─── IDLE ─────────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold opacity-90">Bluff Definition</p>
          <p className="text-sm opacity-50 leading-relaxed">
            Everyone writes a fake definition for the secret word.<br />
            Can you fool the class — and spot the real one?
          </p>
        </div>

        {currentRound && (
          <div className="glass p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-sm opacity-40">Round {roundIdx + 1} of {content.rounds?.length ?? 1}</p>
          </div>
        )}

        {!enoughStudents && (
          <div className="glass p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-300 text-center">
            Need at least 2 students to play. ({students.length} joined)
          </div>
        )}

        <div className="flex justify-center pt-2">
          <button
            onClick={handleStartRound}
            disabled={!currentRound || !enoughStudents}
            className="px-12 py-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            REVEAL WORD ✨
          </button>
        </div>
      </div>
    );
  }

  // ─── SUBMITTING ───────────────────────────────────────────────────────────────
  if (phase === 'submitting') {
    const canAdvance = submittedCount >= 2;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-violet-400">Write Your Fake</h3>
          <span className="text-sm opacity-60">{submittedCount} / {students.length} submitted</span>
        </div>

        {currentRound && (
          <div className="glass p-6 rounded-2xl border-2 border-violet-500/30 text-center space-y-2">
            <p className="text-xs opacity-40 uppercase tracking-widest">The word is</p>
            <p className="text-4xl font-bold text-violet-300">{currentRound.word}</p>
            <p className="text-xs opacity-40">Write a convincing fake definition on your device</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {students.map((s) => {
            const submitted = Object.values(submissions).some((sub) => sub.displayName === s.name);
            return (
              <span
                key={s.id}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  submitted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 opacity-40'
                }`}
              >
                {s.name}
              </span>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGoToVoting}
            disabled={!canAdvance}
            className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {canAdvance ? 'Go to Voting ▶' : 'Need 2+ submissions…'}
          </button>
        </div>
      </div>
    );
  }

  // ─── VOTING ───────────────────────────────────────────────────────────────────
  if (phase === 'voting') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-violet-400">Which is Real?</h3>
          <span className="text-sm opacity-60">{voteCount} / {students.length} voted</span>
        </div>

        <p className="text-xs opacity-40 uppercase tracking-wide">Students are choosing on their devices…</p>

        <div className="space-y-3">
          {shuffledOptions.map((option, i) => {
            const count = voteTally[i];
            const pct = voteCount > 0 ? Math.round((count / voteCount) * 100) : 0;
            return (
              <div key={i} className="glass p-3 rounded-xl border border-white/10 space-y-1.5">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-violet-400 mt-0.5 w-5 shrink-0 text-center">
                    {OPTION_LABELS[i]}
                  </span>
                  <p className="text-sm leading-snug flex-1">{option.text}</p>
                  <span className="text-xs opacity-40 shrink-0">{count}</span>
                </div>
                {voteCount > 0 && (
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden ml-8">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => void handleReveal()}
            className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            REVEAL ✨
          </button>
        </div>
      </div>
    );
  }

  // ─── REVEAL ───────────────────────────────────────────────────────────────────
  if (phase === 'reveal') {
    const finalTally = shuffledOptions.map((o) =>
      Object.values(votes).filter((v) => v === o.text).length
    );

    return (
      <div className="space-y-6">
        <div className="glass p-5 rounded-2xl border border-violet-500/20 bg-violet-500/5 text-center space-y-2">
          <p className="text-xs opacity-40 uppercase tracking-widest">The word was</p>
          <p className="text-4xl font-bold text-violet-300">{currentRound?.word}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs opacity-40 uppercase tracking-wide">Definitions revealed</p>
          {shuffledOptions.map((option, i) => {
            const count = finalTally[i];
            return (
              <div
                key={i}
                className={`glass p-3 rounded-xl border ${
                  option.isReal ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`text-xs font-bold mt-0.5 w-5 shrink-0 text-center ${
                      option.isReal ? 'text-emerald-400' : 'text-violet-400'
                    }`}
                  >
                    {OPTION_LABELS[i]}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-snug">{option.text}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {option.isReal ? (
                        <span className="text-xs text-emerald-400 font-semibold">✓ Real definition</span>
                      ) : (
                        <span className="text-xs opacity-50">by {option.authorName}</span>
                      )}
                      {count > 0 && (
                        <span className="text-xs opacity-40">
                          {count} vote{count !== 1 ? 's' : ''}
                        </span>
                      )}
                      {!option.isReal && count > 0 && (
                        <span className="text-xs text-amber-400">+{count * 2} fool pts</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {hasNextRound && (
            <button
              onClick={handleNextRound}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              Next Word ✨
            </button>
          )}
          <button
            onClick={handleEnd}
            className="px-8 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium transition-colors"
          >
            End Module
          </button>
        </div>
      </div>
    );
  }

  // ─── DONE ─────────────────────────────────────────────────────────────────────
  return (
    <div className="text-center py-12 space-y-3">
      <p className="text-2xl font-bold text-violet-400">Game Over</p>
      <p className="text-sm opacity-50">Thanks for playing Bluff Definition!</p>
    </div>
  );
}
