'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Plane, Radar, RotateCcw, Trophy } from 'lucide-react';
import { getDestinationById, WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { distanceBetweenCoordsKm, formatDistance } from '@/lib/world-flight/geo';
import type { DestinationPack } from '@/lib/world-flight/types';
import type { InputSpec } from '@/lib/input-spec';
import type { GameProps, GameRemoteVote } from '../types';
import { RadarMap, type RadarGuess } from './radar-map';
import { parseGeoGuess, radarClosestBonus, radarLessonPointsForDistance, radarOutcomeForDistance } from './scoring';
import { radarVariationForIndex, selectVariedRadarDestinations, type RadarVariation } from './selection';

type Phase = 'idle' | 'guessing' | 'reveal' | 'finished';
const CLOSEST_BONUS = 2;
const RECENT_DESTINATION_LIMIT = 12;
const RECENT_DESTINATIONS_KEY = 'lc-radar-fix-recent-v1';
const VARIATION_OFFSET_KEY = 'lc-radar-fix-variation-offset-v1';

interface RadarRound {
  destination: DestinationPack;
  variation: RadarVariation;
}

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

function readRecentDestinationIds() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_DESTINATIONS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function rememberDestinations(destinations: DestinationPack[], previousIds: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const selectedIds = destinations.map((destination) => destination.id);
    const next = [...selectedIds, ...previousIds.filter((id) => !selectedIds.includes(id))]
      .slice(0, RECENT_DESTINATION_LIMIT);
    window.localStorage.setItem(RECENT_DESTINATIONS_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable in privacy-restricted browsers; random selection still works.
  }
}

function takeVariationOffset() {
  if (typeof window === 'undefined') return 0;
  try {
    const current = Number(window.localStorage.getItem(VARIATION_OFFSET_KEY) ?? 0);
    const safeCurrent = Number.isFinite(current) ? Math.max(0, Math.floor(current)) : 0;
    window.localStorage.setItem(VARIATION_OFFSET_KEY, String(safeCurrent + 1));
    return safeCurrent;
  } catch {
    return Math.floor(Math.random() * 3);
  }
}

function promptForRound(round: RadarRound, difficulty: string) {
  const { destination, variation } = round;
  if (variation === 'airport') {
    return {
      label: 'Airport Fix',
      prompt: `Plot airport code ${destination.primaryAirport}`,
      detail: `Primary airport for a destination in ${destination.region}`,
    };
  }
  if (variation === 'clue') {
    const terrain = destination.scene.terrain.replace('-', ' ');
    return {
      label: 'Clue Fix',
      prompt: `Find our ${destination.region} destination in ${destination.country}`,
      detail: `${terrain} terrain · ${destination.scene.skyline} skyline`,
    };
  }
  return {
    label: 'City Fix',
    prompt:
      difficulty === 'Beginner' || difficulty === 'Easy'
        ? `Plot ${destination.city}, ${destination.country}`
        : difficulty === 'Intermediate'
          ? `Plot ${destination.city} in ${destination.region}`
          : `Plot ${destination.city}`,
    detail: `Primary airport: ${destination.primaryAirport}`,
  };
}

export function RadarFixGame({
  students,
  onScore,
  config,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  isMicroEvent,
  destinationId,
}: GameProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [rounds, setRounds] = useState<RadarRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundAnswers, setRoundAnswers] = useState<RoundResult[]>([]);
  const [totals, setTotals] = useState<Map<string, TotalEntry>>(() => new Map());

  const phaseRef = useRef<Phase>('idle');
  const roundsRef = useRef<RadarRound[]>([]);
  const roundIndexRef = useRef(0);
  const roundAnswersRef = useRef<RoundResult[]>([]);
  const scoredRoundsRef = useRef<Set<string>>(new Set());

  phaseRef.current = phase;
  roundsRef.current = rounds;
  roundIndexRef.current = roundIndex;
  roundAnswersRef.current = roundAnswers;

  const currentRound = rounds[roundIndex] ?? {
    destination: WORLD_DESTINATIONS[0],
    variation: 'city' as const,
  };
  const target = currentRound.destination;
  const roundPrompt = promptForRound(currentRound, sessionSettings.difficulty);
  const requestedRoundCount = isMicroEvent
    ? 1
    : Math.max(1, Math.min(8, Number(config.roundCount ?? 5)));
  const flightDestination = isMicroEvent && destinationId ? getDestinationById(destinationId) : undefined;

  const broadcastRound = useCallback((round: RadarRound, index: number, answers: RoundResult[]) => {
    const { destination } = round;
    const prompt = promptForRound(round, sessionSettings.difficulty);
    const locked: Record<string, unknown> = {};
    answers.forEach((answer) => {
      locked[answer.clientId] = { locked: true };
    });
    onSetInputSpec?.({
      type: 'geo-point',
      gameKey: 'radar-fix',
      prompt: prompt.prompt,
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
    const round = roundsRef.current[roundIndexRef.current];
    const destination = round?.destination;
    if (!guess || !destination || guess.roundId !== `radar-fix-${roundIndexRef.current}-${destination.id}`) return;

    const studentKey = vote.studentId || vote.clientId;
    if (!studentKey || roundAnswersRef.current.some((answer) => answer.studentKey === studentKey)) return;

    const distanceKm = distanceBetweenCoordsKm(guess, destination);
    const basePoints = radarLessonPointsForDistance(distanceKm);
    const answer: RoundResult = {
      studentKey,
      clientId: vote.clientId,
      studentId: vote.studentId ?? null,
      displayName: vote.displayName,
      lat: guess.lat,
      lng: guess.lng,
      distanceKm,
      basePoints,
      closestBonus: 0,
      lessonPoints: basePoints,
      roundId: guess.roundId,
    };
    const updated = [...roundAnswersRef.current, answer];
    roundAnswersRef.current = updated;
    setRoundAnswers(updated);
    broadcastRound(round, roundIndexRef.current, updated);
  }, [broadcastRound]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [handleVote, onRegisterRemoteVoteHandler]);

  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const startGame = useCallback(() => {
    const recentDestinationIds = readRecentDestinationIds();
    const selectedDestinations = flightDestination
      ? [flightDestination]
      : selectVariedRadarDestinations(WORLD_DESTINATIONS, requestedRoundCount, recentDestinationIds);
    const variationOffset = takeVariationOffset();
    const selected = selectedDestinations
      .map((destination, index) => ({
        destination,
        variation: radarVariationForIndex(variationOffset, index),
      }));
    if (!flightDestination) rememberDestinations(selectedDestinations, recentDestinationIds);
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
  }, [broadcastRound, flightDestination, requestedRoundCount]);

  const reveal = useCallback(() => {
    if (phaseRef.current !== 'guessing') return;
    const round = roundsRef.current[roundIndexRef.current];
    const destination = round?.destination;
    if (!round || !destination) return;
    const currentRoundId = `radar-fix-${roundIndexRef.current}-${destination.id}`;
    setPhase('reveal');
    phaseRef.current = 'reveal';
    onSetInputSpec?.(null);

    if (!scoredRoundsRef.current.has(currentRoundId)) {
      scoredRoundsRef.current.add(currentRoundId);
      const answers = roundAnswersRef.current;
      const closestDistance = answers.length > 0
        ? Math.min(...answers.map((answer) => answer.distanceKm))
        : null;
      const scoredAnswers = answers.map((answer) => {
        const closestBonus = radarClosestBonus(answer.distanceKm, closestDistance);
        return {
          ...answer,
          closestBonus,
          lessonPoints: answer.basePoints + closestBonus,
        };
      });
      roundAnswersRef.current = scoredAnswers;
      setRoundAnswers(scoredAnswers);
      setTotals((previous) => {
        const next = new Map(previous);
        scoredAnswers.forEach((answer) => {
          const current = next.get(answer.studentKey);
          next.set(answer.studentKey, {
            studentKey: answer.studentKey,
            displayName: answer.displayName,
            totalPoints: (current?.totalPoints ?? 0) + answer.lessonPoints,
          });
        });
        return next;
      });
      scoredAnswers.forEach((answer) => {
        onScore(answer.studentKey, {
          isCorrect: null,
          points: answer.lessonPoints,
          bonusPoints: answer.closestBonus,
          outcome: radarOutcomeForDistance(answer.distanceKm),
          responseData: {
            clientId: answer.clientId,
            roundId: currentRoundId,
            targetId: destination.id,
            variation: round.variation,
            distanceKm: Math.round(answer.distanceKm),
            basePoints: answer.basePoints,
            closestBonus: answer.closestBonus,
            lessonPoints: answer.lessonPoints,
          },
        });
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
    const round = roundsRef.current[nextIndex];
    roundIndexRef.current = nextIndex;
    roundAnswersRef.current = [];
    setRoundIndex(nextIndex);
    setRoundAnswers([]);
    setPhase('guessing');
    phaseRef.current = 'guessing';
    broadcastRound(round, nextIndex, []);
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
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">
            {isMicroEvent ? 'Navigation Check' : 'ATC Geography Check'}
          </p>
          <h3 className="mt-2 text-4xl font-game text-white">Radar Fix</h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
            Students plot cities, airport codes, and destination clues on a label-free world map. Positions stay sealed until the radar reveal.
          </p>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-slate-400">
            {isMicroEvent
              ? flightDestination
                ? 'This Navigation Check uses the active flight destination.'
                : 'No flight destination is attached, so this check uses the standalone place rotation.'
              : 'Standalone rounds avoid the 12 most recently played places before repeating them.'}
          </p>
        </div>
        <button
          onClick={startGame}
          className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-game text-lg text-white shadow-xl transition hover:scale-[1.03] active:scale-95"
        >
          {isMicroEvent ? 'START NAVIGATION CHECK' : `START ${requestedRoundCount}-ROUND FLIGHT`}
        </button>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        <div className="text-center">
          <Trophy className="mx-auto h-14 w-14 text-amber-300" />
          <h3 className="mt-3 text-3xl font-game text-white">
            {isMicroEvent ? 'Navigation Check Complete' : 'Radar Flight Complete'}
          </h3>
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
            {isMicroEvent ? `Navigation Check · ${roundPrompt.label}` : `${roundPrompt.label} · Round ${roundIndex + 1} of ${rounds.length}`}
          </p>
          <h3 className="mt-1 text-2xl font-game text-white">{roundPrompt.prompt}</h3>
          <p className="mt-1 text-xs text-slate-400">{roundPrompt.detail}</p>
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
              {rankedRound[0] && <span className="text-sm text-cyan-200">Closest: {rankedRound[0].displayName} at {formatDistance(rankedRound[0].distanceKm)} · +{CLOSEST_BONUS} bonus</span>}
              {medianDistance != null && <span className="text-sm text-slate-400">Class median: {formatDistance(medianDistance)}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {rankedRound.slice(0, 5).map((answer, index) => (
                <span key={answer.studentKey} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-200">
                  {index + 1}. {answer.displayName}: {formatDistance(answer.distanceKm)} | +{answer.lessonPoints} pts
                  {answer.closestBonus > 0 ? ` (${answer.basePoints} + ${answer.closestBonus} closest)` : ''}
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
