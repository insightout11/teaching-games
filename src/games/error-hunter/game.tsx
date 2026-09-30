'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { useRaceMode } from '@/hooks/use-race-mode';
import { GameStatus } from './types';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import { GenerationLoader } from '@/components/ui/generation-loader';
import type { Challenge, EvaluationResult, UserCorrection, ErrorLocation } from './types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { ArrowRight, Check, Clock, Eye, Search, Trophy } from 'lucide-react';

interface WordData {
  word: string;
  index: number;
  isSelected: boolean;
  correction: string;
}

// Speed bonus for the first accurate hunters (accuracy always matters more).
function getPositionPoints(position: number): number {
  if (position === 1) return 3;
  if (position === 2) return 2;
  if (position === 3) return 1;
  return 0;
}

/** Which paragraph word (index) each answer-key error sits on: by position, else first unused matching word. */
function locateSolutions(paragraph: string, solutions: ErrorLocation[]): number[] {
  const words = paragraph.split(/\s+/);
  const used = new Set<number>();
  return solutions.map((sol) => {
    let at = -1;
    if (sol.position >= 0 && sol.position < words.length && normalizeWord(words[sol.position]) === normalizeWord(sol.word)) at = sol.position;
    if (at < 0) at = words.findIndex((w, i) => !used.has(i) && normalizeWord(w) === normalizeWord(sol.word));
    if (at >= 0) used.add(at);
    return at;
  });
}

const normalizeWord = (w: string) => w.replace(/[.,!?;:'"()]/g, '').toLowerCase();

// Rebuild the original paragraph with each error word struck through and its
// correction shown inline, so the teacher can read the fixes in context.
function renderCorrectedParagraph(paragraph: string, solutions: ErrorLocation[]) {
  const remaining = solutions.map(s => ({ ...s, used: false }));
  const tokens = paragraph.split(/(\s+)/); // keep whitespace tokens to preserve spacing

  return tokens.map((token, i) => {
    if (/^\s+$/.test(token) || token === '') {
      return <span key={i}>{token}</span>;
    }
    const norm = normalizeWord(token);
    const sol = remaining.find(s => !s.used && normalizeWord(s.word) === norm);
    if (!sol) {
      return <span key={i}>{token}</span>;
    }
    sol.used = true;
    // Carry over any leading/trailing punctuation from the original token.
    const lead = token.match(/^[.,!?;:'"()]*/)?.[0] ?? '';
    const trail = token.match(/[.,!?;:'"()]*$/)?.[0] ?? '';
    return (
      <span key={i} className="whitespace-nowrap">
        {lead}
        <span className="text-red-400 line-through">{sol.word}</span>
        <span className="text-emerald-400 font-semibold">{' '}{sol.correction}</span>
        {trail}
      </span>
    );
  });
}

interface RaceSolver {
  studentId: string;
  displayName: string;
  corrections: UserCorrection[];
  score: number;
  found: number;
  totalErrors: number;
  position: number;
}

export function ErrorHunterGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterRemoteVoteHandler, isMicroEvent }: GameProps) {
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [words, setWords] = useState<WordData[]>([]);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [correctionInput, setCorrectionInput] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extraSeconds, setExtraSeconds] = useState(0);

  // Simultaneous race mode
  const { isSimultaneous, raceActive, raceFinished, timeRemaining, startRace, endRace, resetRace, addTime } = useRaceMode({
    studentCount: students.length,
    timerSeconds: sessionSettings.timerSeconds,
  });
  const [raceSolvers, setRaceSolvers] = useState<RaceSolver[]>([]);
  const [answerKey, setAnswerKey] = useState<ErrorLocation[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [roundNo, setRoundNo] = useState(1);

  // Stable refs so handleRaceVote / handleTurnBasedVote don't need to be recreated on state changes
  const challengeRef = useRef<Challenge | null>(null);
  challengeRef.current = challenge;
  const raceFinishedRef = useRef(raceFinished);
  raceFinishedRef.current = raceFinished;
  const raceSolversRef = useRef<RaceSolver[]>([]);
  raceSolversRef.current = raceSolvers;
  const answerKeyRef = useRef<ErrorLocation[]>([]);
  answerKeyRef.current = answerKey;
  const difficultyRef = useRef(sessionSettings.difficulty);
  difficultyRef.current = sessionSettings.difficulty;
  const raceStartedAtRef = useRef(0);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Register input spec for student controller
  useEffect(() => {
    if (isSimultaneous) {
      if (raceActive && !raceFinished && challenge && words.length > 0) {
        if (!raceStartedAtRef.current) raceStartedAtRef.current = Date.now();
        onSetInputSpec?.({
          type: 'error-correction',
          gameKey: 'error-hunter',
          options: words.map(w => w.word),
          prompt: `Find and correct the ${challenge.errorCount} error${challenge.errorCount !== 1 ? 's' : ''} — race!`,
          timerSeconds: sessionSettings.timerSeconds + extraSeconds,
          startedAt: raceStartedAtRef.current,
        });
      } else {
        raceStartedAtRef.current = 0;
        onSetInputSpec?.(null);
      }
    } else {
      if (status === GameStatus.PLAYING && challenge && words.length > 0) {
        if (!raceStartedAtRef.current) raceStartedAtRef.current = Date.now();
        onSetInputSpec?.({
          type: 'error-correction',
          gameKey: 'error-hunter',
          options: words.map(w => w.word),
          prompt: `Find and correct the ${challenge.errorCount} error${challenge.errorCount !== 1 ? 's' : ''} in this paragraph`,
          timerSeconds: sessionSettings.timerSeconds + extraSeconds,
          startedAt: raceStartedAtRef.current,
        });
      } else {
        raceStartedAtRef.current = 0;
        onSetInputSpec?.(null);
      }
    }
  }, [isSimultaneous, raceActive, raceFinished, status, challenge, words, onSetInputSpec, sessionSettings.timerSeconds, extraSeconds]);

  // Handle remote vote — race mode
  const handleRaceVote = useCallback(async (vote: GameRemoteVote) => {
    if (!challengeRef.current || raceFinishedRef.current) return;

    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    try {
      const corrections: UserCorrection[] = JSON.parse(vote.choice);
      if (!Array.isArray(corrections)) return;

      // Check for duplicate submissions
      if (raceSolversRef.current.some(s => s.studentId === studentId)) return;

      const response = await fetch('/api/error-hunter/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraph: challengeRef.current.paragraph,
          corrections,
          difficulty: difficultyRef.current,
        }),
      });

      if (!response.ok) return;

      const result: EvaluationResult = await response.json();

      // Capture answer key from first submission
      if (result.solutions?.length && answerKeyRef.current.length === 0) {
        setAnswerKey(result.solutions);
      }

      setRaceSolvers(prev => {
        if (prev.some(s => s.studentId === studentId)) return prev;

        const position = prev.length + 1;
        // Speed only counts for an accurate hunt: submitting nothing first scores nothing.
        const positionBonus = result.score >= 5 ? getPositionPoints(position) : 0;
        const totalPoints = Math.min(10, result.score + positionBonus);

        onScore(studentId, {
          isCorrect: result.score >= 5,
          points: totalPoints,
          responseData: {
            totalErrors: result.totalErrors,
            found: result.found,
            correctFixes: result.correctFixes,
            falsePositives: result.falsePositives,
            position,
          },
        });

        return [...prev, {
          studentId,
          displayName: vote.displayName,
          corrections,
          score: totalPoints,
          found: result.found,
          totalErrors: result.totalErrors,
          position,
        }];
      });
    } catch (err) {
      console.error('Failed to process race vote:', err);
    }
  }, [onScore]);

  // Handle remote vote — turn-based mode
  const handleTurnBasedVote = useCallback(async (vote: GameRemoteVote) => {
    if (!challengeRef.current) return;

    try {
      const corrections: UserCorrection[] = JSON.parse(vote.choice);
      if (!Array.isArray(corrections)) return;

      const response = await fetch('/api/error-hunter/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraph: challengeRef.current.paragraph,
          corrections,
          difficulty: difficultyRef.current,
        }),
      });

      if (!response.ok) return;

      const result: EvaluationResult = await response.json();

      const studentId = vote.studentId;
      if (!studentId) return;

      onScore(studentId, {
        isCorrect: result.score >= 5,
        points: result.score,
        responseData: {
          totalErrors: result.totalErrors,
          found: result.found,
          correctFixes: result.correctFixes,
          falsePositives: result.falsePositives,
          feedback: result.feedback,
        },
      });
    } catch (err) {
      console.error('Failed to process remote error-hunter vote:', err);
    }
  }, [onScore]);

  // Register remote vote handler
  useEffect(() => {
    if (isSimultaneous) {
      onRegisterRemoteVoteHandler?.(handleRaceVote);
    } else {
      onRegisterRemoteVoteHandler?.(handleTurnBasedVote);
    }
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [isSimultaneous, onRegisterRemoteVoteHandler, handleRaceVote, handleTurnBasedVote]);

  const handleGenerate = async () => {
    if (!isSimultaneous && !currentStudentId) {
      onPickStudent();
      return;
    }

    setStatus(GameStatus.GENERATING);
    setError(null);
    setEvaluation(null);
    setWords([]);
    setSelectedWordIndex(null);
    setCorrectionInput('');
    setRaceSolvers([]);
    setAnswerKey([]);
    setRevealed(0);
    setExtraSeconds(0);
    resetRace();

    try {
      const response = await fetch('/api/error-hunter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: getEffectiveTopic(sessionSettings),
          difficulty: sessionSettings.difficulty,
          ...(sessionSettings.grammarTarget ? { grammarTarget: sessionSettings.grammarTarget } : {}),
          ...(sourceMaterial ? { sourceMaterial } : {}),
        })
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      const data = await response.json();

      const wordList = data.paragraph.split(/\s+/).map((word: string, index: number) => ({
        word,
        index,
        isSelected: false,
        correction: ''
      }));

      setChallenge({
        paragraph: data.paragraph,
        errorCount: data.errorCount,
        difficulty: sessionSettings.difficulty
      });
      setWords(wordList);
      setStatus(GameStatus.PLAYING);

      // Auto-start race in simultaneous mode
      if (isSimultaneous) {
        startRace();
      }
    } catch (err) {
      setError('Failed to generate challenge. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleWordClick = (index: number) => {
    if (status !== GameStatus.PLAYING) return;

    const word = words[index];
    if (word.isSelected) {
      setWords(prev => prev.map((w, i) =>
        i === index ? { ...w, isSelected: false, correction: '' } : w
      ));
      if (selectedWordIndex === index) {
        setSelectedWordIndex(null);
        setCorrectionInput('');
      }
    } else {
      setSelectedWordIndex(index);
      setCorrectionInput('');
    }
  };

  const handleCorrection = () => {
    if (selectedWordIndex === null || !correctionInput.trim()) return;

    setWords(prev => prev.map((w, i) =>
      i === selectedWordIndex
        ? { ...w, isSelected: true, correction: correctionInput.trim() }
        : w
    ));
    setSelectedWordIndex(null);
    setCorrectionInput('');
  };

  const handleSubmit = async () => {
    if (!challenge || !currentStudentId) return;

    setStatus(GameStatus.EVALUATING);

    const corrections: UserCorrection[] = words
      .filter(w => w.isSelected && w.correction)
      .map(w => ({
        position: w.index,
        original: w.word.replace(/[.,!?;:'"]/g, ''),
        correction: w.correction
      }));

    try {
      const response = await fetch('/api/error-hunter/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraph: challenge.paragraph,
          corrections,
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
          totalErrors: result.totalErrors,
          found: result.found,
          correctFixes: result.correctFixes,
          falsePositives: result.falsePositives,
          feedback: result.feedback
        }
      });

      setStatus(GameStatus.SHOWING_RESULT);
    } catch (err) {
      setError('Failed to evaluate. Please try again.');
      console.error(err);
      setStatus(GameStatus.PLAYING);
    }
  };

  const handleSameChallenge = () => {
    if (!challenge) return;
    const resetWords = challenge.paragraph.split(/\s+/).map((word: string, index: number) => ({
      word,
      index,
      isSelected: false,
      correction: ''
    }));
    setWords(resetWords);
    setSelectedWordIndex(null);
    setCorrectionInput('');
    setEvaluation(null);
    setStatus(GameStatus.PLAYING);
    if (!isSimultaneous) onPickStudent();
  };

  const handleEndRace = () => {
    endRace();
  };

  // Everyone submitted: end now.
  useEffect(() => {
    if (isSimultaneous && raceActive && !raceFinished && students.length > 0 && raceSolvers.length >= students.length) endRace();
  }, [isSimultaneous, raceActive, raceFinished, raceSolvers.length, students.length, endRace]);

  // Nobody submitted (or the first check failed): still fetch the answer key for the reveal.
  useEffect(() => {
    if (!isSimultaneous || !raceFinished || !challenge || answerKey.length > 0) return;
    let cancelled = false;
    void fetch('/api/error-hunter/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paragraph: challenge.paragraph, corrections: [], difficulty: sessionSettings.difficulty }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res: EvaluationResult | null) => { if (!cancelled && res?.solutions?.length) setAnswerKey(res.solutions); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSimultaneous, raceFinished, challenge, answerKey.length, sessionSettings.difficulty]);

  const handleNewRound = () => {
    setRoundNo((n) => n + 1);
    setChallenge(null);
    setWords([]);
    setEvaluation(null);
    setRaceSolvers([]);
    resetRace();
    setStatus(GameStatus.IDLE);
    if (!isSimultaneous) onPickStudent();
  };

  const getScoreColor = (s: number) => {
    if (s >= 8) return 'from-emerald-500 to-emerald-600';
    if (s >= 5) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const selectedCount = words.filter(w => w.isSelected).length;

  // ============ SIMULTANEOUS RACE MODE ============
  if (isSimultaneous) {
    const total = (sessionSettings.timerSeconds + extraSeconds) || 1;
    const paragraphWords = challenge ? challenge.paragraph.split(/\s+/) : [];
    const spots = challenge ? locateSolutions(challenge.paragraph, answerKey) : [];
    // How many hunters flagged each error (their word index lands on it).
    const foundBy = spots.map((at) => raceSolvers.filter((sv) => sv.corrections.some((c) => c.position === at)).length);
    const revealedAt = new Map<number, number>();
    spots.forEach((at, i) => { if (at >= 0 && i < revealed) revealedAt.set(at, i); });
    const ranked = [...raceSolvers].sort((a, b) => b.score - a.score || a.position - b.position);

    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="rose">Error Hunter · paragraph {roundNo}</KitLabel>
          {challenge && status !== GameStatus.IDLE && <KitReadout>{challenge.errorCount} errors hidden · {raceSolvers.length} / {students.length} submitted</KitReadout>}
        </div>

        {status === GameStatus.IDLE && (
          <div className="space-y-5 py-6 text-center">
            <p className="font-display text-5xl">Hunt the mistakes.</p>
            <p className="mx-auto max-w-xl text-lg text-white/70">A short paragraph appears with hidden grammar and vocabulary errors. Everyone taps the wrong words on their phone and types the fix. Accuracy scores most; the first accurate hunters get a bonus.</p>
            <div className="flex justify-center">
              <KitButton tone="rose" solid onClick={handleGenerate} className="!px-8 !py-3 !text-base" icon={<Search className="h-4 w-4" />}>Start hunting</KitButton>
            </div>
          </div>
        )}

        {status === GameStatus.GENERATING && <GenerationLoader label="challenge" />}
        {error && <p className="rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-rose-100">{error}</p>}

        {challenge && status !== GameStatus.IDLE && status !== GameStatus.GENERATING && (
          <div className={`rounded-[1.75rem] border px-7 py-7 ${raceFinished ? 'border-emerald-300/30 bg-slate-950/50' : 'border-white/12 bg-slate-950/45'}`}>
            <p className="text-2xl leading-[1.9] text-white/90">
              {paragraphWords.map((w, i) => {
                const k = revealedAt.get(i);
                if (k === undefined) return <span key={i}>{w} </span>;
                const sol = answerKey[k];
                return (
                  <motion.span key={i} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="relative inline-block">
                    <span className="text-rose-300 line-through decoration-2">{w}</span>{' '}
                    <motion.span initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-md bg-emerald-400/15 px-1 font-semibold text-emerald-200">{sol.correction}</motion.span>{' '}
                  </motion.span>
                );
              })}
            </p>
          </div>
        )}

        {raceActive && !raceFinished && challenge && (
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
              {raceSolvers.length === 0 && <p className="text-sm text-white/45">Hunters are reading on their phones…</p>}
            </div>
            <div className="flex justify-end"><KitButton onClick={handleEndRace}>End the hunt</KitButton></div>
          </>
        )}

        {raceFinished && challenge && (
          <div className="space-y-4">
            {/* Step-through reveal: each error, its fix, its type, and how many found it */}
            {answerKey.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <KitLabel tone="emerald">The errors · {revealed} / {answerKey.length}</KitLabel>
                  <div className="flex gap-2">
                    {revealed < answerKey.length && <KitButton tone="emerald" solid onClick={() => setRevealed((n) => n + 1)} icon={<Eye className="h-3.5 w-3.5" />}>Reveal next</KitButton>}
                    {revealed < answerKey.length && <KitButton onClick={() => setRevealed(answerKey.length)}>Show all</KitButton>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {answerKey.slice(0, revealed).map((err, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center gap-3 text-lg">
                      <span className="text-rose-300 line-through">{err.word}</span>
                      <ArrowRight className="h-4 w-4 text-white/35" />
                      <span className="font-semibold text-emerald-200">{err.correction}</span>
                      <span className="rounded-full border border-white/12 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/55">{err.errorType}</span>
                      {raceSolvers.length > 0 && <span className="ml-auto font-mono text-xs text-white/50">found by {foundBy[i]} / {raceSolvers.length}</span>}
                    </motion.div>
                  ))}
                  {revealed === 0 && <p className="text-sm text-white/50">Ask the class first: which words looked wrong?</p>}
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-white/50">Loading the answer key…</p>
            )}

            {ranked.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {ranked.map((sv, i) => (
                  <span key={sv.studentId} className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-base ${i === 0 ? 'border-amber-300/50 bg-amber-300/10' : 'border-white/12 bg-white/[0.04]'}`}>
                    {i === 0 && <Trophy className="h-4 w-4 text-amber-300" />}
                    {sv.displayName}
                    <span className="font-mono text-xs text-white/55">{sv.found}/{sv.totalErrors}</span>
                    <span className="font-mono text-xs text-emerald-300">+{sv.score}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-center">
              {isMicroEvent ? (
                <KitReadout>Round complete · advance the flight to continue</KitReadout>
              ) : (
                <KitButton tone="rose" solid onClick={() => { handleNewRound(); }} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>New paragraph</KitButton>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ TURN-BASED MODE (original) ============
  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="text-xs opacity-40">
          {sessionSettings.difficulty} / {sessionSettings.topic}
        </div>
      </div>

      {/* IDLE State */}
      {status === GameStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-3">How to Play</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Find the grammar and spelling errors hidden in the paragraph. Click words to mark them as errors and provide corrections!
            </p>
          </div>

          {!currentStudentId ? (
            <button
              onClick={onPickStudent}
              className="w-full px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              PICK STUDENT
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full px-12 py-6 bg-gradient-to-br from-lc-danger to-red-500 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              START HUNTING
            </button>
          )}
        </motion.div>
      )}

      {/* GENERATING State */}
      {status === GameStatus.GENERATING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <GenerationLoader label="challenge" />
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* PLAYING State */}
      {(status === GameStatus.PLAYING || status === GameStatus.EVALUATING) && challenge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Info Bar */}
          <div className="flex items-center justify-between">
            <div className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold">
              {challenge.errorCount} errors hidden
            </div>
            <div className="px-4 py-2 bg-white/10 text-slate-300 rounded-xl text-sm">
              {selectedCount} marked
            </div>
          </div>

          {/* Paragraph with clickable words */}
          <div className="glass p-6 rounded-2xl border-2 border-red-500/30">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Click words to mark errors</p>
              <button
                onClick={handleGenerate}
                disabled={status === GameStatus.EVALUATING}
                className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              >
                Skip Question
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-lg leading-relaxed">
              {words.map((wordData, index) => (
                <motion.span
                  key={index}
                  onClick={() => handleWordClick(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                    wordData.isSelected
                      ? 'bg-red-500 text-white'
                      : selectedWordIndex === index
                      ? 'bg-yellow-500/30 text-yellow-200'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {wordData.isSelected && wordData.correction ? (
                    <span className="line-through opacity-60">{wordData.word}</span>
                  ) : (
                    wordData.word
                  )}
                  {wordData.isSelected && wordData.correction && (
                    <span className="ml-1 text-emerald-400 no-underline">{wordData.correction}</span>
                  )}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Correction Input */}
          {selectedWordIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">
                  Correct &quot;<span className="text-yellow-400">{words[selectedWordIndex]?.word}</span>&quot; to:
                </p>
                <input
                  type="text"
                  value={correctionInput}
                  onChange={(e) => setCorrectionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCorrection()}
                  placeholder="Type correction..."
                  autoFocus
                  className="w-full bg-black/40 border-2 border-yellow-500/50 text-white rounded-xl px-4 py-2 focus:border-yellow-500 outline-none"
                />
              </div>
              <button
                onClick={handleCorrection}
                disabled={!correctionInput.trim()}
                className="px-4 py-2 bg-yellow-500 text-black rounded-xl font-bold self-end disabled:opacity-30"
              >
                Mark
              </button>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={status === GameStatus.EVALUATING}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl font-game text-xl hover:scale-[1.01] active:scale-95 transition-all text-white shadow-lg disabled:opacity-50"
          >
            {status === GameStatus.EVALUATING ? 'CHECKING...' : 'SUBMIT CORRECTIONS'}
          </button>
        </motion.div>
      )}

      {/* SHOWING_RESULT State */}
      {status === GameStatus.SHOWING_RESULT && evaluation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Results</h3>
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getScoreColor(evaluation.score)} flex items-center justify-center text-3xl font-black text-white`}>
                {evaluation.score}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                <p className="text-xl font-bold text-white">{evaluation.totalErrors}</p>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Found</p>
                <p className="text-xl font-bold text-emerald-400">{evaluation.found}</p>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Fixed</p>
                <p className="text-xl font-bold text-cyan-400">{evaluation.correctFixes}</p>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">False</p>
                <p className="text-xl font-bold text-red-400">{evaluation.falsePositives}</p>
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Feedback</p>
              <p className="text-slate-300">{evaluation.feedback}</p>
            </div>

            {/* Solutions */}
            {evaluation.solutions && evaluation.solutions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">All Errors</p>
                <div className="space-y-2">
                  {evaluation.solutions.map((sol, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-red-400 line-through">{sol.word}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-emerald-400">{sol.correction}</span>
                      <span className="text-slate-500 text-xs">({sol.errorType})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Corrected paragraph in context */}
            {challenge && evaluation.solutions && evaluation.solutions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">In Context</p>
                <p className="text-slate-300 leading-relaxed">
                  {renderCorrectedParagraph(challenge.paragraph, evaluation.solutions)}
                </p>
              </div>
            )}
          </div>

          {isMicroEvent ? (
            <div className="glass p-4 rounded-xl text-center">
              <p className="text-sm text-emerald-400 font-bold">Round complete</p>
              <p className="text-xs opacity-50 mt-1">Advance the flight to continue.</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleNewRound}
                className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
              >
                NEW PARAGRAPH
              </button>
              <button
                onClick={handleSameChallenge}
                className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30"
              >
                SAME TEXT, NEW STUDENT
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
