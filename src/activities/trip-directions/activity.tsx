'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Users } from 'lucide-react';
import { distanceBetweenCoordsKm, formatDistance } from '@/lib/world-flight/geo';
import { parseGeoGuess } from '@/games/radar-fix/scoring';
import type { InputSpec } from '@/lib/input-spec';
import type { ActivityProps, RemoteVote, TripDirectionsContent } from '../types';
import { CityDirectionsMap, type DirectionsGuessPin } from './city-directions-map';

// Find Your Way — the directions game. One student is the GUIDE (rotates); the teacher quietly
// tells them the destination (shown teacher-facing only, not on the projected map). The guide
// gives directions from the Start; everyone else follows on their device's real street map and
// drops a pin. Reveal shows the destination + all pins, scored by real distance.

type Phase = 'idle' | 'guiding' | 'reveal' | 'done';

interface Guess extends DirectionsGuessPin {
  distanceKm: number;
  points: number;
}

function pointsForMeters(meters: number): number {
  if (meters <= 150) return 5;
  if (meters <= 400) return 3;
  if (meters <= 800) return 2;
  return 1;
}

export function TripDirectionsActivity({
  students,
  generatedContent,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onPhaseChange,
}: ActivityProps) {
  const content = generatedContent as TripDirectionsContent;
  const landmarks = useMemo(() => content.landmarks ?? [], [content.landmarks]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIndex, setRoundIndex] = useState(0);
  const [guesses, setGuesses] = useState<Guess[]>([]);

  const phaseRef = useRef<Phase>('idle');
  const roundIndexRef = useRef(0);
  const guessesRef = useRef<Guess[]>([]);
  const scoredRef = useRef<Set<string>>(new Set());
  phaseRef.current = phase;
  roundIndexRef.current = roundIndex;
  guessesRef.current = guesses;

  const target = landmarks.length > 0 ? landmarks[roundIndex % landmarks.length] : null;
  const guide = students.length > 0 ? students[roundIndex % students.length] : null;
  const roundIdFor = (index: number) => {
    const t = landmarks.length > 0 ? landmarks[index % landmarks.length] : null;
    return t ? `trip-directions-${index}-${t.id}` : 'trip-directions-none';
  };

  const broadcast = useCallback((index: number) => {
    onSetInputSpec?.({
      type: 'geo-point',
      gameKey: 'trip-directions',
      prompt: 'Follow the directions and drop a pin where you end up.',
      roundId: landmarks.length > 0 ? `trip-directions-${index}-${landmarks[index % landmarks.length].id}` : 'trip-directions-none',
      mapStyle: 'city-streets',
      mapCenter: [content.center.lng, content.center.lat],
      mapZoom: 13,
      mapMaxZoom: 16,
      allowMultiple: true,
    } as InputSpec);
  }, [onSetInputSpec, content.center, landmarks]);

  const handleVote = useCallback((vote: RemoteVote) => {
    if (phaseRef.current !== 'guiding' || landmarks.length === 0) return;
    const idx = roundIndexRef.current;
    const t = landmarks[idx % landmarks.length];
    const guess = parseGeoGuess(vote.choice);
    if (!guess || guess.roundId !== `trip-directions-${idx}-${t.id}`) return;
    const studentKey = vote.studentId || vote.clientId;
    if (!studentKey || guessesRef.current.some((g) => g.studentKey === studentKey)) return;
    const distanceKm = distanceBetweenCoordsKm(guess, t);
    const next = [
      ...guessesRef.current,
      { studentKey, displayName: vote.displayName, lat: guess.lat, lng: guess.lng, distanceKm, points: pointsForMeters(distanceKm * 1000) },
    ];
    guessesRef.current = next;
    setGuesses(next);
  }, [landmarks]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [handleVote, onRegisterRemoteVoteHandler]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const startRound = useCallback(() => {
    guessesRef.current = [];
    setGuesses([]);
    setPhase('guiding');
    phaseRef.current = 'guiding';
    onPhaseChange?.('guiding');
    broadcast(roundIndexRef.current);
  }, [broadcast, onPhaseChange]);

  const reveal = useCallback(() => {
    if (phaseRef.current !== 'guiding') return;
    onSetInputSpec?.(null);
    setPhase('reveal');
    phaseRef.current = 'reveal';
    onPhaseChange?.('reveal');
    const rid = roundIdFor(roundIndexRef.current);
    if (!scoredRef.current.has(rid)) {
      scoredRef.current.add(rid);
      guessesRef.current.forEach((g) => {
        void onScore?.({ studentId: null, clientId: g.studentKey, displayName: g.displayName, promptIndex: roundIndexRef.current + 1, points: g.points, isCorrect: null });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSetInputSpec, onPhaseChange, onScore, landmarks]);

  const next = useCallback(() => {
    const ni = roundIndexRef.current + 1;
    if (ni >= landmarks.length) {
      onSetInputSpec?.(null);
      setPhase('done');
      phaseRef.current = 'done';
      onPhaseChange?.('finished');
      return;
    }
    roundIndexRef.current = ni;
    setRoundIndex(ni);
    guessesRef.current = [];
    setGuesses([]);
    setPhase('guiding');
    phaseRef.current = 'guiding';
    onPhaseChange?.('guiding');
    broadcast(ni);
  }, [broadcast, landmarks.length, onSetInputSpec, onPhaseChange]);

  const ranked = useMemo(() => [...guesses].sort((a, b) => a.distanceKm - b.distanceKm), [guesses]);

  // No coordinates for this city yet — show a graceful state rather than a broken map.
  if (landmarks.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 py-6 text-center">
        <Compass className="h-14 w-14 text-slate-500" />
        <h3 className="text-2xl font-game text-white">Find Your Way</h3>
        <p className="max-w-md text-sm text-slate-400">The street map for {content.city} isn&apos;t ready yet. Swap this stage for now — it&apos;ll light up once this city has landmark coordinates.</p>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[440px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <Compass className="relative h-20 w-20 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Find Your Way</p>
          <h3 className="mt-2 text-4xl font-game text-white">Directions in {content.city}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            One student is the guide. Quietly tell them the destination, and they give directions from {content.start.name}. Everyone else follows on their device and drops a pin.
          </p>
        </div>
        <button onClick={startRound} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">START ROUND 1</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <Compass className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">You know your way around</h3>
        <p className="max-w-md text-sm text-slate-300">The class navigated {content.city}. Next: checking in.</p>
      </div>
    );
  }

  const revealed = phase === 'reveal';
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Find Your Way · Round {roundIndex + 1} of {landmarks.length}</p>
          <h3 className="mt-1 text-2xl font-game text-white">From {content.start.name}…</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300"><Users className="h-4 w-4 text-cyan-300" />Guide: <span className="font-semibold text-white">{guide ? guide.name : 'the teacher'}</span></p>
        </div>
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/70">Pins dropped</p>
          <p className="font-game text-2xl text-cyan-200">{guesses.length} / {students.length || '?'}</p>
        </div>
      </div>

      {!revealed && (
        <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Quietly tell <span className="font-semibold">{guide ? guide.name : 'the guide'}</span> the destination: <span className="font-game text-amber-200">{target?.name}</span>. They describe the route — everyone else uses their device.
        </div>
      )}

      <CityDirectionsMap
        center={content.center}
        start={content.start}
        target={revealed ? target : null}
        guesses={ranked}
        revealed={revealed}
      />

      {!revealed ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <p className="text-sm text-slate-300">Pins stay hidden until you reveal.</p>
          <button onClick={reveal} disabled={guesses.length === 0} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 font-game text-sm text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30">REVEAL PINS</button>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm font-semibold text-white">Destination: {target?.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ranked.slice(0, 6).map((g, i) => (
                <span key={g.studentKey} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-200">{i + 1}. {g.displayName}: {formatDistance(g.distanceKm)} · +{g.points}</span>
              ))}
              {ranked.length === 0 && <span className="text-xs text-slate-400">No pins dropped.</span>}
            </div>
          </div>
          <button onClick={next} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">{roundIndex + 1 >= landmarks.length ? 'FINISH' : 'NEXT ROUND'}</button>
        </div>
      )}
    </div>
  );
}
