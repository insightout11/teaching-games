'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import { useSyncedTimer } from '@/hooks/use-synced-timer';
import { GamePhase } from './types';
import type { GridContent, WordEntry, SentenceEntry, SpecialAwards, WordValidationResult, SentenceEvaluationResult } from './types';
const ROUND1_DURATION = 90;
const ROUND2_DURATION = 60;

// Client-side letter check — every char in word must exist somewhere in the grid (letters are reusable)
function clientLetterCheck(word: string, letters: string[]): boolean {
  const pool = new Set(letters.map((l) => l.toUpperCase()));
  return word.toUpperCase().split('').every((ch) => pool.has(ch));
}

function estimatePoints(word: string, bonusLetter: string, topicWords: string[]): number {
  const len = word.length;
  const base = len <= 4 ? 1 : len === 5 ? 2 : 3;
  const bonus = word.toLowerCase().includes(bonusLetter.toLowerCase()) ? 1 : 0;
  const topic = topicWords.map((w) => w.toLowerCase()).includes(word.toLowerCase()) ? 2 : 0;
  return base + bonus + topic;
}

export function GridRushGame({
  students,
  onScore,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
}: GameProps) {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.IDLE);
  const phaseRef = useRef<GamePhase>(GamePhase.IDLE);
  phaseRef.current = phase;

  const [grid, setGrid] = useState<GridContent | null>(null);
  const gridRef = useRef<GridContent | null>(null);
  gridRef.current = grid;

  // Countdown synced to the server-stamped round clock so the teacher screen matches
  // student devices within a tick. Each round broadcasts its own duration.
  const roundActive = phase === GamePhase.ROUND1 || phase === GamePhase.ROUND2;
  const roundDuration = phase === GamePhase.ROUND2 ? ROUND2_DURATION : ROUND1_DURATION;
  const { timeLeft, addSeconds } = useSyncedTimer(roundDuration, roundActive);
  const [forceEnd, setForceEnd] = useState(false);

  // Per-student word tracking
  const [studentWords, setStudentWords] = useState<Record<string, WordEntry[]>>({});
  const studentWordsRef = useRef<Record<string, WordEntry[]>>({});
  studentWordsRef.current = studentWords;

  // Dedup sets per student (mutable, no state mirror needed)
  const studentWordSetsRef = useRef<Record<string, Set<string>>>({});

  // Per-student sentence tracking
  const [studentSentences, setStudentSentences] = useState<Record<string, SentenceEntry>>({});
  const studentSentencesRef = useRef<Record<string, SentenceEntry>>({});

  // R2 one-shot guard per student
  const r2SubmittedRef = useRef<Record<string, boolean>>({});

  // Round start timestamps for student timer sync
  const r1StartedAtRef = useRef(0);
  const r2StartedAtRef = useRef(0);

  // Stable refs for sessionSettings values used inside handleVote
  // Avoids recreating handleVote when settings change mid-session (which would cause a handler null gap)
  const difficultyRef = useRef(sessionSettings.difficulty);
  difficultyRef.current = sessionSettings.difficulty;
  const topicRef = useRef(getEffectiveTopic(sessionSettings));
  topicRef.current = getEffectiveTopic(sessionSettings);
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);

  // Maps internal studentId key → clientId (localStorage UUID) so perStudentData can be keyed by clientId
  const studentIdToClientIdRef = useRef<Record<string, string>>({});

  // Maps internal studentId key → displayName for leaderboard (vote keys may be clientIds, not roster UUIDs)
  const studentIdToDisplayNameRef = useRef<Record<string, string>>({});

  // R2 submission count
  const [r2SubmissionCount, setR2SubmissionCount] = useState(0);

  // Special awards
  const [specialAwards, setSpecialAwards] = useState<SpecialAwards | null>(null);

  // Sentence gallery UI state (REVEALING phase)
  const [expandedSentenceId, setExpandedSentenceId] = useState<string | null>(null);
  const [sentenceGalleryOpen, setSentenceGalleryOpen] = useState(true);

  // ------- PHASE TRANSITIONS -------

  const transitionToRevealing = useCallback(() => {
    const wordsSnap = studentWordsRef.current;
    const sentSnap = studentSentencesRef.current;

    const displayNameFor = (sid: string) =>
      studentIdToDisplayNameRef.current[sid]
      ?? students.find((s) => s.id === sid)?.name
      ?? 'Player';

    let longestWord = { studentId: '', displayName: '', word: '' };
    let mostTopicWords = { studentId: '', displayName: '', count: 0 };
    let bestSentence = { studentId: '', displayName: '', sentence: '', score: 0 };

    for (const [sid, entries] of Object.entries(wordsSnap)) {
      for (const entry of entries) {
        if (!entry.rejected && entry.word.length > longestWord.word.length) {
          longestWord = { studentId: sid, displayName: displayNameFor(sid), word: entry.word };
        }
      }
      const count = entries.filter((e) => !e.rejected && e.isTopicWord).length;
      if (count > mostTopicWords.count) {
        mostTopicWords = { studentId: sid, displayName: displayNameFor(sid), count };
      }
    }

    for (const [sid, entry] of Object.entries(sentSnap)) {
      if (entry.score > bestSentence.score) {
        bestSentence = {
          studentId: sid,
          displayName: displayNameFor(sid),
          sentence: entry.sentence,
          score: entry.score,
        };
      }
    }

    setSpecialAwards({ longestWord, mostTopicWords, bestSentence });

    // Award bonus points for special category winners
    if (longestWord.studentId) {
      onScore(longestWord.studentId, {
        isCorrect: null,
        points: 3,
        outcome: 'on-task',
        responseData: { bonus: 'longestWord', word: longestWord.word },
      });
    }
    if (mostTopicWords.studentId && mostTopicWords.count > 0) {
      onScore(mostTopicWords.studentId, {
        isCorrect: null,
        points: 3,
        outcome: 'on-task',
        responseData: { bonus: 'mostTopicWords', count: mostTopicWords.count },
      });
    }
    if (bestSentence.studentId) {
      onScore(bestSentence.studentId, {
        isCorrect: null,
        points: 3,
        outcome: 'on-task',
        responseData: { bonus: 'bestSentence', score: bestSentence.score },
      });
    }

    setPhase(GamePhase.REVEALING);
    phaseRef.current = GamePhase.REVEALING;
  }, [students, onScore]);

  const startGame = useCallback(async () => {
    setPhase(GamePhase.GENERATING);
    phaseRef.current = GamePhase.GENERATING;

    // Reset transient state
    setStudentWords({});
    setStudentSentences({});
    studentSentencesRef.current = {};
    setR2SubmissionCount(0);
    setSpecialAwards(null);
    studentWordSetsRef.current = {};
    r2SubmittedRef.current = {};
    studentIdToClientIdRef.current = {};
    studentIdToDisplayNameRef.current = {};

    try {
      const res = await fetch('/api/grid-rush/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: getEffectiveTopic(sessionSettings),
          difficulty: sessionSettings.difficulty,
          ...(sourceMaterial ? { sourceMaterial } : {}),
        }),
      });

      if (!res.ok) throw new Error('Generate failed');

      const data = await res.json();
      setGrid(data.grid);

      setForceEnd(false);
      setPhase(GamePhase.ROUND1);
      phaseRef.current = GamePhase.ROUND1;
    } catch (err) {
      console.error('[GridRush] startGame error:', err);
      setPhase(GamePhase.IDLE);
      phaseRef.current = GamePhase.IDLE;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionSettings.difficulty, sessionSettings.topic, sessionSettings.customTopic, sourceMaterial]);

  // ------- TIMERS -------

  // End a round when the shared server deadline is reached (or the teacher ends it early).
  useEffect(() => {
    if (phase !== GamePhase.ROUND1 && phase !== GamePhase.ROUND2) return;
    if (timeLeft > 0 && !forceEnd) return;
    onSetInputSpec?.(null);
    if (phase === GamePhase.ROUND1) {
      setPhase(GamePhase.ROUND1_ENDING);
      phaseRef.current = GamePhase.ROUND1_ENDING;
    } else {
      transitionToRevealing();
    }
    setForceEnd(false);
  }, [phase, timeLeft, forceEnd, onSetInputSpec, transitionToRevealing]);

  const startRound2 = useCallback(() => {
    setForceEnd(false);
    setPhase(GamePhase.ROUND2);
    phaseRef.current = GamePhase.ROUND2;
  }, []);

  // ------- INPUT SPEC BROADCASTING -------

  useEffect(() => {
    if (phase === GamePhase.ROUND1 && grid) {
      if (!r1StartedAtRef.current) r1StartedAtRef.current = Date.now();
      const rows = [
        grid.letters.slice(0, 3),
        grid.letters.slice(3, 6),
        grid.letters.slice(6, 9),
      ];
      const gridText = rows
        .map((row, ri) =>
          row.map((l, ci) => {
            const idx = ri * 3 + ci;
            return idx === grid.bonusIndex ? `★${l}` : l;
          }).join(' ')
        )
        .join(' / ');
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'grid-rush',
        prompt: `${gridText} — bonus letter: ${grid.bonusLetter}`,
        placeholder: 'Type a word from the grid...',
        maxLength: 20,
        timerSeconds: ROUND1_DURATION,
        startedAt: r1StartedAtRef.current,
      });
    } else if (phase === GamePhase.ROUND2) {
      if (!r2StartedAtRef.current) r2StartedAtRef.current = Date.now();
      const perStudentData: Record<string, { round1Words: string[]; sentenceResult?: SentenceEntry }> = {};
      for (const [sid, entries] of Object.entries(studentWords)) {
        // Key by clientId (localStorage UUID) so TextareaInput can look it up
        const cid = studentIdToClientIdRef.current[sid] ?? sid;
        perStudentData[cid] = {
          round1Words: entries.map((e) => e.word),
          sentenceResult: studentSentences[sid],
        };
      }
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'grid-rush',
        prompt: 'Write ONE sentence using 2 or more of your Round 1 words.',
        placeholder: 'Your sentence...',
        maxLength: 300,
        perStudentData,
        timerSeconds: ROUND2_DURATION,
        startedAt: r2StartedAtRef.current,
      });
    } else {
      r1StartedAtRef.current = 0;
      r2StartedAtRef.current = 0;
      onSetInputSpec?.(null);
    }
  }, [phase, grid, studentWords, studentSentences, onSetInputSpec]);

  // ------- REMOTE VOTE HANDLER -------

  const handleVote = useCallback(async (vote: GameRemoteVote) => {
    const currentPhase = phaseRef.current;
    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    // ---- ROUND 1: word submission (also accept during ROUND1_ENDING for late-arriving votes) ----
    if (currentPhase === GamePhase.ROUND1 || currentPhase === GamePhase.ROUND1_ENDING) {
      const word = (vote.choice ?? '').trim().toLowerCase();
      if (!word || word.length < 3) return;

      const currentGrid = gridRef.current;
      if (!currentGrid) return;

      // Track clientId for perStudentData keying, and displayName for leaderboard
      if (!studentIdToClientIdRef.current[studentId]) {
        studentIdToClientIdRef.current[studentId] = vote.clientId;
      }
      studentIdToDisplayNameRef.current[studentId] = vote.displayName;

      // Init per-student dedup set
      if (!studentWordSetsRef.current[studentId]) {
        studentWordSetsRef.current[studentId] = new Set();
      }
      if (studentWordSetsRef.current[studentId].has(word)) return;

      // Client-side letter check for instant feedback
      if (!clientLetterCheck(word, currentGrid.letters)) return;

      // Optimistic add to dedup set
      studentWordSetsRef.current[studentId].add(word);

      // Compute optimistic points
      const optimisticPoints = estimatePoints(word, currentGrid.bonusLetter, currentGrid.topicWords);
      const hasBonusLetter = word.includes(currentGrid.bonusLetter.toLowerCase());
      const isTopicWord = currentGrid.topicWords.map((w) => w.toLowerCase()).includes(word);

      const submittedAt = Date.now();

      // Optimistic UI
      const optimisticEntry: WordEntry = {
        word, points: optimisticPoints, hasBonusLetter, isTopicWord, submittedAt,
      };
      setStudentWords((prev) => ({
        ...prev,
        [studentId]: [...(prev[studentId] ?? []), optimisticEntry],
      }));

      // AI validation (background)
      try {
        const res = await fetch('/api/grid-rush/validate-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word,
            letters: currentGrid.letters,
            bonusLetter: currentGrid.bonusLetter,
            topicWords: currentGrid.topicWords,
            topic: topicRef.current,
            difficulty: difficultyRef.current,
          }),
        });

        if (!res.ok) throw new Error('validate-word API error');
        const result: WordValidationResult = await res.json();

        if (!result.isValid) {
          // Remove optimistic entry + show rejection flash
          studentWordSetsRef.current[studentId].delete(word);
          setStudentWords((prev) => ({
            ...prev,
            [studentId]: (prev[studentId] ?? []).filter((e) => e.submittedAt !== submittedAt),
          }));
          onScore(studentId, {
            isCorrect: false,
            points: 1,
            responseData: {
              round: 1,
              word,
              rejected: true,
              reason: result.reason,
            },
          });
          return;
        }

        // Confirm with actual server scores
        setStudentWords((prev) => ({
          ...prev,
          [studentId]: (prev[studentId] ?? []).map((e) =>
            e.submittedAt === submittedAt
              ? { ...e, points: result.points, hasBonusLetter: result.hasBonusLetter, isTopicWord: result.isTopicWord }
              : e
          ),
        }));

        onScore(studentId, {
          isCorrect: true,
          points: result.points,
          responseData: {
            round: 1,
            word,
            hasBonusLetter: result.hasBonusLetter,
            isTopicWord: result.isTopicWord,
          },
        });

        try {
          const audio = new Audio('/sounds/correct.mp3');
          audio.volume = 0.35;
          audio.play().catch(() => {});
        } catch {}

      } catch {
        // On error, roll back optimistic add
        studentWordSetsRef.current[studentId].delete(word);
        setStudentWords((prev) => ({
          ...prev,
          [studentId]: (prev[studentId] ?? []).filter((e) => e.submittedAt !== submittedAt),
        }));
      }

    // ---- ROUND 2: sentence submission (also accept during REVEALING for late-arriving votes) ----
    } else if (currentPhase === GamePhase.ROUND2 || currentPhase === GamePhase.REVEALING) {
      if (r2SubmittedRef.current[studentId]) return;
      r2SubmittedRef.current[studentId] = true;

      const sentence = (vote.choice ?? '').trim();
      if (!sentence) {
        r2SubmittedRef.current[studentId] = false;
        return;
      }

      const myWords = (studentWordsRef.current[studentId] ?? []).map((e) => e.word);
      setR2SubmissionCount((prev) => prev + 1);

      try {
        const res = await fetch('/api/grid-rush/evaluate-sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sentence,
            studentWords: myWords,
            topic: topicRef.current,
            difficulty: difficultyRef.current,
          }),
        });

        if (!res.ok) throw new Error('evaluate-sentence API error');
        const result: SentenceEvaluationResult = await res.json();
        const totalPoints = result.meetsMinWords ? result.score * 2 : 0;

        const entry: SentenceEntry = {
          sentence,
          wordsUsed: result.wordsFound,
          score: result.score,
          feedback: result.feedback,
          totalPoints,
        };

        setStudentSentences((prev) => ({ ...prev, [studentId]: entry }));
        studentSentencesRef.current = { ...studentSentencesRef.current, [studentId]: entry };

        onScore(studentId, {
          isCorrect: result.meetsMinWords && result.score >= 3,
          points: totalPoints,
          responseData: {
            round: 2,
            sentence,
            wordsUsed: result.wordsFound,
            aiScore: result.score,
            feedback: result.feedback,
            meetsMinWords: result.meetsMinWords,
          },
        });

      } catch {
        r2SubmittedRef.current[studentId] = false;
        setR2SubmissionCount((prev) => prev - 1);
      }
    }
  }, [onScore]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, handleVote]);

  // ------- RENDER -------

  const endRoundEarly = useCallback(() => {
    if (phase === GamePhase.ROUND1 || phase === GamePhase.ROUND2) {
      setForceEnd(true);
    }
  }, [phase]);

  const resetToIdle = useCallback(() => {
    setPhase(GamePhase.IDLE);
    phaseRef.current = GamePhase.IDLE;
    setGrid(null);
    setStudentWords({});
    setStudentSentences({});
    studentSentencesRef.current = {};
    setR2SubmissionCount(0);
    setSpecialAwards(null);
    studentWordSetsRef.current = {};
    r2SubmittedRef.current = {};
    studentIdToClientIdRef.current = {};
    studentIdToDisplayNameRef.current = {};
  }, []);

  // -------- PHASE: IDLE --------
  if (phase === GamePhase.IDLE) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">GridRush</h2>
          <p className="text-slate-400 text-sm">2-Round Vocabulary Race</p>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700 max-w-md w-full text-center">
          <div className="grid grid-cols-3 gap-3 mb-6">
            {['R','A','T','E','★','N','G','O','S'].map((l, i) => (
              <div key={i} className={`flex items-center justify-center h-14 rounded-xl font-bold text-xl ${l === '★' ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300' : 'bg-slate-700 text-slate-200'}`}>
                {l}
              </div>
            ))}
          </div>
          <div className="text-left space-y-3 mb-6">
            <div>
              <p className="text-cyan-400 font-semibold text-sm mb-1">Round 1 — 90 seconds</p>
              <ul className="text-slate-400 text-xs space-y-0.5 list-disc list-inside">
                <li>Type words using only the letters shown in the grid</li>
                <li>Each letter can be reused — you don&apos;t &quot;spend&quot; them</li>
                <li>Longer words score more points</li>
                <li>Using the <span className="text-amber-300 font-semibold">★ bonus letter</span> earns extra points</li>
                <li>Longest word &amp; most topic words each earn extra points</li>
              </ul>
            </div>
            <div>
              <p className="text-violet-400 font-semibold text-sm mb-1">Round 2 — 60 seconds</p>
              <ul className="text-slate-400 text-xs space-y-0.5 list-disc list-inside">
                <li>Write one sentence using 2 or more of your Round 1 words</li>
                <li>Smart grading for quality (1–5 points × 2)</li>
                <li>Best sentence earns extra points</li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-slate-500 text-sm mb-6">
            <span>{students.length} students</span>
            <span>·</span>
            <span>{sessionSettings.difficulty}</span>
            <span>·</span>
            <span>{getEffectiveTopic(sessionSettings)}</span>
          </div>
          <button
            onClick={startGame}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-lg transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // -------- PHASE: GENERATING --------
  if (phase === GamePhase.GENERATING) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-300 font-medium">Building your letter grid…</p>
        <p className="text-slate-500 text-sm">{getEffectiveTopic(sessionSettings)} · {sessionSettings.difficulty}</p>
      </div>
    );
  }

  // -------- PHASE: ROUND1 --------
  if (phase === GamePhase.ROUND1 && grid) {
    const isLow = timeLeft <= 10;
    return (
      <div className="flex flex-col h-full gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Round 1</span>
            <h3 className="text-white font-bold text-lg">Word Race</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-3xl font-black tabular-nums ${isLow ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </div>
            <button
              onClick={() => addSeconds(30)}
              className="text-xs px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors font-semibold"
            >
              +30s
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* 3x3 grid */}
            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {grid.letters.map((letter, idx) => {
                  const isBonus = idx === grid.bonusIndex;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-center h-16 rounded-xl font-black text-2xl select-none transition-all ${
                        isBonus
                          ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                          : 'bg-slate-700 text-slate-100'
                      }`}
                    >
                      {isBonus && <span className="text-xs mr-0.5">★</span>}
                      {letter}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">★ {grid.bonusLetter} = +1 pt</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Topic word = +2 pt</span>
              </div>
            </div>

            {/* Per-student word counts */}
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Word counts</p>
              <div className="flex flex-wrap gap-2">
                {students.map((s) => {
                  const words = (studentWords[s.id] ?? []);
                  const totalPts = words.reduce((sum, w) => sum + w.points, 0);
                  return (
                    <div key={s.id} className="flex items-center gap-1.5 bg-slate-700/50 rounded-lg px-3 py-1.5">
                      <span className="text-slate-300 text-sm font-medium">{s.name}</span>
                      <span className="bg-cyan-500/20 text-cyan-300 text-xs rounded px-1.5 py-0.5 font-bold">{words.length} words</span>
                      <span className="text-slate-500 text-xs">{totalPts}pt</span>
                    </div>
                  );
                })}
                {students.length === 0 && (
                  <p className="text-slate-600 text-sm italic">Waiting for students…</p>
                )}
              </div>
            </div>
        </div>

        <button
          onClick={endRoundEarly}
          className="self-end text-sm text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
        >
          End Round 1 early
        </button>
      </div>
    );
  }

  // -------- PHASE: ROUND1_ENDING --------
  if (phase === GamePhase.ROUND1_ENDING) {
    const wordCounts = students.map((s) => ({
      name: s.name,
      count: (studentWords[s.id] ?? []).length,
      pts: (studentWords[s.id] ?? []).reduce((sum, w) => sum + w.points, 0),
    })).sort((a, b) => b.pts - a.pts);

    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl"
        >
          ✏️
        </motion.div>
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Round 1 Complete!</h2>
          <p className="text-violet-400 font-semibold">Sentence Showdown incoming…</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {wordCounts.map((w) => (
            <div key={w.name} className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700">
              <p className="text-slate-400 text-xs">{w.name}</p>
              <p className="text-white font-bold">{w.count} words · {w.pts}pt</p>
            </div>
          ))}
        </div>
        <button
          onClick={startRound2}
          className="mt-2 px-8 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-lg transition-colors"
        >
          Start Round 2 →
        </button>
      </div>
    );
  }

  // -------- PHASE: ROUND2 --------
  if (phase === GamePhase.ROUND2) {
    const isLow = timeLeft <= 10;
    const submitted = students.filter((s) => studentSentences[s.id]);
    const waiting = students.filter((s) => !studentSentences[s.id]);

    return (
      <div className="flex flex-col h-full gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">Round 2</span>
            <h3 className="text-white font-bold text-lg">Sentence Showdown</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-3xl font-black tabular-nums ${isLow ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </div>
            <button
              onClick={() => addSeconds(30)}
              className="text-xs px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors font-semibold"
            >
              +30s
            </button>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 flex-1">
          <p className="text-slate-300 text-center mb-5 text-sm">
            Students: write <strong className="text-white">ONE sentence</strong> using 2+ of your Round 1 words on your device
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="text-4xl font-black text-white">{r2SubmissionCount}</div>
            <div className="text-slate-400">/ {students.length}</div>
            <div className="text-slate-400 text-sm ml-1">submitted</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Submitted</p>
              <div className="flex flex-col gap-1">
                {submitted.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {s.name}
                  </div>
                ))}
                {submitted.length === 0 && <p className="text-slate-600 text-sm italic">None yet</p>}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Waiting</p>
              <div className="flex flex-col gap-1">
                {waiting.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={endRoundEarly}
          className="self-end text-sm text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
        >
          End Round 2 early
        </button>
      </div>
    );
  }

  // -------- PHASE: REVEALING --------
  if (phase === GamePhase.REVEALING) {
    // Leaderboard: built from vote participants (vote keys may be clientIds, not roster UUIDs)
    const participantKeys = Object.keys(studentWords);
    const participantEntries = participantKeys.map((sid) => {
      const r1Pts = (studentWords[sid] ?? []).reduce((sum, w) => sum + w.points, 0);
      const r2Pts = studentSentences[sid]?.totalPoints ?? 0;
      const name = studentIdToDisplayNameRef.current[sid]
        ?? students.find((s) => s.id === sid)?.name
        ?? 'Player';
      return { id: sid, name, r1Pts, r2Pts, total: r1Pts + r2Pts };
    }).sort((a, b) => b.total - a.total);
    const seenIds = new Set(participantKeys);
    const absentEntries = students
      .filter((s) => !seenIds.has(s.id))
      .map((s) => ({ id: s.id, name: s.name, r1Pts: 0, r2Pts: 0, total: 0 }));
    const leaderboard = [...participantEntries, ...absentEntries];

    // Sentence gallery sorted by AI score desc
    const sentenceGallery = Object.entries(studentSentences)
      .map(([sid, entry]) => ({
        sid,
        name: studentIdToDisplayNameRef.current[sid] ?? students.find((s) => s.id === sid)?.name ?? 'Player',
        ...entry,
      }))
      .sort((a, b) => b.score - a.score);

    const medals = ['🥇', '🥈', '🥉'];

    return (
      <div className="flex flex-col h-full gap-4 p-4 overflow-y-auto">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">GridRush Results</h2>
        </div>

        {/* Leaderboard */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden">
          {leaderboard.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 }}
              className={`flex items-center gap-3 px-5 py-3 ${i < leaderboard.length - 1 ? 'border-b border-slate-700/50' : ''} ${i === 0 ? 'bg-amber-500/10' : ''}`}
            >
              <span className="text-xl w-7 text-center">{medals[i] ?? `${i + 1}.`}</span>
              <span className="text-white font-semibold flex-1">{entry.name}</span>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-cyan-400 text-xs">R1: {entry.r1Pts}</span>
                <span className="text-violet-400 text-xs">R2: {entry.r2Pts}</span>
                <span className="text-white font-black text-base">{entry.total}pt</span>
              </div>
            </motion.div>
          ))}
          {leaderboard.length === 0 && (
            <p className="text-slate-500 text-center p-6">No scores recorded.</p>
          )}
        </div>

        {/* Special awards */}
        {specialAwards && (
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/60 rounded-xl border border-cyan-500/30 p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">🏆 Longest Word</p>
                {specialAwards.longestWord.studentId && <span className="text-cyan-300 text-xs font-bold">+3 pts</span>}
              </div>
              {specialAwards.longestWord.studentId ? (
                <>
                  <p className="text-white font-black text-lg uppercase tracking-wide">{specialAwards.longestWord.word}</p>
                  <p className="text-slate-400 text-xs">{specialAwards.longestWord.displayName}</p>
                </>
              ) : (
                <p className="text-slate-500 text-sm italic">No submissions</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52 }}
              className="bg-slate-800/60 rounded-xl border border-emerald-500/30 p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">🎯 Most Topic Words</p>
                {specialAwards.mostTopicWords.studentId && specialAwards.mostTopicWords.count > 0 && <span className="text-emerald-300 text-xs font-bold">+3 pts</span>}
              </div>
              {specialAwards.mostTopicWords.studentId ? (
                <>
                  <p className="text-white font-black text-lg">{specialAwards.mostTopicWords.count}</p>
                  <p className="text-slate-400 text-xs">{specialAwards.mostTopicWords.displayName}</p>
                </>
              ) : (
                <p className="text-slate-500 text-sm italic">No topic words</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.64 }}
              className="bg-slate-800/60 rounded-xl border border-violet-500/30 p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider">🧠 Best Sentence</p>
                {specialAwards.bestSentence.studentId && <span className="text-violet-300 text-xs font-bold">+3 pts</span>}
              </div>
              {specialAwards.bestSentence.studentId ? (
                <>
                  <p className="text-white text-xs leading-snug line-clamp-3 mb-1">&ldquo;{specialAwards.bestSentence.sentence}&rdquo;</p>
                  <p className="text-slate-400 text-xs">{specialAwards.bestSentence.displayName} · {specialAwards.bestSentence.score}/5</p>
                </>
              ) : (
                <p className="text-slate-500 text-sm italic">No sentences</p>
              )}
            </motion.div>
          </div>
        )}

        {/* Sentence Gallery */}
        {sentenceGallery.length > 0 && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => setSentenceGalleryOpen(!sentenceGalleryOpen)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-700/30 transition-colors"
            >
              <span className="text-slate-300 font-semibold text-sm">
                Sentences ({sentenceGallery.length} submitted)
              </span>
              <span className="text-slate-500 text-xs">{sentenceGalleryOpen ? '▾' : '▸'}</span>
            </button>
            {sentenceGalleryOpen && (
              <div className="divide-y divide-slate-700/50">
                {sentenceGallery.map((item) => {
                  const isExpanded = expandedSentenceId === item.sid;
                  const stars = Array.from({ length: 5 }, (_, i) => i < item.score ? '★' : '☆').join('');
                  const allMyWords = (studentWords[item.sid] ?? []).map((e) => e.word);
                  const unusedWords = allMyWords.filter((w) => !item.wordsUsed.includes(w));
                  return (
                    <div
                      key={item.sid}
                      className={`px-5 py-3 cursor-pointer hover:bg-slate-700/20 transition-colors ${item.totalPoints === 0 ? 'opacity-60' : ''}`}
                      onClick={() => setExpandedSentenceId(isExpanded ? null : item.sid)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400 text-sm tracking-tight font-mono shrink-0">{stars}</span>
                        <span className="text-white font-medium flex-1">{item.name}</span>
                        <span className="text-violet-400 text-sm font-bold">+{item.totalPoints}pt</span>
                        <span className="text-slate-500 text-xs">{isExpanded ? '▾' : '▸'}</span>
                      </div>
                      {!isExpanded && (
                        <p className="text-slate-400 text-xs mt-1 line-clamp-1">&ldquo;{item.sentence}&rdquo;</p>
                      )}
                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          <p className="text-slate-200 text-sm">&ldquo;{item.sentence}&rdquo;</p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.wordsUsed.map((w) => (
                              <span key={w} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium">{w}</span>
                            ))}
                            {unusedWords.map((w) => (
                              <span key={w} className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full text-xs">{w}</span>
                            ))}
                          </div>
                          <p className="text-slate-400 text-xs italic">{item.feedback}</p>
                          {item.totalPoints === 0 && (
                            <p className="text-red-400 text-xs">Needs 2+ of their words to earn points</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          onClick={resetToIdle}
          className="self-center mt-2 px-8 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  return null;
}
