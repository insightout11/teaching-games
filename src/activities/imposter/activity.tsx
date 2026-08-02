'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ActivityProps } from '../types';
import type { ImposterContent } from '../types';
import type { Student } from '@/lib/supabase/types';

type Phase = 'idle' | 'briefing' | 'clues' | 'voting' | 'redemption' | 'reveal' | 'done';

type ImposterAssignment = { role: 'insider'; word: string; definition: string } | { role: 'imposter' };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildAssignments(students: Student[], imposterName: string, word: string, definition: string): Record<string, ImposterAssignment> {
  const result: Record<string, ImposterAssignment> = {};
  for (const student of students) {
    result[student.name] = student.name === imposterName
      ? { role: 'imposter' }
      : { role: 'insider', word, definition };
  }
  return result;
}

export function ImposterActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as ImposterContent;

  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIndex, setRoundIndex] = useState(0);
  const [imposterName, setImposterName] = useState<string>('');
  const [assignments, setAssignments] = useState<Record<string, ImposterAssignment>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [confirmedClientIds, setConfirmedClientIds] = useState<Set<string>>(new Set());
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [votedClientIds, setVotedClientIds] = useState<Set<string>>(new Set());
  const [scoredVoterClientIds, setScoredVoterClientIds] = useState<Set<string>>(new Set());
  const [imposterGuessResult, setImposterGuessResult] = useState<'correct' | 'incorrect' | null>(null);
  const [clueScored, setClueScored] = useState<Set<number>>(new Set());
  const [shuffledStudents, setShuffledStudents] = useState<Student[]>([]);
  const [imposterCaught, setImposterCaught] = useState(false);

  // Refs for vote handler (same pattern as character-cards)
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const votedClientIdsRef = useRef(votedClientIds);
  votedClientIdsRef.current = votedClientIds;
  const voteCountsRef = useRef(voteCounts);
  voteCountsRef.current = voteCounts;
  const confirmedClientIdsRef = useRef(confirmedClientIds);
  confirmedClientIdsRef.current = confirmedClientIds;
  const scoredVoterClientIdsRef = useRef(scoredVoterClientIds);
  scoredVoterClientIdsRef.current = scoredVoterClientIds;
  const usedImposterNamesRef = useRef<string[]>([]);

  const currentRound = content.rounds?.[roundIndex] ?? content.rounds?.[0];
  const hasNextRound = roundIndex + 1 < (content.rounds?.length ?? 0);

  const enoughStudents = students.length >= 3;

  // ─── Input spec by phase ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'briefing' || phase === 'clues') {
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'imposter',
        prompt: phase === 'briefing' ? 'Read your card carefully.' : 'Listen to the clues.',
        buttonLabel: phase === 'briefing' ? 'Got it!' : 'Ready!',
        perStudentData: assignments as Record<string, unknown>,
      });
    } else if (phase === 'voting') {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'imposter',
        prompt: 'Who is the imposter?',
        options: students.map((s) => s.name),
      });
    } else {
      onSetInputSpec?.(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ─── Remote vote handler ───────────────────────────────────────────────────
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current === 'briefing' || phaseRef.current === 'clues') {
        if (confirmedClientIdsRef.current.has(vote.clientId)) return;
        setConfirmedClientIds((prev) => new Set(Array.from(prev).concat([vote.clientId])));
      } else if (phaseRef.current === 'voting') {
        if (votedClientIdsRef.current.has(vote.clientId)) return;
        setVotedClientIds((prev) => new Set(Array.from(prev).concat([vote.clientId])));
        const picked = vote.choice;
        if (picked) {
          setVoteCounts((prev) => ({ ...prev, [picked]: (prev[picked] ?? 0) + 1 }));
        }
        // Participation score for voting
        if (!scoredVoterClientIdsRef.current.has(vote.clientId)) {
          setScoredVoterClientIds((prev) => new Set(Array.from(prev).concat([vote.clientId])));
          void onScore?.({
            studentId: vote.studentId ?? null,
            clientId: vote.clientId,
            displayName: vote.displayName,
            promptIndex: students.length + 1,
            points: 1,
            isCorrect: null,
          });
        }
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore, students.length]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (!currentRound) return;
    const usedNames = usedImposterNamesRef.current;
    const available = students.filter(s => !usedNames.includes(s.name));
    const pool = available.length > 0 ? available : students;
    const newImposter = pool[Math.floor(Math.random() * pool.length)].name;
    usedImposterNamesRef.current = [...usedNames, newImposter];
    const newAssignments = buildAssignments(students, newImposter, currentRound.word, currentRound.description);
    setImposterName(newImposter);
    setAssignments(newAssignments);
    setCurrentIdx(0);
    setConfirmedClientIds(new Set());
    setVoteCounts({});
    setVotedClientIds(new Set());
    setScoredVoterClientIds(new Set());
    setImposterGuessResult(null);
    setImposterCaught(false);
    setClueScored(new Set());
    setShuffledStudents(shuffle(students));
    setPhase('briefing');
    onPhaseChange?.('briefing');
  }, [currentRound, students, onPhaseChange]);

  const handleStartClues = useCallback(() => {
    setCurrentIdx(0);
    setPhase('clues');
    onPhaseChange?.('clues');
  }, [onPhaseChange]);

  const handleNextClue = useCallback(async () => {
    const student = shuffledStudents[currentIdx];
    if (student && !clueScored.has(currentIdx)) {
      setClueScored((prev) => new Set(Array.from(prev).concat([currentIdx])));
      await onScore?.({
        studentId: student.id ?? null,
        clientId: student.id ?? null,
        displayName: student.name,
        promptIndex: currentIdx + 1,
        points: 1,
        isCorrect: null,
      });
    }
    const next = currentIdx + 1;
    if (next >= shuffledStudents.length) {
      setPhase('voting');
      onPhaseChange?.('voting');
    } else {
      setCurrentIdx(next);
    }
  }, [currentIdx, shuffledStudents, clueScored, onScore, onPhaseChange]);

  const handleSkipClue = useCallback(() => {
    const next = currentIdx + 1;
    if (next >= shuffledStudents.length) {
      setPhase('voting');
      onPhaseChange?.('voting');
    } else {
      setCurrentIdx(next);
    }
  }, [currentIdx, shuffledStudents.length, onPhaseChange]);

  const handleEndVoting = useCallback(() => {
    // Find most-voted student
    const entries = Object.entries(voteCounts);
    if (entries.length === 0) {
      setImposterCaught(false);
      setPhase('redemption');
      onPhaseChange?.('redemption');
      return;
    }
    const maxVotes = Math.max(...entries.map(([, c]) => c));
    const topNames = entries.filter(([, c]) => c === maxVotes).map(([n]) => n);
    const accused = topNames.length === 1 ? topNames[0] : null; // null = tie

    setImposterCaught(!!(accused && accused === imposterName));
    setPhase('redemption');
    onPhaseChange?.('redemption');
  }, [voteCounts, imposterName, onPhaseChange]);

  const handleRedemption = useCallback(async (result: 'correct' | 'incorrect') => {
    setImposterGuessResult(result);
    // Award bonus to imposter for correct guess
    if (result === 'correct') {
      const imposterStudent = students.find((s) => s.name === imposterName);
      if (imposterStudent) {
        await onScore?.({
          studentId: imposterStudent.id ?? null,
          clientId: imposterStudent.id ?? null,
          displayName: imposterStudent.name,
          promptIndex: students.length + 2,
          points: 3,
          isCorrect: null,
        });
      }
    }
    setPhase('reveal');
    onPhaseChange?.('reveal');
  }, [students, imposterName, onScore, onPhaseChange]);

  const handleNextRound = useCallback(() => {
    setRoundIndex((i) => i + 1);
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('done');
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  // ─── Derived state for reveal ──────────────────────────────────────────────
  const voteEntries = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const totalVotes = votedClientIds.size;
  const maxVotes = voteEntries.length > 0 ? voteEntries[0][1] : 0;
  const topNames = voteEntries.filter(([, c]) => c === maxVotes).map(([n]) => n);
  const accused = topNames.length === 1 ? topNames[0] : null;
  const classWon = accused === imposterName;
  const imposterWon = !classWon || imposterGuessResult === 'correct';

  // ─── IDLE ──────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold opacity-90">Imposter</p>
          <p className="text-sm opacity-50 leading-relaxed">
            Everyone gets the secret word — except one student who gets ???.<br />
            Give clues, then vote to find the imposter.
          </p>
        </div>

        {currentRound && (
          <div className="glass p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-sm opacity-40">Round {roundIndex + 1} of {content.rounds?.length ?? 1}</p>
          </div>
        )}

        {!enoughStudents && (
          <div className="glass p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-300 text-center">
            Need at least 3 students to play. ({students.length} joined)
          </div>
        )}

        <div className="flex justify-center pt-2">
          <button
            onClick={handleStart}
            disabled={!enoughStudents || !currentRound}
            className="px-12 py-6 bg-gradient-to-br from-rose-500 to-red-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            DEAL CARDS
          </button>
        </div>
      </div>
    );
  }

  // ─── BRIEFING ──────────────────────────────────────────────────────────────
  if (phase === 'briefing') {
    const confirmedCount = confirmedClientIds.size;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-rose-400">Reading Cards…</h3>
          <span className="text-sm opacity-60">{confirmedCount} / {students.length} ready</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {students.map((student) => {
            // Approximate readiness by count (we track clientIds, not names)
            const readyCount = confirmedClientIds.size;
            const studentIdx = students.indexOf(student);
            const isReady = studentIdx < readyCount;
            return (
              <span
                key={student.id}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  isReady
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/10 opacity-40'
                }`}
              >
                {student.name}
              </span>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleStartClues}
            className="px-8 py-3 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            START CLUES ▶
          </button>
        </div>
      </div>
    );
  }

  // ─── CLUES ─────────────────────────────────────────────────────────────────
  if (phase === 'clues') {
    const currentStudent = shuffledStudents[currentIdx];
    const isLastStudent = currentIdx + 1 >= shuffledStudents.length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-rose-400">Clue Round</h3>
          <span className="text-sm opacity-60">{currentIdx + 1} / {shuffledStudents.length}</span>
        </div>

        {/* Current speaker */}
        {currentStudent && (
          <div className="glass p-6 rounded-2xl border-2 border-rose-500/30 text-center space-y-2">
            <p className="text-xs opacity-40 uppercase tracking-widest">Now giving a clue</p>
            <p className="text-2xl font-bold">{currentStudent.name}</p>
            <p className="text-xs opacity-40">Say one word or phrase that hints at the secret word — without saying it</p>
          </div>
        )}

        {/* Upcoming speakers */}
        <div className="flex flex-wrap gap-2">
          {shuffledStudents.map((student, i) => (
            <span
              key={student.id}
              className={`text-xs px-3 py-1 rounded-full ${
                clueScored.has(i)
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : i === currentIdx
                  ? 'bg-rose-500/30 text-rose-300 ring-1 ring-rose-400'
                  : 'bg-white/10 opacity-40'
              }`}
            >
              {student.name}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSkipClue}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl transition-colors text-sm font-medium"
          >
            Skip
          </button>
          <button
            onClick={handleNextClue}
            className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            {isLastStudent ? 'Go to Vote ▶' : 'Next ▶'}
          </button>
        </div>
      </div>
    );
  }

  // ─── VOTING ────────────────────────────────────────────────────────────────
  if (phase === 'voting') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-rose-400">Vote!</h3>
          <span className="text-sm opacity-60">{totalVotes} / {students.length} voted</span>
        </div>

        <p className="text-sm opacity-50 text-center">Students are voting on their devices…</p>

        <div className="space-y-3">
          {students.map((student) => {
            const count = voteCounts[student.name] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <div key={student.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{student.name}</span>
                  <span className="opacity-50">{count} vote{count !== 1 ? 's' : ''} · {pct}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleEndVoting}
            className="px-8 py-3 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            REVEAL VOTE
          </button>
        </div>
      </div>
    );
  }

  // ─── REDEMPTION ────────────────────────────────────────────────────────────
  if (phase === 'redemption') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-rose-400">
            {imposterCaught ? 'Imposter Caught!' : 'Imposter Wins!'}
          </p>
          <p className="text-sm opacity-60">
            {imposterCaught
              ? <>The class voted for <strong>{imposterName}</strong>.</>
              : <><strong>{imposterName}</strong> got away — but can they still guess the word?</>}
          </p>
        </div>

        <div className="glass p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-center space-y-3">
          <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wide">
            {imposterCaught ? 'Last Chance' : 'Bonus Round'}
          </p>
          <p className="text-base leading-snug opacity-90">
            <strong>{imposterName}</strong>, what was the secret word?
          </p>
          <p className="text-xs opacity-40">Ask them to guess aloud — then confirm below</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleRedemption('incorrect')}
            className="py-4 bg-white/10 hover:bg-white/15 rounded-xl font-medium text-sm transition-colors"
          >
            ✗ Wrong guess
          </button>
          <button
            onClick={() => handleRedemption('correct')}
            className="py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            ✓ Correct!
          </button>
        </div>
      </div>
    );
  }

  // ─── REVEAL ────────────────────────────────────────────────────────────────
  if (phase === 'reveal') {
    const isTie = topNames.length > 1;

    return (
      <div className="space-y-6">
        {/* Outcome banner */}
        <div className={`text-center py-4 space-y-1 ${imposterWon ? 'text-rose-400' : 'text-emerald-400'}`}>
          <p className="text-3xl font-bold">
            {imposterGuessResult === 'correct'
              ? '🕵️ Imposter wins — correct guess!'
              : imposterWon
              ? '🕵️ Imposter wins!'
              : '🎉 Class wins!'}
          </p>
          {isTie && <p className="text-sm opacity-60">Tie vote — imposter escaped</p>}
        </div>

        {/* Word reveal */}
        <div className="glass p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center space-y-2">
          <p className="text-xs opacity-40 uppercase tracking-widest">The secret word was</p>
          <p className="text-4xl font-bold text-rose-400">{currentRound?.word}</p>
          <p className="text-sm opacity-60 leading-relaxed">{currentRound?.description}</p>
        </div>

        {/* Imposter reveal */}
        <div className="glass px-4 py-3 rounded-xl flex items-center justify-between">
          <span className="text-sm opacity-60">The imposter was</span>
          <span className="font-bold text-rose-400">{imposterName}</span>
        </div>

        {/* Vote breakdown */}
        {voteEntries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs opacity-40 uppercase tracking-wide">Final vote</p>
            {voteEntries.map(([name, count]) => {
              const isActualImposter = name === imposterName;
              const wasAccused = name === accused;
              return (
                <div
                  key={name}
                  className={`flex items-center justify-between glass px-4 py-2.5 rounded-xl ${
                    isActualImposter ? 'border border-rose-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isActualImposter && <span className="text-rose-400 text-sm">🕵️</span>}
                    <span className={`text-sm font-medium ${isActualImposter ? 'text-rose-400' : ''}`}>{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-50">{count} vote{count !== 1 ? 's' : ''}</span>
                    {wasAccused && isActualImposter && <span className="text-xs text-emerald-400">✓ caught</span>}
                    {wasAccused && !isActualImposter && <span className="text-xs text-rose-400">✗ wrong</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {hasNextRound && (
            <button
              onClick={handleNextRound}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              Next Word ✨
            </button>
          )}
          <button
            onClick={handleEnd}
            className="px-8 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium transition-colors"
          >
            End Activity
          </button>
        </div>
      </div>
    );
  }

  // ─── DONE ──────────────────────────────────────────────────────────────────
  return (
    <div className="text-center py-12 space-y-3">
      <p className="text-2xl font-bold text-rose-400">Game Over</p>
      <p className="text-sm opacity-50">Thanks for playing Imposter!</p>
    </div>
  );
}
