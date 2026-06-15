'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Plane, Radar, RotateCcw, Trophy } from 'lucide-react';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { distanceBetweenCoordsKm, formatDistance } from '@/lib/world-flight/geo';
import type { DestinationPack } from '@/lib/world-flight/types';
import type { InputSpec } from '@/lib/input-spec';
import type { GameProps, GameRemoteVote } from '../types';
import { RadarMap, type RadarGuess } from './radar-map';
import { parseGeoGuess, radarOutcomeForDistance, radarPointsForDistance } from './scoring';

type Phase = 'idle' | 'guessing' | 'reveal' | 'finished';

interface RoundResult extends RadarGuess {
  clientId: string;
  studentId: string | null;
  roundId: string;
}

interface TotalEntry {
  studentKey: string;
  displayName: string;
  totalPoints: number;
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function promptForDestination(destination: DestinationPack, difficulty: string) {
  if (difficulty === 'Beginner' || difficulty === 'Easy') return `Plot ${destination.city}, ${destination.country}`;
  if (difficulty === 'Intermediate') return `Plot ${destination.city} in ${destination.region}`;
  return `Plot ${destination.city}`;
}

export function RadarFixGame({
  students,
  onScore,
  config,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  isMicroEvent,
}: GameProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [rounds, setRounds] = useState<DestinationPack[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundAnswers, setRoundAnswers] = useState<RoundResult[]>([]);
  const [totals, setTotals] = useState<Map<string, TotalEntry>>(() => new Map());

  const phaseRef = useRef<Phase>('idle');
  const roundsRef = useRef<DestinationPack[]>([]);
  const roundIndexRef = useRef(0);
  const roundAnswersRef = useRef<RoundResult[]>([]);
  const scoredRoundsRef = useRef<Set<string>>(new Set());

  phaseRef.current = phase;
  roundsRef.current = rounds;
  roundIndexRef.current = roundIndex;
  roundAnswersRef.current = roundAnswers;

  const target = rounds[roundIndex] ?? WORLD_DESTINATIONS[0];
  const requestedRoundCount = isMicroEvent
    ? 1
    : Math.max(1, Math.min(8, Number(config.roundCount ?? 5)));

  const broadcastRound = useCallback((destination: DestinationPack, index: number, answers: RoundResult[]) => {
    const locked: Record<string, unknown> = {};
    answers.forEach((answer) => {
      locked[answer.clientId] = { locked: true };
    });
    onSetInputSpec?.({
      type: 'geo-point',
      gameKey: 'radar-fix',
      prompt: promptForDestination(destination, sessionSettings.difficulty),
      roundId: `radar-fix-${index}-${destination.id}`,
      mapCenter: [10, 18],
      mapZoom: 0.8,
      mapLabels: false,
      allowMultiple: true,
      perStudentData: locked,
    } as InputSpec);
  }, [onSetInputSpec, sessionSettings.difficulty]);

  const handleVote = useCallback((vote: GameRemoteVote) => {
    if (phaseRef.current !== 'guessing') return;
    const guess = parseGeoGuess(vote.choice);
    const destination = roundsRef.current[roundIndexRef.current];
    if (!guess || !destination || guess.roundId !== `radar-fix-${roundIndexRef.current}-${destination.id}`) return;

    const studentKey = vote.studentId || vote.clientId;
    if (!studentKey || roundAnswersRef.current.some((answer) => answer.studentKey === studentKey)) return;

    const distanceKm = distanceBetweenCoordsKm(guess, destination);
    const answer: RoundResult = {
      studentKey,
      clientId: vote.clientId,
      studentId: vote.studentId ?? null,
      displayName: vote.displayName,
      lat: guess.lat,
      lng: guess.lng,
      distanceKm,
      radarPoints: radarPointsForDistance(distanceKm),
      roundId: guess.roundId,
    };
    const updated = [...roundAnswersRef.current, answer];
    roundAnswersRef.current = updated;
    setRoundAnswers(updated);
    broadcastRound(destination, roundIndexRef.current, updated);
  }, [broadcastRound]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [handleVote, onRegisterRemoteVoteHandler]);

  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const startGame = useCallback(() => {
    const selected = shuffle(WORLD_DESTINATIONS).slice(0, requestedRoundCount);
    roundsRef.current = selected;
    roundIndexRef.current = 0;
    roundAnswersRef.current = [];
    scoredRoundsRef.current = new Set();
    setRounds(selected);
    setRoundIndex(0);
    setRoundAnswers([]);
    setTotals(new Map());
    setPhase('guessing');
    phaseRef.current = 'guessing';
    broadcastRound(selected[0], 0, []);
  }, [broadcastRound, requestedRoundCount]);

  const reveal = useCallback(() => {
    if (phaseRef.current !== 'guessing') return;
    const destination = roundsRef.current[roundIndexRef.current];
    if (!destination) return;
    const currentRoundId = `radar-fix-${roundIndexRef.current}-${destination.id}`;
    setPhase('reveal');
    phaseRef.current = 'reveal';
    onSetInputSpec?.(null);

    if (!scoredRoundsRef.current.has(currentRoundId)) {
      scoredRoundsRef.current.add(currentRoundId);
      setTotals((previous) => {
        const next = new Map(previous);
        roundAnswersRef.current.forEach((answer) => {
          const current = next.get(answer.studentKey);
          next.set(answer.studentKey, {
            studentKey: answer.studentKey,
            displayName: answer.displayName,
            totalPoints: (current?.totalPoints ?? 0) + answer.radarPoints,
          });
          onScore(answer.studentKey, {
            isCorrect: null,
            points: answer.radarPoints,
            outcome: radarOutcomeForDistance(answer.distanceKm),
            responseData: {
              clientId: answer.clientId,
              roundId: currentRoundId,
              targetId: destination.id,
              distanceKm: Math.round(answer.distanceKm),
              radarPoints: answer.radarPoints,
            },
          });
        });
        return next;
      });
    }
  }, [onScore, onSetInputSpec]);

  const advance = useCallback(() => {
    const nextIndex = roundIndexRef.current + 1;
    if (nextIndex >= roundsRef.current.length) {
      onSetInputSpec?.(null);
      setPhase('finished');
      phaseRef.current = 'finished';
      return;
    }
    const destination = roundsRef.current[nextIndex];
    roundIndexRef.current = nextIndex;
    roundAnswersRef.current = [];
    setRoundIndex(nextIndex);
    setRoundAnswers([]);
    setPhase('guessing');
    phaseRef.current = 'guessing';
    broadcastRound(destination, nextIndex, []);
  }, [broadcastRound, onSetInputSpec]);

  const rankedRound = useMemo(
    () => [...roundAnswers].sort((a, b) => a.distanceKm - b.distanceKm),
    [roundAnswers],
  );
  const leaderboard = useMemo(
    () => Array.from(totals.values()).sort((a, b) => b.totalPoints - a.totalPoints),
    [totals],
  );
  const medianDistance = useMemo(() => {
    if (rankedRound.length === 0) return null;
    const middle = Math.floor(rankedRound.length / 2);
    return rankedRound.length % 2 === 0
      ? (rankedRound[middle - 1].distanceKm + rankedRound[middle].distanceKm) / 2
      : rankedRound[middle].distanceKm;
  }, [rankedRound]);

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <Radar className="relative h-24 w-24 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">ATC Geography Check</p>
          <h3 className="mt-2 text-4xl font-game text-white">Radar Fix</h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
            Students plot each city on a label-free world map. Positions stay sealed until the radar reveal.
          </p>
        </div>
        <button
          onClick={startGame}
          className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-game text-lg text-white shadow-xl transition hover:scale-[1.03] active:scale-95"
        >
          {isMicroEvent ? 'START RADAR CHECK' : `START ${requestedRoundCount}-ROUND FLIGHT`}
        </button>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        <div className="text-center">
          <Trophy className="mx-auto h-14 w-14 text-amber-300" />
          <h3 className="mt-3 text-3xl font-game text-white">Radar Check Complete</h3>
          <p className="mt-1 text-sm text-slate-400">{rounds.length} position fix{rounds.length === 1 ? '' : 'es'} completed</p>
        </div>
        <div className="space-y-2">
          {leaderboard.slice(0, 8).map((entry, index) => (
            <div key={entry.studentKey} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-game text-cyan-300">{index + 1}</span>
                <span className="font-semibold text-white">{entry.displayName}</span>
              </div>
              <span className="font-game text-amber-300">{entry.totalPoints.toLocaleString()} pts</span>
            </div>
          ))}
          {leaderboard.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No positions were submitted.</p>}
        </div>
        <div className="text-center">
          <button onClick={startGame} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-300/15">
            <RotateCcw className="h-4 w-4" />
            Fly Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">
            {isMicroEvent ? 'Micro-event' : `Round ${roundIndex + 1} of ${rounds.length}`}
          </p>
          <h3 className="mt-1 text-2xl font-game text-white">{promptForDestination(target, sessionSettings.difficulty)}</h3>
          <p className="mt-1 text-xs text-slate-400">Primary airport: {target.primaryAirport}</p>
        </div>
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/70">Radar contacts</p>
          <p className="font-game text-2xl text-cyan-200">{roundAnswers.length} / {students.length || '?'}</p>
        </div>
      </div>

      <RadarMap answer={target} guesses={roundAnswers} revealed={phase === 'reveal'} />

      {phase === 'guessing' ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Plane className="h-5 w-5 text-cyan-300" />
            Positions are sealed. Reveal when the crew is ready.
          </div>
          <button
            onClick={reveal}
            disabled={roundAnswers.length === 0}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 font-game text-sm text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30"
          >
            REVEAL POSITIONS
          </button>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-300" />
                <span className="font-bold text-white">{target.city}, {target.country}</span>
              </div>
              {rankedRound[0] && <span className="text-sm text-cyan-200">Closest: {rankedRound[0].displayName} at {formatDistance(rankedRound[0].distanceKm)}</span>}
              {medianDistance != null && <span className="text-sm text-slate-400">Class median: {formatDistance(medianDistance)}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {rankedRound.slice(0, 5).map((answer, index) => (
                <span key={answer.studentKey} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-200">
                  {index + 1}. {answer.displayName}: {formatDistance(answer.distanceKm)} | {answer.radarPoints.toLocaleString()} pts
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={advance}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]"
          >
            {roundIndex + 1 >= rounds.length ? 'FINISH' : 'NEXT FIX'}
          </button>
        </div>
      )}
    </div>
  );
}
