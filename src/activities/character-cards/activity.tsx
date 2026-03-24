'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { CharacterCardsContent, CharacterCard } from '../types';

type Phase = 'idle' | 'briefing' | 'speaking' | 'done';

export function CharacterCardsActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as CharacterCardsContent;

  const [phase, setPhase] = useState<Phase>('idle');
  // Keyed by student.id (DB id)
  const [assignments, setAssignments] = useState<Record<string, CharacterCard>>({});
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  // Track which speaker indices have spoken (by index, not clientId)
  const [spokenIndices, setSpokenIndices] = useState<Set<number>>(new Set());

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentSpeakerIndexRef = useRef(currentSpeakerIndex);
  currentSpeakerIndexRef.current = currentSpeakerIndex;
  const spokenIndicesRef = useRef(spokenIndices);
  spokenIndicesRef.current = spokenIndices;

  const buildAssignments = useCallback(() => {
    const chars = content.characters ?? [];
    const result: Record<string, CharacterCard> = {};
    students.forEach((student, i) => {
      const char = chars[i % chars.length];
      if (char) result[student.id] = char;
    });
    return result;
  }, [students, content.characters]);

  const handleStart = useCallback(() => {
    const a = buildAssignments();
    setAssignments(a);
    setCurrentSpeakerIndex(0);
    setSpokenIndices(new Set());
    setPhase('briefing');
    onPhaseChange?.('briefing');
  }, [buildAssignments, onPhaseChange]);

  // Set input spec during briefing and speaking phases
  useEffect(() => {
    if (phase === 'briefing') {
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'character-cards',
        prompt: 'Read your character card. Get ready to speak!',
        buttonLabel: 'Ready',
      });
    } else if (phase === 'speaking') {
      const currentStudent = students[currentSpeakerIndex];
      const char = currentStudent ? assignments[currentStudent.id] : null;
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'character-cards',
        prompt: char ? `${char.name}: ${char.sentenceStarter}` : 'Say your sentence now!',
        buttonLabel: 'I said it!',
      });
    } else {
      onSetInputSpec?.(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSpeakerIndex]);

  // Auto-advance from briefing after 20s
  useEffect(() => {
    if (phase !== 'briefing') return;
    const id = setTimeout(() => {
      setPhase('speaking');
      onPhaseChange?.('speaking');
    }, 20000);
    return () => clearTimeout(id);
  }, [phase, onPhaseChange]);

  // Listen for "I said it" confirmations — first vote for current index advances
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

  const handleAdvanceBriefing = useCallback(() => {
    setPhase('speaking');
    onPhaseChange?.('speaking');
  }, [onPhaseChange]);

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
  const currentChar = currentStudent ? assignments[currentStudent.id] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-400">Character Cards</h3>
        {phase === 'speaking' && (
          <span className="text-sm opacity-60">
            {currentSpeakerIndex + 1} of {students.length}
          </span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-xl opacity-90">Each student gets a character with a viewpoint.</p>
          <p className="text-sm opacity-50">Everyone speaks one sentence as their character.</p>
          <button
            onClick={handleStart}
            className="px-12 py-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            DEAL CARDS
          </button>
        </div>
      )}

      {/* BRIEFING */}
      {phase === 'briefing' && (
        <div className="space-y-6">
          <p className="text-sm opacity-60">Students are reading their character cards…</p>
          <div className="grid gap-3 max-h-80 overflow-y-auto">
            {students.map((student) => {
              const char = assignments[student.id];
              return (
                <div key={student.id} className="glass p-4 rounded-xl flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{student.name}</p>
                    {char && (
                      <>
                        <p className="text-amber-400 text-sm font-medium">{char.name}</p>
                        <p className="text-xs opacity-60 mt-1">{char.viewpoint}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAdvanceBriefing}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              START SPEAKING
            </button>
          </div>
        </div>
      )}

      {/* SPEAKING */}
      {phase === 'speaking' && currentStudent && currentChar && (
        <div className="space-y-6">
          {/* Current speaker spotlight */}
          <div className="glass p-6 rounded-2xl border-2 border-amber-500/40 space-y-3 text-center">
            <p className="text-xs opacity-50 uppercase tracking-widest">Now speaking</p>
            <p className="text-2xl font-semibold">{currentStudent.name}</p>
            <div className="bg-amber-500/10 rounded-xl p-4 space-y-1">
              <p className="text-amber-400 font-semibold">{currentChar.name}</p>
              <p className="text-sm opacity-70">{currentChar.viewpoint}</p>
              <p className="text-xs opacity-50 italic mt-2">&ldquo;{currentChar.sentenceStarter}&rdquo;</p>
            </div>
          </div>

          {/* Progress list */}
          <div className="flex flex-wrap gap-2">
            {students.map((student, i) => (
              <span
                key={student.id}
                className={`text-xs px-3 py-1 rounded-full ${
                  spokenIndices.has(i)
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : i === currentSpeakerIndex
                    ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400'
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
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentSpeakerIndex + 1 >= students.length ? 'FINISH' : 'NEXT →'}
            </button>
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="space-y-6">
          <div className="text-center py-6 space-y-2">
            <p className="text-xl font-semibold text-amber-400">All characters have spoken!</p>
            <p className="text-sm opacity-50">Every perspective is in the room. Let&apos;s dive in.</p>
          </div>
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {students.map((student) => {
              const char = assignments[student.id];
              return (
                <div key={student.id} className="flex items-center gap-3 glass px-4 py-2 rounded-xl">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span className="text-sm font-medium">{student.name}</span>
                  {char && <span className="text-xs opacity-50">— {char.name}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
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
