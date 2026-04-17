'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { useRaceMode } from '@/hooks/use-race-mode';
import { getEffectiveTopic } from '@/stores/session-store';
import { GrammarTarget, GameStatus } from './types';
import type { Challenge, EvaluationResult } from './types';
import { GRAMMAR_RULES } from './grammar-rules';

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

export function GrammarBossGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler, onRegisterRemoteVoteHandler, prefsMap, onRevealTopSubmissions }: GameProps) {
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

        try {
          const audio = new Audio(avgScore >= 5 ? '/sounds/correct.mp3' : '/sounds/wrong.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}

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

    try {
      const response = await fetch('/api/grammar-boss/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grammarTarget: selectedTarget,
          topic: getEffectiveTopic(sessionSettings),
          difficulty: sessionSettings.difficulty,
          excludeCacheIds: seenCacheIdsRef.current,
        })
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      const data = await response.json();
      if (data.cacheId) seenCacheIdsRef.current = [...seenCacheIdsRef.current, data.cacheId];
      setCurrentChallenge({
        target: selectedTarget,
        task: data.task,
        exampleSentence: data.exampleSentence
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
    const resolvedName = solver.clientId && prefsMap?.get(solver.clientId)?.score_visible === false
      ? 'Anonymous pilot'
      : (solver.displayName ?? null);
    return (
    <div className="space-y-4">
      <div className="glass p-4 rounded-xl border border-white/10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{resolvedName ? `${resolvedName}'s Response` : 'Student Response'}</p>
        <p className="text-white italic">&quot;{solver.sentence}&quot;</p>
      </div>
      <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">AI Evaluation Report</h3>
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

  // ============ SIMULTANEOUS RACE MODE ============
  if (isSimultaneous) {
    const sortedSolvers = [...raceSolvers].sort((a, b) => b.avgScore - a.avgScore);
    const reviewSolver = sortedSolvers[reviewIndex];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="opacity-70 text-sm">Everyone writes a sentence — best grammar wins!</p>
          <p className="text-xs text-cyan-400 mt-1">{students.length} students connected</p>
        </div>

        {/* IDLE State */}
        {status === GameStatus.IDLE && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Challenge Configuration</h3>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Grammar Target</label>
                {renderGrammarTargetSelect()}
              </div>
            </div>
            <button onClick={handleGenerate} className="w-full px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20">
              GENERATE CHALLENGE
            </button>
          </motion.div>
        )}

        {/* GENERATING State */}
        {status === GameStatus.GENERATING && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-12">
            <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
            <p className="font-game text-xl text-indigo-400 uppercase tracking-widest animate-pulse">Crafting Challenge...</p>
          </motion.div>
        )}

        {/* Error */}
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">{error}</div>}

        {/* CHALLENGE_READY — Race active */}
        {status === GameStatus.CHALLENGE_READY && currentChallenge && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Timer */}
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
                  <p className="text-xs text-slate-400 uppercase">Submissions</p>
                  <p className="text-2xl font-bold text-emerald-400">{raceSolvers.length}</p>
                </div>
              </div>
            )}

            {renderChallengeCard()}

            {/* Sealed solver feed — name + checkmark only during race */}
            {raceActive && !raceFinished && raceSolvers.length > 0 && (
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
                      <span className="font-semibold text-white">
                        {prefsMap?.get(solver.clientId)?.score_visible === false ? 'Anonymous pilot' : solver.displayName}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {raceActive && raceSolvers.length === 0 && (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm">Waiting for students to submit on their devices...</p>
              </div>
            )}

            {raceActive && !raceFinished && (
              <button onClick={handleEndRace} className="w-full py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/10">
                END RACE
              </button>
            )}
          </motion.div>
        )}

        {/* Race finished — review stepper */}
        {raceFinished && currentChallenge && !showingReview && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">CHALLENGE COMPLETE!</h3>
              <p className="text-slate-400">{raceSolvers.length} students submitted sentences</p>
            </div>

            {raceSolvers.length > 0 && (
              <button
                onClick={() => { setShowingReview(true); setReviewIndex(0); }}
                className="w-full py-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl font-game text-lg transition-all text-white border-2 border-white/20 hover:scale-[1.02] active:scale-95"
              >
                REVIEW SUBMISSIONS ({sortedSolvers.length})
              </button>
            )}

            <div className="flex gap-3 flex-wrap">
              {onRevealTopSubmissions && raceSolvers.length > 0 && (
                <button
                  onClick={() => onRevealTopSubmissions(sortedSolvers.slice(0, 3).map((s) => ({
                    content: s.sentence,
                    feedback: s.feedback,
                    points: s.avgScore,
                    clientId: s.clientId,
                    displayName: s.displayName,
                  })))}
                  className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-game text-sm shadow hover:bg-cyan-500/30 transition-all"
                >
                  REVEAL TOP 3
                </button>
              )}
              <button onClick={handleGenerate} className="flex-1 py-4 bg-gradient-to-br from-lc-blue to-blue-500 rounded-xl font-game transition-all text-white border-2 border-white/20 hover:scale-[1.02] active:scale-95 shadow-lg">NEW TASK</button>
              <button onClick={handleSameChallenge} className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10 text-slate-400">SAME TASK, AGAIN</button>
            </div>
          </motion.div>
        )}

        {/* Post-race review stepper */}
        {raceFinished && showingReview && reviewSolver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Student {reviewIndex + 1} of {sortedSolvers.length}
              </p>
              {reviewIndex === 0 && sortedSolvers.length > 0 && (
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold uppercase">Best Score</span>
              )}
            </div>

            {renderEvaluationCard(reviewSolver)}

            <div className="flex gap-3">
              <button
                onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                disabled={reviewIndex === 0}
                className="flex-1 py-3 glass rounded-xl font-game text-sm transition-all border border-white/10 disabled:opacity-30"
              >
                PREV
              </button>
              {reviewIndex < sortedSolvers.length - 1 ? (
                <button
                  onClick={() => setReviewIndex(reviewIndex + 1)}
                  className="flex-1 py-3 bg-indigo-500/20 text-indigo-300 rounded-xl font-game text-sm transition-all border border-indigo-500/30 hover:bg-indigo-500/30"
                >
                  NEXT STUDENT
                </button>
              ) : (
                <button
                  onClick={() => setShowingReview(false)}
                  className="flex-1 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl font-game text-sm transition-all border border-emerald-500/30 hover:bg-emerald-500/30"
                >
                  DONE
                </button>
              )}
            </div>
          </motion.div>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-12">
          <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-indigo-400 uppercase tracking-widest animate-pulse">Crafting Challenge...</p>
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
