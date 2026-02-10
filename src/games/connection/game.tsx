'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameProps } from '../types';
import { GameStatus } from './types';
import type { ConnectionChallenge, ConnectionResult } from './types';

export function ConnectionGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [challenge, setChallenge] = useState<ConnectionChallenge | null>(null);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Keep a ref to current challenge for the submission handler
  const challengeRef = useRef<ConnectionChallenge | null>(null);
  challengeRef.current = challenge;

  // Register input spec for student controller
  useEffect(() => {
    if (status === GameStatus.PLAYING && challenge) {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'connection',
        prompt: `What connects "${challenge.word1}" and "${challenge.word2}"?`,
        placeholder: 'Type what connects them...',
        maxLength: 100,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, challenge, onSetInputSpec]);

  // Register submission handler to evaluate remote submissions
  useEffect(() => {
    onRegisterSubmissionHandler?.({
      handleSubmission: async (content: string) => {
        const ch = challengeRef.current;
        if (!ch) {
          return { isCorrect: false, points: 1, feedback: 'No active challenge' };
        }

        try {
          const response = await fetch('/api/connection/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              word1: ch.word1,
              word2: ch.word2,
              category: ch.category,
              guess: content.trim(),
              difficulty: sessionSettings.difficulty,
            }),
          });

          if (!response.ok) throw new Error('Evaluation failed');

          const evaluationResult: ConnectionResult = await response.json();

          setGuess(content.trim());
          setResult(evaluationResult);
          setStatus(GameStatus.SHOWING_RESULT);

          return {
            isCorrect: evaluationResult.isCorrect,
            points: evaluationResult.score,
            feedback: evaluationResult.feedback,
          };
        } catch {
          return { isCorrect: false, points: 1, feedback: 'Evaluation error' };
        }
      },
    });

    return () => onRegisterSubmissionHandler?.(null);
  }, [sessionSettings.difficulty, onRegisterSubmissionHandler]);

  const handleGenerate = async () => {
    if (!currentStudentId) {
      onPickStudent();
      return;
    }

    setStatus(GameStatus.GENERATING);
    setError(null);
    setGuess('');
    setResult(null);
    setShowHint(false);

    try {
      const response = await fetch('/api/connection/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sessionSettings.topic,
          difficulty: sessionSettings.difficulty
        }),
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      const data = await response.json();
      setChallenge(data);
      setStatus(GameStatus.PLAYING);
    } catch (err) {
      setError('Failed to generate challenge. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleSubmit = async () => {
    if (!guess.trim() || !challenge) return;

    setStatus(GameStatus.EVALUATING);

    try {
      const response = await fetch('/api/connection/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word1: challenge.word1,
          word2: challenge.word2,
          category: challenge.category,
          guess: guess.trim(),
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate');

      const evaluationResult: ConnectionResult = await response.json();
      setResult(evaluationResult);
      setStatus(GameStatus.SHOWING_RESULT);

      if (currentStudentId) {
        onScore(currentStudentId, {
          isCorrect: evaluationResult.isCorrect,
          points: evaluationResult.score,
          responseData: {
            word1: challenge.word1,
            word2: challenge.word2,
            guess: guess.trim(),
            quality: evaluationResult.quality,
            actualConnection: evaluationResult.actualConnection
          }
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to evaluate answer. Please try again.');
      setStatus(GameStatus.PLAYING);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && guess.trim()) {
      handleSubmit();
    }
  };

  const handleNewChallenge = () => {
    setChallenge(null);
    setResult(null);
    setGuess('');
    setShowHint(false);
    setStatus(GameStatus.IDLE);
    onPickStudent();
  };

  const handleSameChallenge = () => {
    setResult(null);
    setGuess('');
    setShowHint(false);
    setStatus(GameStatus.PLAYING);
    onPickStudent();
  };

  const getResultColor = (quality: string) => {
    switch (quality) {
      case 'creative': return 'from-purple-400 to-pink-500';
      case 'correct': return 'from-emerald-400 to-emerald-500';
      case 'partial': return 'from-yellow-400 to-amber-500';
      default: return 'from-red-400 to-red-500';
    }
  };

  const getResultIcon = (quality: string) => {
    switch (quality) {
      case 'creative': return '🌟';
      case 'correct': return '✓';
      case 'partial': return '~';
      default: return '✗';
    }
  };

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
              Two words will appear. Find what connects them! Any valid connection counts -
              be creative and think outside the box.
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
              className="w-full px-12 py-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              GENERATE
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
          <div className="w-16 h-16 border-4 border-violet-500/10 border-t-violet-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-violet-400 uppercase tracking-widest animate-pulse">
            Finding Word Pair...
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
      {status === GameStatus.PLAYING && challenge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-game text-violet-400 tracking-wide">What&apos;s the Link?</h2>
          </div>

          {/* Word Cards */}
          <div className="flex justify-center items-center gap-6">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass px-8 py-6 rounded-2xl border-2 border-violet-500/30"
            >
              <p className="text-3xl font-black text-white tracking-wide">{challenge.word1}</p>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl text-violet-400"
            >
              ↔
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass px-8 py-6 rounded-2xl border-2 border-violet-500/30"
            >
              <p className="text-3xl font-black text-white tracking-wide">{challenge.word2}</p>
            </motion.div>
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type what connects them..."
              autoFocus
              className="flex-1 bg-black/40 border-2 border-white/10 text-white rounded-xl px-4 py-3 focus:border-violet-500 outline-none text-lg"
            />
            <button
              onClick={handleSubmit}
              disabled={!guess.trim()}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl font-bold text-white disabled:opacity-30"
            >
              GO
            </button>
          </div>

          {/* Hint */}
          {challenge.hint && (
            <div className="text-center">
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  💡 Need a hint?
                </button>
              ) : (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-slate-400 italic"
                >
                  Hint: {challenge.hint}
                </motion.p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* EVALUATING State */}
      {status === GameStatus.EVALUATING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6 py-12"
        >
          <div className="w-16 h-16 border-4 border-violet-500/10 border-t-violet-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-violet-400 uppercase tracking-widest animate-pulse">
            Evaluating...
          </p>
        </motion.div>
      )}

      {/* SHOWING_RESULT State */}
      {status === GameStatus.SHOWING_RESULT && result && challenge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Result Header */}
          <div className={`glass p-6 rounded-2xl border-2 text-center ${
            result.isCorrect ? 'border-emerald-500/30' : result.quality === 'partial' ? 'border-yellow-500/30' : 'border-red-500/30'
          }`}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className={`text-4xl font-black bg-gradient-to-r ${getResultColor(result.quality)} bg-clip-text text-transparent`}>
                {getResultIcon(result.quality)}
              </span>
              <span className={`text-2xl font-bold bg-gradient-to-r ${getResultColor(result.quality)} bg-clip-text text-transparent`}>
                {result.quality === 'creative' ? 'Creative!' :
                 result.quality === 'correct' ? 'Correct!' :
                 result.quality === 'partial' ? 'Partial' : 'Not Quite'}
              </span>
              <span className="text-2xl font-bold text-white">+{result.score}</span>
            </div>
            <p className="text-slate-300">{result.feedback}</p>
          </div>

          {/* Connection Visualization */}
          <div className="glass p-6 rounded-2xl border border-white/10 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-xl font-bold text-white">{challenge.word1}</span>
              <span className="text-violet-400">←────────→</span>
              <span className="text-xl font-bold text-white">{challenge.word2}</span>
            </div>
            <div className="inline-block px-4 py-2 bg-violet-500/20 rounded-full">
              <p className="text-violet-300 text-sm font-medium">{result.actualConnection}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleNewChallenge}
              className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
            >
              NEW CHALLENGE
            </button>
            <button
              onClick={handleSameChallenge}
              className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              SAME, NEW STUDENT
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
