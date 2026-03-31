'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { GameStatus, ENGLISH_FACTS } from './types';
import type { GameSentence, EvaluationResult } from './types';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';

const EMPTY_SEEN: string[] = [];

interface RaceSolver {
  studentId: string;
  displayName: string;
  replacement: string;
  score: number;
  comment: string;
  suggestions: string[];
  isValid: boolean;
  position: number;
}

export function VocabSprintGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler, onRegisterRemoteVoteHandler }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState<number>(sessionSettings.timerSeconds);

  // Repetition tracking — read from store but keep refs to avoid stale closures in callbacks
  const addSeenItems = useSessionStore((s) => s.addSeenItems);
  const addSeenCacheId = useSessionStore((s) => s.addSeenCacheId);
  const storeSeenItems = useSessionStore((s) => s.seenItemsByGame['vocab-sprint']) ?? EMPTY_SEEN;
  const storeSeenCacheIds = useSessionStore((s) => s.seenCacheIds);
  const seenItemsRef = useRef<string[]>([]);
  const seenCacheIdsRef = useRef<string[]>([]);
  useEffect(() => { seenItemsRef.current = storeSeenItems; }, [storeSeenItems]);
  useEffect(() => { seenCacheIdsRef.current = storeSeenCacheIds; }, [storeSeenCacheIds]);

  // Prefetching logic
  const [sentenceQueue, setSentenceQueue] = useState<GameSentence[]>([]);
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const [currentFact, setCurrentFact] = useState(ENGLISH_FACTS[0]);

  const [currentSentence, setCurrentSentence] = useState<GameSentence | null>(null);
  const [replacementInput, setReplacementInput] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Simultaneous race mode
  const isSimultaneous = students.length >= 2;
  const [raceSolvers, setRaceSolvers] = useState<RaceSolver[]>([]);
  const [raceFinished, setRaceFinished] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(-1);
  const [reviewShowSuggestions, setReviewShowSuggestions] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Keep refs for handlers
  const currentSentenceRef = useRef<GameSentence | null>(null);
  currentSentenceRef.current = currentSentence;
  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;
  const raceFinishedRef = useRef(false);
  raceFinishedRef.current = raceFinished;

  // Register input spec for student controller
  useEffect(() => {
    if (isSimultaneous) {
      if (status === GameStatus.RUNNING && currentSentence && !raceFinished) {
        onSetInputSpec?.({
          type: 'text',
          gameKey: 'vocab-sprint',
          prompt: `Replace the weak word "${currentSentence.weakWord}" with a stronger word — race!`,
          placeholder: 'Type an upgrade word...',
          maxLength: 50,
        });
      } else {
        onSetInputSpec?.(null);
      }
    } else {
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
    }
  }, [isSimultaneous, status, currentSentence, raceFinished, onSetInputSpec]);

  // Track in-flight evaluate calls to prevent duplicate concurrent requests for the same student
  const inFlightRef = useRef(new Set<string>());

  // Handle race submissions from remote students
  const handleRaceSubmission = useCallback(async (vote: GameRemoteVote) => {
    if (raceFinishedRef.current) return;
    if (statusRef.current !== GameStatus.RUNNING) return;

    const sentence = currentSentenceRef.current;
    if (!sentence) return;

    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    const replacement = vote.choice?.trim();
    if (!replacement) return;

    // Prevent duplicate concurrent evaluate calls for the same student
    if (inFlightRef.current.has(studentId)) return;
    inFlightRef.current.add(studentId);

    let result: EvaluationResult;
    try {
      const response = await fetch('/api/vocab-sprint/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSentence: sentence.sentence,
          weakWord: sentence.weakWord,
          replacement,
          difficulty: sessionSettings.difficulty,
        }),
      });

      if (!response.ok) {
        console.warn('[VocabSprint] evaluate API returned', response.status, '— using fallback score');
        result = { score: 5, comment: '✓', isValid: true, suggestions: [] };
      } else {
        result = await response.json() as EvaluationResult;
      }
    } catch (err) {
      console.warn('[VocabSprint] evaluate API failed:', err, '— using fallback score');
      result = { score: 5, comment: '✓', isValid: true, suggestions: [] };
    } finally {
      inFlightRef.current.delete(studentId);
    }

    setRaceSolvers(prev => {
      if (prev.some(s => s.studentId === studentId)) return prev;

      const position = prev.length + 1;

      onScore(studentId, {
        isCorrect: result.score >= 5,
        points: result.score,
        responseData: {
          replacement,
          score: result.score,
          comment: result.comment,
          position,
        },
      });

      try {
        const audio = new Audio(result.score >= 5 ? '/sounds/correct.mp3' : '/sounds/wrong.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}

      return [...prev, {
        studentId,
        displayName: vote.displayName,
        replacement,
        score: result.score,
        comment: result.comment,
        suggestions: result.suggestions || [],
        isValid: result.isValid ?? (result.score >= 5),
        position,
      }];
    });
  }, [sessionSettings.difficulty, onScore]);

  // Register remote vote handler
  useEffect(() => {
    if (isSimultaneous) {
      onRegisterRemoteVoteHandler?.(handleRaceSubmission);
    } else {
      onRegisterRemoteVoteHandler?.(null);
    }
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [isSimultaneous, onRegisterRemoteVoteHandler, handleRaceSubmission]);

  // Register submission handler (turn-based fallback)
  useEffect(() => {
    if (isSimultaneous) return;

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
  }, [isSimultaneous, sessionSettings.difficulty, onRegisterSubmissionHandler]);

  // Track previous student to detect changes
  const prevStudentRef = useRef<string | null>(null);

  // Clear queue when settings change
  useEffect(() => {
    setSentenceQueue([]);
  }, [sessionSettings.difficulty, sessionSettings.topic, sessionSettings.customTopic, sessionSettings.tone]);

  // When student changes (turn-based only)
  useEffect(() => {
    if (isSimultaneous) return;
    if (currentStudentId && prevStudentRef.current !== currentStudentId) {
      prevStudentRef.current = currentStudentId;
      if (status === GameStatus.FINISHED) {
        setShowSuggestions(false);
        setShowHint(false);
        setReplacementInput('');
        setEvaluation(null);
      }
    }
  }, [isSimultaneous, currentStudentId, status]);

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
          topic: getEffectiveTopic(sessionSettings),
          tone: sessionSettings.tone,
          seenItems: seenItemsRef.current,
          excludeCacheIds: seenCacheIdsRef.current,
        })
      });

      if (!response.ok) throw new Error('Failed to fetch sentences');

      const data = await response.json();
      setSentenceQueue(prev => [...prev, ...data.sentences]);

      // Track what was seen so we avoid repetition in the next fetch
      if (data.cacheId) addSeenCacheId(data.cacheId);
      if (data.sentences?.length) {
        addSeenItems('vocab-sprint', data.sentences.map((s: GameSentence) => s.weakWord));
      }

      if (isInitial) setStatus(GameStatus.IDLE);
    } catch (e) {
      console.error('Batch fetch failed', e);
      if (isInitial) setStatus(GameStatus.IDLE);
    } finally {
      setIsFetchingBatch(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionSettings.difficulty, sessionSettings.topic, sessionSettings.customTopic, sessionSettings.tone, isFetchingBatch, addSeenItems, addSeenCacheId]);

  // Start a sprint round
  const startSprint = async () => {
    if (!isSimultaneous && !currentStudentId) {
      onPickStudent();
      return;
    }

    setShowSuggestions(false);
    setShowHint(false);
    setReplacementInput('');
    setEvaluation(null);
    setRaceSolvers([]);
    setRaceFinished(false);
    inFlightRef.current.clear();
    setReviewIndex(-1);
    setReviewShowSuggestions(false);

    if (sentenceQueue.length > 0) {
      const next = sentenceQueue[0];
      setSentenceQueue(prev => prev.slice(1));
      setCurrentSentence(next);
      setTimeLeft(sessionSettings.timerSeconds);
      setStatus(GameStatus.RUNNING);

      if (sentenceQueue.length < 3) {
        fetchBatch();
      }
    } else {
      setCurrentFact(ENGLISH_FACTS[Math.floor(Math.random() * ENGLISH_FACTS.length)]);
      setStatus(GameStatus.GENERATING);
      try {
        const response = await fetch('/api/vocab-sprint/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            difficulty: sessionSettings.difficulty,
            topic: getEffectiveTopic(sessionSettings),
            tone: sessionSettings.tone,
            seenItems: seenItemsRef.current,
            excludeCacheIds: seenCacheIdsRef.current,
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

          // Track seen items from this fetch
          if (data.cacheId) addSeenCacheId(data.cacheId);
          addSeenItems('vocab-sprint', data.sentences.map((s: GameSentence) => s.weakWord));
        } else {
          setStatus(GameStatus.IDLE);
        }
      } catch (e) {
        console.error('Emergency fetch failed', e);
        setStatus(GameStatus.IDLE);
      }
    }
  };

  // Retry same sentence (turn-based)
  const tryAgain = () => {
    if (!currentSentence) return;
    setShowSuggestions(false);
    setShowHint(false);
    setTimeLeft(sessionSettings.timerSeconds);
    setReplacementInput('');
    setEvaluation(null);
    setStatus(GameStatus.RUNNING);
  };

  // Submit for evaluation (turn-based)
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

      onScore(currentStudentId, {
        isCorrect: result.score >= 5,
        points: result.score,
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
      if (isSimultaneous) {
        setRaceFinished(true);
        setStatus(GameStatus.FINISHED);
      } else {
        setStatus(GameStatus.TIME_UP);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft, isSimultaneous]);

  // Focus input when running (turn-based)
  useEffect(() => {
    if (!isSimultaneous && status === GameStatus.RUNNING && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSimultaneous, status]);

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

  const handleEndRace = () => {
    setRaceFinished(true);
    setStatus(GameStatus.FINISHED);
  };

  // ============ SIMULTANEOUS RACE MODE ============
  if (isSimultaneous) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-semibold text-cyan-400">
              Everyone plays! ({students.length} students)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isFetchingBatch && (
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" title="Pre-loading..." />
            )}
            <span className="text-xs opacity-40">{sentenceQueue.length} ready</span>
          </div>
        </div>

        {/* IDLE State */}
        {status === GameStatus.IDLE && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="mb-6">
              <p className="text-xl mb-1 opacity-90 font-bold italic tracking-tight">Level Up Your Vocabulary</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">
                Race Mode: {sessionSettings.topic} / {sessionSettings.difficulty}
              </p>
            </div>
            <button
              onClick={startSprint}
              className="px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              {sentenceQueue.length > 0 ? 'START RACE' : 'LOAD SPRINT'}
            </button>
          </motion.div>
        )}

        {/* GENERATING State */}
        {status === GameStatus.GENERATING && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-8 max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
            <div className="space-y-4">
              <p className="font-game text-xl text-cyan-400 uppercase tracking-widest animate-pulse">Pre-fetching Sentences...</p>
              <div className="glass p-6 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 block mb-2">Did you know?</span>
                <p className="text-lg font-semibold italic text-slate-300">&quot;{currentFact}&quot;</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* RUNNING State — Race mode */}
        {status === GameStatus.RUNNING && currentSentence && (
          <div className="space-y-6">
            {/* Timer */}
            <div className="flex items-center justify-between">
              <div className={`text-5xl font-game transition-all ${
                timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'
              }`}>
                {timeLeft}s
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase">Submissions</p>
                <p className="text-2xl font-bold text-emerald-400">{raceSolvers.length}</p>
              </div>
            </div>

            {/* Sentence Card */}
            <div className="glass p-6 md:p-8 rounded-[2rem] shadow-xl border-2 border-white/10">
              {renderSentence()}
              <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3 gap-2 opacity-50 text-[8px] font-black uppercase tracking-widest">
                <div className="flex gap-2">
                  <span>{sessionSettings.difficulty}</span>
                  <span>{sessionSettings.topic}</span>
                </div>
                <p>Replace the highlighted word</p>
              </div>
            </div>

            {/* Live solver feed — sealed during race to prevent copying */}
            {raceSolvers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {raceSolvers.length} of {students.length} submitted
                </p>
                <AnimatePresence>
                  {raceSolvers.map(solver => (
                    <motion.div
                      key={solver.studentId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white">{solver.displayName}</span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {raceSolvers.length === 0 && (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm">Waiting for students to submit on their devices...</p>
              </div>
            )}

            {/* End race button */}
            <button
              onClick={handleEndRace}
              className="w-full py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/10"
            >
              END EARLY
            </button>
          </div>
        )}

        {/* FINISHED State — Race results with teacher review */}
        {status === GameStatus.FINISHED && currentSentence && (() => {
          const sorted = [...raceSolvers].sort((a, b) => b.score - a.score);
          const currentReview = reviewIndex >= 0 && reviewIndex < sorted.length ? sorted[reviewIndex] : null;

          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              {/* Phase A: Overview */}
              {reviewIndex === -1 && (
                <>
                  <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30 text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {raceFinished || timeLeft === 0 ? "TIME'S UP!" : 'ROUND COMPLETE!'}
                    </h3>
                    <p className="text-slate-400">{raceSolvers.length} submission{raceSolvers.length !== 1 ? 's' : ''} received</p>
                  </div>

                  {sorted.length > 0 && (
                    <div className="space-y-2">
                      {sorted.map((solver, i) => (
                        <div
                          key={solver.studentId}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                            i === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5 border border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {i === 0 && <span className="text-lg font-black text-yellow-400">BEST</span>}
                            <span className="font-semibold text-white">{solver.displayName}</span>
                            <span className="text-sm text-slate-400 italic">&quot;{solver.replacement}&quot;</span>
                          </div>
                          <div className={`w-10 h-10 rounded-lg ${getScoreColor(solver.score)} flex items-center justify-center text-lg font-black text-white`}>
                            {solver.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    {sorted.length > 0 && (
                      <button
                        onClick={() => { setReviewIndex(0); setReviewShowSuggestions(false); }}
                        className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-game text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        REVIEW ANSWERS
                      </button>
                    )}
                    <button
                      onClick={startSprint}
                      className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-game text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      NEXT SENTENCE
                    </button>
                  </div>
                </>
              )}

              {/* Phase B: Step-through review */}
              {reviewIndex >= 0 && currentReview && (
                <>
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Reviewing {reviewIndex + 1} of {sorted.length}
                    </p>
                    <div className="flex justify-center gap-1 mt-2">
                      {sorted.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                          i < reviewIndex ? 'bg-emerald-500' : i === reviewIndex ? 'bg-cyan-400 scale-125' : 'bg-white/20'
                        }`} />
                      ))}
                    </div>
                  </div>

                  <div className="glass p-6 rounded-[2rem] border-2 border-white/10 shadow-xl flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6 w-full">
                      <div className={`w-24 h-24 flex flex-col items-center justify-center rounded-2xl font-game shadow-lg shrink-0 ${getScoreColor(currentReview.score)}`}>
                        <span className="text-[10px] -mb-1 opacity-60">SCORE</span>
                        <span className="text-4xl font-black">{currentReview.score}</span>
                      </div>
                      <div className="text-left flex-grow">
                        <p className="text-sm font-bold text-slate-400 mb-1">{currentReview.displayName}</p>
                        <p className="text-3xl font-black leading-none mb-2 tracking-tight">
                          {currentReview.replacement.toUpperCase()}
                        </p>
                        <div className="text-sm italic font-bold text-cyan-300 bg-black/30 p-3 rounded-lg">
                          &quot;{currentReview.comment}&quot;
                        </div>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {currentReview.suggestions.length > 0 && (
                      <div className="w-full bg-white/5 p-4 rounded-xl border border-white/5">
                        {!reviewShowSuggestions ? (
                          <button
                            onClick={() => setReviewShowSuggestions(true)}
                            className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-game text-xs rounded-lg transition-all border border-yellow-500/20"
                          >
                            REVEAL PRO UPGRADES
                          </button>
                        ) : (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <p className="text-center text-[8px] font-black uppercase tracking-widest opacity-40 mb-3">
                              Elite Level Suggestions
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {currentReview.suggestions.map((w, i) => (
                                <span key={i} className="px-3 py-1 bg-black/50 text-white rounded-md text-sm font-bold border border-white/5">
                                  {w}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setReviewIndex(-1); setReviewShowSuggestions(false); }}
                      className="py-3 px-4 glass hover:bg-white/10 rounded-xl font-game text-xs transition-all border border-white/10"
                    >
                      BACK
                    </button>
                    {reviewIndex < sorted.length - 1 ? (
                      <button
                        onClick={() => { setReviewIndex(reviewIndex + 1); setReviewShowSuggestions(false); }}
                        className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-game text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        NEXT STUDENT
                      </button>
                    ) : (
                      <button
                        onClick={startSprint}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-game text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        NEXT SENTENCE
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Phase B: End of review (no more students) */}
              {reviewIndex >= 0 && !currentReview && (
                <div className="text-center space-y-4">
                  <p className="text-lg font-bold text-emerald-400">All answers reviewed!</p>
                  <button
                    onClick={startSprint}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-game text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    NEXT SENTENCE
                  </button>
                </div>
              )}
            </motion.div>
          );
        })()}
      </div>
    );
  }

  // ============ TURN-BASED MODE (original) ============
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
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
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
