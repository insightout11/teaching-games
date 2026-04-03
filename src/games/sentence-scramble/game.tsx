'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { useRaceMode } from '@/hooks/use-race-mode';
import { getEffectiveTopic } from '@/stores/session-store';

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
  displayName: string;
  timestamp: number;
  points: number;
  position: number;
}

export function SentenceScrambleGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterRemoteVoteHandler }: GameProps) {
  const [sentences, setSentences] = useState<string[]>(FALLBACK_SENTENCES);
  const [loadingSentences, setLoadingSentences] = useState(true);
  const fetchedRef = useRef<string>('');

  // Fetch AI-generated sentences on mount / when topic or difficulty changes
  useEffect(() => {
    const effectiveTopic = getEffectiveTopic(sessionSettings);
    const key = `${effectiveTopic}-${sessionSettings.difficulty}`;
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
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled && Array.isArray(data.sentences) && data.sentences.length > 0) {
          setSentences(data.sentences);
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
  }, [sessionSettings.topic, sessionSettings.customTopic, sessionSettings.difficulty]);

  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Simultaneous race mode state
  const { isSimultaneous, raceActive, raceFinished, timeRemaining, startRace, endRace, resetRace, addTime } = useRaceMode({
    studentCount: students.length,
    timerSeconds: sessionSettings.timerSeconds,
  });
  const [raceSolvers, setRaceSolvers] = useState<RaceSolver[]>([]);

  const original = sentences[sentenceIndex % sentences.length];
  const words = useMemo(() => tokenize(original), [original]);

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
    resetRace();
    setRaceSolvers([]);
  }, [sentenceIndex, words, resetRace]);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Register input spec for student controller
  useEffect(() => {
    if (isSimultaneous) {
      // In simultaneous mode, broadcast when race is active
      if (raceActive && !raceFinished && availableWords.length > 0) {
        onSetInputSpec?.({
          type: 'sequence',
          gameKey: 'sentence-scramble',
          prompt: 'Arrange the words in the correct order — race!',
          options: availableWords.map(w => w.word),
        });
      } else {
        onSetInputSpec?.(null);
      }
    } else {
      // Turn-based: only show to current student
      if (!submitted && availableWords.length > 0) {
        onSetInputSpec?.({
          type: 'sequence',
          gameKey: 'sentence-scramble',
          prompt: 'Tap words to build the sentence in correct order',
          options: availableWords.map(w => w.word),
        });
      } else {
        onSetInputSpec?.(null);
      }
    }
  }, [isSimultaneous, raceActive, raceFinished, submitted, availableWords, onSetInputSpec]);

  // Handle remote submissions in simultaneous race mode
  const handleRaceSubmission = useCallback((vote: GameRemoteVote) => {
    if (raceFinished) return;

    try {
      const orderedWords: string[] = JSON.parse(vote.choice);
      const isCorrect = orderedWords.join(' ') === words.join(' ');

      if (!isCorrect) return; // Only track correct solvers

      const studentId = vote.studentId || vote.clientId;
      if (!studentId) return;

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

        try {
          const audio = new Audio('/sounds/correct.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}

        return [...prev, {
          studentId,
          displayName: vote.displayName,
          timestamp: Date.now(),
          points,
          position,
        }];
      });
    } catch {
      // Invalid JSON, ignore
    }
  }, [words, raceFinished, onScore]);

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
            const isCorrect = orderedWords.join(' ') === words.join(' ');
            setSelectedWords(mapped);
            setAvailableWords([]);
            setSubmitted(true);
            setFeedback(isCorrect ? 'correct' : 'wrong');

            try {
              const audio = new Audio(isCorrect ? '/sounds/correct.mp3' : '/sounds/wrong.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch {}

            onScore(studentId, {
              isCorrect,
              points: isCorrect ? 10 : 0,
              responseData: { answer: orderedWords.join(' '), expected: words.join(' ') },
            });
          }
        } catch {
          // Invalid JSON, ignore
        }
      });
    }

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [isSimultaneous, submitted, availableWords, words, onRegisterRemoteVoteHandler, handleRaceSubmission, onScore]);

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
    const expected = words.join(' ');
    const isCorrect = answer === expected;

    setSubmitted(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    try {
      const audio = new Audio(isCorrect ? '/sounds/correct.mp3' : '/sounds/wrong.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}

    onScore(currentStudentId, {
      isCorrect,
      points: isCorrect ? 10 : 0,
      responseData: { answer, expected },
    });
  }, [currentStudentId, selectedWords, words, onScore]);

  const handleNext = () => {
    setSentenceIndex((i) => i + 1);
  };

  const handleReveal = () => setRevealed(true);

  // --- Simultaneous mode handlers ---
  const handleStartRace = () => {
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
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Generating sentences...</p>
      </div>
    );
  }

  // --- Simultaneous Race Mode ---
  if (isSimultaneous) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="opacity-70 text-sm">Everyone races to arrange the sentence!</p>
          <p className="text-xs text-cyan-400 mt-1">{students.length} students connected</p>
        </div>

        {/* Timer (during race) */}
        {raceActive && !raceFinished && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`px-4 py-2 rounded-xl font-game text-2xl ${timeRemaining <= 10 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}`}>
                {timeRemaining}s
              </div>
              <button
                onClick={() => addTime(30)}
                className="px-3 py-1.5 rounded-lg text-sm font-game bg-white/10 hover:bg-white/20 text-slate-300 transition-all border border-white/10"
              >
                +30s
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase">Solved</p>
              <p className="text-2xl font-bold text-emerald-400">{raceSolvers.length}<span className="text-sm opacity-60">/{students.length}</span></p>
            </div>
          </div>
        )}

        {/* Sentence display (teacher sees the scrambled words on screen) */}
        {(raceActive || raceFinished) && (
          <div className="glass p-6 rounded-2xl border-2 border-cyan-500/30">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">Scrambled Sentence</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {availableWords.map((wordItem) => (
                <span
                  key={`word-${wordItem.originalIndex}`}
                  className="px-4 py-2 rounded-xl text-sm font-medium glass border border-white/10"
                >
                  {wordItem.word}
                </span>
              ))}
            </div>
            {raceFinished && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Correct Answer</p>
                <p className="text-lg text-white font-medium">{original}</p>
              </div>
            )}
          </div>
        )}

        {/* Sealed solver feed during race — name + checkmark only */}
        {raceActive && !raceFinished && raceSolvers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {raceSolvers.length} of {students.length} submitted
            </p>
            <AnimatePresence>
              {raceSolvers.map((solver) => (
                <motion.div
                  key={solver.studentId}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <span className="font-semibold text-white">{solver.displayName}</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Revealed solver feed after race — positions + points */}
        {raceFinished && raceSolvers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Results</p>
            <AnimatePresence>
              {raceSolvers.map((solver) => (
                <motion.div
                  key={solver.studentId}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                    solver.position === 1
                      ? 'bg-yellow-500/20 border border-yellow-500/30'
                      : solver.position === 2
                      ? 'bg-slate-400/10 border border-slate-400/20'
                      : solver.position === 3
                      ? 'bg-amber-700/20 border border-amber-700/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-black ${
                      solver.position === 1 ? 'text-yellow-400' :
                      solver.position === 2 ? 'text-slate-300' :
                      solver.position === 3 ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                      #{solver.position}
                    </span>
                    <span className="font-semibold text-white">{solver.displayName}</span>
                  </div>
                  <span className="font-game text-emerald-400">+{solver.points}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Race finished summary */}
        {raceFinished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center glass p-6 rounded-2xl border border-white/10"
          >
            <p className="font-game text-xl text-white mb-2">
              {raceSolvers.length === 0 ? 'TIME\'S UP!' : 'ROUND COMPLETE!'}
            </p>
            <p className="text-slate-400">
              {raceSolvers.length} of {students.length} students solved it
            </p>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          {!raceActive && !raceFinished && (
            <button
              onClick={handleStartRace}
              className="px-8 py-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-lg shadow-xl hover:scale-105 active:scale-95 transition-all text-white"
            >
              START RACE
            </button>
          )}
          {raceActive && !raceFinished && (
            <button
              onClick={handleEndRace}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-game text-sm transition-all border border-white/10"
            >
              END EARLY
            </button>
          )}
          {raceFinished && (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-white text-slate-900 rounded-xl font-game text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              NEXT SENTENCE
            </button>
          )}
        </div>
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
            <p className="text-green-400 font-game text-lg">CORRECT! +10 points</p>
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
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-white text-slate-900 rounded-xl font-game text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            NEXT
          </button>
        )}
      </div>
    </div>
  );
}
