'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Shield, Sword, Mic, ChevronRight } from 'lucide-react';
import type { GameProps, GameRemoteVote } from '../types';
import { getEffectiveTopic, useSessionStore } from '@/stores/session-store';
import {
  type DefendItPhase,
  type DebateSide,
  type Reaction,
  type ReactionCount,
  REACTIONS,
  emptyReactionCount,
  totalReactions,
} from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBATE_SECONDS = 60;
const POINTS_ASSIGNED = 2;
const POINTS_SPOTLIGHTED = 3;
const POINTS_PER_REACTION = 1;

// ─── Main Component ──────────────────────────────────────────────────────────

export function DefendItGame({
  students,
  onScore,
  config,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  isMicroEvent,
}: GameProps) {
  const roundCount = Number(config.roundCount ?? 3);
  const classMission = useSessionStore((s) => s.classMission);
  const topic = classMission || getEffectiveTopic(sessionSettings);

  // ─── State ───
  const [phase, setPhase] = useState<DefendItPhase>('idle');
  const [statements, setStatements] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [sides, setSides] = useState<Record<string, DebateSide>>({});
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [spotlightName, setSpotlightName] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, ReactionCount>>({});
  const [timeLeft, setTimeLeft] = useState(DEBATE_SECONDS);
  const [error, setError] = useState<string | null>(null);

  // ─── Refs (stale-closure protection) ───
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const spotlightIdRef = useRef(spotlightId);
  spotlightIdRef.current = spotlightId;
  const spotlightNameRef = useRef(spotlightName);
  spotlightNameRef.current = spotlightName;
  // Tracks which clientIds have already reacted in this spotlight period
  const reactedThisSpotlight = useRef<Set<string>>(new Set());
  // Tracks which studentIds have been spotlighted this round (to award +3 only once)
  const spotlightedThisRound = useRef<Set<string>>(new Set());

  const currentStatement = statements[currentRound - 1] ?? '';
  const defendTeam = students.filter((s) => sides[s.id] === 'DEFEND');
  const attackTeam = students.filter((s) => sides[s.id] === 'ATTACK');

  // ─── Debate Timer ───
  useEffect(() => {
    if (phase !== 'debating' || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setPhase('round_results');
          onSetInputSpec?.(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, timeLeft, onSetInputSpec]);

  // ─── Remote Vote Handler ───
  const handleRemoteVote = useCallback(
    (vote: GameRemoteVote) => {
      if (phaseRef.current !== 'debating') return;
      const speakerId = spotlightIdRef.current;
      const speakerName = spotlightNameRef.current;
      if (!speakerId || !speakerName) return;

      const reactorId = vote.studentId || vote.clientId;
      if (!reactorId) return;
      // Don't let the speaker react to themselves
      if (reactorId === speakerId) return;
      // One reaction per spotlight period per student
      if (reactedThisSpotlight.current.has(reactorId)) return;
      reactedThisSpotlight.current.add(reactorId);

      const emoji = vote.choice as Reaction;
      if (!(REACTIONS as readonly string[]).includes(emoji)) return;

      setReactionCounts((prev) => ({
        ...prev,
        [speakerId]: {
          ...(prev[speakerId] ?? emptyReactionCount()),
          [emoji]: ((prev[speakerId] ?? emptyReactionCount())[emoji]) + 1,
        },
      }));

      onScore(speakerId, {
        isCorrect: true,
        points: POINTS_PER_REACTION,
        responseData: { type: 'reaction', emoji, from: reactorId },
      });
    },
    [onScore],
  );

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleRemoteVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, handleRemoteVote]);

  // ─── Teacher Actions ───

  const handleGenerate = async () => {
    setPhase('loading');
    setError(null);
    try {
      const res = await fetch('/api/defend-it/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty: sessionSettings.difficulty, count: roundCount }),
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data: { statements: string[] } = await res.json();
      setStatements(data.statements);
      setCurrentRound(1);
      setPhase('statement_reveal');
      onSetInputSpec?.(null);
    } catch {
      setError('Could not generate statements. Please try again.');
      setPhase('idle');
    }
  };

  const handleAssignSides = () => {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    const newSides: Record<string, DebateSide> = {};
    shuffled.forEach((s, i) => {
      newSides[s.id] = i < half ? 'DEFEND' : 'ATTACK';
    });
    setSides(newSides);
    setReactionCounts({});

    // Award participation points + broadcast side assignments
    const perStudentData: Record<string, unknown> = {};
    shuffled.forEach((s) => {
      onScore(s.id, { isCorrect: true, points: POINTS_ASSIGNED, responseData: { type: 'side_assigned', side: newSides[s.id] } });
      perStudentData[s.name] = { side: newSides[s.id] };
    });

    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'defend-it',
      prompt: 'You have been assigned a side!',
      buttonLabel: 'Got it!',
      perStudentData,
    });

    setPhase('side_assignment');
  };

  const handleStartDebate = () => {
    setSpotlightId(null);
    setSpotlightName(null);
    reactedThisSpotlight.current = new Set();
    spotlightedThisRound.current = new Set();
    setTimeLeft(DEBATE_SECONDS);
    setPhase('debating');
    onSetInputSpec?.(null);
  };

  const handleSpotlight = (studentId: string, displayName: string) => {
    setSpotlightId(studentId);
    setSpotlightName(displayName);
    reactedThisSpotlight.current = new Set();

    // Award +3 once per student per round
    if (!spotlightedThisRound.current.has(studentId)) {
      spotlightedThisRound.current.add(studentId);
      onScore(studentId, { isCorrect: true, points: POINTS_SPOTLIGHTED, responseData: { type: 'spotlighted' } });
    }

    // Broadcast reaction input to audience; speaker sees "You're speaking!"
    const perStudentData: Record<string, unknown> = { [displayName]: { isSpeaker: true } };
    onSetInputSpec?.({
      type: 'choice',
      gameKey: 'defend-it',
      prompt: `${displayName} is speaking — react!`,
      options: [...REACTIONS],
      perStudentData,
    });
  };

  const handleEndDebate = () => {
    setPhase('round_results');
    onSetInputSpec?.(null);
  };

  const handleNextRound = () => {
    if (currentRound >= roundCount) {
      setPhase('game_over');
      onSetInputSpec?.(null);
    } else {
      setCurrentRound((r) => r + 1);
      setSides({});
      setSpotlightId(null);
      setSpotlightName(null);
      setPhase('statement_reveal');
      onSetInputSpec?.(null);
    }
  };

  const handleRestart = () => {
    setPhase('idle');
    setStatements([]);
    setCurrentRound(1);
    setSides({});
    setSpotlightId(null);
    setSpotlightName(null);
    setReactionCounts({});
    onSetInputSpec?.(null);
  };

  // ─── Render ───

  if (phase === 'idle') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Flame className="w-10 h-10 text-orange-400 mx-auto" />
          <p className="text-sm text-slate-400">
            Students are randomly assigned to <span className="text-emerald-400 font-bold">DEFEND</span> or{' '}
            <span className="text-rose-400 font-bold">ATTACK</span> a wild statement.
          </p>
          <p className="text-xs text-slate-500">
            The audience reacts live with emoji — every argument earns points!
          </p>
        </div>

        <div className="glass p-4 rounded-xl border border-white/10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Topic</p>
          <p className="text-lg font-bold text-white">{topic}</p>
          <p className="text-xs text-slate-500 mt-1">{roundCount} rounds · ~10 min</p>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handleGenerate}
          className="w-full px-12 py-6 bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
        >
          GENERATE & START
        </button>
      </motion.div>
    );
  }

  if (phase === 'loading') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-16">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="font-game text-lg text-orange-400 uppercase tracking-widest animate-pulse">
          Generating statements...
        </p>
      </motion.div>
    );
  }

  if (phase === 'statement_reveal') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">
            Round {currentRound} of {roundCount}
          </p>
          <p className="text-xs text-slate-500">{students.length} students</p>
        </div>

        <div className="glass p-8 rounded-2xl border-2 border-orange-500/30 text-center space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Statement</p>
          <p className="text-2xl font-black text-white leading-tight">&ldquo;{currentStatement}&rdquo;</p>
        </div>

        <button
          onClick={handleAssignSides}
          className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-game text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
        >
          ASSIGN SIDES →
        </button>
      </motion.div>
    );
  }

  if (phase === 'side_assignment') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">
            Round {currentRound} of {roundCount}
          </p>
        </div>

        <div className="glass p-4 rounded-xl border border-orange-500/20 text-center">
          <p className="text-sm text-slate-400 italic">&ldquo;{currentStatement}&rdquo;</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass p-4 rounded-xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Defend ({defendTeam.length})
              </p>
            </div>
            {defendTeam.map((s) => (
              <p key={s.id} className="text-sm text-slate-300 pl-1">• {s.name}</p>
            ))}
          </div>
          <div className="glass p-4 rounded-xl border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-rose-400" />
              <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">
                Attack ({attackTeam.length})
              </p>
            </div>
            {attackTeam.map((s) => (
              <p key={s.id} className="text-sm text-slate-300 pl-1">• {s.name}</p>
            ))}
          </div>
        </div>

        <button
          onClick={handleStartDebate}
          className="w-full py-5 bg-gradient-to-r from-orange-500 to-rose-600 rounded-2xl font-game text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
        >
          START DEBATE ▶
        </button>
      </motion.div>
    );
  }

  if (phase === 'debating') {
    const spotlightStudent = students.find((s) => s.id === spotlightId);
    const spotlightSide = spotlightId ? sides[spotlightId] : null;
    const spotlightReactions = spotlightId ? (reactionCounts[spotlightId] ?? emptyReactionCount()) : null;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">
            Round {currentRound} of {roundCount}
          </p>
          <div className={`text-2xl font-mono font-black ${
            timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-amber-400' : 'text-orange-400'
          }`}>
            {timeLeft}s
          </div>
        </div>

        <div className="glass p-3 rounded-xl border border-orange-500/20 text-center">
          <p className="text-sm text-slate-400 italic">&ldquo;{currentStatement}&rdquo;</p>
        </div>

        {/* Spotlight */}
        <div className="glass p-4 rounded-xl border border-white/10 min-h-[80px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {spotlightStudent ? (
              <motion.div
                key={spotlightStudent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-1"
              >
                <div className="flex items-center justify-center gap-2">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <p className="font-black text-white text-lg">{spotlightStudent.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    spotlightSide === 'DEFEND'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {spotlightSide}
                  </span>
                </div>
                {spotlightReactions && (
                  <div className="flex items-center justify-center gap-3 text-sm">
                    {REACTIONS.map((r) => (
                      <span key={r}>
                        {r}
                        <span className="text-slate-400 ml-0.5">{spotlightReactions[r]}</span>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.p
                key="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-500"
              >
                Tap a student to spotlight them
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Student list by side */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'DEFEND', team: defendTeam, color: 'emerald' },
            { label: 'ATTACK', team: attackTeam, color: 'rose' },
          ].map(({ label, team, color }) => (
            <div key={label} className="space-y-1">
              <p className={`text-xs font-bold uppercase tracking-widest text-${color}-400`}>{label}</p>
              {team.map((s) => {
                const reactions = reactionCounts[s.id] ?? emptyReactionCount();
                const total = totalReactions(reactions);
                const isSpotlighted = s.id === spotlightId;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSpotlight(s.id, s.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                      isSpotlighted
                        ? `bg-${color}-500/20 border border-${color}-500/40 text-white`
                        : 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isSpotlighted && <Mic className="w-3 h-3 text-amber-400 shrink-0" />}
                      {s.name}
                    </span>
                    {total > 0 && (
                      <span className="text-xs text-slate-500">+{total}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <button
          onClick={handleEndDebate}
          className="w-full py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/10"
        >
          END DEBATE
        </button>
      </motion.div>
    );
  }

  if (phase === 'round_results') {
    const allResults = students
      .map((s) => ({ student: s, reactions: reactionCounts[s.id] ?? emptyReactionCount() }))
      .sort((a, b) => totalReactions(b.reactions) - totalReactions(a.reactions));

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
        <div className="text-center">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">
            Round {currentRound} Results
          </p>
        </div>

        <div className="glass p-3 rounded-xl border border-orange-500/20 text-center">
          <p className="text-sm text-slate-400 italic">&ldquo;{currentStatement}&rdquo;</p>
        </div>

        <div className="space-y-2">
          {allResults.map(({ student, reactions }) => {
            const total = totalReactions(reactions);
            const side = sides[student.id];
            return (
              <div
                key={student.id}
                className="flex items-center gap-3 px-4 py-2.5 glass rounded-xl border border-white/5"
              >
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold shrink-0 ${
                  side === 'DEFEND' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {side}
                </span>
                <span className="text-sm text-white flex-1">{student.name}</span>
                {total > 0 ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {REACTIONS.filter((r) => reactions[r] > 0).map((r) => (
                      <span key={r}>{r}{reactions[r]}</span>
                    ))}
                    <span className="text-amber-400 font-bold">+{total}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-600">—</span>
                )}
              </div>
            );
          })}
        </div>

        {isMicroEvent ? (
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-sm text-emerald-400 font-bold">Round complete</p>
            <p className="text-xs opacity-50 mt-1">Advance the flight to continue.</p>
          </div>
        ) : (
          <button
            onClick={handleNextRound}
            className="w-full py-5 bg-gradient-to-r from-orange-500 to-rose-600 rounded-2xl font-game text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20 flex items-center justify-center gap-2"
          >
            {currentRound >= roundCount ? 'FINISH GAME' : (
              <>NEXT ROUND <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        )}
      </motion.div>
    );
  }

  if (phase === 'game_over') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="glass p-8 rounded-2xl border-2 border-orange-500/30 text-center space-y-3">
          <Flame className="w-12 h-12 text-orange-400 mx-auto" />
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Game Over</p>
          <p className="text-3xl font-black text-white">Debate complete!</p>
          <p className="text-slate-400 text-sm">Check the main screen for final scores.</p>
        </div>

        <button
          onClick={handleRestart}
          className="w-full px-12 py-6 bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
        >
          PLAY AGAIN
        </button>
      </motion.div>
    );
  }

  return null;
}
