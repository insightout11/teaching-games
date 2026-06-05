'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ActivityProps } from '../types';
import type { ListeningGapFillContent, GapFillItem } from '../types';

type Phase = 'idle' | 'prompting' | 'revealing' | 'summary';

interface GapFillVote {
  studentId: string | null;
  clientId: string;
  displayName: string;
  answer: string;
}

// votes[itemIndex][clientId] = answer metadata
type VoteMap = Record<number, Record<string, GapFillVote>>;
// results[itemIndex][clientId] = correct?
type ResultMap = Record<number, Record<string, boolean>>;

function isAnswerCorrect(submitted: string, item: GapFillItem): boolean {
  const norm = submitted.trim().toLowerCase();
  return norm === item.answer || (item.alternatives ?? []).some((a) => a === norm);
}

function highlightAnswer(full: string, answer: string): React.ReactNode {
  const idx = full.toLowerCase().indexOf(answer.toLowerCase());
  if (idx === -1) return <span>{full}</span>;
  return (
    <>
      {full.slice(0, idx)}
      <span className="text-teal-300 font-bold underline underline-offset-2">
        {full.slice(idx, idx + answer.length)}
      </span>
      {full.slice(idx + answer.length)}
    </>
  );
}

function GapFillResultCard({
  item,
  votes,
  results,
  compact = false,
}: {
  item: GapFillItem;
  votes: Record<string, GapFillVote>;
  results: Record<string, boolean>;
  compact?: boolean;
}) {
  const total = Object.keys(votes).length;
  const correctCount = Object.values(results).filter(Boolean).length;
  const wrongCount = total - correctCount;
  const correctPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const wrongAnswers = Object.entries(votes)
    .filter(([clientId]) => results[clientId] === false)
    .reduce<Record<string, number>>((acc, [, vote]) => {
      const norm = vote.answer.trim().toLowerCase();
      acc[norm] = (acc[norm] ?? 0) + 1;
      return acc;
    }, {});
  const sortedWrong = Object.entries(wrongAnswers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="glass p-5 rounded-2xl space-y-3">
      <p className="text-base leading-relaxed">{highlightAnswer(item.full, item.answer)}</p>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs w-14 text-right opacity-60">Correct</span>
          <div className="flex-1 bg-white/10 rounded-full h-5 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${correctPct}%` }}
            />
          </div>
          <span className="text-sm w-6 text-right">{correctCount}</span>
          <span className="text-xs opacity-50 w-9 text-right">{correctPct}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs w-14 text-right opacity-60">Wrong</span>
          <div className="flex-1 bg-white/10 rounded-full h-5 overflow-hidden">
            <div
              className="h-full bg-rose-400 rounded-full transition-all duration-500"
              style={{ width: `${100 - correctPct}%` }}
            />
          </div>
          <span className="text-sm w-6 text-right">{wrongCount}</span>
          <span className="text-xs opacity-50 w-9 text-right">{100 - correctPct}%</span>
        </div>
      </div>

      {!compact && sortedWrong.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest opacity-50">Common wrong answers</p>
          <div className="flex flex-wrap gap-1">
            {sortedWrong.map(([ans, count]) => (
              <span key={ans} className="inline-block px-2 py-0.5 bg-rose-500/20 rounded-full text-xs">
                &ldquo;{ans}&rdquo; ×{count}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs opacity-40">{total} response{total !== 1 ? 's' : ''}</p>
    </div>
  );
}

export function ListeningGapFillActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as ListeningGapFillContent;
  const items = useMemo(() => content.items ?? [], [content.items]);
  const itemCount = items.length;
  const mode = content.mode ?? 'listening';
  const activityTitle = content.title ?? (mode === 'reading' ? 'Reading Check' : 'Listening Gap Fill');
  const activityInstruction =
    content.instruction ??
    (mode === 'reading'
      ? 'Students use the briefing text to fill in the missing word.'
      : 'Students type what they think the missing word is.');

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<VoteMap>({});
  const [results, setResults] = useState<ResultMap>({});
  const [timeLeft, setTimeLeft] = useState(0);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const votesRef = useRef(votes);
  votesRef.current = votes;
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const scoredVotesRef = useRef<Set<string>>(new Set());

  const timerSeconds = sessionSettings.timerSeconds ?? 30;

  // Timer countdown
  useEffect(() => {
    if (phase !== 'prompting' || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  // Auto-reveal when timer hits 0
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
      // Dedup: use !== undefined so empty-string answers are still deduped
      if (votesRef.current[idx]?.[vote.clientId] !== undefined) return;

      const item = items[idx];
      if (!item) return;
      const correct = isAnswerCorrect(vote.choice, item);

      setVotes((prev) => ({
        ...prev,
        [idx]: {
          ...prev[idx],
          [vote.clientId]: {
            studentId: vote.studentId ?? null,
            clientId: vote.clientId,
            displayName: vote.displayName,
            answer: vote.choice,
          },
        },
      }));
      setResults((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], [vote.clientId]: correct },
      }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore]);

  // Set InputSpec
  useEffect(() => {
    if (phase !== 'prompting') {
      onSetInputSpec?.(null);
      return;
    }
    const item = items[currentIndex];
    if (!item) return;
    onSetInputSpec?.({
      type: 'text',
      gameKey: 'listening-gap-fill',
      prompt: item.display,
      placeholder: 'Type the missing word…',
      maxLength: 40,
      ...(item.hint ? { hint: { content: item.hint } } : {}),
      timerSeconds: sessionSettings.timerSeconds,
      startedAt: Date.now(),
    });
  }, [phase, currentIndex, items, onSetInputSpec, sessionSettings.timerSeconds]);

  const handleStart = useCallback(() => {
    setCurrentIndex(0);
    setVotes({});
    setResults({});
    scoredVotesRef.current = new Set();
    setTimeLeft(timerSeconds);
    setPhase('prompting');
    onPhaseChange?.('prompting');
  }, [timerSeconds, onPhaseChange]);

  const scoreCurrentVotes = useCallback(() => {
    if (!onScore) return;
    const idx = currentIndexRef.current;
    Object.values(votesRef.current[idx] ?? {}).forEach((vote) => {
      const scoreKey = `${idx}:${vote.clientId}`;
      if (scoredVotesRef.current.has(scoreKey)) return;
      scoredVotesRef.current.add(scoreKey);
      const isCorrect = resultsRef.current[idx]?.[vote.clientId] === true;
      void onScore({
        studentId: vote.studentId,
        clientId: vote.clientId,
        displayName: vote.displayName,
        promptIndex: idx + 1,
        points: isCorrect ? 3 : 1,
        isCorrect,
      });
    });
  }, [onScore]);

  const handleReveal = useCallback(() => {
    scoreCurrentVotes();
    setPhase('revealing');
    onPhaseChange?.('revealing');
  }, [scoreCurrentVotes, onPhaseChange]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= itemCount) {
      setPhase('summary');
      onPhaseChange?.('summary');
    } else {
      setCurrentIndex(nextIndex);
      setTimeLeft(timerSeconds);
      setPhase('prompting');
      onPhaseChange?.('prompting');
    }
  }, [currentIndex, itemCount, timerSeconds, onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
    onSetInputSpec?.(null);
  }, [onPhaseChange, onSetInputSpec]);

  const currentItem = items[currentIndex];
  const currentVotes = votes[currentIndex] ?? {};
  const currentResults = results[currentIndex] ?? {};
  const submittedCount = Object.keys(currentVotes).length;

  // Summary stats
  const totalAttempts = Object.values(votes).reduce((sum, v) => sum + Object.keys(v).length, 0);
  const totalCorrect = Object.values(results).reduce(
    (sum, r) => sum + Object.values(r).filter(Boolean).length,
    0,
  );
  const overallPct = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-teal-400">{activityTitle}</h3>
        {phase !== 'idle' && phase !== 'summary' && (
          <span className="text-sm opacity-60">
            Sentence {currentIndex + 1} of {itemCount}
          </span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-xl opacity-90">{itemCount} sentences — fill in the missing word.</p>
          <p className="text-sm opacity-50">{activityInstruction}</p>
          <button
            onClick={handleStart}
            className="px-12 py-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START
          </button>
        </div>
      )}

      {/* PROMPTING — never show the answer */}
      {phase === 'prompting' && currentItem && (
        <div className="space-y-6">
          <div className="glass p-8 rounded-2xl border-2 border-teal-500/30 text-center space-y-3">
            <p className="text-xs opacity-50 uppercase tracking-widest">Type the missing word</p>
            <p className="text-2xl font-semibold leading-relaxed">{currentItem.display}</p>
            {currentItem.hint && (
              <p className="text-sm opacity-40 italic">Hint: {currentItem.hint}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-game ${timeLeft <= 5 ? 'text-red-400' : 'text-teal-400'}`}>
                {timeLeft}s
              </div>
              <button
                onClick={() => setTimeLeft((prev) => prev + 30)}
                className="px-2 py-1 rounded-lg text-xs font-game bg-white/10 hover:bg-white/20 text-slate-300 transition-all border border-white/10"
              >
                +30s
              </button>
              <div className="text-sm opacity-50">
                {submittedCount} submitted
              </div>
            </div>
            <button
              onClick={handleReveal}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              REVEAL ANSWER
            </button>
          </div>
        </div>
      )}

      {/* REVEALING */}
      {phase === 'revealing' && currentItem && (
        <div className="space-y-6">
          <GapFillResultCard
            item={currentItem}
            votes={currentVotes}
            results={currentResults}
          />

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentIndex < itemCount - 1 ? 'NEXT SENTENCE' : 'VIEW SUMMARY'}
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {phase === 'summary' && (
        <div className="space-y-4">
          <div className="glass p-4 rounded-2xl flex gap-8 text-center">
            <div className="flex-1">
              <p className="text-2xl font-bold text-teal-400">{totalCorrect}</p>
              <p className="text-xs opacity-50">Correct answers</p>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">{totalAttempts}</p>
              <p className="text-xs opacity-50">Total attempts</p>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-emerald-400">{overallPct}%</p>
              <p className="text-xs opacity-50">Class accuracy</p>
            </div>
          </div>

          <p className="text-sm opacity-60">Results for all {itemCount} sentences:</p>
          <div className="space-y-3">
            {items.map((item, i) => (
              <GapFillResultCard
                key={i}
                item={item}
                votes={votes[i] ?? {}}
                results={results[i] ?? {}}
                compact
              />
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleEnd}
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              END MODULE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
