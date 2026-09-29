'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle, ChevronRight, Cloud, Coins, Crown, Heart, Plane, SkipForward, Sparkles,
  Trophy, Users, Wind, Zap, BookOpen,
} from 'lucide-react';
import type { GameProps, GameRemoteVote } from '../types';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import { useRoom } from '@/stores/live-room-store';
import { ANSWERS_OPEN_GRACE_MS, type InputSpec } from '@/lib/input-spec';
import { useSyncedTimer } from '@/hooks/use-synced-timer';
import { GenerationLoader } from '@/components/ui/generation-loader';
import type { SourceMaterial } from '@/types/source-material';
import { KitButton, KitChip, KitLabel, KitReadout, KitStatus } from '@/components/session/widget-kit';

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

type QuizPhase = 'setup' | 'loading' | 'ready' | 'betting' | 'answering' | 'revealing' | 'leaderboard' | 'finished';

/** Game modes: each changes the timer, the scoring or what happens on a wrong answer. */
type QuizMode = 'classic' | 'calm' | 'turbulence' | 'teams' | 'wager' | 'rapid' | 'ourclass';

const MODES: Array<{ key: QuizMode; name: string; blurb: string; icon: typeof Zap }> = [
  { key: 'classic', name: 'Classic race', blurb: 'Right answers and speed earn points.', icon: Zap },
  { key: 'calm', name: 'Calm skies', blurb: 'No rush: only right answers count. Great for beginners.', icon: Cloud },
  { key: 'turbulence', name: 'Turbulence', blurb: 'Three lives each. A wrong answer costs one. Last pilots flying win.', icon: Wind },
  { key: 'teams', name: 'Team battle', blurb: 'Teams (from the Teams widget) race on their average score.', icon: Users },
  { key: 'wager', name: 'Wager', blurb: 'Bet 1–3 before each question: win big if right, lose if wrong.', icon: Coins },
  { key: 'rapid', name: 'Rapid fire', blurb: '10-second questions in quick bursts.', icon: Sparkles },
  { key: 'ourclass', name: 'Our class quiz', blurb: 'Questions from what the class did today (cargo, board, reading).', icon: BookOpen },
];

const REVEAL_GRACE_MS = 1500;
const LIVES = 3;
const BET_WAIT_MS = 12000;

// Answer colours from the widget kit (distinct on a projected screen).
const OPTION_STYLES = [
  { bg: 'bg-cyan-400/15', border: 'border-cyan-300/60', text: 'text-cyan-100', dot: '#67e8f9' },
  { bg: 'bg-violet-400/15', border: 'border-violet-300/60', text: 'text-violet-100', dot: '#c4b5fd' },
  { bg: 'bg-amber-300/15', border: 'border-amber-300/60', text: 'text-amber-100', dot: '#fcd34d' },
  { bg: 'bg-rose-400/15', border: 'border-rose-300/60', text: 'text-rose-100', dot: '#fda4af' },
];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const TEAM_COLORS = ['#67e8f9', '#fcd34d', '#fda4af', '#c4b5fd'];

// ─── Altitude race: every pilot climbs with their score ────────────────────────

interface LeaderEntry { id: string; name: string; points: number; lives?: number; color?: string; members?: string }

function AltitudeBoard({ entries, showLives }: { entries: LeaderEntry[]; showLives: boolean }) {
  const top = Math.max(1, ...entries.map((e) => e.points));
  if (!entries.length) {
    return <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/50">No pilots yet: planes appear here as students answer.</p>;
  }
  return (
    <div className="space-y-2">
      {entries.slice(0, 8).map((e, i) => {
        const out = showLives && (e.lives ?? 1) <= 0;
        return (
          <div key={e.id} className={`rounded-xl border px-3 py-2 ${i === 0 && !out ? 'border-amber-300/50 bg-amber-300/[0.07]' : 'border-white/10 bg-black/20'} ${out ? 'opacity-45' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="w-5 font-mono text-xs text-white/50">{i + 1}</span>
              {i === 0 && !out && <Crown className="h-3.5 w-3.5 text-amber-300" />}
              <span className="min-w-0 flex-1 truncate font-semibold text-white" style={e.color ? { color: e.color } : undefined}>{e.name}</span>
              {showLives && (
                <span className="flex gap-0.5">
                  {Array.from({ length: LIVES }, (_, k) => <Heart key={k} className={`h-3.5 w-3.5 ${k < (e.lives ?? 0) ? 'fill-rose-400 text-rose-400' : 'text-white/20'}`} />)}
                </span>
              )}
              <span className="w-12 text-right font-mono font-bold text-amber-200">{e.points}</span>
            </div>
            {/* The flight track: the plane climbs toward the leader's altitude */}
            <div className="relative mt-1.5 h-2 rounded-full bg-white/[0.06]">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: e.color ?? '#67e8f9', opacity: 0.35 }}
                initial={false}
                animate={{ width: `${(e.points / top) * 100}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              />
              <motion.span
                className="absolute -top-1.5"
                initial={false}
                animate={{ left: `calc(${(e.points / top) * 100}% - 8px)` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              >
                <Plane className="h-4 w-4 -rotate-12 text-white drop-shadow" style={out ? { transform: 'rotate(40deg)' } : undefined} />
              </motion.span>
            </div>
            {e.members && <p className="mt-1 truncate text-[11px] text-white/50">{e.members}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────

export function FlashQuizGame({
  sessionId,
  students,
  onScore,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
}: GameProps) {
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [mode, setMode] = useState<QuizMode>('classic');
  const [bossFinale, setBossFinale] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundAnswers, setRoundAnswers] = useState<StudentAnswer[]>([]);
  const [questionCount, setQuestionCount] = useState<10 | 20>(10);
  const [error, setError] = useState<string | null>(null);

  // Quiz scores, lives and bets (kept inside the game until it ends)
  const [scores, setScores] = useState<Map<string, { name: string; points: number }>>(() => new Map());
  const [lives, setLives] = useState<Map<string, number>>(() => new Map());
  const [bets, setBets] = useState<Map<string, number>>(() => new Map());
  const scoresRef = useRef(scores); scoresRef.current = scores;
  const livesRef = useRef(lives); livesRef.current = lives;
  const betsRef = useRef(bets); betsRef.current = bets;

  const phaseRef = useRef<QuizPhase>('setup'); phaseRef.current = phase;
  const modeRef = useRef<QuizMode>('classic'); modeRef.current = mode;
  const currentIndexRef = useRef(0); currentIndexRef.current = currentIndex;
  const questionsRef = useRef<QuizQuestion[]>([]); questionsRef.current = questions;
  const roundAnswersRef = useRef<StudentAnswer[]>([]); roundAnswersRef.current = roundAnswers;
  const scoredAnswersRef = useRef<Set<string>>(new Set());
  const roundStartRef = useRef<number>(0);

  // Mode timers: calm is roomy, rapid is short.
  const baseTimer = sessionSettings.timerSeconds ?? 30;
  const timerSeconds = mode === 'calm' ? Math.max(45, baseTimer) : mode === 'rapid' ? 10 : baseTimer;
  const timerSecondsRef = useRef(timerSeconds); timerSecondsRef.current = timerSeconds;

  const [roundNonce, setRoundNonce] = useState(0);
  const { timeLeft, opensIn: answersOpenIn } = useSyncedTimer(timerSeconds, phase === 'answering', roundNonce);

  const topic = getEffectiveTopic(sessionSettings);
  const { difficulty } = sessionSettings;
  const seenCacheIds = useSessionStore((s) => s.seenCacheIds);
  const addSeenCacheId = useSessionStore((s) => s.addSeenCacheId);
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  const tripLog = useSessionStore((s) => s.tripLog);
  const isTrip = tripLog.length > 0;
  const { material } = useRoom(sessionId ?? '');

  // "Our class quiz": today's cargo (notes, board, readings) as the quiz source.
  const classSource = useMemo<SourceMaterial | null>(() => {
    const texts = material.filter((m) => m.text || m.description).slice(0, 6);
    if (!texts.length) return null;
    const summary = texts.map((m) => `${m.title}\n${(m.text ?? m.description ?? '').slice(0, 1200)}`).join('\n\n').slice(0, 6000);
    return { sourceType: 'text', sourceKey: `class-${sessionId}`, title: "Today's class", summary, rawText: summary, citations: [] };
  }, [material, sessionId]);

  // Teams: from the Teams widget (same browser), otherwise two teams by roster order.
  const teams = useMemo(() => {
    try {
      const raw = sessionId ? localStorage.getItem(`lc-teams:${sessionId}`) : null;
      const saved = raw ? (JSON.parse(raw) as Array<{ name: string; color: string; members: string[] }>) : [];
      if (saved.length >= 2) return saved.map((t) => ({ name: t.name, color: t.color, members: t.members }));
    } catch { /* fall back */ }
    const a = students.filter((_, i) => i % 2 === 0).map((s) => s.name);
    const b = students.filter((_, i) => i % 2 === 1).map((s) => s.name);
    return [{ name: 'Eagles', color: TEAM_COLORS[0], members: a }, { name: 'Falcons', color: TEAM_COLORS[1], members: b }];
    // Re-read when the mode changes to teams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, students, mode]);

  const isBoss = bossFinale && currentIndex === questions.length - 1 && questions.length > 1;
  const alive = (id: string) => modeRef.current !== 'turbulence' || (livesRef.current.get(id) ?? LIVES) > 0;

  // ── Leaderboard entries ───────────────────────────────────────────────────
  const entries: LeaderEntry[] = useMemo(() => {
    if (mode === 'teams') {
      return teams.map((t) => {
        const member = Array.from(scores.values()).filter((s) => t.members.includes(s.name));
        const avg = member.length ? Math.round(member.reduce((n, s) => n + s.points, 0) / Math.max(1, t.members.length)) : 0;
        return { id: t.name, name: t.name, points: avg, color: t.color, members: t.members.join(', ') };
      }).sort((a, b) => b.points - a.points);
    }
    const list: LeaderEntry[] = [];
    scores.forEach((v, id) => list.push({ id, name: v.name, points: v.points, lives: lives.get(id) ?? LIVES }));
    students.forEach((s) => { if (!scores.has(s.id)) list.push({ id: s.id, name: s.name, points: 0, lives: lives.get(s.id) ?? LIVES }); });
    return list.sort((a, b) => (mode === 'turbulence' ? ((b.lives ?? 0) > 0 ? 1 : 0) - ((a.lives ?? 0) > 0 ? 1 : 0) : 0) || b.points - a.points);
  }, [lives, mode, scores, students, teams]);

  // ── Broadcasting to phones ────────────────────────────────────────────────
  const lockedFor = useCallback((extra: Record<string, unknown> = {}) => {
    const data: Record<string, unknown> = { ...extra };
    // Grounded pilots in Turbulence can't answer.
    if (modeRef.current === 'turbulence') {
      livesRef.current.forEach((l, id) => {
        const a = roundAnswersRef.current.find((x) => x.studentId === id);
        if (l <= 0 && a) data[a.clientId] = { locked: true };
      });
    }
    return data;
  }, []);

  const broadcastQuestion = useCallback((question: QuizQuestion, perStudentData: Record<string, unknown> = {}) => {
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

  // ── Votes from phones ─────────────────────────────────────────────────────
  const handleVote = useCallback((vote: GameRemoteVote) => {
    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;
    const choiceIndex = parseInt(vote.choice, 10);

    // Wager: the bet comes before the question.
    if (phaseRef.current === 'betting') {
      if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex > 2 || betsRef.current.has(studentId)) return;
      setBets((prev) => { const next = new Map(prev); next.set(studentId, choiceIndex + 1); betsRef.current = next; return next; });
      return;
    }
    if (phaseRef.current !== 'answering') return;
    if (!alive(studentId)) return;
    if (roundAnswersRef.current.some((a) => a.studentId === studentId)) return;
    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex > 3) return;

    const question = questionsRef.current[currentIndexRef.current];
    if (!question) return;

    const elapsedSec = (Date.now() - roundStartRef.current - ANSWERS_OPEN_GRACE_MS) / 1000;
    const ts = timerSecondsRef.current;
    const timeRemaining = Math.max(0, Math.min(ts, ts - elapsedSec));
    const isCorrect = choiceIndex === question.correctIndex;
    const m = modeRef.current;
    const boss = bossFinale && currentIndexRef.current === questionsRef.current.length - 1 && questionsRef.current.length > 1;
    let points: number;
    if (m === 'calm') points = isCorrect ? 100 : 0;
    else if (m === 'wager') {
      const bet = betsRef.current.get(studentId) ?? 1;
      points = isCorrect ? 60 * bet + Math.round((timeRemaining / ts) * 15) : -30 * bet;
    } else points = isCorrect ? 100 + Math.round((timeRemaining / ts) * 25) : 0;
    if (boss) points *= 2;

    const answer: StudentAnswer = { studentId, clientId: vote.clientId, displayName: vote.displayName, choiceIndex, timeRemaining, isCorrect, pointsEarned: points };

    setScores((prev) => {
      const next = new Map(prev);
      const cur = next.get(studentId);
      next.set(studentId, { name: vote.displayName || studentId, points: Math.max(0, (cur?.points ?? 0) + points) });
      scoresRef.current = next;
      return next;
    });

    setRoundAnswers((prev) => {
      const updated = [...prev, answer];
      const q = questionsRef.current[currentIndexRef.current];
      if (q) {
        const perStudentData: Record<string, unknown> = {};
        updated.forEach((a) => { perStudentData[a.clientId] = { locked: true }; });
        broadcastQuestion(q, perStudentData);
      }
      return updated;
    });
  }, [bossFinale, broadcastQuestion]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, handleVote]);

  // ── Questions ─────────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setScores(new Map()); scoresRef.current = new Map();
    setLives(new Map()); livesRef.current = new Map();
    scoredAnswersRef.current = new Set();
    const count = isTrip ? 5 : mode === 'rapid' ? 15 : questionCount;
    const source = mode === 'ourclass' ? classSource : sourceMaterial;
    try {
      const res = await fetch('/api/flash-quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty,
          count,
          excludeCacheIds: seenCacheIds,
          ...(source ? { sourceMaterial: source } : {}),
          ...(isTrip ? { trip: { stops: tripLog } } : {}),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { questions: QuizQuestion[]; cacheId: string | null };
      setQuestions(data.questions);
      if (data.cacheId) addSeenCacheId(data.cacheId);
      setPhase('ready');
    } catch (err) {
      console.error('[FlashQuiz] generation failed:', err);
      setError('Could not write the quiz right now. Try again.');
      setPhase('setup');
    }
  }, [addSeenCacheId, classSource, difficulty, isTrip, mode, questionCount, seenCacheIds, sourceMaterial, topic, tripLog]);

  const openQuestion = useCallback((index: number) => {
    const question = questionsRef.current[index];
    if (!question) return;
    setRoundAnswers([]);
    const now = Date.now();
    roundStartRef.current = now;
    setRoundNonce(now);
    setPhase('answering');
    broadcastQuestion(question, lockedFor());
  }, [broadcastQuestion, lockedFor]);

  // Wager: everyone bets first (auto-continues after a few seconds).
  const betTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startQuestion = useCallback((index: number) => {
    const question = questionsRef.current[index];
    if (!question) return;
    setCurrentIndex(index);
    if (modeRef.current === 'wager') {
      setBets(new Map()); betsRef.current = new Map();
      setPhase('betting');
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'flash-quiz',
        prompt: 'Place your bet! How sure are you about the next question?',
        options: ['Bet 1', 'Bet 2', 'Bet 3'],
        perStudentData: {},
      } as InputSpec);
      if (betTimer.current) clearTimeout(betTimer.current);
      betTimer.current = setTimeout(() => { if (phaseRef.current === 'betting') openQuestion(index); }, BET_WAIT_MS);
      return;
    }
    openQuestion(index);
  }, [onSetInputSpec, openQuestion]);
  useEffect(() => () => { if (betTimer.current) clearTimeout(betTimer.current); }, []);

  const revealQuestion = useCallback(() => {
    if (phaseRef.current !== 'answering') return;
    setPhase('revealing');
    const question = questionsRef.current[currentIndexRef.current];
    if (!question) return;
    roundAnswersRef.current.forEach((answer) => {
      const key = `${currentIndexRef.current}:${answer.studentId}`;
      if (scoredAnswersRef.current.has(key)) return;
      scoredAnswersRef.current.add(key);
      onScore(answer.studentId, {
        isCorrect: answer.isCorrect,
        points: answer.isCorrect ? 3 : 1,
        responseData: { clientId: answer.clientId, questionIndex: currentIndexRef.current, choiceIndex: answer.choiceIndex, quizPoints: answer.pointsEarned, timeRemaining: answer.timeRemaining, mode: modeRef.current },
      });
    });
    // Turbulence: a wrong answer (or no answer) costs a life.
    if (modeRef.current === 'turbulence') {
      setLives((prev) => {
        const next = new Map(prev);
        const ids = new Set([...students.map((s) => s.id), ...roundAnswersRef.current.map((a) => a.studentId)]);
        ids.forEach((id) => {
          const l = next.get(id) ?? LIVES;
          if (l <= 0) return;
          const a = roundAnswersRef.current.find((x) => x.studentId === id);
          if (!a || !a.isCorrect) next.set(id, l - 1);
          else next.set(id, l);
        });
        livesRef.current = next;
        return next;
      });
    }
    const perStudentData: Record<string, unknown> = {};
    roundAnswersRef.current.forEach((a) => {
      perStudentData[a.clientId] = { locked: true, result: a.isCorrect ? 'correct' : 'incorrect', pointsEarned: a.pointsEarned };
    });
    broadcastQuestion(question, perStudentData);
  }, [broadcastQuestion, onScore, students]);

  useEffect(() => {
    if (phase !== 'answering' || timeLeft !== 0) return;
    const grace = setTimeout(() => revealQuestion(), REVEAL_GRACE_MS);
    return () => clearTimeout(grace);
  }, [phase, timeLeft, revealQuestion]);

  const flying = mode === 'turbulence' ? students.filter((s) => (lives.get(s.id) ?? LIVES) > 0).length : students.length;
  useEffect(() => {
    if (phase === 'answering' && flying > 0 && roundAnswers.length >= flying) revealQuestion();
  }, [phase, roundAnswers.length, flying, revealQuestion]);
  useEffect(() => {
    if (phase === 'betting' && students.length > 0 && bets.size >= students.length) openQuestion(currentIndexRef.current);
  }, [bets.size, openQuestion, phase, students.length]);

  const showLeaderboard = useCallback(() => {
    onSetInputSpec?.(null);
    setPhase('leaderboard');
  }, [onSetInputSpec]);

  const advance = useCallback(() => {
    const next = currentIndexRef.current + 1;
    const turbulenceOver = modeRef.current === 'turbulence' && students.length > 1
      && students.filter((s) => (livesRef.current.get(s.id) ?? LIVES) > 0).length <= 1;
    if (next >= questionsRef.current.length || turbulenceOver) setPhase('finished');
    else startQuestion(next);
  }, [startQuestion, students]);

  // ── Derived data for the reveal ───────────────────────────────────────────
  const currentQuestion = questions[currentIndex] ?? null;
  const distribution = currentQuestion ? currentQuestion.options.map((_, i) => roundAnswers.filter((a) => a.choiceIndex === i).length) : [0, 0, 0, 0];
  const totalAnswers = roundAnswers.length;
  const correctCount = roundAnswers.filter((a) => a.isCorrect).length;
  const accuracy = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : null;
  const mostPickedWrong = (() => {
    if (!currentQuestion || totalAnswers === 0) return null;
    let best: { index: number; count: number } | null = null;
    distribution.forEach((cnt, i) => {
      if (i !== currentQuestion.correctIndex && cnt > 0 && (!best || cnt > best.count)) best = { index: i, count: cnt };
    });
    return best && (best as { index: number; count: number }).count >= Math.ceil(totalAnswers * 0.3) ? best as { index: number; count: number } : null;
  })();
  const modeInfo = MODES.find((m) => m.key === mode)!;
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="flex items-center gap-2">
        <KitStatus state="live" />
        <KitLabel tone="amber">{modeInfo.name}</KitLabel>
      </span>
      <span className="font-mono text-xs text-white/60">Question {currentIndex + 1} / {questions.length}</span>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  if (phase === 'loading') return <GenerationLoader label="quiz" />;

  // SETUP: pick a mode
  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-4">
        <div className="text-center">
          <KitLabel tone="amber" className="mb-1">Flash Quiz</KitLabel>
          <KitReadout className="text-3xl">{isTrip ? 'Trip review quiz' : 'Choose your flight'}</KitReadout>
          <p className="mt-1 text-sm text-white/60">{isTrip ? '5 questions about the trip the class just took.' : `About: ${topic}`}</p>
        </div>
        {!isTrip && (
          <div className="grid gap-2 sm:grid-cols-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              const disabled = m.key === 'ourclass' && !classSource;
              return (
                <button
                  key={m.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setMode(m.key)}
                  className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-40 ${mode === m.key ? 'border-amber-300/70 bg-amber-300/10' : 'border-white/12 bg-black/20 hover:border-white/30'}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${mode === m.key ? 'bg-amber-300 text-[#1a1204]' : 'bg-white/[0.06] text-white/80'}`}><Icon className="h-4 w-4" /></span>
                  <span>
                    <span className="block font-semibold text-white">{m.name}</span>
                    <span className="block text-xs leading-snug text-white/60">{disabled ? 'Add something to cargo first (a note, a board, a reading).' : m.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {!isTrip && mode !== 'rapid' && ([10, 20] as const).map((n) => (
            <KitChip key={n} on={questionCount === n} onClick={() => setQuestionCount(n)}>{n} questions</KitChip>
          ))}
          {mode === 'rapid' && <KitChip on>15 questions</KitChip>}
          <KitChip on={bossFinale} tone="amber" onClick={() => setBossFinale((v) => !v)}>Boss finale (double points)</KitChip>
          <span className="font-mono text-[11px] text-white/50">{timerSeconds}s per question</span>
        </div>
        {error && <p className="text-center text-sm text-rose-200">{error}</p>}
        <div className="flex justify-center">
          <KitButton tone="amber" solid className="px-8 py-2.5 text-sm" icon={<Plane className="h-4 w-4" />} onClick={() => void fetchQuestions()}>
            {isTrip ? 'Start trip quiz' : 'Write the quiz'}
          </KitButton>
        </div>
      </div>
    );
  }

  // READY
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <KitLabel tone="amber">{modeInfo.name}</KitLabel>
        <KitReadout className="text-4xl">Ready for take-off</KitReadout>
        <p className="text-sm text-white/60">{questions.length} questions · {timerSeconds}s each{bossFinale ? ' · boss finale' : ''}{mode === 'turbulence' ? ` · ${LIVES} lives each` : ''}</p>
        <KitButton tone="amber" solid className="px-8 py-2.5 text-sm" icon={<ChevronRight className="h-4 w-4" />} onClick={() => startQuestion(0)}>Start</KitButton>
      </div>
    );
  }

  // BETTING (wager)
  if (phase === 'betting') {
    return (
      <div className="space-y-5">
        {header}
        <div className="rounded-3xl border border-amber-300/40 bg-amber-300/[0.07] p-6 text-center">
          <Coins className="mx-auto h-8 w-8 text-amber-300" />
          <KitReadout className="mt-2 text-3xl">Place your bets!</KitReadout>
          <p className="mt-1 text-sm text-white/70">Bet 1, 2 or 3 on your phone. Right answer: win 60 per point bet. Wrong: lose 30 per point.</p>
          <p className="mt-3 font-mono text-sm text-amber-100">{bets.size} / {students.length} bets in</p>
        </div>
        <div className="flex justify-end">
          <KitButton icon={<SkipForward className="h-3.5 w-3.5" />} onClick={() => openQuestion(currentIndex)}>Show the question</KitButton>
        </div>
      </div>
    );
  }

  // ANSWERING
  if (phase === 'answering' && currentQuestion) {
    const pct = (timeLeft / timerSeconds) * 100;
    return (
      <div className="space-y-5">
        {header}
        {isBoss && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-rose-300/50 bg-rose-400/10 py-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-rose-100">
            <Crown className="h-4 w-4" /> Boss question · double points
          </div>
        )}
        <div className="rounded-3xl border border-white/12 bg-black/25 p-6">
          <KitReadout className="text-2xl sm:text-3xl">{currentQuestion.question}</KitReadout>
        </div>
        {answersOpenIn > 0 ? (
          <div className="flex flex-col items-center gap-1 py-8">
            <KitLabel>Get ready</KitLabel>
            <p key={answersOpenIn} className="font-mono text-7xl font-black text-amber-300">{answersOpenIn}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option, i) => {
              const st = OPTION_STYLES[i];
              return (
                <div key={i} className={`rounded-2xl border-2 p-4 ${st.bg} ${st.border}`}>
                  <div className={`mb-1 font-mono text-xs font-black uppercase tracking-widest ${st.text}`}>{OPTION_LABELS[i]}</div>
                  <div className="text-base font-semibold leading-snug text-white">{option}</div>
                </div>
              );
            })}
          </div>
        )}
        {answersOpenIn === 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-sm">
              <span className="text-white/60">{mode === 'calm' ? 'Take your time' : 'Time'}</span>
              <span className={timeLeft <= 5 ? 'font-bold text-rose-300' : 'font-bold text-white'}>{timeLeft}s</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: pct > 50 ? '#67e8f9' : pct > 25 ? '#fcd34d' : '#fda4af' }} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-white/60">{totalAnswers} / {flying} answered{mode === 'turbulence' ? ` · ${flying} still flying` : ''}</span>
          <KitButton icon={<SkipForward className="h-3.5 w-3.5" />} onClick={revealQuestion}>End round</KitButton>
        </div>
      </div>
    );
  }

  // REVEALING
  if (phase === 'revealing' && currentQuestion) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {header}
        </div>
        {accuracy !== null && (
          <KitLabel tone={accuracy >= 70 ? 'emerald' : accuracy >= 40 ? 'amber' : 'rose'}>{accuracy}% got it right</KitLabel>
        )}
        <div className="rounded-2xl border border-white/12 bg-black/25 p-4">
          <KitReadout>{currentQuestion.question}</KitReadout>
        </div>
        <div className="space-y-2">
          {currentQuestion.options.map((option, i) => {
            const right = i === currentQuestion.correctIndex;
            const count = distribution[i];
            const barPct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
            return (
              <div key={i} className={`relative overflow-hidden rounded-xl border ${right ? 'border-emerald-300/70 bg-emerald-300/10' : 'border-white/10 bg-black/20'}`}>
                <motion.div className={`absolute inset-y-0 left-0 ${right ? 'bg-emerald-300/25' : 'bg-white/[0.06]'}`} initial={{ width: 0 }} animate={{ width: `${barPct}%` }} transition={{ duration: 0.7, delay: i * 0.08 }} />
                <div className="relative flex items-center justify-between px-4 py-3">
                  <span className="flex items-center gap-3">
                    <i className="h-2.5 w-2.5 rounded-full" style={{ background: OPTION_STYLES[i].dot }} />
                    <span className={`text-sm font-medium ${right ? 'text-emerald-100' : 'text-white/85'}`}>{option}</span>
                    {right && <span className="font-mono text-xs font-bold text-emerald-300">CORRECT</span>}
                  </span>
                  <span className="font-mono text-xs text-white/60">{count} ({barPct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
        {mostPickedWrong && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Many chose <strong>{OPTION_LABELS[mostPickedWrong.index]}</strong>: worth talking about why.
          </div>
        )}
        <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm italic text-white/70">{currentQuestion.explanation}</p>
        <KitButton tone="amber" solid className="w-full py-2.5 text-sm" icon={<Trophy className="h-4 w-4" />} onClick={showLeaderboard}>
          {mode === 'teams' ? 'Team standings' : 'Altitude board'}
        </KitButton>
      </div>
    );
  }

  // LEADERBOARD
  if (phase === 'leaderboard') {
    const last = currentIndex >= questions.length - 1;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <KitReadout>{mode === 'teams' ? 'Team standings' : 'Altitude board'}</KitReadout>
          <KitLabel>After Q{currentIndex + 1}</KitLabel>
        </div>
        <AltitudeBoard entries={entries} showLives={mode === 'turbulence'} />
        <KitButton tone="amber" solid className="w-full py-2.5 text-sm" icon={last ? <Trophy className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />} onClick={advance}>
          {last ? 'Final results' : `Next question (${currentIndex + 2}/${questions.length})`}
        </KitButton>
      </div>
    );
  }

  // FINISHED
  if (phase === 'finished') {
    const winner = entries[0];
    return (
      <div className="space-y-5">
        <div className="py-2 text-center">
          <Trophy className="mx-auto h-10 w-10 text-amber-300" />
          <KitLabel tone="amber" className="mt-2">{modeInfo.name} · complete</KitLabel>
          {winner && <KitReadout className="mt-1 text-3xl">{winner.name} {mode === 'teams' ? 'win!' : 'flies highest!'}</KitReadout>}
        </div>
        <AltitudeBoard entries={entries} showLives={mode === 'turbulence'} />
        <div className="flex gap-2">
          <KitButton className="flex-1" onClick={() => setPhase('setup')}>Change mode</KitButton>
          <KitButton tone="amber" solid className="flex-1" icon={<Zap className="h-3.5 w-3.5" />} onClick={() => void fetchQuestions()}>Play again</KitButton>
        </div>
      </div>
    );
  }

  return null;
}
