'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from '../types';
import { GameStatus, ENGLISH_FACTS } from './types';
import type { GameSentence, EvaluationResult } from './types';

export function VocabSprintGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState<number>(sessionSettings.timerSeconds);

  // Prefetching logic
  const [sentenceQueue, setSentenceQueue] = useState<GameSentence[]>([]);
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const [currentFact, setCurrentFact] = useState(ENGLISH_FACTS[0]);

  const [currentSentence, setCurrentSentence] = useState<GameSentence | null>(null);
  const [replacementInput, setReplacementInput] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Keep a ref to current sentence for the submission handler
  const currentSentenceRef = useRef<GameSentence | null>(null);
  currentSentenceRef.current = currentSentence;

  // Register input spec for student controller
  useEffect(() => {
    if (status === GameStatus.RUNNING && currentSentence) {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'vocab-sprint',
        prompt: `Replace the weak word "${currentSentence.weakWord}" with a stronger word`,
        placeholder: 'Type an upgrade word...',
        maxLength: 50,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentSentence, onSetInputSpec]);

  // Register submission handler to evaluate remote submissions
  useEffect(() => {
    onRegisterSubmissionHandler?.({
      handleSubmission: async (content: string) => {
        const sentence = currentSentenceRef.current;
        if (!sentence) {
          return { isCorrect: false, points: 1, feedback: 'No active challenge' };
        }

        try {
          const response = await fetch('/api/vocab-sprint/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originalSentence: sentence.sentence,
              weakWord: sentence.weakWord,
              replacement: content.trim(),
              difficulty: sessionSettings.difficulty
            })
          });

          if (!response.ok) throw new Error('Evaluation failed');

          const result: EvaluationResult = await response.json();

          // Update the game UI with the result
          setReplacementInput(content.trim());
          setEvaluation(result);
          setStatus(GameStatus.FINISHED);

          return {
            isCorrect: result.score >= 5,
            points: result.score,
            feedback: result.comment,
          };
        } catch {
          return { isCorrect: false, points: 1, feedback: 'Evaluation error' };
        }
      }
    });

    return () => onRegisterSubmissionHandler?.(null);
  }, [sessionSettings.difficulty, onRegisterSubmissionHandler]);

  // Track previous student to detect changes
  const prevStudentRef = useRef<string | null>(null);

  // Clear queue when settings change
  useEffect(() => {
    setSentenceQueue([]);
  }, [sessionSettings.difficulty, sessionSettings.topic, sessionSettings.tone]);

  // When student changes and we have sentences ready, auto-continue (don't reset to IDLE)
  useEffect(() => {
    if (currentStudentId && prevStudentRef.current !== currentStudentId) {
      prevStudentRef.current = currentStudentId;

      // If we have sentences ready and were in IDLE or FINISHED, prepare for next round
      // The actual start will happen when user clicks or after spin completes
      if (status === GameStatus.FINISHED) {
        // Reset UI state but keep the queue
        setShowSuggestions(false);
        setShowHint(false);
        setReplacementInput('');
        setEvaluation(null);
      }
    }
  }, [currentStudentId, status]);

  // Fetch batch of sentences
  const fetchBatch = useCallback(async (isInitial: boolean = false) => {
    if (isFetchingBatch) return;
    setIsFetchingBatch(true);
    if (isInitial) {
      setCurrentFact(ENGLISH_FACTS[Math.floor(Math.random() * ENGLISH_FACTS.length)]);
      setStatus(GameStatus.GENERATING);
    }

    try {
      const response = await fetch('/api/vocab-sprint/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: sessionSettings.difficulty,
          topic: sessionSettings.topic,
          tone: sessionSettings.tone
        })
      });

      if (!response.ok) throw new Error('Failed to fetch sentences');

      const data = await response.json();
      setSentenceQueue(prev => [...prev, ...data.sentences]);
      if (isInitial) setStatus(GameStatus.IDLE);
    } catch (e) {
      console.error('Batch fetch failed', e);
      if (isInitial) setStatus(GameStatus.IDLE);
    } finally {
      setIsFetchingBatch(false);
    }
  }, [sessionSettings.difficulty, sessionSettings.topic, sessionSettings.tone, isFetchingBatch]);

  // Start a sprint round
  const startSprint = async () => {
    if (!currentStudentId) {
      onPickStudent();
      return;
    }

    setShowSuggestions(false);
    setShowHint(false);
    setReplacementInput('');
    setEvaluation(null);

    if (sentenceQueue.length > 0) {
      const next = sentenceQueue[0];
      setSentenceQueue(prev => prev.slice(1));
      setCurrentSentence(next);
      setTimeLeft(sessionSettings.timerSeconds);
      setStatus(GameStatus.RUNNING);

      // Background replenishment if queue is getting low
      if (sentenceQueue.length < 3) {
        fetchBatch();
      }
    } else {
      // Emergency fetch if queue is empty
      setCurrentFact(ENGLISH_FACTS[Math.floor(Math.random() * ENGLISH_FACTS.length)]);
      setStatus(GameStatus.GENERATING);
      try {
        const response = await fetch('/api/vocab-sprint/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            difficulty: sessionSettings.difficulty,
            topic: sessionSettings.topic,
            tone: sessionSettings.tone
          })
        });

        if (!response.ok) throw new Error('Failed to fetch sentences');

        const data = await response.json();
        if (data.sentences && data.sentences.length > 0) {
          const next = data.sentences[0];
          setSentenceQueue(data.sentences.slice(1));
          setCurrentSentence(next);
          setTimeLeft(sessionSettings.timerSeconds);
          setStatus(GameStatus.RUNNING);
        } else {
          setStatus(GameStatus.IDLE);
        }
      } catch (e) {
        console.error('Emergency fetch failed', e);
        setStatus(GameStatus.IDLE);
      }
    }
  };

  // Retry same sentence
  const tryAgain = () => {
    if (!currentSentence) return;
    setShowSuggestions(false);
    setShowHint(false);
    setTimeLeft(sessionSettings.timerSeconds);
    setReplacementInput('');
    setEvaluation(null);
    setStatus(GameStatus.RUNNING);
  };

  // Submit for evaluation
  const submitEvaluation = async () => {
    if (!currentSentence || !replacementInput.trim() || !currentStudentId) return;
    setStatus(GameStatus.EVALUATING);

    try {
      const response = await fetch('/api/vocab-sprint/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSentence: currentSentence.sentence,
          weakWord: currentSentence.weakWord,
          replacement: replacementInput.trim(),
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate');

      const result: EvaluationResult = await response.json();
      setEvaluation(result);

      // Wire score into per-student leaderboard
      // Always use the AI score (1-10) as points - let the spin wheel modifier apply to it
      const points = result.score;
      const isCorrect = result.score >= 5; // 5+ is considered a good answer
      onScore(currentStudentId, {
        isCorrect,
        points,
        responseData: {
          replacement: replacementInput,
          score: result.score,
          comment: result.comment,
          suggestions: result.suggestions,
          isValid: result.isValid
        }
      });

      setStatus(GameStatus.FINISHED);
    } catch (error) {
      console.error('Evaluation failed', error);
      setStatus(GameStatus.FINISHED);
    }
  };

  // Timer effect
  useEffect(() => {
    if (status === GameStatus.RUNNING && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && status === GameStatus.RUNNING) {
      setStatus(GameStatus.TIME_UP);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft]);

  // Focus input when running
  useEffect(() => {
    if (status === GameStatus.RUNNING && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  // Render sentence with highlighted weak word
  const renderSentence = () => {
    if (!currentSentence) return null;
    const parts = currentSentence.sentence.split(new RegExp(`(${currentSentence.weakWord})`, 'gi'));
    return (
      <div className="text-2xl md:text-4xl font-semibold leading-tight text-center px-2">
        {parts.map((part, i) => (
          part.toLowerCase() === currentSentence.weakWord.toLowerCase() ? (
            <span key={i} className="text-yellow-400 underline decoration-yellow-400 underline-offset-4 decoration-2 bg-yellow-400/10 px-1 rounded-md">
              {part}
            </span>
          ) : <span key={i}>{part}</span>
        ))}
      </div>
    );
  };

  const getScoreColor = (s: number) => {
    if (s >= 8) return 'bg-cyan-500';
    if (s >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header with student and prefetch indicator */}
      <div className="flex justify-between items-center">
        <div>
          {currentStudent && (
            <p className="text-lg font-semibold text-cyan-400">
              {currentStudent.name}&apos;s turn
            </p>
          )}
          {!currentStudentId && (
            <p className="opacity-70 text-sm">Pick a student to start</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFetchingBatch && (
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" title="Pre-loading sentences..." />
          )}
          <span className="text-xs opacity-40">
            {sentenceQueue.length} ready
          </span>
        </div>
      </div>

      {/* IDLE State */}
      {status === GameStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="mb-6">
            <p className="text-xl mb-1 opacity-90 font-bold italic tracking-tight">Level Up Your Vocabulary</p>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">
              Mode: {sessionSettings.topic} / {sessionSettings.difficulty}
            </p>
          </div>

          {!currentStudentId ? (
            <button
              onClick={onPickStudent}
              className="px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              PICK STUDENT
            </button>
          ) : (
            <button
              onClick={startSprint}
              className="px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              {sentenceQueue.length > 0 ? 'START ROUND' : 'LOAD SPRINT'}
            </button>
          )}
        </motion.div>
      )}

      {/* GENERATING State */}
      {status === GameStatus.GENERATING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6 py-8 max-w-2xl mx-auto text-center"
        >
          <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
          <div className="space-y-4">
            <p className="font-game text-xl text-cyan-400 uppercase tracking-widest animate-pulse">
              Pre-fetching Sentences...
            </p>
            <div className="glass p-6 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 block mb-2">Did you know?</span>
              <p className="text-lg font-semibold italic text-slate-300">&quot;{currentFact}&quot;</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* RUNNING / TIME_UP / EVALUATING / FINISHED States */}
      {(status === GameStatus.RUNNING || status === GameStatus.TIME_UP || status === GameStatus.EVALUATING || status === GameStatus.FINISHED) && (
        <div className="space-y-6">
          {/* Timer */}
          <div className={`text-7xl font-game text-center transition-all ${
            timeLeft <= 5 && status === GameStatus.RUNNING
              ? 'text-red-500 animate-pulse'
              : 'text-white'
          }`}>
            {timeLeft}s
          </div>

          {/* Sentence Card */}
          <div className="glass p-6 md:p-8 rounded-[2rem] shadow-xl border-2 border-white/10 relative overflow-hidden">
            {renderSentence()}
            <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3 gap-2 opacity-50 text-[8px] font-black uppercase tracking-widest">
              <div className="flex gap-2">
                <span>{sessionSettings.difficulty}</span>
                <span>{sessionSettings.topic}</span>
              </div>
              <p>Replace the highlighted word</p>
            </div>
          </div>

          {/* Input Area */}
          {(status === GameStatus.RUNNING || status === GameStatus.TIME_UP) && (
            <div className="flex flex-col gap-3 relative">
              {/* Hint Tooltip */}
              <AnimatePresence>
                {showHint && currentSentence && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap z-10"
                  >
                    {currentSentence.hint}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={replacementInput}
                  onChange={(e) => setReplacementInput(e.target.value)}
                  placeholder="Upgrade word..."
                  autoFocus
                  className="flex-grow bg-black/40 border-2 border-white/10 p-4 rounded-2xl text-2xl font-bold focus:border-cyan-500 outline-none text-center"
                  onKeyDown={(e) => e.key === 'Enter' && submitEvaluation()}
                />
                <button
                  onClick={() => setShowHint(!showHint)}
                  className={`px-4 rounded-2xl border-2 transition-all ${
                    showHint
                      ? 'bg-yellow-500 border-yellow-500 text-black'
                      : 'border-white/10 hover:border-yellow-500 text-yellow-500'
                  }`}
                  title="Get a hint"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
              </div>

              <button
                onClick={submitEvaluation}
                disabled={!replacementInput.trim()}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-game text-xl hover:translate-y-[-2px] active:scale-95 transition-all text-white shadow-lg disabled:opacity-30 disabled:hover:translate-y-0"
              >
                SUBMIT WORD
              </button>
            </div>
          )}

          {/* Evaluating State */}
          {status === GameStatus.EVALUATING && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="font-game text-lg text-yellow-400 animate-pulse">SCORING...</p>
            </div>
          )}

          {/* Finished State */}
          {status === GameStatus.FINISHED && evaluation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 rounded-[2rem] border-2 border-white/10 shadow-xl flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-6 w-full">
                <div className={`w-24 h-24 flex flex-col items-center justify-center rounded-2xl font-game shadow-lg shrink-0 ${getScoreColor(evaluation.score)}`}>
                  <span className="text-[10px] -mb-1 opacity-60">SCORE</span>
                  <span className="text-4xl font-black">{evaluation.score}</span>
                </div>
                <div className="text-left flex-grow">
                  <p className="text-3xl font-black leading-none mb-2 tracking-tight">
                    {replacementInput.toUpperCase()}
                  </p>
                  <div className="text-sm italic font-bold text-cyan-300 bg-black/30 p-3 rounded-lg">
                    &quot;{evaluation.comment}&quot;
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="w-full bg-white/5 p-4 rounded-xl border border-white/5">
                {!showSuggestions ? (
                  <button
                    onClick={() => setShowSuggestions(true)}
                    className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-game text-xs rounded-lg transition-all border border-yellow-500/20"
                  >
                    REVEAL PRO UPGRADES
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-center text-[8px] font-black uppercase tracking-widest opacity-40 mb-3">
                      Elite Level Suggestions
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {evaluation.suggestions.map((w, i) => (
                        <span key={i} className="px-3 py-1 bg-black/50 text-white rounded-md text-sm font-bold border border-white/5">
                          {w}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={tryAgain}
                  className="flex-1 py-3 glass hover:bg-white/10 rounded-xl font-game text-xs transition-all border border-white/10"
                >
                  RETRY
                </button>
                <button
                  onClick={startSprint}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-game text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  NEXT SENTENCE
                </button>
                <button
                  onClick={() => {
                    // Reset for next student, then pick
                    setStatus(GameStatus.IDLE);
                    setCurrentSentence(null);
                    setEvaluation(null);
                    onPickStudent();
                  }}
                  className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-game text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  PICK NEXT
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
