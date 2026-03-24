'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { OpinionShiftContent } from '../types';

type Phase = 'idle' | 'collecting' | 'revealing';

interface Submission {
  text: string;
  displayName: string;
  studentId?: string | null;
}

export function OpinionShiftActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onLandingAnswer,
  openingStances,
  classMission,
}: ActivityProps) {
  const content = generatedContent as OpinionShiftContent;
  const timerSeconds = sessionSettings.timerSeconds ?? 60;

  const [phase, setPhase] = useState<Phase>('idle');
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;

  // Timer
  useEffect(() => {
    if (phase !== 'collecting' || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'collecting' && timeLeft === 0) {
      handleReveal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // Input spec
  useEffect(() => {
    if (phase !== 'collecting') {
      onSetInputSpec?.(null);
      return;
    }
    onSetInputSpec?.({
      type: 'textarea',
      gameKey: 'opinion-shift',
      prompt: `${content.beforePrompt} → ${content.nowPrompt}`,
      placeholder: 'Write your reflection here...',
      maxLength: 300,
      ...(openingStances && Object.keys(openingStances).length > 0
        ? { prefillByClientId: openingStances }
        : {}),
    });
  }, [phase, content.beforePrompt, content.nowPrompt, onSetInputSpec]);

  // Vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'collecting') return;
      if (submissionsRef.current[vote.clientId]) return;
      setSubmissions((prev) => ({
        ...prev,
        [vote.clientId]: { text: vote.choice, displayName: vote.displayName, studentId: vote.studentId ?? null },
      }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

  const handleStart = useCallback(() => {
    setSubmissions({});
    setTimeLeft(timerSeconds);
    setPhase('collecting');
    onPhaseChange?.('collecting');
  }, [timerSeconds, onPhaseChange]);

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
  const sortedSubs = Object.entries(submissions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-indigo-400">Opinion Shift</h3>
        {phase === 'collecting' && (
          <span className="text-sm opacity-60">{submissionCount} submitted</span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="space-y-5">
          {classMission && (
            <div className="glass px-4 py-3 rounded-xl border border-indigo-500/20 text-sm text-indigo-300 opacity-80">
              Mission: <em>{classMission}</em>
            </div>
          )}
          <div className="glass p-5 rounded-2xl space-y-4">
            <div className="space-y-2">
              <span className="text-xs opacity-50 uppercase tracking-widest">Before</span>
              <p className="text-base font-medium">{content.beforePrompt}</p>
            </div>
            <div className="border-t border-white/10 pt-3 space-y-2">
              <span className="text-xs opacity-50 uppercase tracking-widest">Now</span>
              <p className="text-base font-medium">{content.nowPrompt}</p>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={handleStart}
              className="px-12 py-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              START
            </button>
          </div>
        </div>
      )}

      {/* COLLECTING */}
      {phase === 'collecting' && (
        <div className="space-y-5">
          <div className="glass p-5 rounded-2xl border-2 border-indigo-500/30 space-y-3">
            <p className="text-sm font-medium opacity-70">{content.beforePrompt}</p>
            <p className="text-sm font-medium opacity-70">{content.nowPrompt}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-game ${timeLeft <= 10 ? 'text-red-400' : 'text-indigo-400'}`}>
                {timeLeft}s
              </div>
              <div className="text-sm opacity-50">{submissionCount} submitted</div>
            </div>
            <button
              onClick={handleReveal}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              LOCK &amp; REVEAL
            </button>
          </div>
        </div>
      )}

      {/* REVEALING */}
      {phase === 'revealing' && (
        <div className="space-y-5">
          <div className="glass p-4 rounded-xl border border-indigo-500/20 space-y-1">
            <div className="flex gap-4 text-xs opacity-50 uppercase tracking-widest">
              <span className="flex-1">Before</span>
              <span className="mx-2 opacity-0">→</span>
              <span className="flex-1">Now</span>
            </div>
            <div className="flex gap-4 text-sm opacity-80">
              <span className="flex-1">{content.beforePrompt}</span>
              <span className="mx-2 text-indigo-400">→</span>
              <span className="flex-1">{content.nowPrompt}</span>
            </div>
          </div>

          <div className="space-y-3">
            {sortedSubs.map(([clientId, sub]) => {
              const before = openingStances?.[clientId];
              return (
                <div key={clientId} className="glass p-4 rounded-2xl border border-white/10 space-y-2">
                  <p className="text-sm font-semibold opacity-70">{sub.displayName}</p>
                  {before && (
                    <p className="text-xs text-indigo-300 opacity-70 italic">
                      Before: &ldquo;{before}&rdquo;
                    </p>
                  )}
                  <p className="text-base leading-snug">{sub.text}</p>
                </div>
              );
            })}
          </div>

          {sortedSubs.length === 0 && (
            <p className="text-center opacity-50 py-8">No submissions yet.</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleDone}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
