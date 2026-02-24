'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { useRaceMode } from '@/hooks/use-race-mode';
import { GameStatus } from './types';
import type { Challenge, EvaluationResult } from './types';

interface RaceSolver {
  studentId: string;
  displayName: string;
  response: string;
  score: number;
  feedback: string;
  position: number;
}

export function DialogueDetectiveGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler, onRegisterRemoteVoteHandler }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [response, setResponse] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Simultaneous race mode
  const { isSimultaneous, raceActive, raceFinished, raceFinishedRef, timeRemaining, startRace, endRace, resetRace } = useRaceMode({
    studentCount: students.length,
    timerSeconds: sessionSettings.timerSeconds,
  });
  const [raceSolvers, setRaceSolvers] = useState<RaceSolver[]>([]);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Refs for handlers
  const challengeRef = useRef<Challenge | null>(null);
  challengeRef.current = challenge;
  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;
  // Register input spec for student controller
  useEffect(() => {
    if (isSimultaneous) {
      if (raceActive && !raceFinished && challenge) {
        onSetInputSpec?.({
          type: 'textarea',
          gameKey: 'dialogue-detective',
          prompt: `What did Speaker B say? Goal: ${challenge.goal}`,
          placeholder: "Type B's response...",
          maxLength: 300,
        });
      } else {
        onSetInputSpec?.(null);
      }
    } else {
      if (status === GameStatus.CHALLENGE_READY && challenge) {
        onSetInputSpec?.({
          type: 'textarea',
          gameKey: 'dialogue-detective',
          prompt: `What did Speaker B say? Goal: ${challenge.goal}`,
          placeholder: "Type B's response...",
          maxLength: 300,
        });
      } else {
        onSetInputSpec?.(null);
      }
    }
  }, [isSimultaneous, raceActive, raceFinished, status, challenge, onSetInputSpec]);

  // Handle race submissions
  const handleRaceSubmission = useCallback(async (vote: GameRemoteVote) => {
    if (raceFinishedRef.current) return;

    const ch = challengeRef.current;
    if (!ch) return;

    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    const studentResponse = vote.choice?.trim();
    if (!studentResponse) return;

    try {
      const res = await fetch('/api/dialogue-detective/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speakerA_before: ch.speakerA_before,
          speakerA_after: ch.speakerA_after,
          response: studentResponse,
          goal: ch.goal,
          difficulty: sessionSettings.difficulty,
        }),
      });

      if (!res.ok) return;

      const result: EvaluationResult = await res.json();

      setRaceSolvers(prev => {
        if (prev.some(s => s.studentId === studentId)) return prev;

        const position = prev.length + 1;

        onScore(studentId, {
          isCorrect: result.score >= 5,
          points: result.score,
          responseData: {
            response: studentResponse,
            score: result.score,
            feedback: result.feedback,
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
          response: studentResponse,
          score: result.score,
          feedback: result.feedback,
          position,
        }];
      });
    } catch (err) {
      console.error('Race evaluation failed:', err);
    }
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
        const ch = challengeRef.current;
        if (!ch) {
          return { isCorrect: false, points: 1, feedback: 'No active challenge' };
        }

        try {
          const res = await fetch('/api/dialogue-detective/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              speakerA_before: ch.speakerA_before,
              speakerA_after: ch.speakerA_after,
              response: content.trim(),
              goal: ch.goal,
              difficulty: sessionSettings.difficulty,
            }),
          });

          if (!res.ok) throw new Error('Evaluation failed');

          const result: EvaluationResult = await res.json();

          setResponse(content.trim());
          setEvaluation(result);
          setStatus(GameStatus.SHOWING_RESULT);

          return {
            isCorrect: result.score >= 5,
            points: result.score,
            feedback: result.feedback,
          };
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
    setResponse('');
    setRaceSolvers([]);
    resetRace();

    try {
      const res = await fetch('/api/dialogue-detective/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sessionSettings.topic,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!res.ok) throw new Error('Failed to generate');

      const data = await res.json();
      setChallenge({
        speakerA_before: data.speakerA_before,
        speakerB_blank: true,
        speakerA_after: data.speakerA_after,
        context: data.context,
        goal: data.goal
      });
      setStatus(GameStatus.CHALLENGE_READY);

      // Auto-start race in simultaneous mode
      if (isSimultaneous) {
        startRace();
      }
    } catch (err) {
      setError('Failed to generate dialogue. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleEvaluate = async () => {
    if (!response.trim() || !challenge || !currentStudentId) return;
    setStatus(GameStatus.EVALUATING);
    setError(null);

    try {
      const res = await fetch('/api/dialogue-detective/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speakerA_before: challenge.speakerA_before,
          speakerA_after: challenge.speakerA_after,
          response,
          goal: challenge.goal,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!res.ok) throw new Error('Failed to evaluate');

      const result: EvaluationResult = await res.json();
      setEvaluation(result);

      onScore(currentStudentId, {
        isCorrect: result.score >= 5,
        points: result.score,
        responseData: {
          context: challenge.context,
          goal: challenge.goal,
          response,
          contextFit: result.contextFit,
          naturalness: result.naturalness,
          leadIn: result.leadIn,
          feedback: result.feedback
        }
      });

      setStatus(GameStatus.SHOWING_RESULT);
    } catch (err) {
      setError('Failed to evaluate. Please try again.');
      console.error(err);
      setStatus(GameStatus.CHALLENGE_READY);
    }
  };

  const handleSameChallenge = () => {
    setResponse('');
    setEvaluation(null);
    setRaceSolvers([]);
    resetRace();
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

  // Render dialogue card (shared between modes)
  const renderDialogue = () => {
    if (!challenge) return null;
    return (
      <div className="glass p-6 rounded-2xl border-2 border-amber-500/30 space-y-4">
        {/* Speaker A - Before */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">A</div>
          <div className="bg-blue-500/10 rounded-2xl rounded-tl-none px-4 py-3 text-slate-200">{challenge.speakerA_before}</div>
        </div>

        {/* Speaker B - Blank */}
        <div className="flex gap-3 justify-end">
          <div className="bg-amber-500/20 rounded-2xl rounded-tr-none px-4 py-3 border-2 border-dashed border-amber-500/50 min-w-[200px]">
            <p className="text-amber-400/50 italic">What did B say?</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">B</div>
        </div>

        {/* Speaker A - After */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">A</div>
          <div className="bg-blue-500/10 rounded-2xl rounded-tl-none px-4 py-3 text-slate-200">{challenge.speakerA_after}</div>
        </div>
      </div>
    );
  };

  // ============ SIMULTANEOUS RACE MODE ============
  if (isSimultaneous) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="opacity-70 text-sm">Everyone fills in the missing dialogue — best answer wins!</p>
          <p className="text-xs text-cyan-400 mt-1">{students.length} students connected</p>
        </div>

        {/* IDLE State */}
        {status === GameStatus.IDLE && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-3">Race Mode</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                All students will see the same dialogue and race to fill in the missing line. Best responses score highest!
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="w-full px-12 py-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              START INVESTIGATION
            </button>
          </motion.div>
        )}

        {/* GENERATING State */}
        {status === GameStatus.GENERATING && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-12">
            <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
            <p className="font-game text-xl text-amber-400 uppercase tracking-widest animate-pulse">Creating Dialogue...</p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* CHALLENGE_READY — Race active */}
        {status === GameStatus.CHALLENGE_READY && challenge && (
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

            {/* Context */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold uppercase">{challenge.context}</span>
              <span className="text-slate-500 text-sm">Goal: {challenge.goal}</span>
            </div>

            {/* Dialogue */}
            {renderDialogue()}

            {/* Live solver feed */}
            {raceSolvers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Submissions</p>
                <AnimatePresence>
                  {raceSolvers.map(solver => (
                    <motion.div
                      key={solver.studentId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                        solver.score >= 8 ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : solver.score >= 5 ? 'bg-yellow-500/10 border border-yellow-500/20'
                          : 'bg-red-500/10 border border-red-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg font-black text-slate-500">#{solver.position}</span>
                        <span className="font-semibold text-white shrink-0">{solver.displayName}</span>
                        <span className="text-sm text-slate-400 italic truncate">&quot;{solver.response}&quot;</span>
                      </div>
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getScoreColor(solver.score)} flex items-center justify-center text-lg font-black text-white shrink-0 ml-2`}>
                        {solver.score}
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

            {/* Controls */}
            {raceActive && !raceFinished && (
              <button
                onClick={handleEndRace}
                className="w-full py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/10"
              >
                END RACE
              </button>
            )}
          </motion.div>
        )}

        {/* Race finished */}
        {raceFinished && challenge && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">CASE CLOSED!</h3>
              <p className="text-slate-400">{raceSolvers.length} detectives submitted answers</p>
            </div>

            {/* Best answers sorted by score */}
            {raceSolvers.length > 0 && (
              <div className="space-y-2">
                {[...raceSolvers].sort((a, b) => b.score - a.score).map((solver, i) => (
                  <div
                    key={solver.studentId}
                    className={`px-4 py-3 rounded-xl ${
                      i === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-sm font-black text-yellow-400">BEST</span>}
                        <span className="font-semibold text-white">{solver.displayName}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getScoreColor(solver.score)} flex items-center justify-center text-sm font-black text-white`}>
                        {solver.score}
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 italic">&quot;{solver.response}&quot;</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
              >
                NEW DIALOGUE
              </button>
              <button
                onClick={handleSameChallenge}
                className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30"
              >
                SAME DIALOGUE, AGAIN
              </button>
            </div>
          </motion.div>
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
            <p className="text-lg font-semibold text-cyan-400">{currentStudent.name}&apos;s turn</p>
          )}
          {!currentStudentId && (
            <p className="opacity-70 text-sm">Pick a student to start</p>
          )}
        </div>
        <div className="text-xs opacity-40">{sessionSettings.difficulty} / {sessionSettings.topic}</div>
      </div>

      {/* IDLE State */}
      {status === GameStatus.IDLE && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-3">How to Play</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Fill in the missing dialogue! Figure out what Speaker B said to make the conversation flow naturally.
            </p>
          </div>

          {!currentStudentId ? (
            <button onClick={onPickStudent} className="w-full px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20">
              PICK STUDENT
            </button>
          ) : (
            <button onClick={handleGenerate} className="w-full px-12 py-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20">
              START INVESTIGATION
            </button>
          )}
        </motion.div>
      )}

      {/* GENERATING State */}
      {status === GameStatus.GENERATING && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-12">
          <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-amber-400 uppercase tracking-widest animate-pulse">Creating Dialogue...</p>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* CHALLENGE_READY State */}
      {(status === GameStatus.CHALLENGE_READY || status === GameStatus.EVALUATING) && challenge && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Context */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold uppercase">{challenge.context}</span>
            <span className="text-slate-500 text-sm">Goal: {challenge.goal}</span>
          </div>

          {/* Dialogue Card */}
          <div className="glass p-6 rounded-2xl border-2 border-amber-500/30 space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">A</div>
              <div className="bg-blue-500/10 rounded-2xl rounded-tl-none px-4 py-3 text-slate-200">{challenge.speakerA_before}</div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="bg-amber-500/20 rounded-2xl rounded-tr-none px-4 py-3 border-2 border-dashed border-amber-500/50 min-w-[200px]">
                {response ? (
                  <p className="text-amber-200">{response}</p>
                ) : (
                  <p className="text-amber-400/50 italic">What did B say?</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">B</div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">A</div>
              <div className="bg-blue-500/10 rounded-2xl rounded-tl-none px-4 py-3 text-slate-200">{challenge.speakerA_after}</div>
            </div>
          </div>

          {/* Input */}
          <div className="flex justify-end">
            <button onClick={handleGenerate} disabled={status === GameStatus.EVALUATING} className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30">
              Skip Question
            </button>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider">What did B say?</label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type B's response..."
              rows={2}
              disabled={status === GameStatus.EVALUATING}
              className="w-full bg-black/40 border-2 border-white/10 text-white rounded-2xl px-6 py-4 focus:border-amber-500 outline-none text-lg placeholder:text-slate-500 disabled:opacity-50"
            />
            <button
              onClick={handleEvaluate}
              disabled={!response.trim() || status === GameStatus.EVALUATING}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl font-game text-xl hover:scale-[1.01] active:scale-95 transition-all text-white shadow-lg disabled:opacity-30 disabled:hover:scale-100"
            >
              {status === GameStatus.EVALUATING ? 'INVESTIGATING...' : 'SUBMIT ANSWER'}
            </button>
          </div>
        </motion.div>
      )}

      {/* SHOWING_RESULT State */}
      {status === GameStatus.SHOWING_RESULT && evaluation && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Case Closed!</h3>
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getScoreColor(evaluation.score)} flex items-center justify-center text-3xl font-black text-white`}>
                {evaluation.score}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Context Fit</p>
                <div className={`text-2xl font-bold bg-gradient-to-br ${getScoreColor(evaluation.contextFit)} bg-clip-text text-transparent`}>{evaluation.contextFit}</div>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Natural</p>
                <div className={`text-2xl font-bold bg-gradient-to-br ${getScoreColor(evaluation.naturalness)} bg-clip-text text-transparent`}>{evaluation.naturalness}</div>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Lead-in</p>
                <div className={`text-2xl font-bold bg-gradient-to-br ${getScoreColor(evaluation.leadIn)} bg-clip-text text-transparent`}>{evaluation.leadIn}</div>
              </div>
            </div>

            {evaluation.creativityBonus > 0 && (
              <div className="mb-4 text-center">
                <span className="px-3 py-1 bg-lc-blue/15 text-lc-blue rounded-full text-sm font-bold">+{evaluation.creativityBonus} Creativity Bonus!</span>
              </div>
            )}

            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Feedback</p>
              <p className="text-lg text-slate-300 leading-relaxed">{evaluation.feedback}</p>
            </div>

            {evaluation.exampleResponse && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Example Response</p>
                <div className="p-3 bg-amber-500/10 text-amber-200 rounded-xl text-sm italic border-l-4 border-amber-500">
                  &quot;{evaluation.exampleResponse}&quot;
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={handleGenerate} className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10">
              NEW DIALOGUE
            </button>
            <button onClick={handleSameChallenge} className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30">
              SAME DIALOGUE, NEW STUDENT
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
