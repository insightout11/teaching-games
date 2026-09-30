'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bot, Eye, EyeOff, Lightbulb, X, KeyRound, Mic, Send, HelpCircle, Trophy, ArrowRight } from 'lucide-react';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import type { TwentyQCard, TwentyQRoom } from '@/components/student/twenty-questions-panel';
import type { GameProps, GameRemoteVote } from '../types';
import { GameStatus } from './types';
import type { Question, Guess, GameConstraints } from './types';
import { useSessionStore } from '@/stores/session-store';
import { GenerationLoader } from '@/components/ui/generation-loader';

// ─── Constraint Validation ────────────────────────────────────────

const YES_NO_STARTERS = /^(is|are|do|does|did|can|could|would|will|have|has|was|were|shall|should)\b/i;
const W_STARTERS = /^(who|what|where|when|why|how)\b/i;

function validateQuestion(text: string, constraints: GameConstraints): { valid: boolean; reason?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { valid: false, reason: 'Empty question' };

  if (constraints.questionStyle === 'wh' && !W_STARTERS.test(trimmed)) {
    return { valid: false, reason: 'Must start with Who/What/Where/When/Why/How' };
  }

  if (constraints.questionStyle === 'yesno' && !YES_NO_STARTERS.test(trimmed)) {
    return { valid: false, reason: 'Must be a yes/no question' };
  }

  return { valid: true };
}

// ─── Fuzzy Guess Matching ─────────────────────────────────────────

// Levenshtein edit distance — small values mean a likely typo of the same word.
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[n];
}

// A secret word matches a guess word on exact, containment, or a small typo (edit distance
// scaled to length) — so "marie curry"/"curei" still count as guessing "Marie Curie".
function wordMatches(secretWord: string, guessWord: string): boolean {
  if (secretWord === guessWord) return true;
  if (guessWord.includes(secretWord) || secretWord.includes(guessWord)) return true;
  const tolerance = secretWord.length >= 5 ? 2 : secretWord.length >= 4 ? 1 : 0;
  return tolerance > 0 && editDistance(secretWord, guessWord) <= tolerance;
}

function fuzzyMatch(guess: string, secret: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\b(a|an|the|is|it)\b/g, '').trim().split(/\s+/).filter(Boolean);
  const secretWords = normalize(secret);
  const guessWords = normalize(guess);
  if (secretWords.length === 0) return false;
  return secretWords.every((w) => guessWords.some((gw) => wordMatches(w, gw)));
}

// STRICT match for detecting a QUESTION that names the secret. Unlike fuzzyMatch (used for explicit
// guesses, where typos are forgiven), this requires the whole secret phrase to appear in the
// question — so an ordinary question that merely shares a word/fragment can't trigger a false win.
function questionNamesSecret(question: string, secret: string): boolean {
  const clean = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\b(a|an|the)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const s = clean(secret);
  if (!s) return false;
  return clean(question).includes(s);
}

// ─── Constraint Rules Text ────────────────────────────────────────

function getConstraintRules(constraints: GameConstraints): string {
  if (constraints.questionStyle === 'wh') return 'Rules: WH-questions only (Who/What/Where/When/Why/How)';
  if (constraints.questionStyle === 'yesno') return 'Rules: Yes/No questions only';
  return '';
}

// ─── Main Component ──────────────────────────────────────────────

export function TwentyQuestionsGame({
  students,
  currentStudentId,
  onScore,
  onPickStudent,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
}: GameProps) {
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  // ─── State ───
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [hostId, setHostId] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [secretOverride, setSecretOverride] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [winner, setWinner] = useState<{ name: string; id: string } | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState(false);
  const [secretVisible, setSecretVisible] = useState(false);
  const [secretOverrideVisible, setSecretOverrideVisible] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [hintLoading, setHintLoading] = useState(false);
  // Why a phone's question was not accepted (shown on that phone only).
  const [rejections, setRejections] = useState<Record<string, { reason: string; n: number }>>({});
  // Speak it: raised hands (queue order) and who is asking right now.
  const [hands, setHands] = useState<Array<{ clientId: string; name: string; studentId: string }>>([]);
  const [called, setCalled] = useState<{ clientId: string; name: string; questionId: string } | null>(null);
  const calledRef = useRef(called);
  calledRef.current = called;
  const reject = (clientId: string, reason: string) =>
    setRejections((prev) => ({ ...prev, [clientId]: { reason, n: (prev[clientId]?.n ?? 0) + 1 } }));
  const clearRejection = (clientId: string) =>
    setRejections((prev) => { if (!prev[clientId]) return prev; const n = { ...prev }; delete n[clientId]; return n; });
  // Secrets the AI has already used this session — sent as an avoid-list so
  // "New Game" doesn't keep landing on the single most obvious pick (e.g. Minecraft → creeper).
  const usedSecretsRef = useRef<string[]>([]);

  // Constraints (configurable in IDLE)
  const [constraints, setConstraints] = useState<GameConstraints>({
    questionStyle: 'any',
    questionLimit: 20,
    turnTimerSeconds: 30,
    askMode: 'speak',
  });

  const isSimultaneous = students.length >= 2;
  // Speak it needs a person to hear the question: the AI keeper always uses typed questions.
  const speakMode = constraints.askMode === 'speak' && !aiMode;
  const aiModeRef = useRef(aiMode);
  aiModeRef.current = aiMode;
  const answeredQuestions = questions.filter((q) => q.answer !== null);
  const unansweredQuestions = questions.filter((q) => q.answer === null);
  const totalQuestionsAsked = answeredQuestions.length;
  // ─── Refs ───
  const statusRef = useRef(status);
  statusRef.current = status;
  const hostIdRef = useRef(hostId);
  hostIdRef.current = hostId;
  const hostNameRef = useRef(hostName);
  hostNameRef.current = hostName;
  const secretRef = useRef(secret);
  secretRef.current = secret;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const constraintsRef = useRef(constraints);
  constraintsRef.current = constraints;
  const guessesRef = useRef(guesses);
  guessesRef.current = guesses;

  // Keep the live Q&A feed pinned to the newest answer so the teacher doesn't have to scroll.
  const qnaScrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = qnaScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [answeredQuestions.length]);

  // ─── Phones: one live panel (keeper answers on their phone; askers get feedback) ───
  useEffect(() => {
    const phase: TwentyQRoom['phase'] | null =
      status === GameStatus.WAITING_FOR_SECRET ? 'secret'
        : status === GameStatus.COLLECTING_QUESTIONS ? 'asking'
          : status === GameStatus.GUESSING ? 'guessing' : null;
    if (!phase) { onSetInputSpec?.(null); return; }
    const pending = questions.find((q) => q.answer === null) ?? null;
    const data: Record<string, unknown> = {
      __room: {
        phase,
        remaining: Math.max(0, constraints.questionLimit - totalQuestionsAsked),
        style: constraints.questionStyle,
        pending: pending ? { id: pending.id, text: pending.text, asker: pending.askerName } : null,
        askMode: speakMode ? 'speak' : 'type',
        keeper: aiMode ? 'the AI' : hostName,
      } satisfies TwentyQRoom,
    };
    if (hostId) {
      const keeper: TwentyQCard = { role: 'keeper', ...(secret ? { secret } : {}) };
      data[hostId] = keeper;
      if (hostName) data[hostName] = keeper;
    }
    Object.keys(rejections).forEach((clientId) => { data[clientId] = { role: 'asker', rejected: rejections[clientId] } satisfies TwentyQCard; });
    if (speakMode) {
      hands.forEach((h) => { data[h.clientId] = { role: 'asker', handUp: true } satisfies TwentyQCard; });
      if (called) data[called.clientId] = { role: 'asker', yourTurn: true } satisfies TwentyQCard;
    }
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'twenty-questions',
      prompt: phase === 'secret' ? `${hostName} is choosing a secret` : phase === 'asking' ? 'Ask a question' : 'Guess the secret',
      // Many questions/guesses per student: no roundId; live updates keep typed text.
      allowMultiple: true,
      stableInput: true,
      perStudentData: data,
    });
  }, [status, hostId, hostName, secret, questions, constraints, totalQuestionsAsked, rejections, hands, called, speakMode, aiMode, onSetInputSpec]);

  // A correct guess ends the round. Shared by the guessing phase AND the questioning phase — a
  // question that already names the secret ("Is it the great wall?") is really a guess, so it
  // wins instead of just getting a "yes" and letting play continue.
  const registerCorrectGuess = useCallback((guessText: string, displayName: string, studentId: string) => {
    const qCount = questionsRef.current.length;
    let points = 10;
    if (qCount <= 10) points += 5;
    else if (qCount <= 15) points += 2;

    onScore(studentId, { isCorrect: true, points, responseData: { guess: guessText, questionsUsed: qCount } });
    setWinner({ name: displayName, id: studentId });
    setGuesses((prev) => [...prev, { text: guessText, guesserName: displayName, guesserId: studentId, isCorrect: true, roundNumber: 1 }]);

    if (hostIdRef.current) {
      onScore(hostIdRef.current, { isCorrect: true, points: 3, responseData: { role: 'host' } });
    }
    setStatus(GameStatus.ENDED);
  }, [onScore]);

  // ─── Remote Vote Handler ───
  const handleRemoteVote = useCallback((vote: GameRemoteVote) => {
    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;
    const raw = vote.choice?.trim();
    if (!raw) return;
    const m = /^(secret|ask|guess|answer|hand):([\s\S]*)$/.exec(raw);
    const kind = m?.[1] ?? null;
    const text = (m ? m[2] : raw).trim();
    if (!text) return;
    const isKeeper = !!hostIdRef.current && (studentId === hostIdRef.current || vote.clientId === hostIdRef.current || vote.displayName === hostNameRef.current);
    const currentStatus = statusRef.current;

    // Keeper sets the secret
    if (currentStatus === GameStatus.WAITING_FOR_SECRET) {
      if (!isKeeper || (kind && kind !== 'secret')) return;
      setSecret(text);
      setSecretVisible(false);
      setStatus(GameStatus.COLLECTING_QUESTIONS);
      return;
    }

    // Keeper answers from their phone: answer:<questionId>:<yes|no|maybe|sort of>
    if (kind === 'answer') {
      if (!isKeeper || currentStatus !== GameStatus.COLLECTING_QUESTIONS) return;
      const sep = text.indexOf(':');
      if (sep < 0) return;
      handleAnswerQuestion(text.slice(0, sep), text.slice(sep + 1));
      return;
    }

    if (currentStatus === GameStatus.COLLECTING_QUESTIONS && kind === 'hand') {
      if (isKeeper) return;
      setHands((prev) => (prev.some((h) => h.clientId === vote.clientId) || calledRef.current?.clientId === vote.clientId ? prev : [...prev, { clientId: vote.clientId, name: vote.displayName, studentId }]));
      return;
    }

    // Speak it: the called student may type their spoken question onto the board.
    if (currentStatus === GameStatus.COLLECTING_QUESTIONS && kind === 'ask' && constraintsRef.current.askMode === 'speak' && !aiModeRef.current) {
      const c = calledRef.current;
      if (!c || c.clientId !== vote.clientId) return;
      if (questionNamesSecret(text, secretRef.current)) { registerCorrectGuess(text, vote.displayName, studentId); return; }
      setQuestions((prev) => prev.map((q) => (q.id === c.questionId ? { ...q, text: /[?]$/.test(text) ? text : `${text}?` } : q)));
      return;
    }

    if (currentStatus === GameStatus.COLLECTING_QUESTIONS) {
      if (isKeeper || kind === 'guess') return;
      if (questionNamesSecret(text, secretRef.current)) {
        registerCorrectGuess(text, vote.displayName, studentId);
        return;
      }
      const { valid, reason } = validateQuestion(text, constraintsRef.current);
      if (!valid) { reject(vote.clientId, reason ?? 'That question doesn’t fit the rules'); return; }
      const currentQuestions = questionsRef.current;
      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[?.!]+$/, '').trim();
      if (currentQuestions.some((q) => norm(q.text) === norm(text))) { reject(vote.clientId, 'Someone already asked that'); return; }
      if (currentQuestions.length >= constraintsRef.current.questionLimit) {
        setStatus(GameStatus.GUESSING);
        return;
      }
      clearRejection(vote.clientId);
      setQuestions((prev) => [...prev, {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: /[?]$/.test(text) ? text : `${text}?`,
        askerName: vote.displayName,
        askerId: studentId,
        answer: null,
        roundNumber: 1,
      }]);
      return;
    }

    if (currentStatus === GameStatus.GUESSING) {
      if (isKeeper) return;
      if (fuzzyMatch(text, secretRef.current)) {
        registerCorrectGuess(text, vote.displayName, studentId);
      } else {
        setGuesses((prev) => [...prev, { text, guesserName: vote.displayName, guesserId: studentId, isCorrect: false, roundNumber: 1 }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerCorrectGuess]);

  // Register remote vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleRemoteVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, handleRemoteVote]);

  // ─── Teacher Actions ───

  const handlePickHost = () => {
    setStatus(GameStatus.PICKING_HOST);
    onPickStudent();
  };

  // Start branches on the chosen keeper: AI Keeper skips the host entirely and picks a
  // topic-related secret; Student Keeper picks a student to hold the secret.
  const handleStart = () => {
    if (aiMode) {
      setStatus(GameStatus.PICKING_HOST); // reuse the loader while the AI picks
      void handleAiPickSecret();
    } else {
      handlePickHost();
    }
  };

  // When teacher picks a student, they become host — Student Keeper mode ONLY.
  // In AI Keeper mode the loader also uses PICKING_HOST, but there must be NO
  // student host (the AI keeps the secret). Without this guard the last-selected
  // student would be silently made keeper and blocked from asking questions.
  useEffect(() => {
    if (!aiMode && status === GameStatus.PICKING_HOST && currentStudentId) {
      const student = students.find((s) => s.id === currentStudentId);
      if (student) {
        setHostId(currentStudentId);
        setHostName(student.name);
        setStatus(GameStatus.WAITING_FOR_SECRET);
      }
    }
  }, [aiMode, status, currentStudentId, students]);

  // ─── AI Auto-Answer Effect ───
  useEffect(() => {
    if (!aiMode || status !== GameStatus.COLLECTING_QUESTIONS || aiLoading !== null) return;
    const next = questions.find((q) => q.answer === null);
    if (next) handleAiAutoAnswer(next.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMode, status, aiLoading, questions]);

  const handleTeacherOverrideSecret = () => {
    if (!secretOverride.trim()) return;
    setSecret(secretOverride.trim());
    setSecretOverride('');
    setSecretVisible(false);
    setStatus(GameStatus.COLLECTING_QUESTIONS);
  };

  const handleAiPickSecret = async () => {
    try {
      const res = await fetch('/api/twenty-questions/pick-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: sessionSettings.customTopic || sessionSettings.topic, difficulty: sessionSettings.difficulty, avoid: usedSecretsRef.current, ...(sourceMaterial ? { sourceMaterial } : {}) }),
      });
      if (!res.ok) throw new Error('Failed');
      const data: { secret: string } = await res.json();
      usedSecretsRef.current = [...usedSecretsRef.current, data.secret].slice(-15);
      setSecret(data.secret);
      setSecretVisible(false);
      setStatus(GameStatus.COLLECTING_QUESTIONS);
    } catch {
      // AI pick failed — return to setup so the teacher can retry or switch to Student Keeper.
      setStatus(GameStatus.IDLE);
    }
  };

  const handleGetHint = async () => {
    if (hintLoading || !secret) return;
    setHintLoading(true);
    try {
      const res = await fetch('/api/twenty-questions/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          topic: sessionSettings.customTopic || sessionSettings.topic,
          tone: sessionSettings.tone,
          questionsHistory: answeredQuestions.map((q) => ({ question: q.text, answer: q.answer })),
          existingHints: hints,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data: { hint: string } = await res.json();
      if (data.hint) setHints((prev) => [...prev, data.hint]);
    } catch {
      // Silent — hints are optional; teacher can just try again.
    } finally {
      setHintLoading(false);
    }
  };

  const handleAnswerQuestion = (questionId: string, answer: string) => {
    if (calledRef.current?.questionId === questionId) setCalled(null);
    setQuestions((prev) => {
      const updated = prev.map((q) => (q.id === questionId ? { ...q, answer } : q));
      const answeredCount = updated.filter((q) => q.answer !== null).length;
      if (answeredCount >= constraintsRef.current.questionLimit) {
        setTimeout(() => setStatus(GameStatus.GUESSING), 0);
      }
      return updated;
    });
  };

  const handleAiAutoAnswer = async (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || !secret) return;

    setAiLoading(questionId);
    try {
      const response = await fetch('/api/twenty-questions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          question: question.text,
          tone: sessionSettings.tone,
          questionsHistory: answeredQuestions.map((q) => ({
            question: q.text,
            answer: q.answer,
          })),
        }),
      });

      if (!response.ok) throw new Error('AI answer failed');

      const result: { answer: string; explanation: string } = await response.json();
      handleAnswerQuestion(questionId, result.answer);
    } catch (err) {
      console.error('AI auto-answer error:', err);
    } finally {
      setAiLoading(null);
    }
  };

  const handleGuessPhase = () => {
    setStatus(GameStatus.GUESSING);
  };

  const handleRevealAndEnd = () => {
    // Score the host for hosting even without correct guess
    if (hostId) {
      onScore(hostId, {
        isCorrect: true,
        points: 3,
        responseData: { role: 'host' },
      });
    }
    setStatus(GameStatus.ENDED);
  };

  const handleNewGame = () => {
    setStatus(GameStatus.IDLE);
    setHostId(null);
    setHostName('');
    setSecret('');
    setSecretOverride('');
    setQuestions([]);
    setGuesses([]);
    setWinner(null);
    setAiLoading(null);
    setHints([]);
    setHintLoading(false);
    setRejections({});
    setHands([]);
    setCalled(null);
  };

  // ─── Hint Panel (teacher-triggered, shown to the class) ───

  function renderHintPanel() {
    return (
      <div className="glass p-3 rounded-xl border border-amber-500/20">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300/80 inline-flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Hints{hints.length > 0 ? ` (${hints.length})` : ''}
          </p>
          <button
            onClick={handleGetHint}
            disabled={hintLoading || !secret}
            className="px-3 py-1.5 bg-amber-500/20 text-amber-200 rounded-lg text-xs font-bold hover:bg-amber-500/30 disabled:opacity-30 border border-amber-500/30 inline-flex items-center gap-1.5"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {hintLoading ? 'Thinking…' : hints.length ? 'Another hint' : 'Reveal a hint'}
          </button>
        </div>
        {hints.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {hints.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-amber-100">
                <span className="text-amber-500/70 shrink-0 text-xs mt-0.5 font-bold">{i + 1}.</span>
                <p className="flex-1">{h}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Render ───

  // ===== IDLE =====
  if (status === GameStatus.IDLE) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="text-center">
          <p className="font-display text-5xl text-white">Twenty questions.</p>
          <p className="mt-2 text-lg text-white/70">One keeper, one secret. The class asks questions on their phones to work it out.</p>
          <p className="text-xs text-cyan-400 mt-1">{students.length} student{students.length !== 1 ? 's' : ''} connected</p>
        </div>

        {/* Question style + limits */}
        <div className="glass p-5 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Question Style</h3>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'any' as const, label: 'Any', desc: 'No restriction' },
              { key: 'yesno' as const, label: 'Yes/No', desc: 'Is / Are / Do / Can…' },
              { key: 'wh' as const, label: 'WH-questions', desc: 'Who / What / Where…' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setConstraints((prev) => ({ ...prev, questionStyle: opt.key }))}
                className={`p-3 rounded-xl text-left transition-all border ${
                  constraints.questionStyle === opt.key
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <p className="text-sm font-bold">{opt.label}</p>
                <p className="text-xs opacity-60 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {([['speak', 'Speak it', 'Raise hand, ask out loud (best for speaking)'], ['type', 'Type it', 'Questions typed on phones']] as const).map(([k, label, desc]) => (
              <button key={k} type="button" onClick={() => setConstraints((prev) => ({ ...prev, askMode: k }))} className={`rounded-xl border p-3 text-left ${constraints.askMode === k ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                <span className="flex items-center gap-1.5 text-sm font-bold">{k === 'speak' ? <Mic className="h-4 w-4" /> : <Send className="h-4 w-4" />}{label}</span>
                <span className="mt-0.5 block text-xs opacity-60">{desc}{k === 'speak' ? ' · the AI keeper uses typed questions' : ''}</span>
              </button>
            ))}
          </div>

          {/* Question Limit Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Question Limit</span>
              <span className="font-bold text-white">{constraints.questionLimit}</span>
            </div>
            <input
              type="range"
              min={10}
              max={30}
              step={5}
              value={constraints.questionLimit}
              onChange={(e) => setConstraints((prev) => ({ ...prev, questionLimit: Number(e.target.value) }))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
            </div>
          </div>

          {/* Turn Timer */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Round Timer {isSimultaneous ? '(per round)' : ''}</span>
              <span className="font-bold text-white">{constraints.turnTimerSeconds}s</span>
            </div>
            <input
              type="range"
              min={15}
              max={60}
              step={5}
              value={constraints.turnTimerSeconds}
              onChange={(e) => setConstraints((prev) => ({ ...prev, turnTimerSeconds: Number(e.target.value) }))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>15s</span><span>30s</span><span>45s</span><span>60s</span>
            </div>
          </div>
        </div>

        {/* Who keeps the secret */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setAiMode(false)}
            className={`p-3 rounded-xl text-left transition-all border ${
              !aiMode ? 'bg-violet-500/20 border-violet-500/40 text-violet-200' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-bold"><Users className="w-4 h-4" /> Student Keeper</span>
            <span className="mt-0.5 block text-xs opacity-60">A student holds the secret; the class asks & guesses.</span>
          </button>
          <button
            onClick={() => setAiMode(true)}
            className={`p-3 rounded-xl text-left transition-all border ${
              aiMode ? 'bg-blue-500/20 border-blue-500/40 text-blue-200' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-bold"><Bot className="w-4 h-4" /> AI Keeper</span>
            <span className="mt-0.5 block text-xs opacity-60">The AI picks a topic-related secret; everyone guesses.</span>
          </button>
        </div>

        <div className="flex justify-center">
          <KitButton tone="violet" solid onClick={handleStart} className="!px-8 !py-3 !text-base" icon={aiMode ? <Bot className="h-4 w-4" /> : <Users className="h-4 w-4" />}>
            {aiMode ? 'Start: the AI picks a secret' : 'Pick the keeper'}
          </KitButton>
        </div>
      </motion.div>
    );
  }

  // ===== PICKING_HOST =====
  if (status === GameStatus.PICKING_HOST) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GenerationLoader label="game" />
      </motion.div>
    );
  }

  // ===== WAITING_FOR_SECRET =====
  if (status === GameStatus.WAITING_FOR_SECRET) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="glass p-6 rounded-2xl border-2 border-violet-500/30 text-center">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">The keeper</p>
          <h2 className="font-display text-5xl text-white mb-2">{hostName}</h2>
          <p className="text-slate-300 text-lg">is choosing a secret on their phone…</p>
          <div className="mt-4 w-8 h-8 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto" />
        </div>

        {/* Teacher override */}
        <div className="glass p-4 rounded-xl border border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Teacher Override</p>
          <div className="flex gap-2">
            <input
              type={secretOverrideVisible ? 'text' : 'password'}
              value={secretOverride}
              onChange={(e) => setSecretOverride(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTeacherOverrideSecret()}
              placeholder="Type the secret for the keeper..."
              className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setSecretOverrideVisible((v) => !v)}
              className="px-2 text-slate-400 hover:text-white"
              title={secretOverrideVisible ? 'Hide' : 'Show'}
            >
              {secretOverrideVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={handleTeacherOverrideSecret}
              disabled={!secretOverride.trim()}
              className="px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-bold hover:bg-violet-500/30 disabled:opacity-30"
            >
              Set
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Clue board: every answered question, sorted into what it IS and what it ISN'T.
  const clueBoard = () => {
    const yes = answeredQuestions.filter((q) => q.answer === 'yes' || q.answer === 'sort of');
    const no = answeredQuestions.filter((q) => q.answer === 'no');
    const other = answeredQuestions.filter((q) => !['yes', 'no', 'sort of'].includes(q.answer ?? ''));
    const Col = ({ title, items, tone }: { title: string; items: Question[]; tone: 'emerald' | 'rose' | 'amber' }) => (
      <div className={`rounded-2xl border p-3 ${tone === 'emerald' ? 'border-emerald-300/35 bg-emerald-400/[0.06]' : tone === 'rose' ? 'border-rose-300/35 bg-rose-400/[0.06]' : 'border-amber-300/30 bg-amber-300/[0.05]'}`}>
        <KitLabel tone={tone}>{title} · {items.length}</KitLabel>
        <div className="mt-2 space-y-1">
          {items.map((q) => (
            <motion.p key={q.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-base leading-snug">
              {q.text}{q.answer === 'sort of' && <span className="ml-1 font-mono text-[11px] text-amber-200">sort of</span>}
              {!['yes', 'no', 'sort of'].includes(q.answer ?? '') && q.answer !== 'maybe' && <span className="block text-sm italic text-white/60">→ {q.answer}</span>}
            </motion.p>
          ))}
          {items.length === 0 && <p className="text-sm text-white/35">Nothing yet</p>}
        </div>
      </div>
    );
    return (
      <div className={`grid gap-3 ${other.length ? 'sm:grid-cols-3' : 'grid-cols-2'}`}>
        <Col title="It is…" items={yes} tone="emerald" />
        <Col title="It isn’t…" items={no} tone="rose" />
        {other.length > 0 && <Col title="Maybe / other" items={other} tone="amber" />}
      </div>
    );
  };

  const counterDots = () => (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: constraints.questionLimit }).map((_, i) => (
        <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < totalQuestionsAsked ? 'bg-violet-400' : 'bg-white/12'}`} />
      ))}
    </div>
  );

  // Teacher-only peek (held down), so a stray click never shows the secret to the class.
  const secretPeek = () => (
    <button
      type="button"
      onPointerDown={() => setSecretVisible(true)}
      onPointerUp={() => setSecretVisible(false)}
      onPointerLeave={() => setSecretVisible(false)}
      className="flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1 text-xs text-white/60 hover:text-white"
      title="Hold to peek (the class can see your screen)"
    >
      {secretVisible ? <><Eye className="h-3.5 w-3.5" />{secret}</> : <><EyeOff className="h-3.5 w-3.5" />Hold to peek</>}
    </button>
  );

  // Speak it: call the next raised hand; their question is logged for the keeper to answer.
  const callNext = (h?: { clientId: string; name: string; studentId: string }) => {
    const next = h ?? hands[0];
    if (!next || calledRef.current) return;
    const id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setQuestions((prev) => [...prev, { id, text: `${next.name} asks… (listen)`, askerName: next.name, askerId: next.studentId, answer: null, roundNumber: 1 }]);
    setHands((prev) => prev.filter((x) => x.clientId !== next.clientId));
    setCalled({ clientId: next.clientId, name: next.name, questionId: id });
  };

  // ===== COLLECTING_QUESTIONS =====
  if (status === GameStatus.COLLECTING_QUESTIONS) {
    const nextQ = unansweredQuestions[0] ?? null;
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <KitLabel tone="violet">20 Questions · {aiMode ? 'AI keeper' : `${hostName} keeps the secret`}</KitLabel>
          <div className="flex items-center gap-2">
            {secretPeek()}
            <KitButton tone="amber" onClick={handleGuessPhase}>Guess now</KitButton>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {counterDots()}
          <KitReadout>{totalQuestionsAsked} / {constraints.questionLimit}</KitReadout>
        </div>

        <div className="flex min-h-[150px] flex-col items-center justify-center rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-6 text-center">
          <AnimatePresence mode="wait">
            {nextQ ? (
              <motion.div key={nextQ.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <KitLabel>{nextQ.askerName} asks</KitLabel>
                <p className="font-display text-4xl leading-snug">{nextQ.text}</p>
                {aiMode ? (
                  <p className="text-sky-200"><Bot className="mr-1 inline h-4 w-4" />Thinking…</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-white/60"><KeyRound className="mr-1 inline h-4 w-4" />{hostName} answers on their phone</p>
                    {/* Fallback if the keeper is stuck or offline */}
                    <div className="flex justify-center gap-1.5 opacity-70 hover:opacity-100">
                      {(['yes', 'no', 'maybe'] as const).map((a) => <KitButton key={a} onClick={() => handleAnswerQuestion(nextQ.id, a)}>{a}</KitButton>)}
                      <KitButton disabled={aiLoading !== null} onClick={() => void handleAiAutoAnswer(nextQ.id)} icon={<Bot className="h-3.5 w-3.5" />}>{aiLoading === nextQ.id ? '…' : 'AI'}</KitButton>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                <p className="font-display text-3xl text-white/70">Ask on your phones!</p>
                {getConstraintRules(constraints) && <p className="text-amber-200"><HelpCircle className="mr-1 inline h-4 w-4" />{getConstraintRules(constraints)}</p>}
              </motion.div>
            )}
          </AnimatePresence>
          {unansweredQuestions.length > 1 && <p className="mt-3 font-mono text-xs text-white/45">+{unansweredQuestions.length - 1} waiting</p>}
        </div>

        {speakMode && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <KitLabel tone="emerald">Hands up · {hands.length}</KitLabel>
            {hands.map((h) => (
              <button key={h.clientId} type="button" disabled={!!called} onClick={() => callNext(h)} className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-sm hover:bg-white/10 disabled:opacity-40">{h.name}</button>
            ))}
            {hands.length === 0 && !called && <span className="text-sm text-white/45">Raise your hand on your phone to ask</span>}
            <span className="ml-auto" />
            {called
              ? <KitReadout>{called.name} is asking</KitReadout>
              : <KitButton tone="emerald" solid disabled={hands.length === 0} onClick={() => callNext()} icon={<Mic className="h-3.5 w-3.5" />}>{hands[0] ? `Call ${hands[0].name}` : 'Call next'}</KitButton>}
          </div>
        )}
        {answeredQuestions.length > 0 && clueBoard()}
        {renderHintPanel()}
      </div>
    );
  }

  // ===== GUESSING =====
  if (status === GameStatus.GUESSING) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="amber">Guessing time</KitLabel>
          {secretPeek()}
        </div>
        <p className="text-center font-display text-4xl">What is it? Guess on your phones!</p>
        {clueBoard()}
        <div className="flex min-h-[44px] flex-wrap gap-2">
          <AnimatePresence>
            {guesses.map((g, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-base">
                <X className="h-3.5 w-3.5 text-rose-300" /><span className="text-white/45">{g.guesserName}:</span> {g.text}
              </motion.span>
            ))}
          </AnimatePresence>
          {guesses.length === 0 && <p className="text-sm text-white/40">Guesses appear here…</p>}
        </div>
        {renderHintPanel()}
        <div className="flex justify-end">
          <KitButton tone="amber" solid onClick={handleRevealAndEnd} className="!px-6 !py-2.5 !text-sm">Reveal the secret</KitButton>
        </div>
      </div>
    );
  }

  // ===== ENDED =====
  if (status === GameStatus.ENDED) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="text-center">
          <KitLabel tone="violet">The secret was</KitLabel>
          <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }} className="mt-2 font-display text-6xl text-violet-200">{secret}</motion.p>
          {winner ? (
            <p className="mt-3 flex items-center justify-center gap-2 text-xl"><Trophy className="h-5 w-5 text-amber-300" /><span className="font-semibold">{winner.name}</span> got it in {questions.length} question{questions.length !== 1 ? 's' : ''}!</p>
          ) : (
            <p className="mt-3 text-xl text-amber-200">Nobody cracked it this time!</p>
          )}
          {hostName && <p className="mt-1 text-sm text-white/55">Keeper: {hostName} (+3)</p>}
        </div>
        {answeredQuestions.length > 0 && clueBoard()}
        <div className="flex justify-center">
          <KitButton tone="violet" solid onClick={handleNewGame} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>New game</KitButton>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
