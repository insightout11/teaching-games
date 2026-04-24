'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { InYourWordsContent } from '../types';

type Phase = 'idle' | 'collecting' | 'revealing';

interface Submission {
  text: string;
  displayName: string;
  studentId?: string | null;
}

const TIMER_SECONDS = 60;

export function InYourWordsActivity({
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onLandingAnswer,
}: ActivityProps) {
  const content = generatedContent as InYourWordsContent;
  const words = content.words ?? [];

  const [phase, setPhase] = useState<Phase>('idle');
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;

  // Timer countdown
  useEffect(() => {
    if (phase !== 'collecting' || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'collecting' && timeLeft === 0) handleReveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // Input spec — students see the word list + textarea
  useEffect(() => {
    if (phase !== 'collecting') {
      onSetInputSpec?.(null);
      return;
    }
    onSetInputSpec?.({
      type: 'textarea',
      gameKey: 'in-your-words',
      instruction: `Key words: ${words.join(' · ')}`,
      prompt: 'Pick one word and write a real sentence using it.',
      placeholder: 'Your sentence here…',
      maxLength: 150,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'collecting') return;
      if (submissionsRef.current[vote.clientId]) return;
      if (!vote.choice?.trim()) return;
      setSubmissions((prev) => ({
        ...prev,
        [vote.clientId]: { text: vote.choice.trim(), displayName: vote.displayName, studentId: vote.studentId ?? null },
      }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

  const handleStart = useCallback(() => {
    setSubmissions({});
    setTimeLeft(TIMER_SECONDS);
    setPhase('collecting');
    onPhaseChange?.('collecting');
  }, [onPhaseChange]);

  const handleReveal = useCallback(async () => {
    if (phaseRef.current !== 'collecting') return;
    onSetInputSpec?.(null);
    setPhase('revealing');
    onPhaseChange?.('revealing');

    const subs = submissionsRef.current;
    await Promise.all(
      Object.entries(subs).map(([clientId, sub]) => {
        onLandingAnswer?.(clientId, sub.text);
        return onScore?.({
          studentId: sub.studentId ?? null,
          clientId,
          displayName: sub.displayName,
          promptIndex: 1,
          points: 1,
          isCorrect: null,
        });
      })
    );
  }, [onSetInputSpec, onPhaseChange, onScore, onLandingAnswer]);

  const handleDone = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  const submissionCount = Object.keys(submissions).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-emerald-400">In Your Words</h3>
        {phase === 'collecting' && (
          <span className="text-sm opacity-60">{submissionCount} submitted</span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="space-y-5">
          <p className="text-sm opacity-60 text-center">Students pick one key word and write a real sentence using it.</p>
          <div className="glass p-5 rounded-2xl border border-emerald-500/20 space-y-3">
            <p className="text-xs opacity-50 uppercase tracking-widest">Key words from this lesson</p>
            <div className="flex flex-wrap gap-2">
              {words.map((w) => (
                <span key={w} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-semibold border border-emerald-500/30">
                  {w}
                </span>
              ))}
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={handleStart}
              className="px-12 py-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              START
            </button>
          </div>
        </div>
      )}

      {/* COLLECTING */}
      {phase === 'collecting' && (
        <div className="space-y-5">
          <div className="glass p-4 rounded-2xl border border-emerald-500/20 space-y-2">
            <p className="text-xs opacity-50 uppercase tracking-widest">Key words</p>
            <div className="flex flex-wrap gap-2">
              {words.map((w) => (
                <span key={w} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-semibold border border-emerald-500/30">
                  {w}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`text-3xl font-game ${timeLeft <= 10 ? 'text-red-400' : 'text-emerald-400'}`}>
              {timeLeft}s
            </div>
            <button onClick={() => setTimeLeft((t) => t + 30)} className="px-2 py-1 rounded-lg text-xs font-game bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10">
              +30s
            </button>
            <span className="text-sm opacity-50">{submissionCount} submitted</span>
          </div>

          {/* Live feed */}
          {submissionCount > 0 && (
            <div className="glass p-4 rounded-xl border border-white/5 max-h-48 overflow-y-auto space-y-2">
              {Object.values(submissions).map(({ text, displayName }) => (
                <div key={displayName} className="flex items-start gap-2 text-sm animate-fade-in">
                  <span className="opacity-40 shrink-0 w-24 truncate">{displayName}</span>
                  <span className="opacity-80 italic">&ldquo;{text}&rdquo;</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleReveal}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              LOCK &amp; REVEAL
            </button>
          </div>
        </div>
      )}

      {/* REVEALING */}
      {phase === 'revealing' && (
        <div className="space-y-5">
          <div className="glass p-4 rounded-xl border border-emerald-500/20 space-y-2">
            <p className="text-xs opacity-50 uppercase tracking-widest">Key words used</p>
            <div className="flex flex-wrap gap-2">
              {words.map((w) => (
                <span key={w} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-semibold border border-emerald-500/30">
                  {w}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {Object.values(submissions).map(({ text, displayName }) => (
              <div key={displayName} className="glass p-4 rounded-2xl border border-white/10 space-y-1">
                <p className="text-xs opacity-50">{displayName}</p>
                <p className="text-base leading-snug">{text}</p>
              </div>
            ))}
            {submissionCount === 0 && (
              <p className="text-center opacity-40 py-6">No submissions.</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleDone}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
