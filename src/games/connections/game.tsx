'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { GameStatus, GROUP_COLORS } from './types';
import { getEffectiveTopic } from '@/stores/session-store';
import type { ConnectionsChallenge, ConnectionsGroup, ConnectionsResult, GroupColor } from './types';

const MAX_LIVES = 4;

function getPositionPoints(position: number): number {
  if (position === 1) return 10;
  if (position === 2) return 8;
  if (position === 3) return 6;
  return 3;
}

interface RacePlayer {
  studentId: string;
  displayName: string;
  groupsFound: number;
  finished: boolean;
  eliminated: boolean;
  finishPosition: number | null;
  score: number;
  livesRemaining: number;
}

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

  // Revealed categories in results (click-to-reveal)
  const [revealedCategories, setRevealedCategories] = useState<Set<string>>(new Set());
  const toggleReveal = useCallback((category: string) => {
    setRevealedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) { next.delete(category); } else { next.add(category); }
      return next;
    });
  }, []);

  // Simultaneous race mode
  const isSimultaneous = students.length >= 3;
  const [racePlayers, setRacePlayers] = useState<RacePlayer[]>([]);
  const [raceFinishCount, setRaceFinishCount] = useState(0);
  const [raceComplete, setRaceComplete] = useState(false);
  const racePlayersRef = useRef<RacePlayer[]>([]);
  useEffect(() => { racePlayersRef.current = racePlayers; }, [racePlayers]);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Get remaining groups (not yet found) — for turn-based mode
  const remainingGroups = useMemo(() => challenge?.groups.filter(
    g => !foundGroups.some(fg => fg.category === g.category)
  ) || [], [challenge?.groups, foundGroups]);

  // Get words that haven't been found yet — for turn-based mode
  const remainingWords = useMemo(() => challenge?.words.filter(
    w => !foundGroups.some(g => g.words.includes(w))
  ) || [], [challenge?.words, foundGroups]);

  // Register input spec for student controller
  useEffect(() => {
    if (isSimultaneous) {
      // In race mode, broadcast the full puzzle to all students
      if (status === GameStatus.PLAYING && challenge) {
        onSetInputSpec?.({
          type: 'multi-select',
          gameKey: 'connections',
          prompt: 'Find 4 words that belong together — race to solve all groups!',
          options: challenge.words,
          selectCount: 4,
        });
      } else {
        onSetInputSpec?.(null);
      }
    } else {
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
    }
  }, [isSimultaneous, status, challenge, remainingWords, onSetInputSpec]);

  // Process remote submission (turn-based)
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
        const pointsForGroup = mistakes === 0 ? 10 : mistakes === 1 ? 7 : mistakes === 2 ? 5 : 3;
        const newScore = score + pointsForGroup;
        setScore(newScore);
        setFoundGroups(prev => [...prev, result.matchedGroup!]);
        setFeedback(`+${pointsForGroup} points! ${result.feedback}`);

        if (foundGroups.length + 1 === 4) {
          const finalScore = newScore + 5;
          setScore(finalScore);
          setStatus(GameStatus.WON);

          if (currentStudentId) {
            onScore(currentStudentId, {
              isCorrect: true,
              points: finalScore,
              responseData: { groupsFound: 4, livesRemaining: lives, mistakes }
            });
          }
        } else {
          setStatus(GameStatus.PLAYING);
        }
      } else {
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
              responseData: { groupsFound: foundGroups.length, livesRemaining: 0, mistakes: mistakes + 1 }
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

  // Handle race mode submissions
  const handleRaceSubmission = useCallback(async (vote: GameRemoteVote) => {
    if (!challenge || status !== GameStatus.PLAYING || raceComplete) return;

    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    try {
      const selectedWords = JSON.parse(vote.choice) as string[];
      if (!Array.isArray(selectedWords) || selectedWords.length !== 4) return;

      // Evaluate against ALL groups (not just remaining, since each student plays independently)
      const response = await fetch('/api/connections/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedWords,
          remainingGroups: challenge.groups, // all groups for evaluation
        })
      });

      if (!response.ok) return;

      const result: ConnectionsResult = await response.json();

      // Check if player is already done (finished or eliminated) using ref to avoid stale closure
      const currentPlayer = racePlayersRef.current.find(p => p.studentId === studentId);
      if (currentPlayer?.finished || currentPlayer?.eliminated) return;

      if (result.isCorrect && result.matchedGroup) {
        setRacePlayers(prev => {
          const existing = prev.find(p => p.studentId === studentId);
          if (existing) {
            // Check if they already found this group
            if (existing.finished || existing.eliminated) return prev;

            const newGroupsFound = existing.groupsFound + 1;
            const isComplete = newGroupsFound === 4;

            let finishPosition = existing.finishPosition;
            let bonus = 0;

            if (isComplete && !existing.finished) {
              // Calculate finish position
              const currentFinishCount = prev.filter(p => p.finished).length;
              finishPosition = currentFinishCount + 1;
              bonus = getPositionPoints(finishPosition);

              // Score the student
              onScore(studentId, {
                isCorrect: true,
                points: bonus,
                responseData: { groupsFound: 4, finishPosition },
              });

              try {
                const audio = new Audio('/sounds/correct.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});
              } catch {}
            }

            return prev.map(p =>
              p.studentId === studentId
                ? { ...p, groupsFound: newGroupsFound, finished: isComplete, finishPosition, score: p.score + bonus }
                : p
            );
          } else {
            // New player entry — first submission is correct
            return [...prev, {
              studentId,
              displayName: vote.displayName,
              groupsFound: 1,
              finished: false,
              eliminated: false,
              finishPosition: null,
              score: 0,
              livesRemaining: MAX_LIVES,
            }];
          }
        });
      } else {
        // Wrong answer — deduct a life
        setRacePlayers(prev => {
          const existing = prev.find(p => p.studentId === studentId);
          if (existing) {
            if (existing.finished || existing.eliminated) return prev;
            const newLives = existing.livesRemaining - 1;
            const isEliminated = newLives === 0;
            if (isEliminated) {
              onScore(studentId, {
                isCorrect: false,
                points: 0,
                responseData: { groupsFound: existing.groupsFound, livesRemaining: 0, eliminated: true },
              });
            }
            return prev.map(p =>
              p.studentId === studentId
                ? { ...p, livesRemaining: newLives, eliminated: isEliminated }
                : p
            );
          } else {
            // New player — first submission is wrong
            const newLives = MAX_LIVES - 1;
            return [...prev, {
              studentId,
              displayName: vote.displayName,
              groupsFound: 0,
              finished: false,
              eliminated: false,
              finishPosition: null,
              score: 0,
              livesRemaining: newLives,
            }];
          }
        });
      }
    } catch (err) {
      console.error('Failed to process race submission:', err);
    }
  }, [challenge, status, raceComplete, onScore]);

  // Register remote vote handler
  useEffect(() => {
    if (isSimultaneous) {
      onRegisterRemoteVoteHandler?.(handleRaceSubmission);
    } else {
      onRegisterRemoteVoteHandler?.((vote: GameRemoteVote) => {
        if (status !== GameStatus.PLAYING) return;
        try {
          const selectedWords = JSON.parse(vote.choice) as string[];
          if (Array.isArray(selectedWords) && selectedWords.length === 4) {
            processRemoteSubmission(selectedWords);
          }
        } catch (err) {
          console.error('Failed to parse remote vote:', err);
        }
      });
    }

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [isSimultaneous, status, onRegisterRemoteVoteHandler, processRemoteSubmission, handleRaceSubmission]);

  // Check if race is complete (all finished or enough have)
  useEffect(() => {
    const finishedCount = racePlayers.filter(p => p.finished).length;
    if (finishedCount !== raceFinishCount) {
      setRaceFinishCount(finishedCount);
    }
  }, [racePlayers, raceFinishCount]);

  const handleGenerate = async () => {
    if (!isSimultaneous && !currentStudentId) {
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
    setRacePlayers([]);
    setRaceFinishCount(0);
    setRaceComplete(false);

    try {
      const response = await fetch('/api/connections/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: getEffectiveTopic(sessionSettings),
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
        body: JSON.stringify({ selectedWords: selected, remainingGroups })
      });

      if (!response.ok) throw new Error('Failed to evaluate');

      const result: ConnectionsResult = await response.json();

      if (result.isCorrect && result.matchedGroup) {
        const pointsForGroup = mistakes === 0 ? 10 : mistakes === 1 ? 7 : mistakes === 2 ? 5 : 3;
        const newScore = score + pointsForGroup;
        setScore(newScore);
        setFoundGroups([...foundGroups, result.matchedGroup]);
        setFeedback(`+${pointsForGroup} points! ${result.feedback}`);

        if (foundGroups.length + 1 === 4) {
          const finalScore = newScore + 5;
          setScore(finalScore);
          setStatus(GameStatus.WON);
          if (currentStudentId) {
            onScore(currentStudentId, {
              isCorrect: true,
              points: finalScore,
              responseData: { groupsFound: 4, livesRemaining: lives, mistakes }
            });
          }
        } else {
          setStatus(GameStatus.PLAYING);
        }
      } else {
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
              responseData: { groupsFound: foundGroups.length, livesRemaining: 0, mistakes: mistakes + 1 }
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
    setRacePlayers([]);
    setRaceComplete(false);
    setRevealedCategories(new Set());
    setStatus(GameStatus.IDLE);
    if (!isSimultaneous) onPickStudent();
  };

  const handleEndRace = () => {
    setRaceComplete(true);
    setStatus(GameStatus.WON); // Reuse WON state for race results
  };

  const getWordColor = (word: string): GroupColor | null => {
    const group = foundGroups.find(g => g.words.includes(word));
    return group?.color || null;
  };

  const renderLives = () => (
    <div className="flex gap-1">
      {Array.from({ length: MAX_LIVES }).map((_, i) => (
        <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < lives ? 'bg-red-500' : 'bg-slate-700'}`} />
      ))}
    </div>
  );

  // ============ SIMULTANEOUS RACE MODE ============
  if (isSimultaneous) {
    const sortedPlayers = [...racePlayers].sort((a, b) => {
      if (a.eliminated && !b.eliminated) return 1;
      if (!a.eliminated && b.eliminated) return -1;
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return (a.finishPosition || 99) - (b.finishPosition || 99);
      return b.groupsFound - a.groupsFound;
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="opacity-70 text-sm">Everyone solves independently — first to complete all 4 groups wins!</p>
          <p className="text-xs text-cyan-400 mt-1">{students.length} students connected</p>
        </div>

        {/* IDLE State */}
        {status === GameStatus.IDLE && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-3">Race Mode</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                All students will receive the same 16-word grid on their devices. Race to find all 4 groups!
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="w-full px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              GENERATE PUZZLE
            </button>
          </motion.div>
        )}

        {/* GENERATING State */}
        {status === GameStatus.GENERATING && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-12">
            <div className="w-16 h-16 border-4 border-lc-blue/10 border-t-lc-blue rounded-full animate-spin" />
            <p className="font-game text-xl text-lc-blue uppercase tracking-widest animate-pulse">Creating Puzzle...</p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* PLAYING State — Race tracker */}
        {status === GameStatus.PLAYING && challenge && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Puzzle preview (teacher screen) */}
            <div className="glass p-4 rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Puzzle Words</p>
              <div className="grid grid-cols-4 gap-2">
                {challenge.words.map(word => (
                  <div key={word} className="p-2 rounded-lg bg-slate-800 text-slate-200 text-sm font-bold text-center uppercase">
                    {word}
                  </div>
                ))}
              </div>
            </div>

            {/* Race Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Race Progress</p>
                <p className="text-sm text-emerald-400 font-bold">{raceFinishCount} finished</p>
              </div>

              {sortedPlayers.length === 0 && (
                <div className="text-center py-6">
                  <div className="flex justify-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-slate-400">Waiting for students to start solving...</p>
                </div>
              )}

              <AnimatePresence>
                {sortedPlayers.map(player => (
                  <motion.div
                    key={player.studentId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                      player.eliminated
                        ? 'bg-red-500/10 border border-red-500/20 opacity-60'
                        : player.finished
                          ? player.finishPosition === 1
                            ? 'bg-yellow-500/20 border border-yellow-500/30'
                            : 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {player.eliminated && (
                        <span className="text-lg">💀</span>
                      )}
                      {!player.eliminated && player.finished && player.finishPosition && (
                        <span className={`text-lg font-black ${
                          player.finishPosition === 1 ? 'text-yellow-400' :
                          player.finishPosition === 2 ? 'text-slate-300' :
                          player.finishPosition === 3 ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          #{player.finishPosition}
                        </span>
                      )}
                      <span className="font-semibold text-white">{player.displayName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Lives (only show while in progress) */}
                      {!player.finished && (
                        <div className="flex gap-1">
                          {Array.from({ length: MAX_LIVES }).map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${
                              i < (player.livesRemaining ?? MAX_LIVES) ? 'bg-red-500' : 'bg-slate-700'
                            }`} />
                          ))}
                        </div>
                      )}
                      {/* Group progress dots */}
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`w-3 h-3 rounded-full ${
                            i < player.groupsFound ? 'bg-emerald-400' : 'bg-slate-700'
                          }`} />
                        ))}
                      </div>
                      {player.finished && (
                        <span className="font-game text-emerald-400">+{player.score}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* End race button */}
            <button
              onClick={handleEndRace}
              className="w-full py-3 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
            >
              END RACE
            </button>
          </motion.div>
        )}

        {/* WON State (Race results) */}
        {(status === GameStatus.WON || raceComplete) && challenge && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30 text-center">
              <h2 className="text-3xl font-game text-emerald-400 mb-2">RACE COMPLETE!</h2>
              <p className="text-slate-300">{raceFinishCount} of {racePlayers.length} players completed the puzzle</p>
            </div>

            {/* Final standings */}
            <div className="space-y-2">
              {sortedPlayers.map(player => (
                <div
                  key={player.studentId}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                    player.eliminated
                      ? 'bg-red-500/10 border border-red-500/20 opacity-60'
                      : player.finished && player.finishPosition === 1
                        ? 'bg-yellow-500/20 border border-yellow-500/30'
                        : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {player.eliminated && <span className="text-lg">💀</span>}
                    {!player.eliminated && player.finishPosition && (
                      <span className={`text-lg font-black ${
                        player.finishPosition === 1 ? 'text-yellow-400' :
                        player.finishPosition === 2 ? 'text-slate-300' :
                        player.finishPosition === 3 ? 'text-amber-600' : 'text-slate-500'
                      }`}>#{player.finishPosition}</span>
                    )}
                    <span className="font-semibold text-white">{player.displayName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">{player.groupsFound}/4 groups</span>
                    {player.score > 0 && <span className="font-game text-emerald-400">+{player.score}</span>}
                    {player.eliminated && <span className="text-sm text-red-400">eliminated</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Show solution */}
            <div className="space-y-2">
              <p className="text-sm text-center opacity-60 mb-2">The groups were: <span className="italic">(tap a group to reveal its connection)</span></p>
              {challenge.groups.map((group) => {
                const revealed = revealedCategories.has(group.category);
                return (
                  <button
                    key={group.category}
                    onClick={() => toggleReveal(group.category)}
                    className={`w-full ${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text} p-3 rounded-xl text-center transition-all hover:brightness-110 active:scale-[0.98]`}
                  >
                    {revealed ? (
                      <p className="font-bold text-sm uppercase tracking-wider">{group.category}</p>
                    ) : (
                      <p className="font-bold text-sm uppercase tracking-wider opacity-40">? ? ?</p>
                    )}
                    <p className="text-sm">{group.words.join(', ')}</p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNewGame}
              className="w-full py-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl font-game text-lg text-white hover:scale-[1.02] active:scale-95 transition-all"
            >
              NEW PUZZLE
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
      {status === GameStatus.WON && challenge && !isSimultaneous && (
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

          <div className="space-y-2">
            <p className="text-sm text-center opacity-60 mb-2">The groups were: <span className="italic">(tap a group to reveal its connection)</span></p>
            {challenge.groups.map((group) => {
              const wasFound = foundGroups.some(fg => fg.category === group.category);
              const revealed = revealedCategories.has(group.category);
              return (
                <button
                  key={group.category}
                  onClick={() => toggleReveal(group.category)}
                  className={`w-full ${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text} p-3 rounded-xl text-center transition-all hover:brightness-110 active:scale-[0.98] ${
                    !wasFound ? 'opacity-75' : ''
                  }`}
                >
                  {revealed ? (
                    <p className="font-bold text-sm uppercase tracking-wider">
                      {group.category}
                      {wasFound && ' ✓'}
                    </p>
                  ) : (
                    <p className="font-bold text-sm uppercase tracking-wider opacity-40">
                      ? ? ?{wasFound && ' ✓'}
                    </p>
                  )}
                  <p className="text-sm">{group.words.join(', ')}</p>
                </button>
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
