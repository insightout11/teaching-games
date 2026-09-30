'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { useRaceMode } from '@/hooks/use-race-mode';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import { GenerationLoader } from '@/components/ui/generation-loader';
import { GrammarTarget, GameStatus } from './types';
import type { Challenge, EvaluationResult } from './types';
import { GRAMMAR_RULES } from './grammar-rules';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { ArrowLeft, ArrowRight, Check, Clock, Eye, EyeOff, Mic, PenLine, Trophy } from 'lucide-react';
import { isUnchanged, wordDiff } from '@/lib/word-diff';

const TENSE_TARGETS = [
  GrammarTarget.PresentSimple,
  GrammarTarget.PresentContinuous,
  GrammarTarget.PastSimple,
  GrammarTarget.PastContinuous,
  GrammarTarget.PresentPerfect,
  GrammarTarget.PresentPerfectContinuous,
  GrammarTarget.PastPerfect,
  GrammarTarget.FutureWill,
  GrammarTarget.FutureGoingTo,
  GrammarTarget.FutureContinuous,
];

const STRUCTURE_TARGETS = [
  GrammarTarget.Conditional,
  GrammarTarget.Passive,
  GrammarTarget.RelativeClause,
  GrammarTarget.ReportedSpeech,
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface RaceSolver {
  studentId: string;
  clientId: string;
  displayName: string;
  sentence: string;
  grammarScore: number;
  fluencyScore: number;
  avgScore: number;
  correctedSentence: string;
  feedback: string;
  position: number;
}

function getLessonGrammarTarget(): GrammarTarget | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem('lessonPlanContent');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { grammarTarget?: string };
    return (parsed.grammarTarget as GrammarTarget) ?? null;
  } catch { return null; }
}

export function GrammarBossGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler, onRegisterRemoteVoteHandler, prefsMap }: GameProps) {
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [selectedTarget, setSelectedTarget] = useState<GrammarTarget>(
    sessionSettings.grammarTarget ?? getLessonGrammarTarget() ?? GrammarTarget.PresentSimple
  );

  // Sync if store updates after mount
  useEffect(() => {
    if (sessionSettings.grammarTarget && status === GameStatus.IDLE) {
      setSelectedTarget(sessionSettings.grammarTarget);
    }
  }, [sessionSettings.grammarTarget, status]);

  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [studentSentence, setStudentSentence] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [showRule, setShowRule] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondentName, setRespondentName] = useState<string | null>(null);
  const seenCacheIdsRef = useRef<string[]>([]);

  // Simultaneous race mode
  const { isSimultaneous, raceActive, raceFinished, raceFinishedRef, timeRemaining, startRace, endRace, resetRace, addTime } = useRaceMode({
    studentCount: students.length,
    timerSeconds: sessionSettings.timerSeconds,
  });
  const [raceSolvers, setRaceSolvers] = useState<RaceSolver[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showingReview, setShowingReview] = useState(false);
  const [peekExample, setPeekExample] = useState(false);
  const [sayItRight, setSayItRight] = useState(false);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Refs
  const currentChallengeRef = useRef<Challenge | null>(null);
  currentChallengeRef.current = currentChallenge;
  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;
  // Register input spec
  useEffect(() => {
    if (isSimultaneous) {
      if (raceActive && !raceFinished && currentChallenge) {
        const rule = GRAMMAR_RULES[currentChallenge.target];
        onSetInputSpec?.({
          type: 'textarea',
          gameKey: 'grammar-boss',
          prompt: currentChallenge.task,
          placeholder: 'Type your sentence...',
          maxLength: 500,
          hint: rule ? { title: `Grammar: ${currentChallenge.target}`, content: { rule: rule.rule, example: rule.example, mistakes: rule.mistakes } } : undefined,
        });
      } else {
        onSetInputSpec?.(null);
      }
    } else {
      if (status === GameStatus.CHALLENGE_READY && currentChallenge) {
        const rule = GRAMMAR_RULES[currentChallenge.target];
        onSetInputSpec?.({
          type: 'textarea',
          gameKey: 'grammar-boss',
          prompt: currentChallenge.task,
          placeholder: 'Type your sentence...',
          maxLength: 500,
          hint: rule ? { title: `Grammar: ${currentChallenge.target}`, content: { rule: rule.rule, example: rule.example, mistakes: rule.mistakes } } : undefined,
        });
      } else {
        onSetInputSpec?.(null);
      }
    }
  }, [isSimultaneous, raceActive, raceFinished, status, currentChallenge, onSetInputSpec]);

  // Race submission handler
  const handleRaceSubmission = useCallback(async (vote: GameRemoteVote) => {
    if (raceFinishedRef.current) return;

    const ch = currentChallengeRef.current;
    if (!ch) return;

    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    const sentence = vote.choice?.trim();
    if (!sentence) return;

    try {
      const response = await fetch('/api/grammar-boss/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence,
          grammarTarget: ch.target,
          task: ch.task,
          difficulty: sessionSettings.difficulty,
        }),
      });

      if (!response.ok) return;

      const result: EvaluationResult = await response.json();
      const avgScore = Math.round((result.grammarScore + result.fluencyScore) / 2);

      setRaceSolvers(prev => {
        if (prev.some(s => s.studentId === studentId)) return prev;

        const position = prev.length + 1;

        onScore(studentId, {
          isCorrect: avgScore >= 5,
          points: avgScore,
          responseData: {
            clientId: vote.clientId,
            response: sentence,
            sentence,
            grammarScore: result.grammarScore,
            fluencyScore: result.fluencyScore,
            feedback: result.feedback,
            position,
          },
        });

        return [...prev, {
          studentId,
          clientId: vote.clientId,
          displayName: vote.displayName,
          sentence,
          grammarScore: result.grammarScore,
          fluencyScore: result.fluencyScore,
          avgScore,
          correctedSentence: result.correctedSentence,
          feedback: result.feedback,
          position,
        }];
      });
    } catch (err) {
      console.error('Race evaluation failed:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionSettings.difficulty, onScore]);

  // Turn-based vote handler
  const handleTurnBasedVote = useCallback((vote: GameRemoteVote) => {
    if (statusRef.current !== GameStatus.CHALLENGE_READY) return;

    const sentence = vote.choice?.trim();
    if (!sentence) return;

    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    evaluateTurnBased(sentence, studentId, vote.displayName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Turn-based evaluate
  const evaluateTurnBased = useCallback(async (sentence: string, studentId: string, displayName?: string) => {
    const ch = currentChallengeRef.current;
    if (!ch) return;

    setStudentSentence(sentence);
    setRespondentName(displayName || null);
    setStatus(GameStatus.EVALUATING);
    setError(null);

    try {
      const response = await fetch('/api/grammar-boss/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence,
          grammarTarget: ch.target,
          task: ch.task,
          difficulty: sessionSettings.difficulty,
        }),
      });

      if (!response.ok) throw new Error('Evaluation failed');

      const result: EvaluationResult = await response.json();
      setEvaluation(result);

      const averageScore = Math.round((result.grammarScore + result.fluencyScore) / 2);

      onScore(studentId, {
        isCorrect: averageScore >= 5,
        points: averageScore,
        responseData: {
          sentence,
          grammarScore: result.grammarScore,
          fluencyScore: result.fluencyScore,
          correctedSentence: result.correctedSentence,
          feedback: result.feedback,
          grammarTarget: ch.target,
        },
      });

      setStatus(GameStatus.SHOWING_RESULT);
    } catch {
      setError('Failed to evaluate sentence. Please try again.');
      setStatus(GameStatus.CHALLENGE_READY);
    }
  }, [sessionSettings.difficulty, onScore]);

  // Register remote vote handler
  useEffect(() => {
    if (isSimultaneous) {
      onRegisterRemoteVoteHandler?.(handleRaceSubmission);
    } else {
      onRegisterRemoteVoteHandler?.(handleTurnBasedVote);
    }
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [isSimultaneous, onRegisterRemoteVoteHandler, handleRaceSubmission, handleTurnBasedVote]);

  // Register submission handler (turn-based fallback)
  useEffect(() => {
    if (isSimultaneous) return;

    onRegisterSubmissionHandler?.({
      autoApprove: true,
      handleSubmission: async (content: string) => {
        const ch = currentChallengeRef.current;
        if (!ch) return { isCorrect: false, points: 1, feedback: 'No active challenge' };

        try {
          const response = await fetch('/api/grammar-boss/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sentence: content.trim(),
              grammarTarget: ch.target,
              task: ch.task,
              difficulty: sessionSettings.difficulty,
            }),
          });

          if (!response.ok) throw new Error('Evaluation failed');

          const result: EvaluationResult = await response.json();
          setStudentSentence(content.trim());
          setEvaluation(result);
          setStatus(GameStatus.SHOWING_RESULT);

          const averageScore = Math.round((result.grammarScore + result.fluencyScore) / 2);
          return { isCorrect: averageScore >= 5, points: averageScore, feedback: result.feedback };
        } catch {
          return { isCorrect: false, points: 1, feedback: 'Evaluation error' };
        }
      },
    });

    return () => onRegisterSubmissionHandler?.(null);
  }, [isSimultaneous, sessionSettings.difficulty, onRegisterSubmissionHandler]);

  const handleGenerate = async () => {
    if (!isSimultaneous && !currentStudentId) {
      onPickStudent();
      return;
    }

    setStatus(GameStatus.GENERATING);
    setError(null);
    setEvaluation(null);
    setShowExample(false);
    setStudentSentence('');
    setRespondentName(null);
    setRaceSolvers([]);
    resetRace();
    setShowingReview(false);
    setReviewIndex(0);
    setSayItRight(false);

    try {
      const response = await fetch('/api/grammar-boss/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grammarTarget: selectedTarget,
          topic: getEffectiveTopic(sessionSettings),
          difficulty: sessionSettings.difficulty,
          excludeCacheIds: seenCacheIdsRef.current,
          ...(sourceMaterial ? { sourceMaterial } : {}),
        })
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      const data = await response.json();
      if (data.cacheId) seenCacheIdsRef.current = [...seenCacheIdsRef.current, data.cacheId];
      setCurrentChallenge({
        target: selectedTarget,
        task: data.task,
        exampleSentence: data.exampleSentence,
        sentenceStarter: data.sentenceStarter
      });
      setStatus(GameStatus.CHALLENGE_READY);

      if (isSimultaneous) {
        startRace();
      }
    } catch (err) {
      setError('Failed to generate challenge. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleSameChallenge = () => {
    setStudentSentence('');
    setEvaluation(null);
    setShowExample(false);
    setRespondentName(null);
    setRaceSolvers([]);
    resetRace();
    setShowingReview(false);
    setReviewIndex(0);
    setStatus(GameStatus.CHALLENGE_READY);
    if (!isSimultaneous) onPickStudent();
    if (isSimultaneous) startRace();
  };

  const handleEndRace = () => {
    endRace();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-emerald-500 to-emerald-600';
    if (score >= 5) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  // Grammar target dropdown with optgroups
  const renderGrammarTargetSelect = () => (
    <select
      value={selectedTarget}
      onChange={(e) => setSelectedTarget(e.target.value as GrammarTarget)}
      className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-cyan-500 outline-none"
    >
      <optgroup label="Tenses">
        {TENSE_TARGETS.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
      </optgroup>
      <optgroup label="Structures">
        {STRUCTURE_TARGETS.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
      </optgroup>
    </select>
  );

  // Render challenge card (shared)
  const renderChallengeCard = () => {
    if (!currentChallenge) return null;
    return (
      <div className="glass p-6 md:p-8 rounded-2xl border-2 border-indigo-500/30">
        <div className="flex items-center justify-between mb-4">
          <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Active Task</span>
          <button
            onClick={() => setShowExample(!showExample)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
              showExample ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-slate-400 hover:bg-white/20'
            }`}
          >
            {showExample ? 'Hide Example' : 'Show Example'}
          </button>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">{currentChallenge.task}</h3>
        {currentChallenge.sentenceStarter && (
          <div className="mb-4 inline-flex items-baseline gap-2 rounded-lg bg-sky-500/10 border border-sky-500/30 px-3 py-2">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Stuck? Start with</span>
            <span className="text-sky-200 italic">&quot;{currentChallenge.sentenceStarter}&quot;</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase">Must use: {currentChallenge.target}</span>
          <span className="px-3 py-1 bg-white/10 text-slate-400 rounded-full text-xs font-bold uppercase">{sessionSettings.difficulty} Level</span>
        </div>
        {/* Grammar rule reference */}
        {(() => {
          const rule = GRAMMAR_RULES[currentChallenge.target];
          if (!rule) return null;
          return (
            <div className="mt-4">
              <button
                onClick={() => setShowRule(!showRule)}
                className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2"
              >
                <svg className={`w-3 h-3 transition-transform ${showRule ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path d="M6 4l8 6-8 6V4z"/></svg>
                Grammar Reference
              </button>
              {showRule && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Structure</p>
                    <p className="text-emerald-200 font-medium">{rule.rule}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Example</p>
                    <p className="text-emerald-200 italic">&quot;{rule.example}&quot;</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Common Mistakes</p>
                    <ul className="space-y-1">
                      {rule.mistakes.map((m, i) => (
                        <li key={i} className="text-red-300/80 text-sm">{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        {showExample && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">Model Structure</p>
            <p className="text-yellow-200 font-medium italic text-lg">&quot;{currentChallenge.exampleSentence}&quot;</p>
          </motion.div>
        )}
      </div>
    );
  };

  // Render evaluation card (shared between turn-based result and race review)
  const renderEvaluationCard = (solver: { clientId?: string; displayName?: string; sentence: string; grammarScore: number; fluencyScore: number; correctedSentence: string; feedback: string }) => {
    return (
    <div className="space-y-4">
      <div className="glass p-4 rounded-xl border border-white/10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Student Response</p>
        <p className="text-white italic">&quot;{solver.sentence}&quot;</p>
      </div>
      <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Smart Evaluation Report</h3>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Grammar</p>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getScoreColor(solver.grammarScore)} flex items-center justify-center text-2xl font-black text-white`}>{solver.grammarScore}</div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Fluency</p>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getScoreColor(solver.fluencyScore)} flex items-center justify-center text-2xl font-black text-white`}>{solver.fluencyScore}</div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Corrected Version</p>
          <div className="p-4 bg-slate-900/50 text-slate-100 rounded-xl text-lg font-medium italic border-l-4 border-emerald-500">&quot;{solver.correctedSentence}&quot;</div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Feedback</p>
          <p className="text-lg text-slate-300 leading-relaxed">{solver.feedback}</p>
        </div>
      </div>
    </div>
  );
  };

  // Shared-screen review: the student's sentence vs the correction, changed words highlighted.
  const renderCorrection = (sentence: string, corrected: string) => {
    const parts = wordDiff(sentence, corrected);
    const same = isUnchanged(sentence, corrected);
    return (
      <div className="space-y-3">
        <div>
          <KitLabel>Written</KitLabel>
          <p className="mt-1 text-2xl leading-snug">
            {parts.filter((p) => p.kind !== 'added').map((p, i) => <span key={i} className={p.kind === 'removed' ? 'rounded bg-rose-400/15 px-0.5 text-rose-200 line-through decoration-rose-300/80' : ''}>{p.text} </span>)}
          </p>
        </div>
        {same ? (
          <p className="flex items-center gap-2 text-xl text-emerald-200"><Check className="h-5 w-5" />Perfect: nothing to fix!</p>
        ) : (
          <div>
            <KitLabel tone="emerald">Corrected</KitLabel>
            <p className="mt-1 text-2xl leading-snug">
              {parts.filter((p) => p.kind !== 'removed').map((p, i) => <span key={i} className={p.kind === 'added' ? 'rounded bg-emerald-400/15 px-0.5 font-semibold text-emerald-200' : ''}>{p.text} </span>)}
            </p>
          </div>
        )}
      </div>
    );
  };

  // ============ SIMULTANEOUS RACE MODE ============
  if (isSimultaneous) {
    const sortedSolvers = [...raceSolvers].sort((a, b) => b.avgScore - a.avgScore);
    const reviewSolver = sortedSolvers[reviewIndex];
    const best = sortedSolvers[0];
    const rule = currentChallenge ? GRAMMAR_RULES[currentChallenge.target] : null;
    const total = sessionSettings.timerSeconds || 1;

    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="violet">Grammar Boss{currentChallenge ? ` · ${capitalize(currentChallenge.target)}` : ''}</KitLabel>
          {status === GameStatus.CHALLENGE_READY && <KitReadout>{raceSolvers.length} / {students.length} written</KitReadout>}
        </div>

        {status === GameStatus.IDLE && (
          <div className="space-y-5 py-4 text-center">
            <p className="font-display text-5xl">Beat the Grammar Boss.</p>
            <p className="mx-auto max-w-xl text-lg text-white/70">One task, one grammar point. Everyone writes a sentence on their phone, then we fix them together.</p>
            <div className="mx-auto max-w-sm text-left">
              <KitLabel>Grammar point</KitLabel>
              <div className="mt-1">{renderGrammarTargetSelect()}</div>
            </div>
            <div className="flex justify-center">
              <KitButton tone="violet" solid onClick={handleGenerate} className="!px-8 !py-3 !text-base" icon={<PenLine className="h-4 w-4" />}>Set the task</KitButton>
            </div>
          </div>
        )}

        {status === GameStatus.GENERATING && <GenerationLoader label="challenge" />}
        {error && <p className="rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-rose-100">{error}</p>}

        {status === GameStatus.CHALLENGE_READY && currentChallenge && !raceFinished && (
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-6">
              <p className="font-display text-3xl leading-snug">{currentChallenge.task}</p>
              {currentChallenge.sentenceStarter && <p className="mt-3 text-lg text-white/70">Stuck? Start with <span className="text-sky-200">&ldquo;{currentChallenge.sentenceStarter}&rdquo;</span></p>}
              {rule && (
                <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-400/[0.06] px-4 py-3">
                  <KitLabel tone="emerald">How it works</KitLabel>
                  <p className="mt-1 text-lg text-emerald-100">{rule.rule}</p>
                  <p className="text-base italic text-emerald-200/80">&ldquo;{rule.example}&rdquo;</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Clock className={`h-5 w-5 ${timeRemaining <= 10 ? 'text-rose-300' : 'text-white/60'}`} />
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10"><motion.div className={`h-full ${timeRemaining <= 10 ? 'bg-rose-400' : 'bg-violet-400'}`} animate={{ width: `${Math.max(0, Math.min(100, (timeRemaining / total) * 100))}%` }} transition={{ ease: 'linear', duration: 1 }} /></div>
              <span className={`w-14 text-right font-mono text-2xl ${timeRemaining <= 10 ? 'text-rose-300' : ''}`}>{timeRemaining}s</span>
              <KitButton onClick={() => addTime(30)}>+30s</KitButton>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AnimatePresence>
                {raceSolvers.map((sv) => (
                  <motion.span key={sv.studentId} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-100">
                    <Check className="h-3.5 w-3.5" />{prefsMap?.get(sv.clientId)?.score_visible === false ? 'Anonymous pilot' : sv.displayName}
                  </motion.span>
                ))}
              </AnimatePresence>
              {raceSolvers.length === 0 && <p className="text-sm text-white/45">Writing on phones…</p>}
            </div>
            <div className="flex items-center justify-between">
              {/* The model sentence answers this exact task: teacher-only peek while they write. */}
              <button type="button" onPointerDown={() => setPeekExample(true)} onPointerUp={() => setPeekExample(false)} onPointerLeave={() => setPeekExample(false)} className="flex max-w-md items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-xs text-white/60 hover:text-white">
                {peekExample ? <><Eye className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{currentChallenge.exampleSentence}</span></> : <><EyeOff className="h-3.5 w-3.5" />Hold to peek at a model</>}
              </button>
              <KitButton onClick={handleEndRace}>Time&apos;s up</KitButton>
            </div>
          </div>
        )}

        {raceFinished && currentChallenge && !showingReview && (
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-5">
              <KitLabel>The task</KitLabel>
              <p className="mt-1 font-display text-2xl">{currentChallenge.task}</p>
              <p className="mt-3 text-lg"><span className="font-mono text-xs uppercase tracking-[0.14em] text-amber-300">Model </span><span className="italic text-amber-100">&ldquo;{currentChallenge.exampleSentence}&rdquo;</span></p>
            </div>
            {best && (
              <div className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] p-5">
                <p className="flex items-center gap-2 font-display text-2xl"><Trophy className="h-5 w-5 text-amber-300" />Top sentence: {best.displayName}</p>
                <div className="mt-3">{renderCorrection(best.sentence, best.correctedSentence)}</div>
                {sayItRight
                  ? <p className="mt-3 flex items-center gap-2 text-lg text-amber-100"><Mic className="h-5 w-5" />{best.displayName} reads the corrected sentence aloud, then everyone repeats it.</p>
                  : <KitButton tone="amber" className="mt-3" onClick={() => setSayItRight(true)} icon={<Mic className="h-3.5 w-3.5" />}>Say it right</KitButton>}
              </div>
            )}
            {raceSolvers.length === 0 && <p className="text-center text-white/55">No sentences this time.</p>}
            <div className="flex flex-wrap justify-center gap-2">
              {sortedSolvers.length > 1 && <KitButton tone="violet" onClick={() => { setShowingReview(true); setReviewIndex(1); }} icon={<ArrowRight className="h-3.5 w-3.5" />}>Fix the others together ({sortedSolvers.length - 1})</KitButton>}
              <KitButton onClick={handleSameChallenge}>Same task again</KitButton>
              <KitButton tone="violet" solid onClick={handleGenerate} className="!px-6 !py-2.5 !text-sm">New task</KitButton>
            </div>
          </div>
        )}

        {raceFinished && showingReview && reviewSolver && (
          <div className="space-y-4">
            {/* Anonymous: the class fixes the sentence, not the person */}
            <div className="flex items-center justify-between">
              <KitLabel tone="violet">Sentence {reviewIndex} of {sortedSolvers.length - 1}</KitLabel>
              <KitReadout>Spot what changed</KitReadout>
            </div>
            <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-5">
              {renderCorrection(reviewSolver.sentence, reviewSolver.correctedSentence)}
              {reviewSolver.feedback && <p className="mt-4 border-t border-white/10 pt-3 text-lg text-white/75">{reviewSolver.feedback}</p>}
            </div>
            <div className="flex justify-center gap-2">
              <KitButton disabled={reviewIndex <= 1} onClick={() => setReviewIndex(Math.max(1, reviewIndex - 1))} icon={<ArrowLeft className="h-3.5 w-3.5" />}>Back</KitButton>
              {reviewIndex < sortedSolvers.length - 1
                ? <KitButton tone="violet" solid onClick={() => setReviewIndex(reviewIndex + 1)} icon={<ArrowRight className="h-3.5 w-3.5" />}>Next sentence</KitButton>
                : <KitButton tone="emerald" solid onClick={() => setShowingReview(false)} icon={<Check className="h-3.5 w-3.5" />}>Done</KitButton>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ TURN-BASED MODE ============
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {currentStudent && <p className="text-lg font-semibold text-cyan-400">{currentStudent.name}&apos;s turn</p>}
          {!currentStudentId && <p className="opacity-70 text-sm">Pick a student to start</p>}
        </div>
        <div className="text-xs opacity-40">{sessionSettings.difficulty} / {sessionSettings.topic}</div>
      </div>

      {status === GameStatus.IDLE && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Challenge Configuration</h3>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Grammar Target</label>
              {renderGrammarTargetSelect()}
            </div>
          </div>
          {!currentStudentId ? (
            <button onClick={onPickStudent} className="w-full px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20">PICK STUDENT</button>
          ) : (
            <button onClick={handleGenerate} className="w-full px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20">GENERATE CHALLENGE</button>
          )}
        </motion.div>
      )}

      {status === GameStatus.GENERATING && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GenerationLoader label="challenge" />
        </motion.div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">{error}</div>}

      {status === GameStatus.CHALLENGE_READY && currentChallenge && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {renderChallengeCard()}
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-cyan-400 font-semibold">Waiting for student to type on their device...</p>
            <p className="text-xs text-slate-500">The student&apos;s response will appear here automatically</p>
          </div>
          <div className="flex justify-between items-center">
            <button onClick={handleGenerate} className="text-sm text-slate-400 hover:text-white transition-colors">Skip Question</button>
          </div>
        </motion.div>
      )}

      {status === GameStatus.EVALUATING && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {studentSentence && (
            <div className="glass p-6 rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{respondentName ? `${respondentName}'s Response` : 'Student Response'}</p>
              <p className="text-lg text-white italic">&quot;{studentSentence}&quot;</p>
            </div>
          )}
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
            <p className="font-game text-xl text-emerald-400 uppercase tracking-widest animate-pulse">Evaluating...</p>
          </div>
        </motion.div>
      )}

      {status === GameStatus.SHOWING_RESULT && evaluation && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          {renderEvaluationCard({
            displayName: respondentName || undefined,
            sentence: studentSentence,
            grammarScore: evaluation.grammarScore,
            fluencyScore: evaluation.fluencyScore,
            correctedSentence: evaluation.correctedSentence,
            feedback: evaluation.feedback,
          })}
          <div className="flex gap-3">
            <button onClick={handleGenerate} className="flex-1 py-4 bg-gradient-to-br from-lc-blue to-blue-500 rounded-xl font-game transition-all text-white border-2 border-white/20 hover:scale-[1.02] active:scale-95 shadow-lg">NEW TASK</button>
            <button onClick={handleSameChallenge} className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10 text-slate-400">SAME TASK, NEW STUDENT</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
