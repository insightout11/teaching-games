'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Eye, Flag, Mic, RefreshCw, Repeat, Route, Users } from 'lucide-react';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { distanceBetweenCoordsKm } from '@/lib/world-flight/geo';
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
  const [replayKey, setReplayKey] = useState(0);

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
      // The guide scores for clear directions: the class's average pin points x2 (max 10).
      const guide = guideRef.current;
      const gs = guessesRef.current;
      if (guide && gs.length) {
        const points = Math.min(10, Math.round((gs.reduce((n, g) => n + g.points, 0) / gs.length) * 2));
        void onScore?.({ studentId: null, clientId: guide.clientId, displayName: guide.name, promptIndex: roundIndexRef.current + 1, points, isCorrect: null });
      }
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

  const PHRASES = [
    'Start at the green pin.',
    'Head north / south / east / west.',
    'Go along the river / the main road.',
    'Cross the river / the bridge.',
    'Go past ___.',
    "It's next to / across from ___.",
    "It's about ___ minutes' walk.",
    'You are there!',
  ];
  const within400 = ranked.filter((g) => g.distanceKm <= 0.4).length;
  const STEPS: Array<[typeof Users, string, string]> = [
    [Users, 'Check in', 'Phones tap ready. A guide is picked at random.'],
    [Mic, 'Guide talks', 'Only the guide sees the destination. They describe the route.'],
    [Flag, 'Pin + reveal', 'Everyone pins; the route draws itself; closest wins.'],
  ];

  // No coordinates for this city yet — show a graceful state rather than a broken map.
  if (landmarks.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-3 py-10 text-center text-white">
        <Compass className="mx-auto h-12 w-12 text-white/40" />
        <p className="font-display text-3xl">Find Your Way</p>
        <p className="text-white/60">The street map for {content.city} isn&apos;t ready yet. Swap this stage for now; it&apos;ll light up once this city has landmark coordinates.</p>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <Compass className="mx-auto h-10 w-10 text-cyan-300" />
        <div>
          <KitLabel tone="cyan">Find Your Way</KitLabel>
          <p className="mt-2 font-display text-5xl">Directions in {content.city}.</p>
        </div>
        <p className="mx-auto max-w-xl text-lg text-white/70">One student secretly sees a destination on their phone and gives directions from {content.start.name}. Everyone else follows on their street map and drops a pin where the directions lead.</p>
        <div className="mx-auto grid max-w-2xl gap-2 text-left sm:grid-cols-3">
          {STEPS.map(([Icon, title, text]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <Icon className="h-5 w-5 text-cyan-300" />
              <p className="mt-2 font-display text-xl">{title}</p>
              <p className="text-sm text-white/60">{text}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <KitButton tone="cyan" solid onClick={beginCheckIn} className="!px-8 !py-3 !text-base" icon={<Users className="h-4 w-4" />}>Crew check-in</KitButton>
        </div>
      </div>
    );
  }

  if (phase === 'check-in') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-6 text-center text-white">
        <KitLabel tone="cyan">Crew check-in</KitLabel>
        <p className="font-display text-5xl">Who&apos;s navigating?</p>
        <p className="text-lg text-white/70">Tap <span className="text-white">&ldquo;I&apos;m ready&rdquo;</span> on your phone.</p>
        <div className="flex min-h-[48px] flex-wrap items-center justify-center gap-2">
          {readyNames.length === 0
            ? <span className="text-white/45">Waiting for the crew…</span>
            : readyNames.map((name) => <span key={name} className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1.5 text-lg text-cyan-50">{name}</span>)}
        </div>
        <div className="flex justify-center">
          <KitButton tone="cyan" solid disabled={readyNames.length < 2} onClick={startRounds} className="!px-8 !py-3 !text-base" icon={<Compass className="h-4 w-4" />}>Start round 1</KitButton>
        </div>
        {readyNames.length < 2 && <p className="text-sm text-white/45">Needs at least 2 phones: one guides, the rest navigate.</p>}
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-xl space-y-3 py-10 text-center text-white">
        <Compass className="mx-auto h-12 w-12 text-cyan-300" />
        <p className="font-display text-4xl">You know your way around {content.city}.</p>
      </div>
    );
  }

  const revealed = phase === 'reveal';
  return (
    <div className="mx-auto max-w-5xl space-y-3 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <KitLabel tone="cyan">Find Your Way · round {roundIndex + 1} · from {content.start.name}</KitLabel>
        <KitReadout>{guesses.length} / {Math.max(students.length - 1, 0) || '?'} pinned</KitReadout>
      </div>

      {!revealed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] px-5 py-3">
          <p className="flex items-center gap-2 text-xl"><Mic className="h-5 w-5 text-amber-300" /><span className="font-display text-3xl">{guideDevice?.name ?? 'The guide'}</span> is guiding. Only their phone shows the destination.</p>
          <KitButton tone="plain" onClick={swapGuide} icon={<RefreshCw className="h-3.5 w-3.5" />}>Swap guide</KitButton>
        </div>
      )}
      {revealed && target && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] px-5 py-3">
          <div>
            <KitLabel tone="amber">The destination</KitLabel>
            <p className="font-display text-4xl">{target.name}</p>
          </div>
          <div className="text-right">
            {ranked.length > 0 ? (
              <>
                <p className="text-lg">{ranked.slice(0, 3).map((g, i) => `${i + 1}. ${g.displayName}`).join('   ')}</p>
                <p className="text-sm text-white/60">{within400} of {ranked.length} pins within 400 m</p>
              </>
            ) : <p className="text-white/60">No pins dropped.</p>}
          </div>
        </div>
      )}

      <CityDirectionsMap
        center={content.center}
        start={content.start}
        landmarks={landmarks}
        target={revealed ? target : null}
        guesses={ranked}
        revealed={revealed}
        replayKey={replayKey}
      />

      {!revealed ? (
        <>
          <div className="flex flex-wrap gap-1.5">{PHRASES.map((p) => <span key={p} className="rounded-full border border-white/10 px-3 py-1 text-base text-white/75">{p}</span>)}</div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-white/50">North is always up. Compass words and landmarks beat left and right.</p>
            <KitButton tone="amber" solid disabled={guesses.length === 0} onClick={reveal} className="!px-5 !py-2 !text-sm" icon={<Eye className="h-4 w-4" />}>Reveal</KitButton>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <KitButton tone="amber" onClick={() => setReplayKey((k) => k + 1)} icon={<Route className="h-3.5 w-3.5" />}>Replay route</KitButton>
          <p className="text-sm text-white/55">{guideDevice?.name}, walk us through it again.</p>
          <div className="flex gap-2">
            <KitButton tone="plain" onClick={anotherRound} icon={<Repeat className="h-3.5 w-3.5" />}>Another round</KitButton>
            <KitButton tone="cyan" solid onClick={finish} className="!px-5 !py-2 !text-sm" icon={<Flag className="h-4 w-4" />}>Finish</KitButton>
          </div>
        </div>
      )}
    </div>
  );
}
