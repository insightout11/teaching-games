'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { CharacterCardsContent, CharacterCard } from '../types';

type Phase = 'idle' | 'briefing' | 'speaking' | 'voting' | 'done';

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
  // Keyed by student.name so student devices can look up their own card by displayName
  const [assignments, setAssignments] = useState<Record<string, CharacterCard>>({});
  const [briefingIndex, setBriefingIndex] = useState(0);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [spokenIndices, setSpokenIndices] = useState<Set<number>>(new Set());
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [votedClientIds, setVotedClientIds] = useState<Set<string>>(new Set());

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentSpeakerIndexRef = useRef(currentSpeakerIndex);
  currentSpeakerIndexRef.current = currentSpeakerIndex;
  const spokenIndicesRef = useRef(spokenIndices);
  spokenIndicesRef.current = spokenIndices;
  const votedClientIdsRef = useRef(votedClientIds);
  votedClientIdsRef.current = votedClientIds;

  const buildAssignments = useCallback(() => {
    const chars = content.characters ?? [];
    const result: Record<string, CharacterCard> = {};
    students.forEach((student, i) => {
      const char = chars[i % chars.length];
      if (char) result[student.name] = char;
    });
    return result;
  }, [students, content.characters]);

  const handleStart = useCallback(() => {
    const a = buildAssignments();
    setAssignments(a);
    setBriefingIndex(0);
    setCurrentSpeakerIndex(0);
    setSpokenIndices(new Set());
    setVoteCounts({});
    setVotedClientIds(new Set());
    setPhase('briefing');
    onPhaseChange?.('briefing');
  }, [buildAssignments, onPhaseChange]);

  // Set input spec for each phase
  useEffect(() => {
    if (phase === 'briefing') {
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'character-cards',
        prompt: 'Read your character card carefully.',
        buttonLabel: 'Ready!',
        perStudentData: assignments as Record<string, unknown>,
      });
    } else if (phase === 'speaking') {
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'character-cards',
        prompt: 'Say your character\'s viewpoint aloud.',
        buttonLabel: 'I said it!',
        perStudentData: assignments as Record<string, unknown>,
      });
    } else if (phase === 'voting') {
      const characterNames = Array.from(new Set(
        students.map((s) => assignments[s.name]?.name).filter(Boolean) as string[]
      ));
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'character-cards',
        prompt: 'Which character do you most identify with?',
        options: characterNames,
      });
    } else {
      onSetInputSpec?.(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Unified handler for speaking (advance) and voting (tally) phases
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current === 'speaking') {
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
          setPhase('voting');
          onPhaseChange?.('voting');
        } else {
          setCurrentSpeakerIndex(nextIndex);
        }
      } else if (phaseRef.current === 'voting') {
        if (votedClientIdsRef.current.has(vote.clientId)) return;
        setVotedClientIds((prev) => new Set(Array.from(prev).concat([vote.clientId])));
        const picked = vote.choice;
        if (picked) {
          setVoteCounts((prev) => ({ ...prev, [picked]: (prev[picked] ?? 0) + 1 }));
        }
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore, students]);

  const handleAdvanceBriefing = useCallback(() => {
    setPhase('speaking');
    onPhaseChange?.('speaking');
  }, [onPhaseChange]);

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
      setPhase('voting');
      onPhaseChange?.('voting');
    } else {
      setCurrentSpeakerIndex(nextIndex);
    }
  }, [currentSpeakerIndex, students, spokenIndices, onScore, onPhaseChange]);

  const handleFinishVoting = useCallback(() => {
    setPhase('done');
    onPhaseChange?.('done');
    onSetInputSpec?.(null);
  }, [onPhaseChange, onSetInputSpec]);

  const handleEnd = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
    onSetInputSpec?.(null);
  }, [onPhaseChange, onSetInputSpec]);

  const currentStudent = students[currentSpeakerIndex];
  const currentChar = currentStudent ? assignments[currentStudent.name] : null;
  const briefingStudent = students[briefingIndex];
  const briefingChar = briefingStudent ? assignments[briefingStudent.name] : null;

  // Sorted vote results for display
  const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const totalVotes = votedClientIds.size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-400">Character Cards</h3>
        {phase === 'briefing' && (
          <span className="text-sm opacity-60">{briefingIndex + 1} of {students.length}</span>
        )}
        {phase === 'speaking' && (
          <span className="text-sm opacity-60">{currentSpeakerIndex + 1} of {students.length}</span>
        )}
        {phase === 'voting' && (
          <span className="text-sm opacity-60">{totalVotes} of {students.length} voted</span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-xl opacity-90">Each student gets a character with a viewpoint.</p>
          <p className="text-sm opacity-50">Everyone reads and shares their character&apos;s perspective.</p>
          <button
            onClick={handleStart}
            className="px-12 py-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            DEAL CARDS
          </button>
        </div>
      )}

      {/* BRIEFING — one card at a time, large */}
      {phase === 'briefing' && briefingStudent && (
        <div className="space-y-6">
          <p className="text-sm opacity-50">Students are reading their character cards on their devices.</p>

          {/* Large card spotlight */}
          <div className="glass p-8 rounded-2xl border-2 border-amber-500/30 space-y-4 text-center">
            <p className="text-xs opacity-40 uppercase tracking-widest">Card for</p>
            <p className="text-2xl font-semibold">{briefingStudent.name}</p>
            {briefingChar && (
              <div className="bg-amber-500/10 rounded-xl p-6 space-y-3">
                <p className="text-3xl font-bold text-amber-400 leading-tight">{briefingChar.name}</p>
                <p className="text-lg opacity-80 leading-relaxed">{briefingChar.viewpoint}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setBriefingIndex((i) => Math.max(0, i - 1))}
              disabled={briefingIndex === 0}
              className="px-6 py-2 glass rounded-xl text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
            >
              ← PREV
            </button>

            <button
              onClick={handleAdvanceBriefing}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              START SPEAKING
            </button>

            <button
              onClick={() => setBriefingIndex((i) => Math.min(students.length - 1, i + 1))}
              disabled={briefingIndex === students.length - 1}
              className="px-6 py-2 glass rounded-xl text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
            >
              NEXT →
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
            <div className="bg-amber-500/10 rounded-xl p-5 space-y-2">
              <p className="text-2xl font-bold text-amber-400">{currentChar.name}</p>
              <p className="text-base opacity-80 leading-relaxed">{currentChar.viewpoint}</p>
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
              {currentSpeakerIndex + 1 >= students.length ? 'GO TO VOTE →' : 'NEXT →'}
            </button>
          </div>
        </div>
      )}

      {/* VOTING */}
      {phase === 'voting' && (
        <div className="space-y-6">
          <p className="text-sm opacity-60 text-center">Students are voting on their devices…</p>

          {/* Live vote tally */}
          <div className="space-y-3">
            {sortedVotes.length === 0 ? (
              <p className="text-center opacity-40 text-sm py-4">Waiting for votes…</p>
            ) : (
              sortedVotes.map(([charName, count]) => {
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                return (
                  <div key={charName} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-400 font-medium">{charName}</span>
                      <span className="opacity-60">{count} vote{count !== 1 ? 's' : ''} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
            {/* Show unvoted characters with 0 */}
            {students
              .map((s) => assignments[s.name]?.name)
              .filter((name): name is string => !!name && !voteCounts[name])
              .filter((name, i, arr) => arr.indexOf(name) === i)
              .map((charName) => (
                <div key={charName} className="space-y-1 opacity-40">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-400 font-medium">{charName}</span>
                    <span>0 votes</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full" />
                </div>
              ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleFinishVoting}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              FINISH VOTE
            </button>
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="space-y-6">
          <div className="text-center py-4 space-y-2">
            <p className="text-xl font-semibold text-amber-400">All characters have spoken!</p>
            <p className="text-sm opacity-50">Every perspective is in the room.</p>
          </div>

          {/* Final vote results */}
          {sortedVotes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs opacity-50 uppercase tracking-widest text-center">Most identified with</p>
              {sortedVotes.map(([charName, count], i) => (
                <div key={charName} className="flex items-center gap-3 glass px-4 py-2 rounded-xl">
                  {i === 0 && <span className="text-amber-400 text-sm">★</span>}
                  {i > 0 && <span className="text-sm opacity-30 w-4 text-center">{i + 1}</span>}
                  <span className="text-sm font-medium text-amber-400 flex-1">{charName}</span>
                  <span className="text-xs opacity-50">{count} vote{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}

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
