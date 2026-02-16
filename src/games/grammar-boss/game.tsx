'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { GrammarTarget, FeedbackTone, GameStatus } from './types';
import type { Challenge, EvaluationResult } from './types';

interface RaceSolver {
  studentId: string;
  displayName: string;
  sentence: string;
  grammarScore: number;
  fluencyScore: number;
  avgScore: number;
  feedback: string;
  position: number;
}

export function GrammarBossGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler, onRegisterRemoteVoteHandler }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [selectedTarget, setSelectedTarget] = useState<GrammarTarget>(GrammarTarget.Tense);
  const [selectedTone, setSelectedTone] = useState<FeedbackTone>(FeedbackTone.Coach);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [studentSentence, setStudentSentence] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respondentName, setRespondentName] = useState<string | null>(null);

  // Simultaneous race mode
  const isSimultaneous = students.length >= 3;
  const [raceSolvers, setRaceSolvers] = useState<RaceSolver[]>([]);
  const [raceFinished, setRaceFinished] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(sessionSettings.timerSeconds);
  const [raceActive, setRaceActive] = useState(false);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Refs
  const currentChallengeRef = useRef<Challenge | null>(null);
  currentChallengeRef.current = currentChallenge;
  const selectedToneRef = useRef<FeedbackTone>(selectedTone);
  selectedToneRef.current = selectedTone;
  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;
  const raceFinishedRef = useRef(false);
  raceFinishedRef.current = raceFinished;

  // Register input spec
  useEffect(() => {
    if (isSimultaneous) {
      if (raceActive && !raceFinished && currentChallenge) {
        onSetInputSpec?.({
          type: 'textarea',
          gameKey: 'grammar-boss',
          prompt: currentChallenge.task,
          placeholder: 'Type your sentence...',
          maxLength: 500,
        });
      } else {
        onSetInputSpec?.(null);
      }
    } else {
      if (status === GameStatus.CHALLENGE_READY && currentChallenge) {
        onSetInputSpec?.({
          type: 'textarea',
          gameKey: 'grammar-boss',
          prompt: currentChallenge.task,
          placeholder: 'Type your sentence...',
          maxLength: 500,
        });
      } else {
        onSetInputSpec?.(null);
      }
    }
  }, [isSimultaneous, raceActive, raceFinished, status, currentChallenge, onSetInputSpec]);

  // Timer for simultaneous mode
  useEffect(() => {
    if (!raceActive || raceFinished) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setRaceFinished(true);
          setRaceActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [raceActive, raceFinished]);

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
          tone: selectedToneRef.current,
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
          displayName: vote.displayName,
          sentence,
          grammarScore: result.grammarScore,
          fluencyScore: result.fluencyScore,
          avgScore,
          feedback: result.feedback,
          position,
        }];
      });
    } catch (err) {
      console.error('Race evaluation failed:', err);
    }
  }, [sessionSettings.difficulty, onScore]);

  // Turn-based vote handler
  const handleTurnBasedVote = useCallback((vote: GameRemoteVote) => {
    if (statusRef.current !== GameStatus.CHALLENGE_READY) return;

    const sentence = vote.choice?.trim();
    if (!sentence) return;

    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    // Evaluate (reuse shared logic)
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
          tone: selectedToneRef.current,
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
              tone: selectedToneRef.current,
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
    setRaceFinished(false);
    setRaceActive(false);
    setTimeRemaining(sessionSettings.timerSeconds);

    try {
      const response = await fetch('/api/grammar-boss/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grammarTarget: selectedTarget,
          topic: sessionSettings.topic,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      const data = await response.json();
      setCurrentChallenge({
        target: selectedTarget,
        task: data.task,
        exampleSentence: data.exampleSentence
      });
      setStatus(GameStatus.CHALLENGE_READY);

      if (isSimultaneous) {
        setRaceActive(true);
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
    setRaceFinished(false);
    setRaceActive(false);
    setTimeRemaining(sessionSettings.timerSeconds);
    setStatus(GameStatus.CHALLENGE_READY);
    if (!isSimultaneous) onPickStudent();
    if (isSimultaneous) setRaceActive(true);
  };

  const handleEndRace = () => {
    setRaceFinished(true);
    setRaceActive(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-emerald-500 to-emerald-600';
    if (score >= 5) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

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
        {showExample && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">Model Structure</p>
            <p className="text-yellow-200 font-medium italic text-lg">&quot;{currentChallenge.exampleSentence}&quot;</p>
          </motion.div>
        )}
      </div>
    );
  };

  // ============ SIMULTANEOUS RACE MODE ============
  if (isSimultaneous) {
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Grammar Target</label>
                  <select value={selectedTarget} onChange={(e) => setSelectedTarget(e.target.value as GrammarTarget)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-cyan-500 outline-none">
                    {Object.values(GrammarTarget).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Evaluator Tone</label>
                  <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value as FeedbackTone)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-cyan-500 outline-none">
                    {Object.values(FeedbackTone).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
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
                <div className={`px-4 py-2 rounded-xl font-game text-2xl ${timeRemaining <= 10 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}`}>
                  {timeRemaining}s
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase">Submissions</p>
                  <p className="text-2xl font-bold text-emerald-400">{raceSolvers.length}</p>
                </div>
              </div>
            )}

            {renderChallengeCard()}

            {/* Solver feed */}
            {raceSolvers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Submissions</p>
                <AnimatePresence>
                  {raceSolvers.map(solver => (
                    <motion.div
                      key={solver.studentId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-4 py-3 rounded-xl ${
                        solver.avgScore >= 8 ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : solver.avgScore >= 5 ? 'bg-yellow-500/10 border border-yellow-500/20'
                          : 'bg-red-500/10 border border-red-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-500">#{solver.position}</span>
                          <span className="font-semibold text-white">{solver.displayName}</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="text-center">
                            <p className="text-[8px] text-slate-500 uppercase">G</p>
                            <p className={`text-sm font-bold ${solver.grammarScore >= 5 ? 'text-emerald-400' : 'text-red-400'}`}>{solver.grammarScore}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] text-slate-500 uppercase">F</p>
                            <p className={`text-sm font-bold ${solver.fluencyScore >= 5 ? 'text-emerald-400' : 'text-red-400'}`}>{solver.fluencyScore}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 italic truncate">&quot;{solver.sentence}&quot;</p>
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

        {/* Race finished */}
        {raceFinished && currentChallenge && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">CHALLENGE COMPLETE!</h3>
              <p className="text-slate-400">{raceSolvers.length} students submitted sentences</p>
            </div>

            {raceSolvers.length > 0 && (
              <div className="space-y-2">
                {[...raceSolvers].sort((a, b) => b.avgScore - a.avgScore).map((solver, i) => (
                  <div key={solver.studentId} className={`px-4 py-3 rounded-xl ${i === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5 border border-white/10'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-sm font-black text-yellow-400">BEST</span>}
                        <span className="font-semibold text-white">{solver.displayName}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs text-slate-500">G:{solver.grammarScore}</span>
                        <span className="text-xs text-slate-500">F:{solver.fluencyScore}</span>
                        <span className={`font-bold ${solver.avgScore >= 5 ? 'text-emerald-400' : 'text-red-400'}`}>Avg:{solver.avgScore}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 italic">&quot;{solver.sentence}&quot;</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleGenerate} className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10">NEW TASK</button>
              <button onClick={handleSameChallenge} className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30">SAME TASK, AGAIN</button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Grammar Target</label>
                <select value={selectedTarget} onChange={(e) => setSelectedTarget(e.target.value as GrammarTarget)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-cyan-500 outline-none">
                  {Object.values(GrammarTarget).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Evaluator Tone</label>
                <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value as FeedbackTone)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-cyan-500 outline-none">
                  {Object.values(FeedbackTone).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
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
            <p className="text-sm text-slate-500">Evaluating as: <span className="text-indigo-400 font-bold">{selectedTone}</span></p>
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
          {studentSentence && (
            <div className="glass p-4 rounded-xl border border-white/10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{respondentName ? `${respondentName}'s Response` : 'Student Response'}</p>
              <p className="text-white italic">&quot;{studentSentence}&quot;</p>
            </div>
          )}
          <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">AI Evaluation Report</h3>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Grammar</p>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getScoreColor(evaluation.grammarScore)} flex items-center justify-center text-2xl font-black text-white`}>{evaluation.grammarScore}</div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Fluency</p>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getScoreColor(evaluation.fluencyScore)} flex items-center justify-center text-2xl font-black text-white`}>{evaluation.fluencyScore}</div>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Corrected Version</p>
              <div className="p-4 bg-slate-900/50 text-slate-100 rounded-xl text-lg font-medium italic border-l-4 border-emerald-500">&quot;{evaluation.correctedSentence}&quot;</div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Coach&apos;s Feedback</p>
              <p className="text-lg text-slate-300 leading-relaxed">{evaluation.feedback}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleGenerate} className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10">NEW TASK</button>
            <button onClick={handleSameChallenge} className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30">SAME TASK, NEW STUDENT</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
