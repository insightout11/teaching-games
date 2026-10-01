'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { GameStatus, ENGLISH_FACTS } from './types';
import type { GameSentence, EvaluationResult } from './types';
import { useSessionStore, getEffectiveTopic, getDisplayTopic } from '@/stores/session-store';
import { GenerationLoader } from '@/components/ui/generation-loader';
import { useSyncedTimer } from '@/hooks/use-synced-timer';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { ArrowRight, BookOpen, Check, Clock, Lightbulb, Sparkles, Trophy } from 'lucide-react';

const EMPTY_SEEN: string[] = [];

interface RaceSolver {
  studentId: string;
  clientId: string;
  displayName: string;
  replacement: string;
  score: number;
  comment: string;
  suggestions: string[];
  isValid: boolean;
  position: number;
}

export function VocabSprintGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler, onRegisterRemoteVoteHandler, prefsMap, config, isMicroEvent }: GameProps) {
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  const lessonKit = useSessionStore((s) => s.lessonKit);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState<number>(sessionSettings.timerSeconds);

  // Repetition tracking â€” read from store but keep refs to avoid stale closures in callbacks
  const addSeenItems = useSessionStore((s) => s.addSeenItems);
  const addSeenCacheId = useSessionStore((s) => s.addSeenCacheId);
  const storeSeenItems = useSessionStore((s) => s.seenItemsByGame['vocab-sprint']) ?? EMPTY_SEEN;
  const storeSeenCacheIds = useSessionStore((s) => s.seenCacheIds);
  const seenItemsRef = useRef<string[]>([]);
  const seenCacheIdsRef = useRef<string[]>([]);
  useEffect(() => { seenItemsRef.current = storeSeenItems; }, [storeSeenItems]);
  useEffect(() => { seenCacheIdsRef.current = storeSeenCacheIds; }, [storeSeenCacheIds]);

  // Prefetching logic â€” seed from pre-generated content if provided (e.g. Vocab Blitz)
  const [sentenceQueue, setSentenceQueue] = useState<GameSentence[]>(() => {
    const preGen = (config?.preGeneratedContent as { gameKey?: string; sentences?: GameSentence[] } | undefined);
    return preGen?.gameKey === 'vocab-sprint' && preGen.sentences?.length ? preGen.sentences : [];
  });
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
  // Race extras: teacher-revealed hint, round count, and a word bank of the best upgrades.
  const [raceHint, setRaceHint] = useState(false);
  // Seconds added with +30s — sent to phones too (same start, longer timer).
  const [extraSeconds, setExtraSeconds] = useState(0);
  const [roundNo, setRoundNo] = useState(0);
  const [wordBank, setWordBank] = useState<Array<{ weak: string; words: string[] }>>([]);
  const [showBank, setShowBank] = useState(false);
  const bankedRoundRef = useRef(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Keep refs for handlers
  const currentSentenceRef = useRef<GameSentence | null>(null);
  currentSentenceRef.current = currentSentence;
  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;
  const raceFinishedRef = useRef(false);
  raceFinishedRef.current = raceFinished;
  const raceStartedAtRef = useRef(0);

  // Register input spec for student controller
  useEffect(() => {
    if (isSimultaneous) {
      if (status === GameStatus.RUNNING && currentSentence && !raceFinished) {
        if (!raceStartedAtRef.current) raceStartedAtRef.current = Date.now();
        onSetInputSpec?.({
          type: 'text',
          gameKey: 'vocab-sprint',
          prompt: currentSentence.level === 'hard'
            ? `What's the precise term for: "${currentSentence.weakWord}"? â€” race!`
            : `Replace the weak word "${currentSentence.weakWord}" with a stronger word â€” race!`,
          placeholder: currentSentence.level === 'hard' ? 'Type the precise term...' : 'Type an upgrade word...',
          maxLength: 50,
          timerSeconds: sessionSettings.timerSeconds + extraSeconds,
          startedAt: raceStartedAtRef.current,
        });
      } else {
        raceStartedAtRef.current = 0;
        onSetInputSpec?.(null);
      }
    } else {
      if (status === GameStatus.RUNNING && currentSentence) {
        if (!raceStartedAtRef.current) raceStartedAtRef.current = Date.now();
        onSetInputSpec?.({
          type: 'text',
          gameKey: 'vocab-sprint',
          prompt: currentSentence.level === 'hard'
            ? `What's the precise term for: "${currentSentence.weakWord}"?`
            : `Replace the weak word "${currentSentence.weakWord}" with a stronger word`,
          placeholder: currentSentence.level === 'hard' ? 'Type the precise term...' : 'Type an upgrade word...',
          maxLength: 50,
          timerSeconds: sessionSettings.timerSeconds + extraSeconds,
          startedAt: raceStartedAtRef.current,
        });
      } else {
        raceStartedAtRef.current = 0;
        onSetInputSpec?.(null);
      }
    }
  }, [isSimultaneous, status, currentSentence, raceFinished, onSetInputSpec, sessionSettings.timerSeconds, extraSeconds]);

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
          level: sentence.level,
          targetWord: sentence.targetWord,
        }),
      });

      if (!response.ok) {
        console.warn('[VocabSprint] evaluate API returned', response.status, 'â€” using fallback score');
        result = { score: 5, comment: 'âœ“', isValid: true, suggestions: [] };
      } else {
        result = await response.json() as EvaluationResult;
      }
    } catch (err) {
      console.warn('[VocabSprint] evaluate API failed:', err, 'â€” using fallback score');
      result = { score: 5, comment: 'âœ“', isValid: true, suggestions: [] };
    } finally {
      inFlightRef.current.delete(studentId);
    }

    setRaceSolvers(prev => {
      if (prev.some(s => s.studentId === studentId)) return prev;

      const position = prev.length + 1;

      onScore(studentId, {
        isCorrect: result.score >= 5,
        points: result.score,
        // First solver in a simultaneous round is standout (+5)
        outcome: position === 1 && result.score >= 5 ? 'standout' : undefined,
        responseData: {
          clientId: vote.clientId,
          replacement,
          response: replacement,
          feedback: result.comment,
          score: result.score,
          comment: result.comment,
          position,
        },
      });

      return [...prev, {
        studentId,
        clientId: vote.clientId,
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
      autoApprove: true,
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
              difficulty: sessionSettings.difficulty,
              level: sentence.level,
              targetWord: sentence.targetWord,
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
          ...(sourceMaterial ? { sourceMaterial } : {}), ...(lessonKit ? { lessonKit } : {}),
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
  }, [sessionSettings.difficulty, sessionSettings.topic, sessionSettings.customTopic, sessionSettings.tone, isFetchingBatch, addSeenItems, addSeenCacheId, sourceMaterial]);

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
    setRaceHint(false);
    setExtraSeconds(0);
    setShowBank(false);
    setRoundNo((n) => n + 1);

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
            ...(sourceMaterial ? { sourceMaterial } : {}), ...(lessonKit ? { lessonKit } : {}),
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
          difficulty: sessionSettings.difficulty,
          level: currentSentence.level,
          targetWord: currentSentence.targetWord,
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

  // Timer: the SAME server-stamped clock the phones use (incl. their 3-2-1 beat),
  // so the teacher screen and devices end together. A fresh round ignores the
  // previous round's final 0 for its first moments.
  const synced = useSyncedTimer(sessionSettings.timerSeconds, status === GameStatus.RUNNING, raceStartedAtRef.current || undefined);
  const runStartRef = useRef(0);
  useEffect(() => { if (status === GameStatus.RUNNING) runStartRef.current = Date.now(); }, [status, currentSentence]);
  useEffect(() => {
    if (status !== GameStatus.RUNNING) return;
    if (synced.timeLeft === 0 && Date.now() - runStartRef.current < 1500) return;
    setTimeLeft(synced.timeLeft);
  }, [synced.timeLeft, status]);

  useEffect(() => {
    if (timeLeft === 0 && status === GameStatus.RUNNING) {
      if (isSimultaneous) {
        setRaceFinished(true);
        setStatus(GameStatus.FINISHED);
      } else {
        setStatus(GameStatus.TIME_UP);
      }
    }
  }, [status, timeLeft, isSimultaneous]);

  // Focus input when running (turn-based)
  useEffect(() => {
    if (!isSimultaneous && status === GameStatus.RUNNING && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSimultaneous, status]);

  // Everyone has answered: end the race without waiting for the clock.
  useEffect(() => {
    if (isSimultaneous && status === GameStatus.RUNNING && students.length > 0 && raceSolvers.length >= students.length) {
      setRaceFinished(true);
      setStatus(GameStatus.FINISHED);
    }
  }, [isSimultaneous, status, raceSolvers.length, students.length]);

  // Bank the strong upgrades once per finished round (plus the AI's suggestions).
  useEffect(() => {
    if (!isSimultaneous || status !== GameStatus.FINISHED || !currentSentence || bankedRoundRef.current === roundNo) return;
    bankedRoundRef.current = roundNo;
    const good = [...raceSolvers].filter((r) => r.score >= 7).sort((a, b) => b.score - a.score).map((r) => r.replacement.toLowerCase());
    const extra = raceSolvers.flatMap((r) => r.suggestions).map((w) => w.toLowerCase());
    const words = Array.from(new Set([...good, ...extra])).slice(0, 5);
    if (words.length) setWordBank((prev) => [...prev, { weak: currentSentence.weakWord, words }]);
  }, [isSimultaneous, status, currentSentence, raceSolvers, roundNo]);

  const LEVEL_LABELS: Record<'easy' | 'medium' | 'hard', string> = {
    easy: 'EASY',
    medium: 'MEDIUM',
    hard: 'HARD',
  };
  const LEVEL_COLORS: Record<'easy' | 'medium' | 'hard', string> = {
    easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    hard: 'text-red-400 border-red-500/30 bg-red-500/10',
  };

  // Render sentence with the weak word highlighted â€” or swapped for an upgrade.
  const renderSentence = (swap?: string) => {
    if (!currentSentence) return null;
    const escaped = currentSentence.weakWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = currentSentence.sentence.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <p className="px-2 text-center font-display text-3xl leading-snug text-white md:text-[2.6rem]" style={{ textWrap: 'balance' }}>
        {parts.map((part, i) => (
          part.toLowerCase() === currentSentence.weakWord.toLowerCase() ? (
            swap ? (
              <span key={i} className="relative inline-block">
                <span className="mr-1.5 text-white/35 line-through decoration-rose-400/80 decoration-2">{part}</span>
                <motion.span initial={{ opacity: 0, y: -14, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.25 }} className="rounded-lg bg-emerald-400/15 px-1.5 text-emerald-300">
                  {swap}
                </motion.span>
              </span>
            ) : (
              <span key={i} className="rounded-lg bg-amber-300/15 px-1.5 text-amber-200 underline decoration-amber-300 decoration-2 underline-offset-[6px]">{part}</span>
            )
          ) : <span key={i}>{part}</span>
        ))}
      </p>
    );
  };

  const getScoreColor = (s: number) => {
    if (s >= 8) return 'bg-cyan-500';
    if (s >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  const scoreTone = (s: number) => (s >= 8 ? 'border-emerald-300/50 bg-emerald-400/10 text-emerald-200' : s >= 5 ? 'border-amber-300/40 bg-amber-300/10 text-amber-100' : 'border-white/15 bg-white/[0.04] text-white/70');

  const handleEndRace = () => {
    setRaceFinished(true);
    setStatus(GameStatus.FINISHED);
  };

  const nameFor = (s: RaceSolver) => (prefsMap?.get(s.clientId)?.score_visible === false ? 'Anonymous pilot' : s.displayName);
  const topic = getDisplayTopic(sessionSettings, sourceMaterial);
  const total = (sessionSettings.timerSeconds + extraSeconds) || 1;

  const NextButton = ({ label = 'Next sentence' }: { label?: string }) => (isMicroEvent ? (
    <KitReadout>Round complete Â· advance the flight to continue</KitReadout>
  ) : (
    <KitButton tone="cyan" solid onClick={startSprint} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>{label}</KitButton>
  ));

  const WordBank = () => (
    <div className="rounded-2xl border border-cyan-300/30 bg-slate-950/50 p-5">
      <KitLabel tone="cyan">Word bank Â· {topic}</KitLabel>
      <div className="mt-3 space-y-2.5">
        {wordBank.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <span className="min-w-[90px] font-mono text-sm text-white/45 line-through decoration-rose-400/70">{row.weak}</span>
            <ArrowRight className="h-4 w-4 text-white/35" />
            {row.words.map((w) => <span key={w} className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-base text-emerald-100">{w}</span>)}
          </div>
        ))}
      </div>
    </div>
  );

  // ============ SIMULTANEOUS RACE MODE ============
  if (isSimultaneous) {
    const sorted = [...raceSolvers].sort((a, b) => b.score - a.score);
    const best = sorted[0] && sorted[0].score >= 5 ? sorted[0] : null;
    const currentReview = reviewIndex >= 0 && reviewIndex < sorted.length ? sorted[reviewIndex] : null;

    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between">
          <KitLabel tone="cyan">VocabSprint{roundNo ? ` Â· sentence ${roundNo}` : ''} Â· {topic}</KitLabel>
          <div className="flex items-center gap-3">
            {wordBank.length > 0 && status !== GameStatus.RUNNING && (
              <KitButton tone={showBank ? 'cyan' : 'plain'} onClick={() => setShowBank((v) => !v)} icon={<BookOpen className="h-3.5 w-3.5" />}>Word bank Â· {wordBank.length}</KitButton>
            )}
            {isFetchingBatch && <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" title="Pre-loading..." />}
          </div>
        </div>

        {showBank && status !== GameStatus.RUNNING && <WordBank />}

        {/* IDLE */}
        {status === GameStatus.IDLE && !showBank && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 py-6 text-center">
            <p className="font-display text-5xl">Upgrade the word.</p>
            <p className="mx-auto max-w-xl text-lg text-white/70">A sentence appears with one weak word. Everyone races on their phones to type a stronger one. The best upgrade gets swapped in.</p>
            <div className="flex justify-center">
              <KitButton tone="cyan" solid onClick={startSprint} className="!px-8 !py-3 !text-base" icon={<Sparkles className="h-4 w-4" />}>
                {sentenceQueue.length > 0 ? 'Start the race' : 'Load sentences'}
              </KitButton>
            </div>
          </motion.div>
        )}

        {/* GENERATING */}
        {status === GameStatus.GENERATING && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-8 text-center">
            <GenerationLoader label="sentences" />
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
              <KitLabel>Did you know?</KitLabel>
              <p className="mt-2 text-lg italic text-white/80">&quot;{currentFact}&quot;</p>
            </div>
          </motion.div>
        )}

        {/* RUNNING */}
        {status === GameStatus.RUNNING && currentSentence && (
          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-8">
              <div className="mb-5 flex items-center justify-center gap-2">
                <span className={`rounded-full border px-3 py-0.5 font-mono text-[11px] uppercase tracking-[0.16em] ${LEVEL_COLORS[currentSentence.level]}`}>{LEVEL_LABELS[currentSentence.level]}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">{currentSentence.level === 'hard' ? 'Say it precisely' : 'Replace the highlighted word'}</span>
              </div>
              {renderSentence()}
              {raceHint && currentSentence.hint && (
                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-center text-lg text-amber-200">
                  <Lightbulb className="mr-1.5 inline h-4 w-4" />{currentSentence.hint}
                </motion.p>
              )}
            </div>

            {/* Clock bar + count */}
            <div className="flex items-center gap-4">
              <Clock className={`h-5 w-5 ${timeLeft <= 5 ? 'text-rose-300' : 'text-white/60'}`} />
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div className={`h-full ${timeLeft <= 5 ? 'bg-rose-400' : 'bg-cyan-400'}`} animate={{ width: `${Math.max(0, Math.min(100, (timeLeft / total) * 100))}%` }} transition={{ ease: 'linear', duration: 1 }} />
              </div>
              <span className={`w-14 text-right font-mono text-2xl ${timeLeft <= 5 ? 'text-rose-300' : 'text-white'}`}>{timeLeft}s</span>
              <KitButton onClick={() => { synced.addSeconds(30); setExtraSeconds((x) => x + 30); }}>+30s</KitButton>
            </div>

            {/* Sealed answers: names only */}
            <div className="flex flex-wrap items-center gap-2">
              <KitReadout>{raceSolvers.length} / {students.length} answered</KitReadout>
              <AnimatePresence>
                {raceSolvers.map((sv) => (
                  <motion.span key={sv.studentId} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-100">
                    <Check className="h-3.5 w-3.5" />{nameFor(sv)}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            <div className="flex justify-between gap-2">
              <KitButton tone="amber" disabled={raceHint || !currentSentence.hint} onClick={() => setRaceHint(true)} icon={<Lightbulb className="h-3.5 w-3.5" />}>Show hint</KitButton>
              <KitButton onClick={handleEndRace}>End early</KitButton>
            </div>
          </div>
        )}

        {/* FINISHED: overview */}
        {status === GameStatus.FINISHED && currentSentence && reviewIndex === -1 && !showBank && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-7">
              <div className="mb-4 text-center">
                <KitLabel tone={best ? 'emerald' : 'plain'}>{best ? `Best upgrade Â· ${nameFor(best)}` : raceSolvers.length ? 'Try these upgrades' : 'No answers this time'}</KitLabel>
              </div>
              {renderSentence(best?.replacement ?? sorted[0]?.suggestions[0] ?? raceSolvers.flatMap((r) => r.suggestions)[0])}
              {best?.comment && <p className="mt-4 text-center text-base italic text-white/65">{best.comment}</p>}
            </div>

            {/* Answer wall: words only (names stay private on the shared screen) */}
            {sorted.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {sorted.map((sv, i) => (
                  <motion.span key={sv.studentId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.06 }} className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-lg ${scoreTone(sv.score)}`}>
                    {i === 0 && best && <Trophy className="h-4 w-4 text-amber-300" />}
                    {sv.replacement}
                    <span className="font-mono text-xs opacity-60">{sv.score}</span>
                  </motion.span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              {sorted.length > 0 && (
                <KitButton tone="amber" onClick={() => { setReviewIndex(0); setReviewShowSuggestions(false); }}>Review one by one</KitButton>
              )}
              <NextButton />
            </div>
          </motion.div>
        )}

        {/* FINISHED: step-through review */}
        {status === GameStatus.FINISHED && reviewIndex >= 0 && !showBank && (
          currentReview ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-1.5">
                {sorted.map((_, i) => <span key={i} className={`h-2 w-2 rounded-full ${i < reviewIndex ? 'bg-emerald-400' : i === reviewIndex ? 'scale-125 bg-cyan-300' : 'bg-white/20'}`} />)}
              </div>
              <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-7">
                {renderSentence(currentReview.replacement)}
                <div className="mt-5 flex items-center justify-center gap-3">
                  <span className={`rounded-xl border px-3 py-1 font-mono text-lg ${scoreTone(currentReview.score)}`}>{currentReview.score}/10</span>
                  <p className="text-base italic text-white/75">{currentReview.comment}</p>
                </div>
                {currentReview.suggestions.length > 0 && (
                  <div className="mt-5 text-center">
                    {!reviewShowSuggestions ? (
                      <KitButton tone="amber" className="mx-auto" onClick={() => setReviewShowSuggestions(true)} icon={<Sparkles className="h-3.5 w-3.5" />}>Show stronger options</KitButton>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-2">
                        {currentReview.suggestions.map((w) => <span key={w} className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-base text-emerald-100">{w}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-2">
                <KitButton onClick={() => { setReviewIndex(-1); setReviewShowSuggestions(false); }}>Back</KitButton>
                {reviewIndex < sorted.length - 1 ? (
                  <KitButton tone="cyan" solid onClick={() => { setReviewIndex(reviewIndex + 1); setReviewShowSuggestions(false); }} icon={<ArrowRight className="h-4 w-4" />}>Next answer</KitButton>
                ) : <NextButton />}
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="font-display text-3xl">All answers reviewed</p>
              <div className="flex justify-center"><NextButton /></div>
            </div>
          )
        )}
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
              Mode: {getDisplayTopic(sessionSettings, sourceMaterial)} / {sessionSettings.difficulty}
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
          <GenerationLoader label="sentences" />
          <div className="space-y-4">
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
            {currentSentence?.level && (
              <div className="flex justify-center mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${LEVEL_COLORS[currentSentence.level]}`}>
                  {LEVEL_LABELS[currentSentence.level]}
                </span>
              </div>
            )}
            {renderSentence()}
            <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3 gap-2 opacity-50 text-[8px] font-black uppercase tracking-widest">
              <div className="flex gap-2">
                <span>{sessionSettings.difficulty}</span>
                <span>{getDisplayTopic(sessionSettings, sourceMaterial)}</span>
              </div>
              <p>{currentSentence?.level === 'hard' ? "What's the precise term?" : 'Replace the highlighted word'}</p>
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
                  placeholder={currentSentence?.level === 'hard' ? 'Type the precise term...' : 'Upgrade word...'}
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
                {currentSentence?.level === 'hard' ? 'SUBMIT ANSWER' : 'SUBMIT WORD'}
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
                {isMicroEvent ? (
                  <div className="glass p-4 rounded-xl text-center flex-1">
                    <p className="text-sm text-emerald-400 font-bold">Round complete</p>
                    <p className="text-xs opacity-50 mt-1">Advance the flight to continue.</p>
                  </div>
                ) : (
                  <button
                    onClick={startSprint}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-game text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    NEXT SENTENCE
                  </button>
                )}
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
