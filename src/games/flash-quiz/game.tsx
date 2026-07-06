'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, ChevronRight, SkipForward, Trophy, AlertCircle } from 'lucide-react';
import type { GameProps, GameRemoteVote } from '../types';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import type { InputSpec } from '@/lib/input-spec';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: string[]; // exactly 4
  correctIndex: number;
  explanation: string;
}

interface StudentAnswer {
  studentId: string;
  clientId: string;
  displayName: string;
  choiceIndex: number;
  timeRemaining: number;
  isCorrect: boolean;
  pointsEarned: number;
}

type QuizPhase = 'idle' | 'loading' | 'answering' | 'revealing' | 'leaderboard' | 'finished';

// Grace period after timer hits 0 — keeps phase 'answering' so in-flight votes still land
const REVEAL_GRACE_MS = 1500;

const OPTION_COLORS = ['bg-red-600', 'bg-blue-600', 'bg-amber-500', 'bg-green-600'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// ─── In-game leaderboard ──────────────────────────────────────────────────────

interface LeaderEntry { studentId: string; name: string; totalPoints: number; rankAward?: number }

function MiniLeaderboard({ entries }: { entries: LeaderEntry[] }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="space-y-2">
      {entries.slice(0, 5).map((e, i) => (
        <div
          key={e.studentId}
          className={`flex items-center justify-between px-4 py-3 rounded-xl ${
            i === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
            i === 1 ? 'bg-gray-400/10 border border-gray-400/20' :
            i === 2 ? 'bg-amber-700/10 border border-amber-700/20' :
            'bg-lc-surface'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg w-7">{medals[i] ?? <span className="text-lc-text2 font-bold text-sm">{i + 1}</span>}</span>
            <span className="font-semibold">{e.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {e.rankAward !== undefined && (
              <span className="text-xs font-bold text-green-400 bg-green-500/15 border border-green-500/25 px-2 py-0.5 rounded-full">
                +{e.rankAward}
              </span>
            )}
            <span className="font-game text-yellow-400">{e.totalPoints}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────

export function FlashQuizGame({
  students,
  onScore,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
}: GameProps) {
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [roundAnswers, setRoundAnswers] = useState<StudentAnswer[]>([]);
  const [, setCacheId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<10 | 20>(10);

  // Internal quiz scores — NOT written to session store until quiz ends
  const [internalScores, setInternalScores] = useState<Map<string, { name: string; totalPoints: number }>>(() => new Map());
  const internalScoresRef = useRef<Map<string, { name: string; totalPoints: number }>>(new Map());
  const [rankAwards, setRankAwards] = useState<Map<string, number>>(() => new Map());

  // Refs for use inside callbacks (avoid stale closures)
  const phaseRef = useRef<QuizPhase>('idle');
  phaseRef.current = phase;
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;
  const questionsRef = useRef<QuizQuestion[]>([]);
  questionsRef.current = questions;
  const roundAnswersRef = useRef<StudentAnswer[]>([]);
  roundAnswersRef.current = roundAnswers;
  const scoredAnswersRef = useRef<Set<string>>(new Set());
  const roundStartRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer seconds comes from session settings (controlled by the dropdown on the game card)
  const timerSeconds = sessionSettings.timerSeconds ?? 30;
  const timerSecondsRef = useRef(timerSeconds);
  timerSecondsRef.current = timerSeconds;

  const topic = getEffectiveTopic(sessionSettings);
  const { difficulty } = sessionSettings;
  const seenCacheIds = useSessionStore((s) => s.seenCacheIds);
  const addSeenCacheId = useSessionStore((s) => s.addSeenCacheId);
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  // Travel review game: when the class has a trip log (Travel arc only writes one), this quiz
  // becomes a fixed 5-question review grounded on the trip the class actually took.
  const tripLog = useSessionStore((s) => s.tripLog);
  const isTrip = tripLog.length > 0;
  const effectiveCount = isTrip ? 5 : questionCount;

  // ── Build in-game leaderboard from internalScores ─────────────────────────
  const leaderboardEntries: LeaderEntry[] = (() => {
    const entries: LeaderEntry[] = [];
    internalScores.forEach((data, studentId) => {
      entries.push({ studentId, name: data.name, totalPoints: data.totalPoints });
    });
    // Include students who haven't scored yet
    students.forEach((s) => {
      if (!internalScores.has(s.id)) {
        entries.push({ studentId: s.id, name: s.name, totalPoints: 0 });
      }
    });
    return entries.sort((a, b) => b.totalPoints - a.totalPoints);
  })();

  // ── InputSpec broadcasting ────────────────────────────────────────────────
  const broadcastQuestion = useCallback((
    question: QuizQuestion,
    perStudentData: Record<string, unknown> = {},
  ) => {
    onSetInputSpec?.({
      type: 'choice',
      gameKey: 'flash-quiz',
      prompt: question.question,
      options: question.options,
      timerSeconds: timerSecondsRef.current,
      startedAt: roundStartRef.current,
      perStudentData,
    } as InputSpec);
  }, [onSetInputSpec]);

  // ── Remote vote handler ───────────────────────────────────────────────────
  const handleVote = useCallback((vote: GameRemoteVote) => {
    if (phaseRef.current !== 'answering') return;

    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    // Deduplicate
    if (roundAnswersRef.current.some((a) => a.studentId === studentId)) return;

    const choiceIndex = parseInt(vote.choice, 10);
    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex > 3) return;

    const question = questionsRef.current[currentIndexRef.current];
    if (!question) return;

    // Calculate time remaining from round start
    const elapsedSec = (Date.now() - roundStartRef.current) / 1000;
    const ts = timerSecondsRef.current;
    const timeRemaining = Math.max(0, ts - elapsedSec);

    const isCorrect = choiceIndex === question.correctIndex;
    const base = isCorrect ? 100 : 0;
    const speedBonus = isCorrect ? Math.round((timeRemaining / ts) * 25) : 0;
    const pointsEarned = base + speedBonus;

    const answer: StudentAnswer = {
      studentId,
      clientId: vote.clientId,
      displayName: vote.displayName,
      choiceIndex,
      timeRemaining,
      isCorrect,
      pointsEarned,
    };

    // Accumulate into internal quiz scores (NOT session store)
    setInternalScores((prev) => {
      const next = new Map(prev);
      const existing = next.get(studentId);
      next.set(studentId, {
        name: vote.displayName || studentId,
        totalPoints: (existing?.totalPoints ?? 0) + pointsEarned,
      });
      internalScoresRef.current = next;
      return next;
    });

    // Sound
    try {
      const audio = new Audio(isCorrect ? '/sounds/correct.mp3' : '/sounds/wrong.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch { /* ignore */ }

    setRoundAnswers((prev) => {
      const updated = [...prev, answer];

      // Lock this student on their device
      const q = questionsRef.current[currentIndexRef.current];
      if (q) {
        const perStudentData: Record<string, unknown> = {};
        updated.forEach((a) => { perStudentData[a.clientId] = { locked: true }; });
        onSetInputSpec?.({
          type: 'choice',
          gameKey: 'flash-quiz',
          prompt: q.question,
          options: q.options,
          timerSeconds: timerSecondsRef.current,
          startedAt: roundStartRef.current,
          perStudentData,
        } as InputSpec);
      }

      return updated;
    });
  }, [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, handleVote]);

  // ── Timer countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'answering') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ── Fetch questions ───────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setPhase('loading');
    setInternalScores(new Map());
    internalScoresRef.current = new Map();
    scoredAnswersRef.current = new Set();
    setRankAwards(new Map());
    try {
      const res = await fetch('/api/flash-quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty,
          count: effectiveCount,
          excludeCacheIds: seenCacheIds,
          // Ground the quiz in the lesson's article/video when one is attached.
          ...(sourceMaterial ? { sourceMaterial } : {}),
          // Travel review: ground the quiz in the trip the class actually took.
          ...(isTrip ? { trip: { stops: tripLog } } : {}),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { questions: QuizQuestion[]; cacheId: string | null };
      setQuestions(data.questions);
      setCacheId(data.cacheId);
      if (data.cacheId) addSeenCacheId(data.cacheId);
      setPhase('idle'); // ready to start first question
    } catch (err) {
      console.error('[FlashQuiz] generation failed:', err);
      setPhase('idle');
    }
  }, [topic, difficulty, effectiveCount, isTrip, tripLog, seenCacheIds, addSeenCacheId, sourceMaterial]);

  // ── Start a question round ────────────────────────────────────────────────
  const startQuestion = useCallback((index: number) => {
    const question = questionsRef.current[index];
    if (!question) return;
    setCurrentIndex(index);
    setRoundAnswers([]);
    setTimeLeft(timerSecondsRef.current);
    roundStartRef.current = Date.now();
    setPhase('answering');
    broadcastQuestion(question);
  }, [broadcastQuestion]);

  // ── Reveal current question ───────────────────────────────────────────────
  const revealQuestion = useCallback(() => {
    if (phaseRef.current !== 'answering') return; // guard against double-calls
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('revealing');

    // Push result feedback to each student device
    const question = questionsRef.current[currentIndexRef.current];
    if (!question) return;
    roundAnswersRef.current.forEach((answer) => {
      const scoreKey = `${currentIndexRef.current}:${answer.studentId}`;
      if (scoredAnswersRef.current.has(scoreKey)) return;
      scoredAnswersRef.current.add(scoreKey);
      onScore(answer.studentId, {
        isCorrect: answer.isCorrect,
        points: answer.isCorrect ? 3 : 1,
        responseData: {
          clientId: answer.clientId,
          questionIndex: currentIndexRef.current,
          choiceIndex: answer.choiceIndex,
          quizPoints: answer.pointsEarned,
          timeRemaining: answer.timeRemaining,
        },
      });
    });
    const perStudentData: Record<string, unknown> = {};
    roundAnswersRef.current.forEach((a) => {
      perStudentData[a.clientId] = {
        locked: true,
        result: a.isCorrect ? 'correct' : 'incorrect',
        pointsEarned: a.pointsEarned,
      };
    });
    onSetInputSpec?.({
      type: 'choice',
      gameKey: 'flash-quiz',
      prompt: question.question,
      options: question.options,
      timerSeconds: timerSecondsRef.current,
      startedAt: roundStartRef.current,
      perStudentData,
    } as InputSpec);
  }, [onScore, onSetInputSpec]);

  // Auto-reveal when timer hits 0, with grace period for in-flight submissions
  useEffect(() => {
    if (phase !== 'answering' || timeLeft !== 0) return;
    const grace = setTimeout(() => revealQuestion(), REVEAL_GRACE_MS);
    return () => clearTimeout(grace);
  }, [phase, timeLeft, revealQuestion]);

  // Auto-reveal when all students have answered
  useEffect(() => {
    if (phase === 'answering' && students.length > 0 && roundAnswers.length >= students.length) {
      revealQuestion();
    }
  }, [phase, roundAnswers.length, students.length, revealQuestion]);

  // ── Advance to leaderboard ────────────────────────────────────────────────
  const showLeaderboard = useCallback(() => {
    onSetInputSpec?.(null);
    setPhase('leaderboard');
  }, [onSetInputSpec]);

  // ── Advance to next question or finish ────────────────────────────────────
  const advance = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex >= questionsRef.current.length) {
      setPhase('finished');
    } else {
      startQuestion(nextIndex);
    }
  }, [startQuestion]);

  // ── Derived data for reveal phase ─────────────────────────────────────────
  const currentQuestion = questions[currentIndex] ?? null;
  const distribution = currentQuestion
    ? currentQuestion.options.map((_, i) => roundAnswers.filter((a) => a.choiceIndex === i).length)
    : [0, 0, 0, 0];
  const totalAnswers = roundAnswers.length;
  const correctCount = roundAnswers.filter((a) => a.isCorrect).length;
  const accuracy = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : null;
  const mostPickedWrong: { index: number; count: number } | null = (() => {
    if (!currentQuestion || totalAnswers === 0) return null;
    let best: { index: number; count: number } | null = null;
    distribution.forEach((cnt, i) => {
      if (i !== currentQuestion.correctIndex && cnt > 0) {
        if (!best || cnt > best.count) best = { index: i, count: cnt };
      }
    });
    if (!best) return null;
    return (best as { index: number; count: number }).count >= Math.ceil(totalAnswers * 0.3) ? best : null;
  })();

  // ─── Render ───────────────────────────────────────────────────────────────

  // IDLE — not yet loaded
  if (phase === 'idle' && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <Zap className="w-10 h-10 text-violet-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-game text-lc-text">{isTrip ? 'Trip Quiz' : 'Flash Quiz'}</h2>
          <p className="text-lc-text2 text-sm max-w-xs">
            {isTrip
              ? `5 questions about your trip — ${timerSeconds} seconds each. All students answer together.`
              : `topic-generated quiz — ${timerSeconds} seconds per question. All students answer simultaneously.`}
          </p>
        </div>
        {/* Question count toggle — fixed at 5 for the trip review */}
        {!isTrip && (
          <div className="flex items-center gap-1 p-1 bg-lc-surface rounded-xl border border-lc-border">
            {([10, 20] as const).map((n) => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  questionCount === n
                    ? 'bg-violet-500 text-white shadow'
                    : 'text-lc-text2 hover:text-lc-text'
                }`}
              >
                {n} questions
              </button>
            ))}
          </div>
        )}
        <button
          onClick={fetchQuestions}
          className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          {isTrip ? 'Start Trip Quiz' : 'Generate Questions'}
        </button>
      </div>
    );
  }

  // LOADING
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-lc-text2">Generating quiz questions…</p>
      </div>
    );
  }

  // IDLE — questions ready, not started
  if (phase === 'idle' && questions.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <Zap className="w-10 h-10 text-violet-400" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-game text-lc-text">Ready!</h2>
          <p className="text-lc-text2 text-sm">{questions.length} questions · {timerSeconds}s each</p>
        </div>
        <button
          onClick={() => startQuestion(0)}
          className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  // ANSWERING
  if (phase === 'answering' && currentQuestion) {
    const timerPct = (timeLeft / timerSeconds) * 100;
    const timerColor = timerPct > 50 ? 'bg-green-500' : timerPct > 25 ? 'bg-amber-500' : 'bg-red-500';

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-lc-text2 font-medium">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-lc-text3">Points = correctness + speed</span>
        </div>

        {/* Question */}
        <div className="bg-lc-surface rounded-2xl p-5 border border-lc-border">
          <p className="text-xl font-semibold text-lc-text leading-snug">{currentQuestion.question}</p>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-2 gap-3">
          {currentQuestion.options.map((option, i) => (
            <div
              key={i}
              className={`${OPTION_COLORS[i]} rounded-xl p-4 opacity-80`}
            >
              <div className="text-xs font-black uppercase tracking-widest text-white/70 mb-1">{OPTION_LABELS[i]}</div>
              <div className="text-sm font-semibold text-white leading-snug">{option}</div>
            </div>
          ))}
        </div>

        {/* Timer */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-lc-text2">Time remaining</span>
            <span className={`font-black ${timeLeft <= 5 ? 'text-red-400' : 'text-lc-text'}`}>{timeLeft}s</span>
          </div>
          <div className="w-full h-3 bg-lc-surface rounded-full overflow-hidden border border-lc-border">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>

        {/* Status + controls */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-lc-text2">
            {totalAnswers} / {students.length} answered
          </span>
          <button
            onClick={revealQuestion}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-lc-surface border border-lc-border rounded-xl text-lc-text2 hover:bg-lc-card transition-all"
          >
            <SkipForward className="w-4 h-4" />
            End Round Early
          </button>
        </div>
      </div>
    );
  }

  // REVEALING
  if (phase === 'revealing' && currentQuestion) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-lc-text2 font-medium">
            Question {currentIndex + 1} of {questions.length}
          </span>
          {accuracy !== null && (
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              accuracy >= 70 ? 'bg-green-500/20 text-green-400' :
              accuracy >= 40 ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {accuracy}% correct
            </span>
          )}
        </div>

        {/* Question */}
        <div className="bg-lc-surface rounded-2xl p-4 border border-lc-border">
          <p className="text-lg font-semibold text-lc-text leading-snug">{currentQuestion.question}</p>
        </div>

        {/* Options with distribution */}
        <div className="space-y-2">
          {currentQuestion.options.map((option, i) => {
            const isCorrect = i === currentQuestion.correctIndex;
            const count = distribution[i];
            const barPct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;

            return (
              <div
                key={i}
                className={`relative rounded-xl overflow-hidden border ${
                  isCorrect
                    ? 'border-green-500/60 bg-green-500/10'
                    : 'border-lc-border bg-lc-surface'
                }`}
              >
                {/* Distribution fill */}
                {barPct > 0 && (
                  <div
                    className={`absolute inset-0 ${isCorrect ? 'bg-green-500/20' : 'bg-lc-card'}`}
                    style={{ width: `${barPct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black uppercase tracking-widest w-5 ${
                      isCorrect ? 'text-green-400' : 'text-lc-text3'
                    }`}>{OPTION_LABELS[i]}</span>
                    <span className={`text-sm font-medium ${isCorrect ? 'text-green-300' : 'text-lc-text'}`}>
                      {option}
                    </span>
                    {isCorrect && <span className="text-green-400 text-sm font-bold">✓</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-lc-text2">
                    <span className="font-bold">{count}</span>
                    <span className="opacity-50">({barPct}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight row */}
        {mostPickedWrong !== null && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              Most students chose <strong>{OPTION_LABELS[(mostPickedWrong as { index: number; count: number }).index]}</strong> — worth discussing why.
            </span>
          </div>
        )}

        {/* Explanation */}
        <div className="px-4 py-3 rounded-xl bg-lc-surface border border-lc-border text-sm text-lc-text2 italic">
          {currentQuestion.explanation}
        </div>

        <p className="text-xs text-lc-text3 text-right">Points = correctness + speed</p>

        <button
          onClick={showLeaderboard}
          className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Trophy className="w-4 h-4" />
          Show Leaderboard
        </button>
      </div>
    );
  }

  // LEADERBOARD
  if (phase === 'leaderboard') {
    const isLastQuestion = currentIndex >= questions.length - 1;
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-game text-lg text-lc-text">Quiz Standings</h3>
          <span className="text-xs text-lc-text2">After Q{currentIndex + 1}</span>
        </div>
        <MiniLeaderboard entries={leaderboardEntries} />
        <button
          onClick={advance}
          className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {isLastQuestion ? (
            <>
              <Trophy className="w-4 h-4" />
              View Final Results
            </>
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              Next Question ({currentIndex + 2}/{questions.length})
            </>
          )}
        </button>
      </div>
    );
  }

  // FINISHED
  if (phase === 'finished') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2 py-4">
          <div className="text-4xl">🏆</div>
          <h2 className="text-2xl font-game text-lc-text">Quiz Complete!</h2>
          <p className="text-lc-text2 text-sm">{questions.length} questions answered</p>
        </div>
        <MiniLeaderboard entries={leaderboardEntries.map((e) => ({ ...e, rankAward: rankAwards.get(e.studentId) }))} />
        <button
          onClick={fetchQuestions}
          className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Zap className="w-4 h-4" />
          New Quiz
        </button>
      </div>
    );
  }

  return null;
}
