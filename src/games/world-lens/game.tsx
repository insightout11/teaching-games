'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Globe2, MapPin, RotateCcw, Trophy } from 'lucide-react';
import { DestinationMediaCard } from '@/components/place-media/destination-media-card';
import { getWorldLensPlacePool } from '@/lib/place-media';
import { distanceBetweenCoordsKm, formatDistance } from '@/lib/world-flight/geo';
import type { InputSpec } from '@/lib/input-spec';
import type { GameProps, GameRemoteVote } from '../types';
import { WorldLensMap, type WorldLensGuess } from './world-lens-map';
import { selectWorldLensRounds, type WorldLensRound } from './selection';
import {
  parseWorldLensGuess,
  worldLensClosestBonus,
  worldLensClueModeForDifficulty,
  worldLensOutcomeForDistance,
  worldLensPointsForDistance,
} from './scoring';

type Phase = 'idle' | 'guessing' | 'reveal' | 'finished';

const CLOSEST_BONUS = 2;
const RECENT_PLACE_LIMIT = 20;
const RECENT_PLACES_KEY = 'lc-world-lens-recent-v1';

interface RoundResult extends WorldLensGuess {
  clientId: string;
  studentId: string | null;
  roundId: string;
}

interface TotalEntry {
  studentKey: string;
  displayName: string;
  totalPoints: number;
}

function readRecentPlaceIds() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_PLACES_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function rememberPlaces(rounds: WorldLensRound[], previousIds: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const selectedIds = rounds.map((round) => round.place.id);
    const next = [...selectedIds, ...previousIds.filter((id) => !selectedIds.includes(id))]
      .slice(0, RECENT_PLACE_LIMIT);
    window.localStorage.setItem(RECENT_PLACES_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable; the in-session no-repeat behavior still works.
  }
}

function roundIdFor(index: number, round: WorldLensRound) {
  return `world-lens-${index}-${round.place.id}`;
}

function promptForRound(round: WorldLensRound) {
  if (round.clueMode === 'easy') {
    return {
      label: 'Country Clue',
      prompt: `Find this place in ${round.place.country}.`,
      detail: 'Use the image, then place the pin as close as you can.',
      inputPrompt: `Find the image location in ${round.place.country}.`,
    };
  }
  if (round.clueMode === 'hard') {
    return {
      label: 'Anywhere Mode',
      prompt: 'Find this place anywhere in the world.',
      detail: 'No country or region clue. Use visual evidence only.',
      inputPrompt: 'Find this place anywhere in the world.',
    };
  }
  return {
    label: 'Region Clue',
    prompt: `Find this place in ${round.place.region}.`,
    detail: 'The exact city or landmark is hidden until reveal.',
    inputPrompt: `Find the image location in ${round.place.region}.`,
  };
}

export function WorldLensGame({
  students,
  onScore,
  config,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
}: GameProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [rounds, setRounds] = useState<WorldLensRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundAnswers, setRoundAnswers] = useState<RoundResult[]>([]);
  const [totals, setTotals] = useState<Map<string, TotalEntry>>(() => new Map());

  const phaseRef = useRef<Phase>('idle');
  const roundsRef = useRef<WorldLensRound[]>([]);
  const roundIndexRef = useRef(0);
  const roundAnswersRef = useRef<RoundResult[]>([]);
  const scoredRoundsRef = useRef<Set<string>>(new Set());

  phaseRef.current = phase;
  roundsRef.current = rounds;
  roundIndexRef.current = roundIndex;
  roundAnswersRef.current = roundAnswers;

  const requestedRoundCount = Math.max(1, Math.min(8, Number(config.roundCount ?? 5)));
  const clueMode = worldLensClueModeForDifficulty(sessionSettings.difficulty);
  const currentRound = rounds[roundIndex] ?? null;
  const roundPrompt = currentRound ? promptForRound(currentRound) : null;

  const broadcastRound = useCallback((round: WorldLensRound, index: number, answers: RoundResult[]) => {
    const locked: Record<string, unknown> = {};
    answers.forEach((answer) => {
      locked[answer.clientId] = { locked: true };
    });
    const prompt = promptForRound(round);
    onSetInputSpec?.({
      type: 'geo-point',
      gameKey: 'world-lens',
      prompt: prompt.inputPrompt,
      roundId: roundIdFor(index, round),
      mapCenter: [10, 18],
      mapZoom: round.clueMode === 'hard' ? 0.65 : 0.8,
      mapLabels: false,
      allowMultiple: true,
      perStudentData: locked,
    } as InputSpec);
  }, [onSetInputSpec]);

  const handleVote = useCallback((vote: GameRemoteVote) => {
    if (phaseRef.current !== 'guessing') return;
    const guess = parseWorldLensGuess(vote.choice);
    const round = roundsRef.current[roundIndexRef.current];
    if (!guess || !round || guess.roundId !== roundIdFor(roundIndexRef.current, round)) return;

    const studentKey = vote.studentId || vote.clientId;
    if (!studentKey || roundAnswersRef.current.some((answer) => answer.studentKey === studentKey)) return;

    const distanceKm = distanceBetweenCoordsKm(guess, round.place);
    const basePoints = worldLensPointsForDistance(distanceKm, round.clueMode);
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
    const recentPlaceIds = readRecentPlaceIds();
    const selected = selectWorldLensRounds(getWorldLensPlacePool(), {
      count: requestedRoundCount,
      recentPlaceIds,
      clueMode,
    });
    rememberPlaces(selected, recentPlaceIds);
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
    if (selected[0]) broadcastRound(selected[0], 0, []);
  }, [broadcastRound, clueMode, requestedRoundCount]);

  const reveal = useCallback(() => {
    if (phaseRef.current !== 'guessing') return;
    const round = roundsRef.current[roundIndexRef.current];
    if (!round) return;
    const currentRoundId = roundIdFor(roundIndexRef.current, round);
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
        const closestBonus = worldLensClosestBonus(answer.distanceKm, closestDistance);
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
          outcome: worldLensOutcomeForDistance(answer.distanceKm, round.clueMode),
          responseData: {
            clientId: answer.clientId,
            roundId: currentRoundId,
            placeId: round.place.id,
            mediaId: round.media.id,
            clueMode: round.clueMode,
            country: round.place.country,
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
          <Globe2 className="relative h-24 w-24 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Global Geo Challenge</p>
          <h3 className="mt-2 text-4xl font-game text-white">World Lens</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            Students study a real place image, place a pin on a label-free world map, then reveal the true location and class guesses.
          </p>
        </div>
        <button
          onClick={startGame}
          className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-game text-lg text-white shadow-xl transition hover:scale-[1.03] active:scale-95"
        >
          START {requestedRoundCount}-ROUND WORLD LENS
        </button>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        <div className="text-center">
          <Trophy className="mx-auto h-14 w-14 text-amber-300" />
          <h3 className="mt-3 text-3xl font-game text-white">World Lens Complete</h3>
          <p className="mt-1 text-sm text-slate-400">{rounds.length} global image round{rounds.length === 1 ? '' : 's'} completed</p>
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
          {leaderboard.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No guesses were submitted.</p>}
        </div>
        <div className="text-center">
          <button onClick={startGame} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-300/15">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentRound || !roundPrompt) {
    return (
      <div className="rounded-2xl border border-red-300/20 bg-red-950/30 p-6 text-center text-sm text-red-100">
        World Lens could not find any place media. Add geo-clue media to the Place Media Library.
      </div>
    );
  }

  const imageUrl = currentRound.media.url ?? currentRound.media.thumbnailUrl;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">
            {roundPrompt.label} - Round {roundIndex + 1} of {rounds.length}
          </p>
          <h3 className="mt-1 text-2xl font-game text-white">{roundPrompt.prompt}</h3>
          <p className="mt-1 text-xs text-slate-400">{roundPrompt.detail}</p>
        </div>
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/70">Pins locked</p>
          <p className="font-game text-2xl text-cyan-200">{roundAnswers.length} / {students.length || '?'}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(360px,1.1fr)]">
        <div className="space-y-3">
          {imageUrl ? (
            phase === 'reveal' ? (
              <DestinationMediaCard
                media={currentRound.media}
                placeName={currentRound.place.name}
                label="Image clue revealed"
                showSource
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-cyan-300/18 bg-slate-950/55">
                <div className="relative h-[360px] overflow-hidden bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Mystery place clue" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-slate-950/78 p-3 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-cyan-200" />
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/80">Mystery image</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">Source and exact caption unlock after reveal.</p>
                  </div>
                </div>
              </div>
            )
          ) : null}
        </div>
        <WorldLensMap
          answer={{
            name: currentRound.place.city ?? currentRound.place.name,
            country: currentRound.place.country,
            lat: currentRound.place.lat,
            lng: currentRound.place.lng,
          }}
          guesses={roundAnswers}
          revealed={phase === 'reveal'}
        />
      </div>

      {phase === 'guessing' ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <MapPin className="h-5 w-5 text-cyan-300" />
            Students choose a position on their devices. Reveal when the class is ready.
          </div>
          <button
            onClick={reveal}
            disabled={roundAnswers.length === 0}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 font-game text-sm text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30"
          >
            REVEAL LOCATION
          </button>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-300" />
                <span className="font-bold text-white">{currentRound.place.name}</span>
              </div>
              {rankedRound[0] && <span className="text-sm text-cyan-200">Closest: {rankedRound[0].displayName} at {formatDistance(rankedRound[0].distanceKm)} - +{CLOSEST_BONUS} bonus</span>}
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
            {roundIndex + 1 >= rounds.length ? 'FINISH' : 'NEXT IMAGE'}
          </button>
        </div>
      )}
    </div>
  );
}
