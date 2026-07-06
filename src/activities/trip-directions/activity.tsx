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

type Phase = 'idle' | 'check-in' | 'guiding' | 'reveal' | 'done';

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
  // The guide is always a STUDENT DEVICE (clientId) — the destination is marked on their map
  // only, so they genuinely know where to direct people. (Never the teacher: the teacher's
  // screen is projected, so they can't be shown the destination either.) Devices are learned
  // via the check-in beat before round 1; the role rotates each round.
  const [guideDevice, setGuideDevice] = useState<{ clientId: string; name: string } | null>(null);
  const [readyNames, setReadyNames] = useState<string[]>([]);

  const phaseRef = useRef<Phase>('idle');
  const roundIndexRef = useRef(0);
  const guessesRef = useRef<Guess[]>([]);
  const scoredRef = useRef<Set<string>>(new Set());
  const guideRef = useRef<{ clientId: string; name: string } | null>(null);
  const participantsRef = useRef<Map<string, string>>(new Map()); // clientId -> displayName
  phaseRef.current = phase;
  roundIndexRef.current = roundIndex;
  guessesRef.current = guesses;
  guideRef.current = guideDevice;

  const target = landmarks.length > 0 ? landmarks[roundIndex % landmarks.length] : null;
  const roundIdFor = (index: number) => {
    const t = landmarks.length > 0 ? landmarks[index % landmarks.length] : null;
    return t ? `trip-directions-${index}-${t.id}` : 'trip-directions-none';
  };

  const broadcast = useCallback((index: number, guide: { clientId: string; name: string } | null) => {
    const t = landmarks.length > 0 ? landmarks[index % landmarks.length] : null;
    onSetInputSpec?.({
      type: 'geo-point',
      gameKey: 'trip-directions',
      prompt: guide
        ? `Listen to ${guide.name}'s directions from ${content.start.name} (green pin), then drop your pin where they lead.`
        : `Listen to the directions from ${content.start.name} (green pin), then drop your pin where they lead.`,
      roundId: roundIdFor(index),
      mapStyle: 'city-streets',
      // Centre on the START so students begin oriented, zoomed to street level, WITH street
      // names — you can't follow "turn left at Dame Street" on an unlabelled map.
      mapCenter: [content.start.lng, content.start.lat],
      mapZoom: 14,
      mapMaxZoom: 17,
      mapLabels: true,
      mapMarkers: [{ lat: content.start.lat, lng: content.start.lng, label: `START · ${content.start.name}`, color: '#34d399' }],
      // The guide's device — and only theirs — shows the destination.
      ...(guide && t
        ? { perStudentData: { [guide.clientId]: { guide: true, target: { lat: t.lat, lng: t.lng, label: t.name } } } }
        : {}),
      allowMultiple: true,
    } as InputSpec);
    // roundIdFor is derived from landmarks, already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSetInputSpec, content.start, landmarks]);

  const handleVote = useCallback((vote: RemoteVote) => {
    // Check-in beat: any tap tells us this device is connected (clientId + name).
    if (phaseRef.current === 'check-in') {
      participantsRef.current.set(vote.clientId, vote.displayName);
      setReadyNames(Array.from(participantsRef.current.values()));
      return;
    }
    if (phaseRef.current !== 'guiding' || landmarks.length === 0) return;
    const idx = roundIndexRef.current;
    const t = landmarks[idx % landmarks.length];
    const guess = parseGeoGuess(vote.choice);
    if (!guess || guess.roundId !== `trip-directions-${idx}-${t.id}`) return;
    // The guide knows the answer — their pins don't count.
    if (guideRef.current && vote.clientId === guideRef.current.clientId) return;
    participantsRef.current.set(vote.clientId, vote.displayName);
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

  const beginCheckIn = useCallback(() => {
    setPhase('check-in');
    phaseRef.current = 'check-in';
    onPhaseChange?.('check-in');
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'trip-directions',
      prompt: `Ready to navigate ${content.city}? One of you will be the guide.`,
      buttonLabel: "I'm ready",
    } as InputSpec);
  }, [onPhaseChange, onSetInputSpec, content.city]);

  // Random guide each round (like Imposter) — never "first to check in wins".
  const pickRandomGuide = useCallback((excludeClientId?: string | null) => {
    const ids = Array.from(participantsRef.current.keys());
    const pool = ids.length > 1 && excludeClientId ? ids.filter((id) => id !== excludeClientId) : ids;
    if (pool.length === 0) return null;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { clientId: pick, name: participantsRef.current.get(pick) ?? 'a student' };
  }, []);

  const startRounds = useCallback(() => {
    if (participantsRef.current.size < 2) return; // one guides, at least one navigates
    const guide = pickRandomGuide();
    if (!guide) return;
    guideRef.current = guide;
    setGuideDevice(guide);
    guessesRef.current = [];
    setGuesses([]);
    setPhase('guiding');
    phaseRef.current = 'guiding';
    onPhaseChange?.('guiding');
    broadcast(roundIndexRef.current, guide);
  }, [broadcast, onPhaseChange, pickRandomGuide]);

  // If the guide's device drops (or the teacher wants a different guide), hand the role on.
  const swapGuide = useCallback(() => {
    if (participantsRef.current.size < 2 || !guideRef.current) return;
    const guide = pickRandomGuide(guideRef.current.clientId);
    if (!guide) return;
    guideRef.current = guide;
    setGuideDevice(guide);
    broadcast(roundIndexRef.current, guide);
  }, [broadcast, pickRandomGuide]);

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

  // Soft default is ONE round: after the first reveal the primary action is FINISH. "Another
  // round" stays available with no hard cap — the guide rotates and the destination cycles
  // through the city's landmarks (wrapping), so a teacher can keep going as long as they like.
  const finish = useCallback(() => {
    onSetInputSpec?.(null);
    setPhase('done');
    phaseRef.current = 'done';
    onPhaseChange?.('finished');
  }, [onSetInputSpec, onPhaseChange]);

  const anotherRound = useCallback(() => {
    const ni = roundIndexRef.current + 1;
    roundIndexRef.current = ni;
    setRoundIndex(ni);
    guessesRef.current = [];
    setGuesses([]);
    // New random guide each round (excluding whoever just guided).
    const nextGuide = pickRandomGuide(guideRef.current?.clientId) ?? guideRef.current;
    guideRef.current = nextGuide;
    setGuideDevice(nextGuide);
    setPhase('guiding');
    phaseRef.current = 'guiding';
    onPhaseChange?.('guiding');
    broadcast(ni, nextGuide);
  }, [broadcast, onPhaseChange, pickRandomGuide]);

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
            The guide sees the destination on their map — nobody else does. They describe the route from {content.start.name}; everyone else follows the streets on their device and drops a pin where the directions lead.
          </p>
        </div>
        <ol className="mx-auto w-full max-w-md space-y-1.5 text-left text-sm text-slate-300">
          <li className="rounded-lg bg-white/[0.04] px-3 py-2"><span className="font-semibold text-cyan-200">1.</span> Students check in on their devices — one becomes the <span className="font-semibold text-white">guide</span>.</li>
          <li className="rounded-lg bg-white/[0.04] px-3 py-2"><span className="font-semibold text-cyan-200">2.</span> The destination appears secretly on the guide&apos;s map. They describe the route from {content.start.name} out loud.</li>
          <li className="rounded-lg bg-white/[0.04] px-3 py-2"><span className="font-semibold text-cyan-200">3.</span> Everyone else traces the route on their street map and drops a pin — closest pins score, then a new guide takes over.</li>
        </ol>
        <button onClick={beginCheckIn} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">CREW CHECK-IN</button>
      </div>
    );
  }

  if (phase === 'check-in') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <Users className="relative h-16 w-16 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Crew check-in</p>
          <h3 className="mt-2 text-3xl font-game text-white">Who&apos;s navigating?</h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">
            Students tap <span className="font-semibold text-white">&ldquo;I&apos;m ready&rdquo;</span> on their device. A guide is chosen at random each round.
          </p>
        </div>
        <div className="flex min-h-[44px] flex-wrap items-center justify-center gap-2">
          {readyNames.length === 0 ? (
            <span className="text-sm text-slate-500">Waiting for the crew…</span>
          ) : (
            readyNames.map((name) => (
              <span key={name} className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-sm font-semibold text-cyan-100">{name}</span>
            ))
          )}
        </div>
        <button
          onClick={startRounds}
          disabled={readyNames.length < 2}
          className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          START ROUND 1
        </button>
        {readyNames.length < 2 && (
          <p className="text-xs text-slate-500">Needs at least 2 connected students — one guides, the rest navigate.</p>
        )}
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
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Find Your Way · Round {roundIndex + 1}</p>
          <h3 className="mt-1 text-2xl font-game text-white">From {content.start.name}…</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300"><Users className="h-4 w-4 text-cyan-300" />Guide: <span className="font-semibold text-white">{guideDevice?.name ?? '—'}</span></p>
        </div>
        <div className="flex items-center gap-2">
          {!revealed && (
            <button onClick={swapGuide} className="rounded-xl bg-white/10 px-4 py-2 font-game text-xs text-white transition hover:bg-white/20">
              Swap guide
            </button>
          )}
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/70">Pins dropped</p>
            <p className="font-game text-2xl text-cyan-200">{guesses.length} / {Math.max(students.length - 1, 0) || '?'}</p>
          </div>
        </div>
      </div>

      {!revealed && (
        <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <span className="font-semibold">{guideDevice?.name ?? 'The guide'}</span> is the guide — the destination is marked on <span className="font-semibold">their device only</span>. They describe the route from <span className="font-semibold">{content.start.name}</span> (the green START pin); everyone else follows and drops a pin.
        </div>
      )}

      <CityDirectionsMap
        center={content.center}
        start={content.start}
        landmarks={landmarks}
        target={revealed ? target : null}
        guesses={ranked}
        revealed={revealed}
      />

      {!revealed && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Direction language for the guide</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Start at the green pin.',
              'Head north / south / east / west.',
              'Go along the river / the main road.',
              'Cross the river / the bridge.',
              'Go past ___.',
              'Turn towards ___ at the corner.',
              "It's next to / across from ___.",
              "It's about ___ minutes' walk.",
              'You are there!',
            ].map((phrase) => (
              <span key={phrase} className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-sm text-slate-200">{phrase}</span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            The maps never rotate — north is always up, and everyone has the same compass. Compass words and landmarks beat left/right here.
          </p>
        </div>
      )}

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
          <div className="flex items-center gap-2">
            <button onClick={anotherRound} className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-game text-sm text-slate-200 transition hover:bg-white/10">ANOTHER ROUND</button>
            <button onClick={finish} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">FINISH</button>
          </div>
        </div>
      )}
    </div>
  );
}
