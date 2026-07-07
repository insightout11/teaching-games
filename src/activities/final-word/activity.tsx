'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { FinalWordContent } from '../types';
import { useSessionStore, type FlightLogEntry } from '@/stores/session-store';

type Phase = 'idle' | 'speaking' | 'done';

// Order the debrief callbacks so predictions land before the opinion split.
const BEAT_ORDER: Record<FlightLogEntry['beat'], number> = { prediction: 0, 'opinion-pulse': 1, council: 2, toolkit: 3 };

/**
 * Flight Log debrief (Captain's Flight, Stage 2). When the flight log has entries, the Final Word
 * stops being one bare prompt: it recalls the words the class learned (chips) and poses back what
 * actually happened this lesson (callbacks). Projected-safe — everything here is class-level. Renders
 * nothing when the log is empty, so it's inert for every non-Captain's preset that uses final-word.
 */
function FlightDebrief({ flightLog }: { flightLog: FlightLogEntry[] }) {
  const vocab = useMemo(
    () => Array.from(new Set(flightLog.flatMap((e) => e.vocab ?? []))),
    [flightLog],
  );
  const callbacks = useMemo(
    () =>
      flightLog
        .filter((e) => e.callback)
        .sort((a, b) => BEAT_ORDER[a.beat] - BEAT_ORDER[b.beat])
        .map((e) => e.callback as string),
    [flightLog],
  );

  if (flightLog.length === 0) return null;

  return (
    <div className="glass p-5 rounded-2xl border border-teal-500/25 space-y-4 text-left">
      <div className="flex items-center gap-2 text-teal-300">
        <Sparkles className="w-4 h-4" />
        <p className="text-xs uppercase tracking-widest opacity-80">Flight log — before you land</p>
      </div>

      {callbacks.length > 0 && (
        <ul className="space-y-2">
          {callbacks.map((c, i) => (
            <li key={i} className="text-sm text-teal-100/90 flex gap-2">
              <span className="text-teal-400">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}

      {vocab.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs opacity-50">Use a word from today:</p>
          <div className="flex flex-wrap gap-2">
            {vocab.map((word) => (
              <span
                key={word}
                className="px-3 py-1 rounded-full text-xs font-medium bg-sky-500/15 text-sky-200 border border-sky-500/30"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FinalWordActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as FinalWordContent;
  const flightLog = useSessionStore((s) => s.flightLog);

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  // Track which speaker indices have confirmed (by index, not clientId)
  const [spokenIndices, setSpokenIndices] = useState<Set<number>>(new Set());

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentSpeakerIndexRef = useRef(currentSpeakerIndex);
  currentSpeakerIndexRef.current = currentSpeakerIndex;
  const spokenIndicesRef = useRef(spokenIndices);
  spokenIndicesRef.current = spokenIndices;

  const handleStart = useCallback(() => {
    setCurrentSpeakerIndex(0);
    setSpokenIndices(new Set());
    setPhase('speaking');
    onPhaseChange?.('speaking');
  }, [onPhaseChange]);

  // Set input spec — current speaker sees prompt + confirm button
  useEffect(() => {
    if (phase !== 'speaking') {
      onSetInputSpec?.(null);
      return;
    }
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'final-word',
      prompt: content.prompt,
      buttonLabel: 'I said it!',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSpeakerIndex]);

  // Listen for confirmations — first vote for current speaker index advances
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'speaking') return;
      const idx = currentSpeakerIndexRef.current;
      if (spokenIndicesRef.current.has(idx)) return;

      setSpokenIndices((prev) => new Set(Array.from(prev).concat([idx])));
      onScore?.({
        studentId: vote.studentId ?? null,
        clientId: vote.clientId,
        displayName: vote.displayName,
        promptIndex: idx + 1,
        points: 1,
        isCorrect: null,
      });
      const nextIndex = idx + 1;
      if (nextIndex >= students.length) {
        setPhase('done');
        onPhaseChange?.('done');
      } else {
        setCurrentSpeakerIndex(nextIndex);
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore, students]);

  // Teacher manual advance
  const handleNext = useCallback(() => {
    const idx = currentSpeakerIndex;
    const current = students[idx];
    if (current && !spokenIndices.has(idx)) {
      setSpokenIndices((prev) => new Set(Array.from(prev).concat([idx])));
      onScore?.({
        studentId: current.id ?? null,
        clientId: current.id,
        displayName: current.name,
        promptIndex: idx + 1,
        points: 1,
        isCorrect: null,
      });
    }
    const nextIndex = idx + 1;
    if (nextIndex >= students.length) {
      setPhase('done');
      onPhaseChange?.('done');
    } else {
      setCurrentSpeakerIndex(nextIndex);
    }
  }, [currentSpeakerIndex, students, spokenIndices, onScore, onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
    onSetInputSpec?.(null);
  }, [onPhaseChange, onSetInputSpec]);

  const currentStudent = students[currentSpeakerIndex];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-teal-400">Final Word</h3>
        {phase === 'speaking' && (
          <span className="text-sm opacity-60">{currentSpeakerIndex + 1} of {students.length}</span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-xl opacity-90">Everyone gets a final word.</p>
          <p className="text-sm opacity-50">One sentence each — their own voice, no character.</p>
          <div className="glass p-4 rounded-xl mx-auto max-w-sm">
            <p className="text-teal-300 italic">&ldquo;{content.prompt}&rdquo;</p>
          </div>
          <div className="mx-auto max-w-md">
            <FlightDebrief flightLog={flightLog} />
          </div>
          <button
            onClick={handleStart}
            className="px-12 py-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            BEGIN
          </button>
        </div>
      )}

      {/* SPEAKING */}
      {phase === 'speaking' && currentStudent && (
        <div className="space-y-6">
          {/* Prompt */}
          <div className="glass p-5 rounded-2xl border border-teal-500/30 text-center">
            <p className="text-xs opacity-50 uppercase tracking-widest mb-2">The question</p>
            <p className="text-lg font-medium text-teal-200">{content.prompt}</p>
          </div>

          <FlightDebrief flightLog={flightLog} />

          {/* Current speaker */}
          <div className="glass p-6 rounded-2xl border-2 border-teal-500/40 text-center space-y-2">
            <p className="text-xs opacity-50 uppercase tracking-widest">Now speaking</p>
            <p className="text-3xl font-semibold">{currentStudent.name}</p>
            <p className="text-sm opacity-50">Say your sentence to the class</p>
          </div>

          {/* Progress */}
          <div className="flex flex-wrap gap-2">
            {students.map((student, i) => (
              <span
                key={student.id}
                className={`text-xs px-3 py-1 rounded-full ${
                  spokenIndices.has(i)
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : i === currentSpeakerIndex
                    ? 'bg-teal-500/30 text-teal-300 ring-1 ring-teal-400'
                    : 'bg-white/10 opacity-40'
                }`}
              >
                {student.name}
              </span>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentSpeakerIndex + 1 >= students.length ? 'FINISH' : 'NEXT →'}
            </button>
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-2xl font-semibold text-teal-400">Everyone had their Final Word.</p>
          <p className="text-sm opacity-50">Lesson complete.</p>
          <button
            onClick={handleEnd}
            className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            END MODULE
          </button>
        </div>
      )}
    </div>
  );
}
