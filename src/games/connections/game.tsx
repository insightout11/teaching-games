'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { GameStatus, GROUP_COLORS } from './types';
import type { ConnectionsChallenge, ConnectionsGroup, ConnectionsResult, GroupColor } from './types';

const MAX_LIVES = 4;

export function ConnectionsGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterRemoteVoteHandler }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [challenge, setChallenge] = useState<ConnectionsChallenge | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [foundGroups, setFoundGroups] = useState<ConnectionsGroup[]>([]);
  const [lives, setLives] = useState(MAX_LIVES);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shakeWords, setShakeWords] = useState<string[]>([]);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Get remaining groups (not yet found)
  const remainingGroups = useMemo(() => challenge?.groups.filter(
    g => !foundGroups.some(fg => fg.category === g.category)
  ) || [], [challenge?.groups, foundGroups]);

  // Get words that haven't been found yet
  const remainingWords = useMemo(() => challenge?.words.filter(
    w => !foundGroups.some(g => g.words.includes(w))
  ) || [], [challenge?.words, foundGroups]);

  // Register input spec for student controller
  useEffect(() => {
    if (status === GameStatus.PLAYING && challenge && remainingWords.length > 0) {
      onSetInputSpec?.({
        type: 'multi-select',
        gameKey: 'connections',
        prompt: 'Find 4 words that belong together',
        options: remainingWords,
        selectCount: 4,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, challenge, remainingWords, onSetInputSpec]);

  // Process remote vote (submission from student device)
  const processRemoteSubmission = useCallback(async (selectedWords: string[]) => {
    if (!challenge || status !== GameStatus.PLAYING) return;

    setStatus(GameStatus.EVALUATING);
    setFeedback(null);

    try {
      const response = await fetch('/api/connections/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedWords,
          remainingGroups
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate');

      const result: ConnectionsResult = await response.json();

      if (result.isCorrect && result.matchedGroup) {
        // Calculate points based on mistakes
        const pointsForGroup = mistakes === 0 ? 10 : mistakes === 1 ? 7 : mistakes === 2 ? 5 : 3;
        const newScore = score + pointsForGroup;
        setScore(newScore);
        setFoundGroups(prev => [...prev, result.matchedGroup!]);
        setFeedback(`+${pointsForGroup} points! ${result.feedback}`);

        // Check if won (all 4 groups found)
        if (foundGroups.length + 1 === 4) {
          const finalScore = newScore + 5; // Bonus for completing
          setScore(finalScore);
          setStatus(GameStatus.WON);

          if (currentStudentId) {
            onScore(currentStudentId, {
              isCorrect: true,
              points: finalScore,
              responseData: {
                groupsFound: 4,
                livesRemaining: lives,
                mistakes
              }
            });
          }
        } else {
          setStatus(GameStatus.PLAYING);
        }
      } else {
        // Wrong guess
        const newLives = lives - 1;
        setLives(newLives);
        setMistakes(prev => prev + 1);
        setFeedback(result.feedback);
        setShakeWords([...selectedWords]);

        setTimeout(() => setShakeWords([]), 500);

        if (newLives === 0) {
          setStatus(GameStatus.LOST);

          if (currentStudentId) {
            onScore(currentStudentId, {
              isCorrect: false,
              points: score,
              responseData: {
                groupsFound: foundGroups.length,
                livesRemaining: 0,
                mistakes: mistakes + 1
              }
            });
          }
        } else {
          setStatus(GameStatus.PLAYING);
        }
      }

      setSelected([]);
    } catch (err) {
      console.error(err);
      setError('Failed to evaluate answer. Please try again.');
      setStatus(GameStatus.PLAYING);
    }
  }, [challenge, status, remainingGroups, mistakes, score, foundGroups, lives, currentStudentId, onScore]);

  // Register remote vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote: GameRemoteVote) => {
      if (status !== GameStatus.PLAYING) return;

      try {
        // Parse the JSON-stringified array of selected words
        const selectedWords = JSON.parse(vote.choice) as string[];
        if (Array.isArray(selectedWords) && selectedWords.length === 4) {
          processRemoteSubmission(selectedWords);
        }
      } catch (err) {
        console.error('Failed to parse remote vote:', err);
      }
    });

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, onRegisterRemoteVoteHandler, processRemoteSubmission]);

  const handleGenerate = async () => {
    if (!currentStudentId) {
      onPickStudent();
      return;
    }

    setStatus(GameStatus.GENERATING);
    setError(null);
    setSelected([]);
    setFoundGroups([]);
    setLives(MAX_LIVES);
    setMistakes(0);
    setScore(0);
    setFeedback(null);

    try {
      const response = await fetch('/api/connections/generate', {
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

  const toggleSelect = (word: string) => {
    if (status !== GameStatus.PLAYING) return;

    setFeedback(null);

    if (selected.includes(word)) {
      setSelected(selected.filter(w => w !== word));
    } else if (selected.length < 4) {
      setSelected([...selected, word]);
    }
  };

  const handleSubmit = async () => {
    if (selected.length !== 4 || !challenge) return;

    setStatus(GameStatus.EVALUATING);
    setFeedback(null);

    try {
      const response = await fetch('/api/connections/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedWords: selected,
          remainingGroups
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate');

      const result: ConnectionsResult = await response.json();

      if (result.isCorrect && result.matchedGroup) {
        // Calculate points based on mistakes
        const pointsForGroup = mistakes === 0 ? 10 : mistakes === 1 ? 7 : mistakes === 2 ? 5 : 3;
        const newScore = score + pointsForGroup;
        setScore(newScore);
        setFoundGroups([...foundGroups, result.matchedGroup]);
        setFeedback(`+${pointsForGroup} points! ${result.feedback}`);

        // Check if won (all 4 groups found)
        if (foundGroups.length + 1 === 4) {
          const finalScore = newScore + 5; // Bonus for completing
          setScore(finalScore);
          setStatus(GameStatus.WON);

          if (currentStudentId) {
            onScore(currentStudentId, {
              isCorrect: true,
              points: finalScore,
              responseData: {
                groupsFound: 4,
                livesRemaining: lives,
                mistakes
              }
            });
          }
        } else {
          setStatus(GameStatus.PLAYING);
        }
      } else {
        // Wrong guess
        const newLives = lives - 1;
        setLives(newLives);
        setMistakes(mistakes + 1);
        setFeedback(result.feedback);
        setShakeWords([...selected]);

        setTimeout(() => setShakeWords([]), 500);

        if (newLives === 0) {
          setStatus(GameStatus.LOST);

          if (currentStudentId) {
            onScore(currentStudentId, {
              isCorrect: false,
              points: score,
              responseData: {
                groupsFound: foundGroups.length,
                livesRemaining: 0,
                mistakes: mistakes + 1
              }
            });
          }
        } else {
          setStatus(GameStatus.PLAYING);
        }
      }

      setSelected([]);
    } catch (err) {
      console.error(err);
      setError('Failed to evaluate answer. Please try again.');
      setStatus(GameStatus.PLAYING);
    }
  };

  const handleDeselectAll = () => {
    setSelected([]);
    setFeedback(null);
  };

  const handleNewGame = () => {
    setChallenge(null);
    setSelected([]);
    setFoundGroups([]);
    setLives(MAX_LIVES);
    setMistakes(0);
    setScore(0);
    setFeedback(null);
    setStatus(GameStatus.IDLE);
    onPickStudent();
  };

  const getWordColor = (word: string): GroupColor | null => {
    const group = foundGroups.find(g => g.words.includes(word));
    return group?.color || null;
  };

  const renderLives = () => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < lives ? 'bg-red-500' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    );
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
              Find 4 groups of 4 related words from a grid of 16 words.
              You have 4 lives - each wrong guess costs one life.
              Find easier groups first for more points!
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
              className="w-full px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              GENERATE PUZZLE
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
          <div className="w-16 h-16 border-4 border-lc-blue/10 border-t-lc-blue rounded-full animate-spin" />
          <p className="font-game text-xl text-lc-blue uppercase tracking-widest animate-pulse">
            Creating Puzzle...
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
          className="space-y-4"
        >
          {/* Stats Bar */}
          <div className="flex justify-between items-center glass px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-60">Lives:</span>
              {renderLives()}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-60">Score:</span>
              <span className="font-bold text-emerald-400">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-60">Found:</span>
              <span className="font-bold text-cyan-400">{foundGroups.length}/4</span>
            </div>
          </div>

          {/* Found Groups */}
          <AnimatePresence>
            {foundGroups.map((group) => (
              <motion.div
                key={group.category}
                initial={{ opacity: 0, scale: 0.9, height: 0 }}
                animate={{ opacity: 1, scale: 1, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.9, height: 0 }}
                className={`${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text} p-4 rounded-xl text-center`}
              >
                <p className="font-bold text-sm uppercase tracking-wider mb-1">{group.category}</p>
                <p className="font-medium">{group.words.join(', ')}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Word Grid */}
          <div className="grid grid-cols-4 gap-2">
            {remainingWords.map((word) => {
              const isSelected = selected.includes(word);
              const isShaking = shakeWords.includes(word);
              const wordColor = getWordColor(word);

              return (
                <motion.button
                  key={word}
                  onClick={() => toggleSelect(word)}
                  disabled={status === GameStatus.EVALUATING || !!wordColor}
                  animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`
                    p-3 rounded-lg font-bold text-sm transition-all uppercase
                    ${wordColor ? `${GROUP_COLORS[wordColor].bg} ${GROUP_COLORS[wordColor].text}` : ''}
                    ${!wordColor && isSelected ? 'bg-cyan-500 text-white scale-105 ring-2 ring-cyan-300 shadow-lg shadow-cyan-500/30' : ''}
                    ${!wordColor && !isSelected ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : ''}
                    ${status === GameStatus.EVALUATING ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {word}
                </motion.button>
              );
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-center p-3 rounded-xl ${
                  feedback.includes('+') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {feedback}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDeselectAll}
              disabled={selected.length === 0 || status === GameStatus.EVALUATING}
              className="flex-1 py-3 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10 disabled:opacity-30"
            >
              DESELECT
            </button>
            <button
              onClick={handleSubmit}
              disabled={selected.length !== 4 || status === GameStatus.EVALUATING}
              className="flex-1 py-3 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-white disabled:opacity-30 transition-all"
            >
              {status === GameStatus.EVALUATING ? 'CHECKING...' : 'SUBMIT'}
            </button>
          </div>

          {/* Selection Counter */}
          <div className="text-center text-sm opacity-60">
            {selected.length}/4 words selected
          </div>
        </motion.div>
      )}

      {/* WON State */}
      {status === GameStatus.WON && challenge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30 text-center">
            <h2 className="text-3xl font-game text-emerald-400 mb-2">PUZZLE COMPLETE!</h2>
            <p className="text-slate-300 mb-4">You found all 4 groups!</p>
            <div className="text-4xl font-black text-white">
              {score} <span className="text-lg font-normal opacity-60">points</span>
            </div>
            <p className="text-sm text-emerald-400 mt-2">+5 bonus for completing!</p>
          </div>

          {/* Show all groups */}
          <div className="space-y-2">
            {challenge.groups.map((group) => (
              <div
                key={group.category}
                className={`${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text} p-3 rounded-xl text-center`}
              >
                <p className="font-bold text-sm uppercase tracking-wider">{group.category}</p>
                <p className="text-sm">{group.words.join(', ')}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleNewGame}
            className="w-full py-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl font-game text-lg text-white hover:scale-[1.02] active:scale-95 transition-all"
          >
            NEW PUZZLE
          </button>
        </motion.div>
      )}

      {/* LOST State */}
      {status === GameStatus.LOST && challenge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-red-500/30 text-center">
            <h2 className="text-3xl font-game text-red-400 mb-2">OUT OF LIVES!</h2>
            <p className="text-slate-300 mb-4">
              You found {foundGroups.length} out of 4 groups
            </p>
            <div className="text-4xl font-black text-white">
              {score} <span className="text-lg font-normal opacity-60">points</span>
            </div>
          </div>

          {/* Reveal all groups */}
          <div className="space-y-2">
            <p className="text-sm text-center opacity-60 mb-2">The groups were:</p>
            {challenge.groups.map((group) => {
              const wasFound = foundGroups.some(fg => fg.category === group.category);
              return (
                <div
                  key={group.category}
                  className={`${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text} p-3 rounded-xl text-center ${
                    !wasFound ? 'opacity-75' : ''
                  }`}
                >
                  <p className="font-bold text-sm uppercase tracking-wider">
                    {group.category}
                    {wasFound && ' ✓'}
                  </p>
                  <p className="text-sm">{group.words.join(', ')}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleNewGame}
            className="w-full py-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl font-game text-lg text-white hover:scale-[1.02] active:scale-95 transition-all"
          >
            TRY AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
}
