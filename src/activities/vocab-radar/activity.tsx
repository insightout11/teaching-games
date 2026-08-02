'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { VocabRadarContent, VocabRadarWord } from '../types';

type Phase = 'idle' | 'prompting' | 'revealing' | 'summary';

// votes[wordIndex][clientId] = 'New to me' | 'Heard it' | 'Know it'
type VoteMap = Record<number, Record<string, string>>;

const FAMILIARITY_OPTIONS = ['New to me', 'Heard it', 'Know it'] as const;
type FamiliarityOption = typeof FAMILIARITY_OPTIONS[number];

const OPTION_COLORS: Record<FamiliarityOption, string> = {
  'New to me': 'bg-rose-400',
  'Heard it': 'bg-amber-400',
  'Know it': 'bg-emerald-400',
};

function FamiliarityBar({
  label,
  count,
  total,
}: {
  label: FamiliarityOption;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-20 text-right opacity-70">{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
        <div
          className={`h-full ${OPTION_COLORS[label]} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm w-8 text-right">{count}</span>
      <span className="text-xs opacity-50 w-8">{pct}%</span>
    </div>
  );
}

function WordChart({
  word,
  votes,
  showDefinition = false,
}: {
  word: VocabRadarWord;
  votes: Record<string, string>;
  showDefinition?: boolean;
}) {
  const total = Object.keys(votes).length;
  return (
    <div className="glass p-5 rounded-2xl space-y-3">
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-bold">{word.word}</p>
        {word.partOfSpeech && (
          <span className="text-xs opacity-50 italic">{word.partOfSpeech}</span>
        )}
      </div>
      <div className="space-y-2">
        {FAMILIARITY_OPTIONS.map((opt) => (
          <FamiliarityBar
            key={opt}
            label={opt}
            count={Object.values(votes).filter((v) => v === opt).length}
            total={total}
          />
        ))}
      </div>
      {showDefinition && word.definition && (
        <p className="text-sm opacity-60 border-t border-white/10 pt-3">
          {word.definition}
        </p>
      )}
      <p className="text-xs opacity-40">{total} response{total !== 1 ? 's' : ''}</p>
    </div>
  );
}

function FocusList({
  words,
  votes,
}: {
  words: VocabRadarWord[];
  votes: VoteMap;
}) {
  const ranked = words
    .map((word, i) => {
      const wordVotes = votes[i] ?? {};
      const total = Object.keys(wordVotes).length;
      const newCount = Object.values(wordVotes).filter((v) => v === 'New to me').length;
      const newPct = total > 0 ? Math.round((newCount / total) * 100) : 0;
      return { word, newPct, total };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.newPct - a.newPct);

  if (ranked.length === 0) return null;

  function getTag(pct: number): { label: string; color: string } {
    if (pct >= 50) return { label: 'Spend time here', color: 'text-rose-400' };
    if (pct >= 20) return { label: 'Quick review', color: 'text-amber-400' };
    return { label: 'Skip or challenge', color: 'text-emerald-400' };
  }

  return (
    <div className="glass p-4 rounded-2xl space-y-3">
      <p className="text-xs uppercase tracking-widest opacity-50">Teaching priorities</p>
      <div className="space-y-2">
        {ranked.map(({ word, newPct }) => {
          const { label, color } = getTag(newPct);
          return (
            <div key={word.word} className="flex items-center justify-between text-sm">
              <span className="font-medium">{word.word}</span>
              <span className={`${color} text-xs`}>
                {newPct}% new · {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function VocabRadarActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as VocabRadarContent;
  const words = content.words;
  const wordCount = words.length;

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);

  const initVotes = useCallback((): VoteMap => {
    const m: VoteMap = {};
    for (let i = 0; i < wordCount; i++) m[i] = {};
    return m;
  }, [wordCount]);

  const [votes, setVotes] = useState<VoteMap>(initVotes);
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
    const word = words[currentIndex];
    if (!word) return;
    onSetInputSpec?.({
      type: 'choice',
      gameKey: 'vocab-radar',
      prompt: word.word,
      options: ['New to me', 'Heard it', 'Know it'],
    });
  }, [phase, currentIndex, words, onSetInputSpec]);

  const handleStart = useCallback(() => {
    setCurrentIndex(0);
    setVotes(initVotes());
    setTimeLeft(timerSeconds);
    setPhase('prompting');
    onPhaseChange?.('prompting');
  }, [timerSeconds, onPhaseChange, initVotes]);

  const handleReveal = useCallback(() => {
    setPhase('revealing');
    onPhaseChange?.('revealing');
  }, [onPhaseChange]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= wordCount) {
      setPhase('summary');
      onPhaseChange?.('summary');
    } else {
      setCurrentIndex(nextIndex);
      setTimeLeft(timerSeconds);
      setPhase('prompting');
      onPhaseChange?.('prompting');
    }
  }, [currentIndex, wordCount, timerSeconds, onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
    onSetInputSpec?.(null);
  }, [onPhaseChange, onSetInputSpec]);

  const currentWord = words[currentIndex];
  const currentVotes = votes[currentIndex] ?? {};
  const totalVotes = Object.keys(currentVotes).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-violet-400">Vocab Radar</h3>
        {phase !== 'idle' && phase !== 'summary' && (
          <span className="text-sm opacity-60">
            Word {currentIndex + 1} of {wordCount}
          </span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-xl opacity-90">{wordCount} key words — see who knows what.</p>
          <p className="text-sm opacity-50">
            Students rate each word: New to me / Heard it / Know it.
          </p>
          <button
            onClick={handleStart}
            className="px-12 py-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START
          </button>
        </div>
      )}

      {/* PROMPTING */}
      {phase === 'prompting' && currentWord && (
        <div className="space-y-6">
          <div className="glass p-8 rounded-2xl border-2 border-violet-500/30 text-center space-y-2">
            <p className="text-xs opacity-50 uppercase tracking-widest">How well do you know this word?</p>
            <p className="text-4xl font-bold tracking-wide">{currentWord.word}</p>
            {currentWord.partOfSpeech && (
              <p className="text-sm opacity-40 italic">{currentWord.partOfSpeech}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-game ${timeLeft <= 5 ? 'text-red-400' : 'text-violet-400'}`}>
                {timeLeft}s
              </div>
              <button onClick={() => setTimeLeft(prev => prev + 30)} className="px-2 py-1 rounded-lg text-xs font-game bg-white/10 hover:bg-white/20 text-slate-300 transition-all border border-white/10">+30s</button>
              <div className="text-sm opacity-50">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</div>
            </div>
            <button
              onClick={handleReveal}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              REVEAL NOW
            </button>
          </div>
        </div>
      )}

      {/* REVEALING */}
      {phase === 'revealing' && currentWord && (
        <div className="space-y-6">
          <WordChart word={currentWord} votes={currentVotes} showDefinition />

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentIndex < wordCount - 1 ? 'NEXT WORD' : 'VIEW SUMMARY'}
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {phase === 'summary' && (
        <div className="space-y-4">
          <p className="text-sm opacity-60">Vocabulary map for this class:</p>
          <div className="grid gap-3">
            {words.map((word, i) => (
              <WordChart key={i} word={word} votes={votes[i] ?? {}} />
            ))}
          </div>
          <FocusList words={words} votes={votes} />
          <div className="flex justify-end pt-2">
            <button
              onClick={handleEnd}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              END ACTIVITY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
