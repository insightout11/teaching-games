'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { GameStatus, GROUP_COLORS } from './types';
import { useSessionStore, getEffectiveTopic, getDisplayTopic } from '@/stores/session-store';
import { GenerationLoader } from '@/components/ui/generation-loader';
import type { ConnectionsChallenge, ConnectionsGroup, ConnectionsResult, ConnectionsPhoneState, GroupColor } from './types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { ArrowRight, HeartCrack, Puzzle, Trophy } from 'lucide-react';

const MAX_LIVES = 4;

function getPositionPoints(position: number): number {
  if (position === 1) return 10;
  if (position === 2) return 8;
  if (position === 3) return 6;
  return 3;
}

const GROUP_POINTS = 2; // every group found scores, finishing adds the position bonus

/** Deterministic check (the answer key is known): right group, one away, or wrong. */
function checkGuess(groups: ConnectionsGroup[], picked: string[]): { group: ConnectionsGroup | null; oneAway: boolean } {
  const set = new Set(picked);
  let oneAway = false;
  for (const g of groups) {
    const hits = g.words.filter((w) => set.has(w)).length;
    if (hits === 4) return { group: g, oneAway: false };
    if (hits === 3) oneAway = true;
  }
  return { group: null, oneAway };
}

interface RacePlayer {
  studentId: string;
  clientId: string;
  foundWords: string[];
  foundCategories: string[];
  last?: ConnectionsPhoneState['last'];
  displayName: string;
  groupsFound: number;
  finished: boolean;
  eliminated: boolean;
  finishPosition: number | null;
  score: number;
  livesRemaining: number;
}

export function ConnectionsGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterRemoteVoteHandler }: GameProps) {
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
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
  const isSimultaneous = students.length >= 2;
  const [racePlayers, setRacePlayers] = useState<RacePlayer[]>([]);
  const [raceFinishCount, setRaceFinishCount] = useState(0);
  const [raceComplete, setRaceComplete] = useState(false);
  const racePlayersRef = useRef<RacePlayer[]>([]);
  useEffect(() => { racePlayersRef.current = racePlayers; }, [racePlayers]);

  // Stable refs so handleRaceSubmission doesn't recreate on every state change
  const challengeRef = useRef<ConnectionsChallenge | null>(null);
  challengeRef.current = challenge;
  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;
  const raceCompleteRef = useRef(raceComplete);
  raceCompleteRef.current = raceComplete;

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
          perStudentData: Object.fromEntries(
            racePlayers.map((p): [string, ConnectionsPhoneState & { foundWords: string[] }] => [p.clientId, {
              foundWords: p.foundWords,
              found: challenge.groups.filter((g) => p.foundCategories.includes(g.category)).map((g) => ({ category: g.category, words: g.words, color: g.color })),
              livesRemaining: p.livesRemaining,
              last: p.last,
              done: p.finished ? 'finished' : p.eliminated ? 'eliminated' : undefined,
              position: p.finishPosition,
            }])
          ),
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
  }, [isSimultaneous, status, challenge, remainingWords, racePlayers, onSetInputSpec]);

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

  // Handle race mode submissions — checked locally (instant; the answer key is known).
  const handleRaceSubmission = useCallback((vote: GameRemoteVote) => {
    const ch = challengeRef.current;
    if (!ch || statusRef.current !== GameStatus.PLAYING || raceCompleteRef.current) return;
    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;
    let picked: string[];
    try { picked = JSON.parse(vote.choice) as string[]; } catch { return; }
    if (!Array.isArray(picked) || picked.length !== 4) return;

    const { group, oneAway } = checkGuess(ch.groups, picked);
    setRacePlayers((prev) => {
      const existing: RacePlayer = prev.find((p) => p.studentId === studentId) ?? {
        studentId, clientId: vote.clientId, displayName: vote.displayName, foundWords: [], foundCategories: [],
        groupsFound: 0, finished: false, eliminated: false, finishPosition: null, score: 0, livesRemaining: MAX_LIVES,
      };
      if (existing.finished || existing.eliminated) return prev;
      const n = (existing.last?.n ?? 0) + 1;
      let next: RacePlayer;
      if (group && existing.foundCategories.includes(group.category)) {
        // Already found: no double counting, no life lost.
        next = { ...existing, last: { kind: 'repeat', n } };
      } else if (group) {
        const groupsFound = existing.groupsFound + 1;
        const finished = groupsFound === 4;
        const finishPosition = finished ? prev.filter((p) => p.finished).length + 1 : null;
        const points = GROUP_POINTS + (finishPosition ? getPositionPoints(finishPosition) : 0);
        onScore(studentId, {
          isCorrect: true,
          points,
          ...(finishPosition === 1 ? { outcome: 'standout' as const } : {}),
          responseData: { clientId: vote.clientId, groupsFound, category: group.category, ...(finishPosition ? { finishPosition } : {}) },
        });
        next = {
          ...existing, groupsFound, finished, finishPosition,
          foundWords: [...existing.foundWords, ...group.words],
          foundCategories: [...existing.foundCategories, group.category],
          score: existing.score + points, last: { kind: 'right', n },
        };
      } else {
        const livesRemaining = existing.livesRemaining - 1;
        const eliminated = livesRemaining <= 0;
        if (eliminated) {
          onScore(studentId, { isCorrect: false, points: 0, responseData: { clientId: vote.clientId, groupsFound: existing.groupsFound, eliminated: true } });
        }
        next = { ...existing, livesRemaining, eliminated, last: { kind: oneAway ? 'one-away' : 'wrong', n } };
      }
      return prev.some((p) => p.studentId === studentId) ? prev.map((p) => (p.studentId === studentId ? next : p)) : [...prev, next];
    });
  }, [onScore]);

  // Register remote vote handler
  useEffect(() => {
    if (isSimultaneous) {
      onRegisterRemoteVoteHandler?.(handleRaceSubmission);
    } else {
      onRegisterRemoteVoteHandler?.((vote: GameRemoteVote) => {
        if (statusRef.current !== GameStatus.PLAYING) return;
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
  }, [isSimultaneous, onRegisterRemoteVoteHandler, processRemoteSubmission, handleRaceSubmission]);

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
          difficulty: sessionSettings.difficulty,
          ...(sourceMaterial ? { sourceMaterial } : {}),
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

  // Everyone is done (finished or out of lives): end without waiting.
  useEffect(() => {
    if (!isSimultaneous || status !== GameStatus.PLAYING || raceComplete) return;
    const done = racePlayers.filter((p) => p.finished || p.eliminated).length;
    if (students.length > 0 && done >= students.length) { setRaceComplete(true); setStatus(GameStatus.WON); }
  }, [isSimultaneous, status, raceComplete, racePlayers, students.length]);

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
      if (a.finished && b.finished) return (a.finishPosition || 99) - (b.finishPosition || 99);
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      return b.groupsFound - a.groupsFound;
    });
    const foundBy = (category: string) => racePlayers.filter((p) => p.foundCategories.includes(category)).length;
    const ORDER: GroupColor[] = ['yellow', 'green', 'blue', 'purple'];
    const groupsByColor = challenge ? [...challenge.groups].sort((a, b) => ORDER.indexOf(a.color) - ORDER.indexOf(b.color)) : [];

    const PlayerRow = ({ player }: { player: RacePlayer }) => (
      <motion.div layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 ${player.finished && player.finishPosition === 1 ? 'border-amber-300/50 bg-amber-300/10' : player.eliminated ? 'border-white/10 bg-white/[0.02] opacity-60' : 'border-white/10 bg-slate-950/40'}`}>
        <span className="flex items-center gap-2.5">
          {player.finished && player.finishPosition === 1 ? <Trophy className="h-4 w-4 text-amber-300" />
            : player.finished ? <span className="font-mono text-xs text-white/60">#{player.finishPosition}</span>
            : player.eliminated ? <HeartCrack className="h-4 w-4 text-rose-300" /> : null}
          <span className="text-base font-semibold">{player.displayName}</span>
        </span>
        <span className="flex items-center gap-3">
          {/* Group colours found (never the words) */}
          <span className="flex gap-1">
            {groupsByColor.map((g) => (
              <span key={g.category} className={`h-3.5 w-3.5 rounded-full ${player.foundCategories.includes(g.category) ? GROUP_COLORS[g.color].bg : 'bg-white/10'}`} />
            ))}
          </span>
          {!player.finished && !player.eliminated && (
            <span className="flex gap-0.5">{Array.from({ length: MAX_LIVES }).map((_, i) => <span key={i} className={`h-2 w-2 rounded-full ${i < player.livesRemaining ? 'bg-rose-400' : 'bg-white/10'}`} />)}</span>
          )}
          {player.score > 0 && <span className="font-mono text-xs text-emerald-300">+{player.score}</span>}
        </span>
      </motion.div>
    );

    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="violet">Connections{getDisplayTopic(sessionSettings, sourceMaterial) ? ` · ${getDisplayTopic(sessionSettings, sourceMaterial)}` : ''}</KitLabel>
          {status === GameStatus.PLAYING && <KitReadout>{raceFinishCount} finished · {racePlayers.filter((p) => p.eliminated).length} out</KitReadout>}
        </div>

        {status === GameStatus.IDLE && (
          <div className="space-y-5 py-6 text-center">
            <p className="font-display text-5xl">Find the four groups.</p>
            <p className="mx-auto max-w-xl text-lg text-white/70">Sixteen words, four hidden groups of four. Everyone solves on their own phone: every group scores, the first to find all four win a bonus. Four wrong guesses and you&apos;re out.</p>
            <div className="flex justify-center">
              <KitButton tone="violet" solid onClick={handleGenerate} className="!px-8 !py-3 !text-base" icon={<Puzzle className="h-4 w-4" />}>Deal the puzzle</KitButton>
            </div>
          </div>
        )}

        {status === GameStatus.GENERATING && <GenerationLoader label="puzzle" />}
        {error && <p className="rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-rose-100">{error}</p>}

        {status === GameStatus.PLAYING && challenge && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {challenge.words.map((word) => (
                <div key={word} className="flex min-h-[64px] items-center justify-center rounded-xl border border-white/12 bg-slate-950/50 px-2 text-center font-display text-2xl leading-tight">
                  {word}
                </div>
              ))}
            </div>

            {/* Group heat: which colours the class has cracked (no words shown) */}
            {racePlayers.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {groupsByColor.map((g) => (
                  <div key={g.category} className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                    <span className={`h-3 w-3 rounded-full ${GROUP_COLORS[g.color].bg}`} />
                    <span className="font-mono text-xs text-white/70">found by {foundBy(g.category)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <AnimatePresence>
                {sortedPlayers.map((player) => <PlayerRow key={player.studentId} player={player} />)}
              </AnimatePresence>
              {sortedPlayers.length === 0 && <p className="py-3 text-center text-sm text-white/45">Solvers are thinking on their phones…</p>}
            </div>

            <div className="flex justify-end"><KitButton onClick={handleEndRace}>End the race</KitButton></div>
          </div>
        )}

        {(status === GameStatus.WON || raceComplete) && challenge && (
          <div className="space-y-4">
            <div className="text-center">
              <KitLabel tone="emerald">Race over</KitLabel>
              <p className="mt-1 font-display text-4xl">{raceFinishCount > 0 ? `${raceFinishCount} solved it all` : 'Let\u2019s reveal the groups'}</p>
            </div>

            {/* Reveal each group's connection in turn (easiest first) */}
            <div className="space-y-2">
              {groupsByColor.map((group) => {
                const revealed = revealedCategories.has(group.category);
                return (
                  <button key={group.category} type="button" onClick={() => toggleReveal(group.category)} className={`w-full rounded-2xl px-4 py-3 text-center transition-all hover:brightness-110 active:scale-[0.99] ${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text}`}>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.16em]">{revealed ? group.category : 'Tap to reveal the connection'}</p>
                    <p className="font-display text-2xl">{group.words.join(' · ')}</p>
                    {racePlayers.length > 0 && <p className="mt-0.5 font-mono text-[11px] opacity-70">found by {foundBy(group.category)} / {racePlayers.length}</p>}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">{sortedPlayers.map((player) => <PlayerRow key={player.studentId} player={player} />)}</div>

            <div className="flex justify-center">
              <KitButton tone="violet" solid onClick={handleNewGame} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>New puzzle</KitButton>
            </div>
          </div>
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
          {sessionSettings.difficulty} / {getDisplayTopic(sessionSettings, sourceMaterial)}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GenerationLoader label="puzzle" />
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
            <p className="text-sm text-emerald-400 mt-2">All groups found!</p>
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
