'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { GameStatus } from './types';
import type { Question, Guess, GameConstraints } from './types';

// ─── Constraint Validation ────────────────────────────────────────

const YES_NO_STARTERS = /^(is|are|do|does|did|can|could|would|will|have|has|was|were|shall|should)\b/i;
const W_STARTERS = /^(who|what|where|when|why|how)\b/i;

function validateQuestion(text: string, constraints: GameConstraints): { valid: boolean; reason?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { valid: false, reason: 'Empty question' };

  if (constraints.fullSentenceRequired) {
    if (!trimmed.endsWith('?')) return { valid: false, reason: 'Must end with ?' };
    if (trimmed.split(/\s+/).length < 4) return { valid: false, reason: 'Must be at least 4 words' };
  }

  if (constraints.wQuestionRequired && !W_STARTERS.test(trimmed)) {
    return { valid: false, reason: 'Must start with Who/What/Where/When/Why/How' };
  }

  if (constraints.noYesNo && YES_NO_STARTERS.test(trimmed)) {
    return { valid: false, reason: 'No yes/no questions allowed' };
  }

  if (constraints.yesNoOnly && !YES_NO_STARTERS.test(trimmed)) {
    return { valid: false, reason: 'Must be a yes/no question' };
  }

  return { valid: true };
}

// ─── Fuzzy Guess Matching ─────────────────────────────────────────

function fuzzyMatch(guess: string, secret: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\b(a|an|the|is|it)\b/g, '').trim().split(/\s+/).filter(Boolean);
  const secretWords = normalize(secret);
  const guessWords = normalize(guess);
  if (secretWords.length === 0) return false;
  return secretWords.every((w) => guessWords.some((gw) => gw === w || gw.includes(w) || w.includes(gw)));
}

// ─── Constraint Rules Text ────────────────────────────────────────

function getConstraintRules(constraints: GameConstraints): string {
  const rules: string[] = [];
  if (constraints.fullSentenceRequired) rules.push('Full sentence ending with ?');
  if (constraints.wQuestionRequired) rules.push('Start with Who/What/Where/When/Why/How');
  if (constraints.noYesNo) rules.push('No yes/no questions');
  if (constraints.yesNoOnly) rules.push('Yes/no questions only');
  return rules.length > 0 ? `Rules: ${rules.join(' | ')}` : '';
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
  const [aiPickingSecret, setAiPickingSecret] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [secretVisible, setSecretVisible] = useState(false);
  const [secretOverrideVisible, setSecretOverrideVisible] = useState(false);
  const [customAnswerDraft, setCustomAnswerDraft] = useState<Record<string, string>>({});

  // Constraints (configurable in IDLE)
  const [constraints, setConstraints] = useState<GameConstraints>({
    yesNoOnly: false,
    wQuestionRequired: false,
    noYesNo: false,
    fullSentenceRequired: false,
    questionLimit: 20,
    turnTimerSeconds: 30,
  });

  const isSimultaneous = students.length >= 2;
  const answeredQuestions = questions.filter((q) => q.answer !== null);
  const unansweredQuestions = questions.filter((q) => q.answer === null);
  const totalQuestionsAsked = answeredQuestions.length;
  // ─── Refs ───
  const statusRef = useRef(status);
  statusRef.current = status;
  const hostIdRef = useRef(hostId);
  hostIdRef.current = hostId;
  const secretRef = useRef(secret);
  secretRef.current = secret;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const constraintsRef = useRef(constraints);
  constraintsRef.current = constraints;
  const guessesRef = useRef(guesses);
  guessesRef.current = guesses;

  // ─── InputSpec Effect ───
  useEffect(() => {
    if (status === GameStatus.WAITING_FOR_SECRET) {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'twenty-questions',
        prompt: `${hostName}, type your secret! (person, place, or thing)`,
        placeholder: 'e.g. The Eiffel Tower',
        maxLength: 100,
      });
    } else if (status === GameStatus.COLLECTING_QUESTIONS) {
      const remaining = constraints.questionLimit - totalQuestionsAsked;
      const rulesText = getConstraintRules(constraints);
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'twenty-questions',
        prompt: `Ask a question! (${remaining} left)${rulesText ? `\n${rulesText}` : ''}`,
        placeholder: 'Type your question...',
        maxLength: 200,
        hint: rulesText ? { title: 'Question Rules', content: rulesText } : undefined,
      });
    } else if (status === GameStatus.GUESSING) {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'twenty-questions',
        prompt: 'What is it? Submit your guess!',
        placeholder: 'Type your guess...',
        maxLength: 100,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, hostName, constraints, totalQuestionsAsked, onSetInputSpec]);

  // ─── Remote Vote Handler ───
  const handleRemoteVote = useCallback((vote: GameRemoteVote) => {
    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;
    const text = vote.choice?.trim();
    if (!text) return;

    const currentStatus = statusRef.current;

    // WAITING_FOR_SECRET: only host can submit
    if (currentStatus === GameStatus.WAITING_FOR_SECRET) {
      if (studentId !== hostIdRef.current) return;
      setSecret(text);
      setSecretVisible(false);
      setStatus(GameStatus.COLLECTING_QUESTIONS);
      return;
    }

    // COLLECTING_QUESTIONS: reject host, validate constraints
    if (currentStatus === GameStatus.COLLECTING_QUESTIONS) {
      if (studentId === hostIdRef.current) return;
      const { valid } = validateQuestion(text, constraintsRef.current);
      if (!valid) return; // silently drop invalid

      const currentQuestions = questionsRef.current;
      const answeredCount = currentQuestions.filter((q) => q.answer !== null).length;
      if (answeredCount >= constraintsRef.current.questionLimit) {
        // Limit already reached via answered questions — switch to guessing
        setStatus(GameStatus.GUESSING);
        return;
      }

      const newQuestion: Question = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        askerName: vote.displayName,
        askerId: studentId,
        answer: null,
        roundNumber: 1,
      };
      setQuestions((prev) => [...prev, newQuestion]);
      return;
    }

    // GUESSING: reject host, fuzzy-match guess
    if (currentStatus === GameStatus.GUESSING) {
      if (studentId === hostIdRef.current) return;
      const secretVal = secretRef.current;
      const isCorrect = fuzzyMatch(text, secretVal);

      const newGuess: Guess = {
        text,
        guesserName: vote.displayName,
        guesserId: studentId,
        isCorrect,
        roundNumber: 1,
      };
      setGuesses((prev) => [...prev, newGuess]);

      if (isCorrect) {
        // Score the guesser
        const qCount = questionsRef.current.length;
        let points = 10;
        if (qCount <= 10) points += 5;
        else if (qCount <= 15) points += 2;

        onScore(studentId, {
          isCorrect: true,
          points,
          responseData: { guess: text, questionsUsed: qCount },
        });

        setWinner({ name: vote.displayName, id: studentId });

        // Score the host for hosting
        if (hostIdRef.current) {
          onScore(hostIdRef.current, {
            isCorrect: true,
            points: 3,
            responseData: { role: 'host' },
          });
        }

        setStatus(GameStatus.ENDED);
      }
      return;
    }
  }, [isSimultaneous, onScore]);

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

  // When teacher picks a student, they become host
  useEffect(() => {
    if (status === GameStatus.PICKING_HOST && currentStudentId) {
      const student = students.find((s) => s.id === currentStudentId);
      if (student) {
        setHostId(currentStudentId);
        setHostName(student.name);
        setStatus(GameStatus.WAITING_FOR_SECRET);
      }
    }
  }, [status, currentStudentId, students]);

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
    setAiPickingSecret(true);
    try {
      const res = await fetch('/api/twenty-questions/pick-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: sessionSettings.customTopic || sessionSettings.topic, difficulty: sessionSettings.difficulty }),
      });
      if (!res.ok) throw new Error('Failed');
      const data: { secret: string } = await res.json();
      setSecret(data.secret);
      setSecretVisible(false);
      setStatus(GameStatus.COLLECTING_QUESTIONS);
    } catch {
      // fall back — teacher types it manually
    } finally {
      setAiPickingSecret(false);
    }
  };

  const handleAnswerQuestion = (questionId: string, answer: string) => {
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
  };

  // ─── Answer Badge Helper ───

  function renderAnswerBadge(answer: string) {
    const base = 'shrink-0 text-center text-xs px-2 py-0.5 rounded-full font-bold';
    if (answer === 'yes') return <span className={`${base} w-14 bg-green-500/20 text-green-300`}>yes</span>;
    if (answer === 'no')  return <span className={`${base} w-14 bg-red-500/20 text-red-300`}>no</span>;
    if (answer === 'maybe') return <span className={`${base} w-14 bg-yellow-500/20 text-yellow-300`}>maybe</span>;
    return <span className={`${base} bg-slate-500/20 text-slate-300 max-w-[120px] truncate`}>{answer}</span>;
  }

  function renderAnsweredRow(q: Question, extraClasses = '') {
    const isShort = q.answer === 'yes' || q.answer === 'no' || q.answer === 'maybe';
    if (isShort) {
      return (
        <div className={`flex items-center gap-2 ${extraClasses}`}>
          {renderAnswerBadge(q.answer!)}
          <span className="text-slate-400 truncate">{q.text}</span>
          <span className="text-xs text-slate-600 shrink-0">— {q.askerName}</span>
        </div>
      );
    }
    return (
      <div className={extraClasses}>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="truncate">{q.text}</span>
          <span className="text-xs text-slate-600 shrink-0">— {q.askerName}</span>
        </div>
        <div className="text-xs text-slate-300 italic mt-0.5">→ {q.answer}</div>
      </div>
    );
  }

  // ─── Render ───

  // ===== IDLE =====
  if (status === GameStatus.IDLE) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="text-center">
          <p className="opacity-70 text-sm">A student picks a secret — others ask questions to deduce it!</p>
          <p className="text-xs text-cyan-400 mt-1">{students.length} student{students.length !== 1 ? 's' : ''} connected</p>
        </div>

        {/* Constraint Toggles */}
        <div className="glass p-5 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Question Rules</h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'fullSentenceRequired' as const, label: 'Full Sentences', desc: 'Must end with ? and 4+ words' },
              { key: 'wQuestionRequired' as const, label: 'W-Questions Only', desc: 'Who/What/Where/When/Why/How' },
              { key: 'noYesNo' as const, label: 'No Yes/No Qs', desc: 'Block Is/Are/Do/Does starters' },
              { key: 'yesNoOnly' as const, label: 'Yes/No Only', desc: 'Must use auxiliary verb starters' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setConstraints((prev) => {
                    const next = { ...prev, [opt.key]: !prev[opt.key] };
                    // Mutually exclusive: noYesNo and yesNoOnly
                    if (opt.key === 'noYesNo' && next.noYesNo) next.yesNoOnly = false;
                    if (opt.key === 'yesNoOnly' && next.yesNoOnly) next.noYesNo = false;
                    // yesNoOnly and wQuestionRequired are incompatible
                    if (opt.key === 'yesNoOnly' && next.yesNoOnly) next.wQuestionRequired = false;
                    if (opt.key === 'wQuestionRequired' && next.wQuestionRequired) next.yesNoOnly = false;
                    return next;
                  });
                }}
                className={`p-3 rounded-xl text-left transition-all border ${
                  constraints[opt.key]
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <p className="text-sm font-bold">{opt.label}</p>
                <p className="text-xs opacity-60 mt-0.5">{opt.desc}</p>
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

        {/* AI Mode toggle */}
        <button
          onClick={() => setAiMode((v) => !v)}
          className={`w-full py-3 rounded-xl font-game text-sm transition-all border ${
            aiMode
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          {aiMode ? '🤖 AI MODE ON — AI picks secret & auto-answers' : '🤖 AI MODE — AI picks & answers everything'}
        </button>

        <button
          onClick={handlePickHost}
          className="w-full px-12 py-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
        >
          {aiMode ? 'START (AI PICKS SECRET)' : 'PICK HOST & START'}
        </button>
      </motion.div>
    );
  }

  // ===== PICKING_HOST =====
  if (status === GameStatus.PICKING_HOST) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-12">
        <div className="w-16 h-16 border-4 border-violet-500/10 border-t-violet-500 rounded-full animate-spin" />
        <p className="font-game text-xl text-violet-400 uppercase tracking-widest animate-pulse">Picking Host...</p>
      </motion.div>
    );
  }

  // ===== WAITING_FOR_SECRET =====
  if (status === GameStatus.WAITING_FOR_SECRET) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="glass p-6 rounded-2xl border-2 border-violet-500/30 text-center">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Waiting for Host</p>
          <h2 className="text-3xl font-black text-white mb-2">{hostName}</h2>
          <p className="text-slate-400 text-sm">is typing their secret on their device...</p>
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
              placeholder="Type the secret for the host..."
              className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setSecretOverrideVisible((v) => !v)}
              className="px-2 text-slate-400 hover:text-white"
              title={secretOverrideVisible ? 'Hide' : 'Show'}
            >
              {secretOverrideVisible ? '🙈' : '👁'}
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
        {aiMode && (
          <button
            onClick={handleAiPickSecret}
            disabled={aiPickingSecret}
            className="w-full py-3 bg-blue-500/20 text-blue-300 rounded-xl font-game text-sm border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50"
          >
            {aiPickingSecret ? 'AI is picking...' : '🤖 AI PICKS THE SECRET'}
          </button>
        )}
      </motion.div>
    );
  }

  // ===== COLLECTING_QUESTIONS =====
  if (status === GameStatus.COLLECTING_QUESTIONS) {
    const remaining = constraints.questionLimit - totalQuestionsAsked;
    const nextQ = unansweredQuestions[0] ?? null;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">
              {aiMode ? '🤖 AI Mode' : `${hostName} is the host`}
            </p>
            <p className="text-sm text-slate-400">
              {remaining} question{remaining !== 1 ? 's' : ''} remaining
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-bold">
              {totalQuestionsAsked}/{constraints.questionLimit}
            </div>
            <button onClick={handleGuessPhase} className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg font-game text-xs border border-amber-500/30 hover:bg-amber-500/30">
              GUESS
            </button>
          </div>
        </div>

        {/* Secret (teacher-only blur) */}
        <div className="flex justify-between items-center px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <span className="text-xs text-slate-500">Secret</span>
          <button onClick={() => setSecretVisible((v) => !v)} className="text-violet-300 font-bold text-sm">
            <span className={secretVisible ? '' : 'blur-sm select-none'}>{secret}</span>
          </button>
        </div>

        {/* Next unanswered question — answering zone */}
        {nextQ ? (
          <div className="glass p-5 rounded-2xl border-2 border-violet-500/30 space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">{nextQ.askerName} asks:</p>
              <p className="text-xl font-semibold text-white">{nextQ.text}</p>
            </div>
            {aiMode ? (
              <div className="flex items-center gap-2 text-blue-300 text-sm animate-pulse">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
                AI is answering…
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  {(['yes', 'no', 'maybe'] as const).map((ans) => (
                    <button
                      key={ans}
                      onClick={() => handleAnswerQuestion(nextQ.id, ans)}
                      disabled={aiLoading === nextQ.id}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-30 ${
                        ans === 'yes' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30'
                        : ans === 'no' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30'
                      }`}
                    >
                      {ans.toUpperCase()}
                    </button>
                  ))}
                  <button
                    onClick={() => handleAiAutoAnswer(nextQ.id)}
                    disabled={aiLoading !== null}
                    className="px-3 py-2.5 bg-blue-500/20 text-blue-300 rounded-xl text-xs font-bold hover:bg-blue-500/30 disabled:opacity-30 border border-blue-500/30"
                  >
                    {aiLoading === nextQ.id ? '…' : 'AI'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or type a custom answer..."
                    value={customAnswerDraft[nextQ.id] ?? ''}
                    onChange={(e) => setCustomAnswerDraft((prev) => ({ ...prev, [nextQ.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customAnswerDraft[nextQ.id]?.trim()) {
                        handleAnswerQuestion(nextQ.id, customAnswerDraft[nextQ.id].trim());
                        setCustomAnswerDraft((prev) => ({ ...prev, [nextQ.id]: '' }));
                      }
                    }}
                    className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:border-violet-500 outline-none"
                  />
                  <button
                    onClick={() => {
                      const val = customAnswerDraft[nextQ.id]?.trim();
                      if (val) { handleAnswerQuestion(nextQ.id, val); setCustomAnswerDraft((prev) => ({ ...prev, [nextQ.id]: '' })); }
                    }}
                    disabled={!customAnswerDraft[nextQ.id]?.trim()}
                    className="px-3 py-1.5 bg-slate-500/20 text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-500/30 border border-slate-500/30 disabled:opacity-30"
                  >
                    Set
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="glass p-5 rounded-2xl border border-white/10 text-center">
            <p className="text-slate-400 text-sm">Waiting for students to ask questions…</p>
            {getConstraintRules(constraints) && (
              <p className="text-xs text-amber-300 mt-2">{getConstraintRules(constraints)}</p>
            )}
          </div>
        )}

        {/* Q&A history */}
        {answeredQuestions.length > 0 && (
          <div className="glass p-4 rounded-xl border border-white/5 max-h-48 overflow-y-auto">
            <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Q&A History</p>
            <div className="space-y-1">
              {answeredQuestions.map((q, i) => (
                <div key={q.id} className="flex items-start gap-2">
                  <span className="text-slate-600 w-5 shrink-0 text-xs mt-0.5">{i + 1}.</span>
                  <div className="flex-1">{renderAnsweredRow(q, 'text-sm py-0.5')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending unanswered (beyond the first) */}
        {unansweredQuestions.length > 1 && (
          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-400">
            +{unansweredQuestions.length - 1} more question{unansweredQuestions.length - 1 !== 1 ? 's' : ''} queued
          </div>
        )}

      </motion.div>
    );
  }

  // ===== GUESSING =====
  if (status === GameStatus.GUESSING) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Guess Phase</p>
          <p className="text-sm text-slate-400">Students submit their guesses!</p>
        </div>

        {/* Q&A Transcript */}
        <div className="glass p-4 rounded-xl border border-white/10 max-h-48 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
            Q&A History ({answeredQuestions.length} questions)
          </p>
          <div className="space-y-1">
            {answeredQuestions.map((q) => (
              <div key={q.id}>{renderAnsweredRow(q, 'text-xs py-0.5')}</div>
            ))}
          </div>
        </div>

        {/* Secret (teacher only) */}
        <div className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-center">
          <p className="text-xs text-slate-500">Secret</p>
          <button
            onClick={() => setSecretVisible((v) => !v)}
            className="text-lg font-bold text-violet-300"
            title={secretVisible ? 'Click to hide' : 'Click to reveal'}
          >
            <span className={secretVisible ? '' : 'blur-sm select-none'}>
              {secret}
            </span>
          </button>
        </div>

        {/* Guess feed */}
        <div className="glass p-4 rounded-xl border border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">Guesses</p>
          {guesses.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Waiting for guesses...</p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {guesses.map((g, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      g.isCorrect ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5'
                    }`}
                  >
                    <span className={`text-lg ${g.isCorrect ? '' : 'opacity-50'}`}>
                      {g.isCorrect ? '\u2713' : '\u2717'}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${g.isCorrect ? 'text-green-300' : 'text-slate-300'}`}>
                        {g.text}
                      </p>
                      <p className="text-xs text-slate-500">{g.guesserName}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <button
          onClick={handleRevealAndEnd}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-lg text-white shadow-lg hover:scale-[1.01] active:scale-95 transition-all"
        >
          REVEAL & END
        </button>
      </motion.div>
    );
  }

  // ===== ENDED =====
  if (status === GameStatus.ENDED) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="glass p-6 rounded-2xl border-2 border-violet-500/30 text-center">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Game Over</p>
          <h2 className="text-4xl font-black text-white mb-2">The secret was...</h2>
          <p className="text-3xl font-black text-violet-400 mb-4">{secret}</p>

          {winner ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
              <p className="text-green-300 font-bold text-lg">{winner.name} guessed it!</p>
              <p className="text-xs text-slate-400 mt-1">
                in {questions.length} question{questions.length !== 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
              <p className="text-amber-300 font-bold">Nobody guessed the secret!</p>
            </div>
          )}

          <p className="text-sm text-slate-400">Host: <span className="text-white font-medium">{hostName}</span> (+3 pts)</p>
        </div>

        {/* Full Transcript */}
        <div className="glass p-4 rounded-xl border border-white/10 max-h-64 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Full Transcript</p>
          <div className="space-y-1">
            {answeredQuestions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-2">
                <span className="text-slate-600 w-5 shrink-0 text-xs mt-0.5">{i + 1}.</span>
                {renderAnsweredRow(q, 'text-xs py-0.5 flex-1')}
              </div>
            ))}
          </div>
          {guesses.length > 0 && (
            <>
              <hr className="border-white/5 my-2" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Guesses</p>
              {guesses.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                  <span className={g.isCorrect ? 'text-green-400' : 'text-red-400'}>
                    {g.isCorrect ? '\u2713' : '\u2717'}
                  </span>
                  <span className="text-slate-400">{g.text}</span>
                  <span className="text-slate-600">— {g.guesserName}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <button
          onClick={handleNewGame}
          className="w-full px-12 py-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
        >
          NEW GAME
        </button>
      </motion.div>
    );
  }

  // Fallback
  return null;
}
