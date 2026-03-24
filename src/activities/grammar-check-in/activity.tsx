'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { GrammarCheckInContent } from '../types';
import { GrammarTarget, GRAMMAR_TARGET_GROUPS } from '@/lib/grammar';
import { useSessionStore } from '@/stores/session-store';

type Phase = 'idle' | 'rating' | 'revealing' | 'done';

// votes[sentenceIndex][clientId] = choice
type VoteMap = Record<number, Record<string, string>>;

const RATING_OPTIONS = ["I'd say this", 'Not sure', "I wouldn't say this"];
const OPTION_COLORS = ['bg-emerald-500/20 text-emerald-300', 'bg-yellow-500/20 text-yellow-300', 'bg-rose-500/20 text-rose-300'];

function HeatBar({ label, count, total, colorClass }: { label: string; count: number; total: number; colorClass: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs px-2 py-0.5 rounded-full w-36 text-center ${colorClass}`}>{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorClass.replace('/20', '/40')}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm w-6 text-right">{count}</span>
    </div>
  );
}

export function GrammarCheckInActivity({
  students,
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as GrammarCheckInContent;
  const sentences = content.sentences ?? [];
  const setGrammarTarget = useSessionStore((s) => s.setGrammarTarget);

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<VoteMap>({ 0: {}, 1: {}, 2: {} });
  const [confirmedTarget, setConfirmedTarget] = useState<string>(content.grammarTarget ?? '');

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const votesRef = useRef(votes);
  votesRef.current = votes;

  const handleStart = useCallback(() => {
    setCurrentIndex(0);
    setVotes({ 0: {}, 1: {}, 2: {} });
    setConfirmedTarget(content.grammarTarget ?? '');
    setPhase('rating');
    onPhaseChange?.('rating');
  }, [content.grammarTarget, onPhaseChange]);

  // Set input spec for current sentence
  useEffect(() => {
    if (phase !== 'rating') {
      onSetInputSpec?.(null);
      return;
    }
    const sentence = sentences[currentIndex];
    if (!sentence) return;
    onSetInputSpec?.({
      type: 'choice',
      gameKey: 'grammar-check-in',
      prompt: sentence.text,
      options: RATING_OPTIONS,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex]);

  // Register vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'rating') return;
      const idx = currentIndexRef.current;
      if (votesRef.current[idx]?.[vote.clientId]) return;
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
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore]);

  const handleReveal = useCallback(() => {
    setPhase('revealing');
    onPhaseChange?.('revealing');
  }, [onPhaseChange]);

  const handleNextSentence = useCallback(() => {
    const next = currentIndex + 1;
    if (next >= sentences.length) {
      setPhase('revealing');
      onPhaseChange?.('revealing');
    } else {
      setCurrentIndex(next);
    }
  }, [currentIndex, sentences.length, onPhaseChange]);

  const handleConfirmTarget = useCallback(() => {
    setGrammarTarget(confirmedTarget as GrammarTarget);
    setPhase('done');
    onPhaseChange?.('done');
  }, [confirmedTarget, setGrammarTarget, onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
    onSetInputSpec?.(null);
  }, [onPhaseChange, onSetInputSpec]);

  // Compute weakest area from votes
  const getWeakestCount = (idx: number) => {
    const v = votes[idx] ?? {};
    return Object.values(v).filter((c) => c === "I wouldn't say this").length;
  };

  const currentVotes = votes[currentIndex] ?? {};
  const totalVotes = Object.keys(currentVotes).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-sky-400">Grammar Check-In</h3>
        {phase === 'rating' && (
          <span className="text-sm opacity-60">Sentence {currentIndex + 1} of {sentences.length}</span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-xl opacity-90">Quick confidence check before we start.</p>
          <p className="text-sm opacity-50">Students rate 3 sentences — you see the heat map.</p>
          {content.grammarTarget && (
            <p className="text-sky-400 text-sm">Today's target: <strong>{content.grammarTarget}</strong></p>
          )}
          <button
            onClick={handleStart}
            className="px-12 py-6 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START CHECK-IN
          </button>
        </div>
      )}

      {/* RATING */}
      {phase === 'rating' && sentences[currentIndex] && (
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border-2 border-sky-500/30 space-y-3">
            <p className="text-xs opacity-50 uppercase tracking-widest">Rate this sentence</p>
            <p className="text-xl font-semibold leading-relaxed">"{sentences[currentIndex].text}"</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-50">{totalVotes} / {students.length} rated</span>
            <button
              onClick={currentIndex + 1 >= sentences.length ? handleReveal : handleNextSentence}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentIndex + 1 >= sentences.length ? 'REVEAL RESULTS' : 'NEXT SENTENCE →'}
            </button>
          </div>
        </div>
      )}

      {/* REVEALING */}
      {phase === 'revealing' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {sentences.map((sentence, i) => {
              const v = votes[i] ?? {};
              const total = Object.keys(v).length;
              const counts = RATING_OPTIONS.map((opt) => Object.values(v).filter((c) => c === opt).length);
              const weakCount = getWeakestCount(i);
              return (
                <div key={i} className={`glass p-5 rounded-2xl space-y-3 ${weakCount > 0 && !sentence.isCorrect ? 'border border-rose-500/30' : ''}`}>
                  <div className="flex items-start gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sentence.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {sentence.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="font-medium">"{sentence.text}"</p>
                  <div className="space-y-2">
                    {RATING_OPTIONS.map((opt, oi) => (
                      <HeatBar key={opt} label={opt} count={counts[oi]} total={total} colorClass={OPTION_COLORS[oi]} />
                    ))}
                  </div>
                  <p className="text-xs opacity-60 italic">{sentence.explanation}</p>
                </div>
              );
            })}
          </div>

          {/* Grammar target confirmation */}
          <div className="glass p-5 rounded-2xl space-y-3 border border-sky-500/30">
            <p className="text-sm font-semibold text-sky-400">Lesson grammar target</p>
            <div className="flex items-center gap-3">
              <select
                value={confirmedTarget}
                onChange={(e) => setConfirmedTarget(e.target.value)}
                className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-sm border border-white/20 focus:outline-none focus:border-sky-400"
              >
                {Object.entries(GRAMMAR_TARGET_GROUPS).map(([group, targets]) => (
                  <optgroup key={group} label={group}>
                    {targets.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <button
              onClick={handleConfirmTarget}
              className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              CONFIRM TARGET: {confirmedTarget}
            </button>
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="space-y-6 text-center py-6">
          <p className="text-xl font-semibold text-sky-400">Target set: {confirmedTarget}</p>
          <p className="text-sm opacity-50">All practice activities will focus on this structure.</p>
          <button
            onClick={handleEnd}
            className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            END MODULE
          </button>
        </div>
      )}
    </div>
  );
}
