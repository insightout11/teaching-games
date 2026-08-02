'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ActivityProps } from '../types';
import type { TabooSprintContent } from '../types';
import type { Student } from '@/lib/supabase/types';

type Phase = 'idle' | 'briefing' | 'speaking' | 'discussing' | 'guessing' | 'reveal' | 'done';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TabooSprintActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as TabooSprintContent;

  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIndex, setRoundIndex] = useState(0);
  const [speakingGroup, setSpeakingGroup] = useState<'A' | 'B'>('A');
  const [groupA, setGroupA] = useState<Student[]>([]);
  const [groupB, setGroupB] = useState<Student[]>([]);
  const [currentSpeakerIdx, setCurrentSpeakerIdx] = useState(0);
  const [teamBGuess, setTeamBGuess] = useState('');
  const [timer, setTimer] = useState(30);
  const [tabooFlash, setTabooFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentRound = content.rounds?.[roundIndex] ?? content.rounds?.[0];
  const hasNextRound = roundIndex + 1 < (content.rounds?.length ?? 0);
  const enoughStudents = students.length >= 4;

  const speakingStudents = speakingGroup === 'A' ? groupA : groupB;
  const guessingStudents = speakingGroup === 'A' ? groupB : groupA;

  // ─── Timer ────────────────────────────────────────────────────────────────────
  const startTimer = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(seconds);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  useEffect(() => {
    if (phase === 'discussing' && timer === 0) {
      setPhase('guessing');
      onPhaseChange?.('guessing');
    }
  }, [timer, phase, onPhaseChange]);

  // ─── Input spec ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'briefing' && currentRound) {
      const perStudentData: Record<string, unknown> = {};
      for (const s of speakingStudents) {
        perStudentData[s.name] = {
          role: 'speaker',
          word: currentRound.word,
          forbidden: currentRound.forbiddenWords,
        };
      }
      for (const s of guessingStudents) {
        perStudentData[s.name] = { role: 'guesser' };
      }
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'taboo-sprint',
        prompt: 'Read your card carefully.',
        buttonLabel: 'Got it!',
        perStudentData,
      });
    } else {
      onSetInputSpec?.(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ─── Remote vote handler (briefing confirmations) ─────────────────────────────
  const confirmedIdsRef = useRef<Set<string>>(new Set());
  const [confirmedCount, setConfirmedCount] = useState(0);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'briefing') return;
      if (confirmedIdsRef.current.has(vote.clientId)) return;
      confirmedIdsRef.current.add(vote.clientId);
      setConfirmedCount((prev) => prev + 1);
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

  // ─── Taboo buzz (cosmetic only) ───────────────────────────────────────────────
  const handleTabooBuzz = useCallback(() => {
    setTabooFlash(true);
    setTimeout(() => setTabooFlash(false), 1500);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (!currentRound) return;
    confirmedIdsRef.current = new Set();
    setConfirmedCount(0);
    setTeamBGuess('');
    setCurrentSpeakerIdx(0);
    setTabooFlash(false);
    stopTimer();

    if (groupA.length === 0) {
      const mid = Math.ceil(students.length / 2);
      const shuffled = shuffle(students);
      setGroupA(shuffled.slice(0, mid));
      setGroupB(shuffled.slice(mid));
    }

    setPhase('briefing');
    onPhaseChange?.('briefing');
  }, [currentRound, students, groupA.length, stopTimer, onPhaseChange]);

  const handleStartSpeaking = useCallback(() => {
    setCurrentSpeakerIdx(0);
    setPhase('speaking');
    onPhaseChange?.('speaking');
    startTimer(30);
  }, [onPhaseChange, startTimer]);

  const handleNextSpeaker = useCallback(async () => {
    stopTimer();
    const speaker = speakingStudents[currentSpeakerIdx];
    if (speaker) {
      await onScore?.({
        studentId: speaker.id ?? null,
        clientId: speaker.id ?? null,
        displayName: speaker.name,
        promptIndex: currentSpeakerIdx + 1,
        points: 1,
        isCorrect: null,
      });
    }
    const next = currentSpeakerIdx + 1;
    if (next >= speakingStudents.length) {
      setPhase('discussing');
      onPhaseChange?.('discussing');
      startTimer(30);
    } else {
      setCurrentSpeakerIdx(next);
      startTimer(30);
    }
  }, [currentSpeakerIdx, speakingStudents, stopTimer, startTimer, onScore, onPhaseChange]);

  const handleSkipDiscuss = useCallback(() => {
    stopTimer();
    setPhase('guessing');
    onPhaseChange?.('guessing');
  }, [stopTimer, onPhaseChange]);

  const handleReveal = useCallback(async () => {
    if (!currentRound || !teamBGuess.trim()) return;
    stopTimer();
    const guessCorrect = teamBGuess.trim().toLowerCase() === currentRound.word.toLowerCase();

    if (guessCorrect) {
      for (const s of guessingStudents) {
        await onScore?.({
          studentId: s.id ?? null,
          clientId: s.id ?? null,
          displayName: s.name,
          promptIndex: speakingStudents.length + 1,
          points: 2,
          isCorrect: null,
        });
      }
    } else {
      for (const s of speakingStudents) {
        await onScore?.({
          studentId: s.id ?? null,
          clientId: s.id ?? null,
          displayName: s.name,
          promptIndex: speakingStudents.length + 1,
          points: 1,
          isCorrect: null,
        });
      }
    }

    setPhase('reveal');
    onPhaseChange?.('reveal');
  }, [currentRound, teamBGuess, guessingStudents, speakingStudents, stopTimer, onScore, onPhaseChange]);

  const handleNextRound = useCallback(() => {
    setRoundIndex((i) => i + 1);
    setSpeakingGroup((g) => (g === 'A' ? 'B' : 'A'));
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('done');
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  // ─── IDLE ──────────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    const nextSpeakers = speakingGroup === 'A'
      ? (groupA.length > 0 ? groupA : null)
      : (groupB.length > 0 ? groupB : null);
    const nextGuessers = speakingGroup === 'A'
      ? (groupB.length > 0 ? groupB : null)
      : (groupA.length > 0 ? groupA : null);

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold opacity-90">Taboo Sprint</p>
          <p className="text-sm opacity-50 leading-relaxed">
            Like Password — but you can&apos;t say the secret word<br />
            or any of the 4 forbidden words either.
          </p>
        </div>

        {nextSpeakers && nextGuessers ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="glass p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <p className="text-xs opacity-40 uppercase tracking-wide text-center">Speaking</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {nextSpeakers.map((s) => (
                  <span key={s.id} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">{s.name}</span>
                ))}
              </div>
            </div>
            <div className="glass p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-2">
              <p className="text-xs opacity-40 uppercase tracking-wide text-center">Guessing</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {nextGuessers.map((s) => (
                  <span key={s.id} className="text-xs px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300">{s.name}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-sm opacity-40">Round {roundIndex + 1} of {content.rounds?.length ?? 1}</p>
          </div>
        )}

        {!enoughStudents && (
          <div className="glass p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-300 text-center">
            Need at least 4 students to play. ({students.length} joined)
          </div>
        )}

        <div className="flex justify-center pt-2">
          <button
            onClick={handleStart}
            disabled={!enoughStudents || !currentRound}
            className="px-12 py-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            DEAL CARDS
          </button>
        </div>
      </div>
    );
  }

  // ─── BRIEFING ──────────────────────────────────────────────────────────────────
  if (phase === 'briefing') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-orange-400">Reading Cards…</h3>
          <span className="text-sm opacity-60">{confirmedCount} / {students.length} ready</span>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex flex-wrap gap-2">
            {speakingStudents.map((s) => (
              <span key={s.id} className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                {s.name} — speaker
              </span>
            ))}
            {guessingStudents.map((s) => (
              <span key={s.id} className="text-xs px-3 py-1 rounded-full bg-sky-500/20 text-sky-400">
                {s.name} — guesser
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleStartSpeaking}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            START SPEAKING ▶
          </button>
        </div>
      </div>
    );
  }

  // ─── SPEAKING ──────────────────────────────────────────────────────────────────
  if (phase === 'speaking') {
    const currentSpeaker = speakingStudents[currentSpeakerIdx];
    const isLastSpeaker = currentSpeakerIdx + 1 >= speakingStudents.length;
    const timerColor = timer <= 5 ? 'text-rose-400' : timer <= 10 ? 'text-amber-400' : 'text-orange-400';

    return (
      <div className={`space-y-5 transition-all duration-300 ${tabooFlash ? 'ring-2 ring-rose-500/60 rounded-2xl bg-rose-500/5 p-2' : ''}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-orange-400">Speaking</h3>
          <span className="text-sm opacity-60">{currentSpeakerIdx + 1} / {speakingStudents.length}</span>
        </div>

        {/* Secret word + forbidden words */}
        {currentRound && (
          <div className="glass p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 space-y-3">
            <div className="text-center space-y-1">
              <p className="text-xs opacity-40 uppercase tracking-widest">Secret Word</p>
              <p className="text-3xl font-bold text-orange-300">{currentRound.word}</p>
            </div>
            <div className="border-t border-white/10 pt-3 space-y-1.5">
              <p className="text-xs opacity-40 uppercase tracking-widest text-center">🚫 Forbidden Words</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {currentRound.forbiddenWords.map((w, i) => (
                  <span key={i} className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-sm font-medium border border-rose-500/30">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Current speaker */}
        {currentSpeaker && (
          <div className="glass p-5 rounded-2xl border-2 border-orange-500/30 text-center space-y-2">
            <p className="text-xs opacity-40 uppercase tracking-widest">Now speaking</p>
            <p className="text-2xl font-bold">{currentSpeaker.name}</p>
            <p className={`text-4xl font-bold font-mono ${timerColor}`}>{timer}s</p>
          </div>
        )}

        {/* Progress */}
        <div className="flex flex-wrap gap-2">
          {speakingStudents.map((s, i) => (
            <span
              key={s.id}
              className={`text-xs px-3 py-1 rounded-full ${
                i < currentSpeakerIdx
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : i === currentSpeakerIdx
                  ? 'bg-orange-500/30 text-orange-300 ring-1 ring-orange-400'
                  : 'bg-white/10 opacity-40'
              }`}
            >
              {s.name}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTabooBuzz}
            className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-xl transition-colors text-sm font-medium text-rose-300"
          >
            🚫 Taboo!
          </button>
          <button
            onClick={() => void handleNextSpeaker()}
            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            {isLastSpeaker ? 'Done — Start Discussion ▶' : 'Next Speaker ▶'}
          </button>
        </div>
      </div>
    );
  }

  // ─── DISCUSSING ────────────────────────────────────────────────────────────────
  if (phase === 'discussing') {
    const timerColor = timer <= 5 ? 'text-rose-400' : timer <= 10 ? 'text-amber-400' : 'text-orange-400';

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-orange-400">Team Discussion</h3>

        <div className="glass p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 text-center space-y-4">
          <p className="text-xs opacity-40 uppercase tracking-widest">Guessing team — agree on your answer</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {guessingStudents.map((s) => (
              <span key={s.id} className="text-xs px-3 py-1 rounded-full bg-sky-500/20 text-sky-300">{s.name}</span>
            ))}
          </div>
          <p className={`text-5xl font-bold font-mono ${timerColor}`}>{timer}s</p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSkipDiscuss}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            Time&apos;s Up →
          </button>
        </div>
      </div>
    );
  }

  // ─── GUESSING ──────────────────────────────────────────────────────────────────
  if (phase === 'guessing') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-orange-400">What&apos;s the Word?</h3>

        <div className="glass p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 text-center">
          <p className="text-sm opacity-60">Ask the guessing team for their answer, then type it below.</p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={teamBGuess}
            onChange={(e) => setTeamBGuess(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && teamBGuess.trim()) void handleReveal(); }}
            placeholder="Type their answer…"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:opacity-30 focus:outline-none focus:border-orange-400/50 text-lg"
            autoFocus
          />
          <div className="flex justify-end">
            <button
              onClick={() => void handleReveal()}
              disabled={!teamBGuess.trim()}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              REVEAL ✨
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── REVEAL ────────────────────────────────────────────────────────────────────
  if (phase === 'reveal') {
    const guessCorrect = teamBGuess.trim().toLowerCase() === currentRound?.word.toLowerCase();

    return (
      <div className="space-y-6">
        <div className={`text-center py-4 space-y-1 ${guessCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
          <p className="text-3xl font-bold">
            {guessCorrect ? '🎉 Correct!' : '🙈 Wrong guess!'}
          </p>
          <p className="text-sm opacity-60">
            {guessCorrect ? 'The guessing team cracked it!' : 'The speaking team fooled them!'}
          </p>
        </div>

        <div className="glass p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 text-center space-y-2">
          <p className="text-xs opacity-40 uppercase tracking-widest">The word was</p>
          <p className="text-4xl font-bold text-orange-300">{currentRound?.word}</p>
          <p className="text-sm opacity-60 leading-relaxed">{currentRound?.description}</p>
          {currentRound && currentRound.forbiddenWords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              {currentRound.forbiddenWords.map((w, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full">
                  🚫 {w}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="glass px-4 py-3 rounded-xl flex items-center justify-between">
          <span className="text-sm opacity-60">Their guess</span>
          <span className={`font-bold ${guessCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
            {teamBGuess}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {hasNextRound && (
            <button
              onClick={handleNextRound}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              Next Round ✨
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

  // ─── DONE ──────────────────────────────────────────────────────────────────────
  return (
    <div className="text-center py-12 space-y-3">
      <p className="text-2xl font-bold text-orange-400">Game Over</p>
      <p className="text-sm opacity-50">Thanks for playing Taboo Sprint!</p>
    </div>
  );
}
