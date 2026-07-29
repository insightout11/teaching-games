'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityProps } from '../types';
import { ActivityStatus, type Guess, type TwoTruthsContent, type TwoTruthsRound } from './types';

export function TwoTruthsActivity({
  generatedContent,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  isMicroEvent,
}: ActivityProps) {
  const content = generatedContent as TwoTruthsContent;

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const scoredGuessesRef = useRef<Set<string>>(new Set());

  const currentRound: TwoTruthsRound | undefined = content.rounds?.[currentRoundIndex];

  // Register input spec for student controller
  useEffect(() => {
    if (status === ActivityStatus.GUESSING && currentRound) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'two-truths',
        prompt: 'Which statement is FALSE?',
        options: currentRound.statements.map((s, i) => `${i + 1}. ${s}`),
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentRound, onSetInputSpec]);

  // Register remote vote handler to receive votes from student devices
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (status !== ActivityStatus.GUESSING || !currentRound) return;

      const options = currentRound.statements.map((s, i) => `${i + 1}. ${s}`);
      const guessIndex = options.indexOf(vote.choice);
      if (guessIndex === -1) return;

      setGuesses((prev) => {
        const filtered = prev.filter((g) => g.clientId !== vote.clientId);
        return [...filtered, {
          clientId: vote.clientId,
          studentId: vote.studentId ?? null,
          studentName: vote.displayName,
          guessIndex,
        }];
      });
    });

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, currentRound, onRegisterRemoteVoteHandler]);

  // Calculate guess statistics
  const guessStats = useMemo(() => {
    if (!currentRound) return { counts: [0, 0, 0], correct: 0 };

    const counts = [0, 0, 0];
    let correct = 0;

    guesses.forEach((g) => {
      counts[g.guessIndex]++;
      if (g.guessIndex === currentRound.fabricationIndex) {
        correct++;
      }
    });

    return { counts, correct };
  }, [guesses, currentRound]);

  const startActivity = useCallback(() => {
    scoredGuessesRef.current = new Set();
    setStatus(ActivityStatus.PRESENTING);
    onPhaseChange?.('presenting');
  }, [onPhaseChange]);

  const startGuessing = useCallback(() => {
    setStatus(ActivityStatus.GUESSING);
    setGuesses([]);
    onPhaseChange?.('guessing');
  }, [onPhaseChange]);

  const revealAnswer = useCallback(() => {
    if (!currentRound) return;
    guesses.forEach((guess) => {
      const scoreKey = `${currentRoundIndex}:${guess.clientId}`;
      if (scoredGuessesRef.current.has(scoreKey)) return;
      scoredGuessesRef.current.add(scoreKey);
      const isCorrect = guess.guessIndex === currentRound.fabricationIndex;
      void onScore?.({
        studentId: guess.studentId,
        clientId: guess.clientId,
        displayName: guess.studentName,
        promptIndex: currentRoundIndex + 1,
        points: isCorrect ? 3 : 1,
        isCorrect,
      });
    });
    setStatus(ActivityStatus.REVEAL);
    setCorrectCount((prev) => prev + guessStats.correct);
    onPhaseChange?.('reveal');
  }, [currentRound, currentRoundIndex, guesses, guessStats.correct, onScore, onPhaseChange]);

  const nextRound = useCallback(() => {
    if (!isMicroEvent && currentRoundIndex < (content.rounds?.length || 0) - 1) {
      setCurrentRoundIndex((prev) => prev + 1);
      setGuesses([]);
      setShowExplanation(false);
      setStatus(ActivityStatus.PRESENTING);
      onPhaseChange?.('presenting');
    } else {
      setStatus(ActivityStatus.FINISHED);
      onPhaseChange?.('finished');
    }
  }, [isMicroEvent, currentRoundIndex, content.rounds?.length, onPhaseChange]);

  const restartActivity = useCallback(() => {
    setCurrentRoundIndex(0);
    setGuesses([]);
    setShowExplanation(false);
    setCorrectCount(0);
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-white';
    }
  };

  if (!content.rounds || content.rounds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">No rounds available. Please regenerate content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-emerald-400">Spot the Fib</h3>
          {customTopic && customTopic !== 'General' && (
            <p className="text-xs opacity-60">Topic: {customTopic}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isMicroEvent && (
            <span className="text-sm opacity-60">
              Round {currentRoundIndex + 1} / {content.rounds.length}
            </span>
          )}
          {currentRound && (
            <span className={`text-xs uppercase ${getDifficultyColor(currentRound.difficulty)}`}>
              {currentRound.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* IDLE State */}
      {status === ActivityStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-xl mb-2 opacity-90">Spot the Lie!</p>
          <p className="opacity-60 text-sm mb-8">
            Two statements are true, one is false. Can you find the fabrication?
          </p>
          <button
            onClick={startActivity}
            className="px-12 py-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START
          </button>
        </motion.div>
      )}

      {/* PRESENTING State */}
      {status === ActivityStatus.PRESENTING && currentRound && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center mb-4">
            <p className="text-sm uppercase tracking-widest opacity-50">
              Which one is FALSE?
            </p>
          </div>

          <div className="space-y-4">
            {currentRound.statements.map((statement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="glass p-6 rounded-2xl border-2 border-white/10"
              >
                <div className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-lg">{statement}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={startGuessing}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              START GUESSING
            </button>
          </div>
        </motion.div>
      )}

      {/* GUESSING State */}
      {status === ActivityStatus.GUESSING && currentRound && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="space-y-4">
            {currentRound.statements.map((statement, index) => (
              <div
                key={index}
                className="glass p-4 rounded-2xl border-2 border-white/10"
              >
                <div className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="mb-3">{statement}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-50">Votes:</span>
                      <span className="text-lg font-bold text-red-400">{guessStats.counts[index]}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={revealAnswer}
              disabled={guesses.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              REVEAL ANSWER
            </button>
          </div>
        </motion.div>
      )}

      {/* REVEAL State */}
      {status === ActivityStatus.REVEAL && currentRound && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="space-y-4">
            {currentRound.statements.map((statement, index) => {
              const isFabrication = index === currentRound.fabricationIndex;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.3 }}
                  className={`glass p-4 rounded-2xl border-2 ${
                    isFabrication
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-green-500 bg-green-500/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      isFabrication ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                      {isFabrication ? '✗' : '✓'}
                    </span>
                    <div className="flex-1">
                      <p className="mb-2">{statement}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={isFabrication ? 'text-red-400 font-bold' : 'text-green-400'}>
                          {isFabrication ? 'FALSE' : 'TRUE'}
                        </span>
                        <span className="opacity-50">
                          {guessStats.counts[index]} guessed this
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {!showExplanation ? (
              <motion.div className="text-center">
                <button
                  onClick={() => setShowExplanation(true)}
                  className="px-6 py-2 glass hover:bg-white/10 rounded-lg text-sm border border-yellow-500/30 text-yellow-400"
                >
                  SHOW EXPLANATION
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-2xl border-2 border-yellow-500/30"
              >
                <p className="text-sm uppercase tracking-widest opacity-50 mb-2">Why it&apos;s false:</p>
                <p className="text-lg">{currentRound.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-2xl font-game">
              <span className="text-green-400">{guessStats.correct}</span>
              <span className="opacity-50"> / {guesses.length} correct</span>
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={nextRound}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentRoundIndex < content.rounds.length - 1 ? 'NEXT ROUND' : 'FINISH'}
            </button>
          </div>
        </motion.div>
      )}

      {/* FINISHED State */}
      {status === ActivityStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-2xl font-game text-emerald-400 mb-4">Great Detective Work!</p>
          <p className="text-4xl font-game mb-2">
            {correctCount} <span className="text-lg opacity-50">correct guesses</span>
          </p>
          <p className="opacity-70 mb-8">
            across {content.rounds.length} rounds
          </p>
          <button
            onClick={restartActivity}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            PLAY AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
}
