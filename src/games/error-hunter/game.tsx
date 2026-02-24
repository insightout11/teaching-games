'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { useRaceMode } from '@/hooks/use-race-mode';
import { GameStatus } from './types';
import type { Challenge, EvaluationResult, UserCorrection } from './types';

interface WordData {
  word: string;
  index: number;
  isSelected: boolean;
  correction: string;
}

function getPositionPoints(position: number): number {
  if (position === 1) return 10;
  if (position === 2) return 8;
  if (position === 3) return 6;
  return 3;
}

interface RaceSolver {
  studentId: string;
  displayName: string;
  score: number;
  found: number;
  totalErrors: number;
  position: number;
}

export function ErrorHunterGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterRemoteVoteHandler }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [words, setWords] = useState<WordData[]>([]);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [correctionInput, setCorrectionInput] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Simultaneous race mode
  const { isSimultaneous, raceActive, raceFinished, timeRemaining, startRace, endRace, resetRace } = useRaceMode({
    studentCount: students.length,
    timerSeconds: sessionSettings.timerSeconds,
  });
  const [raceSolvers, setRaceSolvers] = useState<RaceSolver[]>([]);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Register input spec for student controller
  useEffect(() => {
    if (isSimultaneous) {
      if (raceActive && !raceFinished && challenge && words.length > 0) {
        onSetInputSpec?.({
          type: 'error-correction',
          gameKey: 'error-hunter',
          options: words.map(w => w.word),
          prompt: `Find and correct the ${challenge.errorCount} error${challenge.errorCount !== 1 ? 's' : ''} — race!`,
        });
      } else {
        onSetInputSpec?.(null);
      }
    } else {
      if (status === GameStatus.PLAYING && challenge && words.length > 0) {
        onSetInputSpec?.({
          type: 'error-correction',
          gameKey: 'error-hunter',
          options: words.map(w => w.word),
          prompt: `Find and correct the ${challenge.errorCount} error${challenge.errorCount !== 1 ? 's' : ''} in this paragraph`,
        });
      } else {
        onSetInputSpec?.(null);
      }
    }
  }, [isSimultaneous, raceActive, raceFinished, status, challenge, words, onSetInputSpec]);

  // Handle remote vote — race mode
  const handleRaceVote = useCallback(async (vote: GameRemoteVote) => {
    if (!challenge || raceFinished) return;

    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    try {
      const corrections: UserCorrection[] = JSON.parse(vote.choice);
      if (!Array.isArray(corrections)) return;

      // Check for duplicate submissions
      if (raceSolvers.some(s => s.studentId === studentId)) return;

      const response = await fetch('/api/error-hunter/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraph: challenge.paragraph,
          corrections,
          difficulty: sessionSettings.difficulty,
        }),
      });

      if (!response.ok) return;

      const result: EvaluationResult = await response.json();

      setRaceSolvers(prev => {
        if (prev.some(s => s.studentId === studentId)) return prev;

        const position = prev.length + 1;
        const positionBonus = getPositionPoints(position);
        const totalPoints = Math.min(10, result.score + (position <= 3 ? positionBonus : 0));

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

        try {
          const audio = new Audio(result.score >= 5 ? '/sounds/correct.mp3' : '/sounds/wrong.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}

        return [...prev, {
          studentId,
          displayName: vote.displayName,
          score: totalPoints,
          found: result.found,
          totalErrors: result.totalErrors,
          position,
        }];
      });
    } catch (err) {
      console.error('Failed to process race vote:', err);
    }
  }, [challenge, raceFinished, raceSolvers, sessionSettings.difficulty, onScore]);

  // Handle remote vote — turn-based mode
  const handleTurnBasedVote = useCallback(async (vote: GameRemoteVote) => {
    if (!challenge) return;

    try {
      const corrections: UserCorrection[] = JSON.parse(vote.choice);
      if (!Array.isArray(corrections)) return;

      const response = await fetch('/api/error-hunter/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraph: challenge.paragraph,
          corrections,
          difficulty: sessionSettings.difficulty,
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
  }, [challenge, sessionSettings.difficulty, onScore]);

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
    resetRace();

    try {
      const response = await fetch('/api/error-hunter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sessionSettings.topic,
          difficulty: sessionSettings.difficulty
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

  const handleNewRound = () => {
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
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="opacity-70 text-sm">Everyone hunts for errors — race to find them all!</p>
          <p className="text-xs text-cyan-400 mt-1">{students.length} students connected</p>
        </div>

        {/* IDLE State */}
        {status === GameStatus.IDLE && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-3">Race Mode</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                All students will see the same paragraph on their devices and race to find and correct the errors!
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="w-full px-12 py-6 bg-gradient-to-br from-lc-danger to-red-500 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              START HUNTING
            </button>
          </motion.div>
        )}

        {/* GENERATING State */}
        {status === GameStatus.GENERATING && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-12">
            <div className="w-16 h-16 border-4 border-red-500/10 border-t-red-500 rounded-full animate-spin" />
            <p className="font-game text-xl text-red-400 uppercase tracking-widest animate-pulse">Hiding Errors...</p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* PLAYING State — Race mode */}
        {status === GameStatus.PLAYING && challenge && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Timer & Stats */}
            {raceActive && !raceFinished && (
              <div className="flex items-center justify-between">
                <div className={`px-4 py-2 rounded-xl font-game text-2xl ${timeRemaining <= 10 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}`}>
                  {timeRemaining}s
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold">
                    {challenge.errorCount} errors hidden
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase">Submitted</p>
                    <p className="text-2xl font-bold text-emerald-400">{raceSolvers.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Paragraph preview (teacher screen) */}
            <div className="glass p-6 rounded-2xl border-2 border-red-500/30">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Paragraph</p>
              <p className="text-lg leading-relaxed text-slate-200">{challenge.paragraph}</p>
            </div>

            {/* Race solver feed */}
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
                        solver.position === 1
                          ? 'bg-yellow-500/20 border border-yellow-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-black ${
                          solver.position === 1 ? 'text-yellow-400' :
                          solver.position === 2 ? 'text-slate-300' :
                          solver.position === 3 ? 'text-amber-600' : 'text-slate-500'
                        }`}>#{solver.position}</span>
                        <span className="font-semibold text-white">{solver.displayName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">{solver.found}/{solver.totalErrors} found</span>
                        <span className="font-game text-emerald-400">+{solver.score}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {raceActive && raceSolvers.length === 0 && (
              <div className="text-center py-6">
                <div className="flex justify-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-slate-400">Waiting for students to submit corrections...</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {raceActive && !raceFinished && (
                <button
                  onClick={handleEndRace}
                  className="flex-1 py-3 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
                >
                  END RACE
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Race finished */}
        {raceFinished && challenge && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30 text-center">
              <h2 className="text-3xl font-game text-emerald-400 mb-2">HUNT COMPLETE!</h2>
              <p className="text-slate-300">{raceSolvers.length} students submitted corrections</p>
            </div>

            {/* Final standings */}
            {raceSolvers.length > 0 && (
              <div className="space-y-2">
                {raceSolvers.map(solver => (
                  <div
                    key={solver.studentId}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                      solver.position === 1
                        ? 'bg-yellow-500/20 border border-yellow-500/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-black ${
                        solver.position === 1 ? 'text-yellow-400' :
                        solver.position === 2 ? 'text-slate-300' :
                        solver.position === 3 ? 'text-amber-600' : 'text-slate-500'
                      }`}>#{solver.position}</span>
                      <span className="font-semibold text-white">{solver.displayName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">{solver.found}/{solver.totalErrors} found</span>
                      <span className="font-game text-emerald-400">+{solver.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleNewRound}
              className="w-full py-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl font-game text-lg text-white hover:scale-[1.02] active:scale-95 transition-all"
            >
              NEW PARAGRAPH
            </button>
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
          className="flex flex-col items-center gap-6 py-12"
        >
          <div className="w-16 h-16 border-4 border-red-500/10 border-t-red-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-red-400 uppercase tracking-widest animate-pulse">
            Hiding Errors...
          </p>
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
          </div>

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
        </motion.div>
      )}
    </div>
  );
}
