'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { useRaceMode } from '@/hooks/use-race-mode';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import { GenerationLoader } from '@/components/ui/generation-loader';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { ArrowRight, Check, Clock, Lightbulb, Shuffle, Trophy } from 'lucide-react';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function tokenize(sentence: string): string[] {
  return sentence.split(/\s+/).filter(Boolean);
}

function isAnswerCorrect(answer: string, canonical: string, alternatives: string[]): boolean {
  return answer === canonical || alternatives.includes(answer);
}

const FALLBACK_SENTENCES = [
  'The children are playing in the garden.',
  'She always drinks coffee in the morning.',
  'He usually walks to school every day.',
  'They watched a movie at the cinema.',
  'We are going to the beach tomorrow.',
];

// Scoring for simultaneous mode: position-based
function getPositionPoints(position: number): number {
  if (position === 1) return 10;
  if (position === 2) return 8;
  if (position === 3) return 6;
  return 3;
}

interface RaceSolver {
  studentId: string;
  clientId: string;
  displayName: string;
  timestamp: number;
  points: number;
  position: number;
}

export function SentenceScrambleGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterRemoteVoteHandler, isMicroEvent }: GameProps) {
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  const [sentences, setSentences] = useState<string[]>(FALLBACK_SENTENCES);
  const [sentenceAlternatives, setSentenceAlternatives] = useState<Record<string, string[]>>({});
  const [loadingSentences, setLoadingSentences] = useState(true);
  const fetchedRef = useRef<string>('');

  // Fetch AI-generated sentences on mount / when topic or difficulty changes
  useEffect(() => {
    const effectiveTopic = getEffectiveTopic(sessionSettings);
    const key = `${effectiveTopic}-${sessionSettings.difficulty}-${sessionSettings.grammarTarget ?? ''}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    let cancelled = false;
    setLoadingSentences(true);

    fetch('/api/sentence-scramble/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: effectiveTopic,
        difficulty: sessionSettings.difficulty,
        ...(sessionSettings.grammarTarget ? { grammarTarget: sessionSettings.grammarTarget } : {}),
        ...(sourceMaterial ? { sourceMaterial } : {}),
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled && Array.isArray(data.sentences) && data.sentences.length > 0) {
          setSentences(data.sentences);
          setSentenceAlternatives(data.sentenceAlternatives ?? {});
        }
      })
      .catch(() => {
        // Keep fallback sentences
      })
      .finally(() => {
        if (!cancelled) setLoadingSentences(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionSettings.topic, sessionSettings.customTopic, sessionSettings.difficulty, sessionSettings.grammarTarget]);

  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [extraSeconds, setExtraSeconds] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [revealed, setRevealed] = useState(false);
  const studentResultRef = useRef<'correct' | 'incorrect' | null>(null);

  // Simultaneous race mode state
  const { isSimultaneous, raceActive, raceFinished, timeRemaining, startRace, endRace, resetRace, addTime } = useRaceMode({
    studentCount: students.length,
    timerSeconds: sessionSettings.timerSeconds,
  });
  const [raceSolvers, setRaceSolvers] = useState<RaceSolver[]>([]);
  // Wrong tries per phone (clientId): feeds "Not quite, try again" + the common-slip reveal.
  const [attempts, setAttempts] = useState<Record<string, { tries: number; last: string }>>({});
  const [hintShown, setHintShown] = useState(false);
  const [roundNo, setRoundNo] = useState(1);

  const original = sentences[sentenceIndex % sentences.length];
  const words = useMemo(() => tokenize(original), [original]);

  // Stable refs so handleRaceSubmission doesn't recreate on every state change
  const originalRef = useRef(original);
  originalRef.current = original;
  const sentenceAlternativesRef = useRef(sentenceAlternatives);
  sentenceAlternativesRef.current = sentenceAlternatives;
  const raceFinishedRef = useRef(raceFinished);
  raceFinishedRef.current = raceFinished;
  const raceStartedAtRef = useRef(0);

  const [availableWords, setAvailableWords] = useState<{ word: string; originalIndex: number }[]>([]);
  const [selectedWords, setSelectedWords] = useState<{ word: string; originalIndex: number }[]>([]);

  // Shuffle words when sentence changes
  useEffect(() => {
    const indexed = words.map((word, idx) => ({ word, originalIndex: idx }));
    let shuffled = shuffleArray(indexed);
    while (shuffled.map(w => w.word).join(' ') === words.join(' ') && words.length > 1) {
      shuffled = shuffleArray(indexed);
    }
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setSubmitted(false);
    setRevealed(false);
    setFeedback(null);
    studentResultRef.current = null;
    setExtraSeconds(0);
    resetRace();
    setRaceSolvers([]);
    setAttempts({});
    setHintShown(false);
  }, [sentenceIndex, words, resetRace]);

  // Per-phone feedback: solved (#position, points) or "try again".
  const perStudentData = useMemo(() => {
    const data: Record<string, unknown> = {};
    Object.keys(attempts).forEach((id) => { data[id] = { status: 'retry', tries: attempts[id].tries }; });
    raceSolvers.forEach((sv) => { data[sv.clientId] = { status: 'solved', position: sv.position, points: sv.points }; });
    return data;
  }, [attempts, raceSolvers]);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Register input spec for student controller
  useEffect(() => {
    if (isSimultaneous) {
      // In simultaneous mode, broadcast when race is active
      if (raceActive && !raceFinished && availableWords.length > 0) {
        if (!raceStartedAtRef.current) raceStartedAtRef.current = Date.now();
        onSetInputSpec?.({
          type: 'sequence',
          gameKey: 'sentence-scramble',
          prompt: 'Arrange the words in the correct order — race!',
          options: availableWords.map(w => w.word),
          timerSeconds: sessionSettings.timerSeconds + extraSeconds,
          startedAt: raceStartedAtRef.current,
          perStudentData,
        });
      } else {
        raceStartedAtRef.current = 0;
        onSetInputSpec?.(null);
      }
    } else {
      // Turn-based: only show to current student. Teacher-paced and untimed — the teacher
      // screen shows no countdown here, so the student's device must not either, or an expired
      // timer would lock the single student out of submitting (their only input path).
      if (!submitted && availableWords.length > 0) {
        raceStartedAtRef.current = 0;
        onSetInputSpec?.({
          type: 'sequence',
          gameKey: 'sentence-scramble',
          prompt: 'Tap words to build the sentence in correct order',
          options: availableWords.map(w => w.word),
        });
      } else if (submitted && studentResultRef.current) {
        raceStartedAtRef.current = 0;
        // Push result feedback to student device
        onSetInputSpec?.({
          type: 'sequence',
          gameKey: 'sentence-scramble',
          result: studentResultRef.current,
        });
      } else {
        raceStartedAtRef.current = 0;
        onSetInputSpec?.(null);
      }
    }
  }, [isSimultaneous, raceActive, raceFinished, submitted, availableWords, onSetInputSpec, sessionSettings.timerSeconds, extraSeconds, perStudentData]);

  // Handle remote submissions in simultaneous race mode
  const handleRaceSubmission = useCallback((vote: GameRemoteVote) => {
    if (raceFinishedRef.current) return;

    try {
      const orderedWords: string[] = JSON.parse(vote.choice);
      const answer = orderedWords.join(' ');
      const isCorrect = isAnswerCorrect(answer, originalRef.current, sentenceAlternativesRef.current[originalRef.current] ?? []);

      const studentId = vote.studentId || vote.clientId;
      if (!studentId) return;

      if (!isCorrect) {
        setAttempts((prev) => ({ ...prev, [vote.clientId]: { tries: (prev[vote.clientId]?.tries ?? 0) + 1, last: answer } }));
        return;
      }

      // Prevent duplicate submissions from same student
      setRaceSolvers(prev => {
        if (prev.some(s => s.studentId === studentId)) return prev;

        const position = prev.length + 1;
        const points = getPositionPoints(position);

        // Score the student
        onScore(studentId, {
          isCorrect: true,
          points,
          responseData: { position, answer: orderedWords.join(' ') },
        });

        return [...prev, {
          studentId,
          clientId: vote.clientId,
          displayName: vote.displayName,
          timestamp: Date.now(),
          points,
          position,
        }];
      });
    } catch {
      // Invalid JSON, ignore
    }
  }, [onScore]);

  // Register remote vote handler
  useEffect(() => {
    if (isSimultaneous) {
      onRegisterRemoteVoteHandler?.(handleRaceSubmission);
    } else {
      // Turn-based: auto-evaluate and score without teacher approval
      if (submitted || availableWords.length === 0) return;

      onRegisterRemoteVoteHandler?.((vote: GameRemoteVote) => {
        const studentId = vote.studentId || vote.clientId;
        if (!studentId) return;

        try {
          const orderedWords: string[] = JSON.parse(vote.choice);
          const allWords = words.map((word, idx) => ({ word, originalIndex: idx }));
          const mapped = orderedWords
            .map(w => allWords.find(item => item.word === w))
            .filter((item): item is { word: string; originalIndex: number } => item !== undefined);

          if (mapped.length === words.length) {
            const answer = orderedWords.join(' ');
            const isCorrect = isAnswerCorrect(answer, original, sentenceAlternatives[original] ?? []);
            studentResultRef.current = isCorrect ? 'correct' : 'incorrect';
            setSelectedWords(mapped);
            setAvailableWords([]);
            setSubmitted(true);
            setFeedback(isCorrect ? 'correct' : 'wrong');

            onScore(studentId, {
              isCorrect,
              points: isCorrect ? 10 : 0,
              responseData: { answer, expected: original },
            });
          }
        } catch {
          // Invalid JSON, ignore
        }
      });
    }

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [isSimultaneous, submitted, availableWords, words, original, sentenceAlternatives, onRegisterRemoteVoteHandler, handleRaceSubmission, onScore]);

  // --- Turn-based handlers (unchanged) ---
  const handleSelectWord = (wordItem: { word: string; originalIndex: number }) => {
    if (submitted) return;
    setAvailableWords(prev => prev.filter(w => w.originalIndex !== wordItem.originalIndex));
    setSelectedWords(prev => [...prev, wordItem]);
  };

  const handleDeselectWord = (wordItem: { word: string; originalIndex: number }) => {
    if (submitted) return;
    setSelectedWords(prev => prev.filter(w => w.originalIndex !== wordItem.originalIndex));
    setAvailableWords(prev => [...prev, wordItem]);
  };

  const handleReset = () => {
    if (submitted) return;
    const indexed = words.map((word, idx) => ({ word, originalIndex: idx }));
    let shuffled = shuffleArray(indexed);
    while (shuffled.map(w => w.word).join(' ') === words.join(' ') && words.length > 1) {
      shuffled = shuffleArray(indexed);
    }
    setAvailableWords(shuffled);
    setSelectedWords([]);
  };

  const handleSubmit = useCallback(() => {
    if (!currentStudentId) return;
    const answer = selectedWords.map(w => w.word).join(' ');
    const isCorrect = isAnswerCorrect(answer, original, sentenceAlternatives[original] ?? []);

    studentResultRef.current = isCorrect ? 'correct' : 'incorrect';
    setSubmitted(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    onScore(currentStudentId, {
      isCorrect,
      points: isCorrect ? 10 : 0,
      responseData: { answer, expected: original },
    });
  }, [currentStudentId, selectedWords, original, sentenceAlternatives, onScore]);

  const handleNext = () => {
    setSentenceIndex((i) => i + 1);
    setRoundNo((n) => n + 1);
  };

  // Everyone solved it: no need to wait for the clock.
  useEffect(() => {
    if (isSimultaneous && raceActive && !raceFinished && students.length > 0 && raceSolvers.length >= students.length) endRace();
  }, [isSimultaneous, raceActive, raceFinished, raceSolvers.length, students.length, endRace]);

  // The most common wrong order (anonymous) — a teaching moment at the reveal.
  const commonSlip = useMemo(() => {
    const solvedIds = new Set(raceSolvers.map((sv) => sv.clientId));
    const counts = new Map<string, number>();
    Object.keys(attempts).forEach((id) => {
      if (solvedIds.has(id)) return;
      const a = attempts[id].last;
      counts.set(a, (counts.get(a) ?? 0) + 1);
    });
    let best: { answer: string; n: number } | null = null;
    counts.forEach((n, answer) => { if (!best || n > best.n) best = { answer, n }; });
    return best as { answer: string; n: number } | null;
  }, [attempts, raceSolvers]);

  const handleReveal = () => setRevealed(true);

  // --- Simultaneous mode handlers ---
  const handleStartRace = () => {
    setExtraSeconds(0);
    startRace();
    setRaceSolvers([]);
  };

  const handleEndRace = () => {
    endRace();
  };

  const allWordsSelected = availableWords.length === 0;

  // ============ RENDER ============

  // Loading state
  if (loadingSentences && sentenceIndex === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <GenerationLoader label="sentences" />
      </div>
    );
  }

  // --- Simultaneous Race Mode ---
  if (isSimultaneous) {
    const total = (sessionSettings.timerSeconds + extraSeconds) || 1;
    // Same keys in both orders, so the tiles glide into the right sentence at the reveal.
    const tiles = raceFinished ? [...availableWords].sort((a, b) => a.originalIndex - b.originalIndex) : availableWords;
    const slipWords = commonSlip ? commonSlip.answer.split(' ') : [];
    const stillTrying = Object.keys(attempts).filter((id) => !raceSolvers.some((sv) => sv.clientId === id)).length;

    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="cyan">Sentence Scramble · sentence {roundNo}</KitLabel>
          {(raceActive || raceFinished) && <KitReadout>{raceSolvers.length} / {students.length} solved</KitReadout>}
        </div>

        {!raceActive && !raceFinished && (
          <div className="space-y-5 py-6 text-center">
            <p className="font-display text-5xl">Unscramble the sentence.</p>
            <p className="mx-auto max-w-xl text-lg text-white/70">The words appear here and on every phone. Tap them into the right order. The fastest correct answers score most, and wrong orders can try again.</p>
            <div className="flex justify-center">
              <KitButton tone="cyan" solid onClick={handleStartRace} className="!px-8 !py-3 !text-base" icon={<Shuffle className="h-4 w-4" />}>Start the race</KitButton>
            </div>
          </div>
        )}

        {(raceActive || raceFinished) && (
          <div className={`rounded-[1.75rem] border px-6 py-8 ${raceFinished ? 'border-emerald-300/40 bg-emerald-400/[0.06]' : 'border-white/12 bg-slate-950/45'}`}>
            <div className="flex flex-wrap justify-center gap-2.5">
              {tiles.map((w, i) => (
                <motion.span
                  key={`tile-${w.originalIndex}`}
                  layout
                  transition={{ type: 'spring', stiffness: 170, damping: 20, delay: raceFinished ? i * 0.04 : 0 }}
                  className={`rounded-xl border px-4 py-2 font-display text-3xl ${
                    raceFinished ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-50'
                      : hintShown && w.originalIndex === 0 ? 'border-amber-300 bg-amber-300/20 text-amber-50'
                      : 'border-white/15 bg-white/[0.06]'
                  }`}
                >
                  {w.word}
                </motion.span>
              ))}
            </div>
            {hintShown && !raceFinished && <p className="mt-4 text-center text-sm text-amber-200"><Lightbulb className="mr-1 inline h-3.5 w-3.5" />The sentence starts with the highlighted word</p>}
          </div>
        )}

        {raceActive && !raceFinished && (
          <>
            <div className="flex items-center gap-4">
              <Clock className={`h-5 w-5 ${timeRemaining <= 10 ? 'text-rose-300' : 'text-white/60'}`} />
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div className={`h-full ${timeRemaining <= 10 ? 'bg-rose-400' : 'bg-cyan-400'}`} animate={{ width: `${Math.max(0, Math.min(100, (timeRemaining / total) * 100))}%` }} transition={{ ease: 'linear', duration: 1 }} />
              </div>
              <span className={`w-14 text-right font-mono text-2xl ${timeRemaining <= 10 ? 'text-rose-300' : ''}`}>{timeRemaining}s</span>
              <KitButton onClick={() => { addTime(30); setExtraSeconds((seconds) => seconds + 30); }}>+30s</KitButton>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AnimatePresence>
                {raceSolvers.map((sv) => (
                  <motion.span key={sv.studentId} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-100">
                    <Check className="h-3.5 w-3.5" />{sv.displayName}
                  </motion.span>
                ))}
              </AnimatePresence>
              {stillTrying > 0 && <KitReadout>{stillTrying} trying again</KitReadout>}
              {raceSolvers.length === 0 && stillTrying === 0 && <p className="text-sm text-white/45">Waiting for answers on phones…</p>}
            </div>
            <div className="flex justify-between">
              <KitButton tone="amber" disabled={hintShown} onClick={() => setHintShown(true)} icon={<Lightbulb className="h-3.5 w-3.5" />}>Show first word</KitButton>
              <KitButton onClick={handleEndRace}>End early</KitButton>
            </div>
          </>
        )}

        {raceFinished && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-4">
            {commonSlip && (
              <div className="rounded-2xl border border-rose-300/30 bg-slate-950/45 p-4">
                <KitLabel tone="rose">Common slip{commonSlip.n > 1 ? ` · ${commonSlip.n} students` : ''}</KitLabel>
                <p className="mt-2 flex flex-wrap gap-1.5 font-display text-2xl">
                  {slipWords.map((w, i) => (
                    <span key={i} className={w === words[i] ? 'text-white/60' : 'rounded-md bg-rose-400/20 px-1 text-rose-200'}>{w}</span>
                  ))}
                </p>
              </div>
            )}
            {raceSolvers.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {raceSolvers.map((sv) => (
                  <span key={sv.studentId} className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-base ${sv.position === 1 ? 'border-amber-300/50 bg-amber-300/10' : 'border-white/12 bg-white/[0.04]'}`}>
                    {sv.position === 1 ? <Trophy className="h-4 w-4 text-amber-300" /> : <span className="font-mono text-xs text-white/50">#{sv.position}</span>}
                    {sv.displayName}
                    <span className="font-mono text-xs text-emerald-300">+{sv.points}</span>
                  </span>
                ))}
              </div>
            )}
            {raceSolvers.length === 0 && <p className="text-center text-white/60">Nobody got it this time. Talk through the order together.</p>}
            <div className="flex justify-center">
              {isMicroEvent ? (
                <KitReadout>Round complete · advance the flight to continue</KitReadout>
              ) : (
                <KitButton tone="cyan" solid onClick={handleNext} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>Next sentence</KitButton>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // --- Turn-based Mode (original) ---
  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-center">
        <p className="opacity-70 text-sm">Tap words to build the sentence in correct order</p>
        {currentStudent && (
          <p className="text-lg font-semibold text-cyan-400 mt-1">
            {currentStudent.name}&apos;s turn
          </p>
        )}
      </div>

      {/* Answer area - selected words */}
      <div className={`min-h-[60px] p-4 rounded-xl glass ${
        submitted
          ? feedback === 'correct'
            ? 'border-2 border-green-500/50'
            : 'border-2 border-red-500/50'
          : 'border border-white/10'
      }`}>
        <div className="flex flex-wrap gap-2 justify-center">
          <AnimatePresence mode="popLayout">
            {selectedWords.length === 0 ? (
              <p className="opacity-40 text-sm">Tap words below to build your answer...</p>
            ) : (
              selectedWords.map((wordItem) => (
                <motion.button
                  key={`selected-${wordItem.originalIndex}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => handleDeselectWord(wordItem)}
                  disabled={submitted}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    submitted
                      ? feedback === 'correct'
                        ? 'bg-green-500/30 text-green-300'
                        : 'bg-red-500/30 text-red-300'
                      : 'bg-cyan-500 text-white hover:bg-cyan-600'
                  }`}
                >
                  {wordItem.word}
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[60px] p-4">
        <AnimatePresence mode="popLayout">
          {availableWords.map((wordItem) => (
            <motion.button
              key={`available-${wordItem.originalIndex}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => handleSelectWord(wordItem)}
              disabled={submitted}
              className="px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/10 transition-colors"
            >
              {wordItem.word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Feedback */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {feedback === 'correct' ? (
            <div className="glass rounded-2xl px-6 py-4 border border-emerald-500/30 bg-emerald-500/10 space-y-1">
              <p className="text-emerald-400 font-game text-xl">CORRECT!</p>
              {currentStudent && (
                <p className="text-white font-semibold text-lg">{currentStudent.name}</p>
              )}
              <p className="text-emerald-300 font-game text-base">+10 points</p>
            </div>
          ) : (
            <div>
              <p className="text-red-400 font-game text-lg">NOT QUITE!</p>
              {revealed && (
                <p className="opacity-70 text-sm mt-1">Answer: {original}</p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!currentStudentId && (
          <button
            onClick={onPickStudent}
            className="px-8 py-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-lg shadow-xl hover:scale-105 active:scale-95 transition-all text-white"
          >
            PICK STUDENT
          </button>
        )}
        {currentStudentId && !submitted && (
          <>
            <button
              onClick={handleReset}
              disabled={selectedWords.length === 0}
              className="px-6 py-3 glass rounded-xl font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-30"
            >
              RESET
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allWordsSelected}
              className="px-8 py-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl font-game text-lg shadow-xl hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30 disabled:hover:scale-100"
            >
              CHECK
            </button>
          </>
        )}
        {submitted && !revealed && feedback === 'wrong' && (
          <button
            onClick={handleReveal}
            className="px-6 py-3 glass rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
          >
            REVEAL
          </button>
        )}
        {submitted && (
          isMicroEvent ? (
            <div className="glass p-4 rounded-xl text-center">
              <p className="text-sm text-emerald-400 font-bold">Round complete</p>
              <p className="text-xs opacity-50 mt-1">Advance the flight to continue.</p>
            </div>
          ) : (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-white text-slate-900 rounded-xl font-game text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              NEXT
            </button>
          )
        )}
      </div>
    </div>
  );
}
