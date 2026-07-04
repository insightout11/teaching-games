'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { ClassBoardCanvas } from '@/components/session/class-board-canvas';
import { boardSpecFields, getClassBoardPreset, type ClassBoardZone } from '@/lib/class-board';
import { drawTravelMoment, type TravelMoment } from '@/lib/world-flight/travel-moments';
import { useSessionStore } from '@/stores/session-store';
import type { InputSpec } from '@/lib/input-spec';
import type { ActivityProps, TripAttractionsContent } from '../types';
import { ExpandableImage } from '../shared/expandable-image';

// Out & About stage of the Travel arc, built on the CLASS BOARD as designed:
//  - one board column per REAL attraction (name + what it is as the column header)
//  - students add reasons / concerns / questions under each place FROM THEIR DEVICES
//  - students upvote each other's notes; the teacher inline-adds while the class talks
//  - the class discusses aloud, the teacher marks the winning place
//  - then a travel moment lands on the pick — a framed class speaking moment

const BOARD_KEY = 'trip-attractions';
const PRESET_KEY = 'trip-attractions';

type Phase = 'idle' | 'discuss' | 'vote' | 'moment' | 'done';

export function TripAttractionsActivity({
  sessionId,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as TripAttractionsContent;
  const attractions = useMemo(() => content.attractions ?? [], [content.attractions]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [moment, setMoment] = useState<TravelMoment | null>(null);
  const [votes, setVotes] = useState<Record<string, string>>({}); // clientId -> attraction name
  const scoredRef = useRef<Set<string>>(new Set());
  const addTripLogEntry = useSessionStore((s) => s.addTripLogEntry);

  // One board zone per attraction — notes attach to the place they're about.
  const attractionZones = useMemo<ClassBoardZone[]>(
    () => attractions.map((a) => ({ key: a.id, label: a.name, description: a.whatItIs })),
    [attractions],
  );

  const buildBoardSpec = useCallback((): InputSpec => {
    const preset = getClassBoardPreset(PRESET_KEY);
    return {
      type: 'board',
      gameKey: BOARD_KEY,
      prompt: content.framingPrompt,
      instruction: 'Add a reason, concern, or question',
      maxLength: 200,
      allowMultiple: true,
      ...boardSpecFields(preset, BOARD_KEY, attractionZones),
    };
  }, [content.framingPrompt, attractionZones]);

  const buildVoteSpec = useCallback((): InputSpec => ({
    type: 'choice',
    gameKey: BOARD_KEY,
    prompt: `Vote: where should the class go in ${content.city}?`,
    options: attractions.map((a) => a.name),
  }), [content.city, attractions]);

  useEffect(() => {
    if (phase === 'discuss') {
      onSetInputSpec?.(buildBoardSpec());
      onRegisterRemoteVoteHandler?.(null);
      return undefined;
    }
    if (phase === 'vote') {
      // Students vote for the DESTINATION itself — not for each other's notes.
      onSetInputSpec?.(buildVoteSpec());
      onRegisterRemoteVoteHandler?.((vote) => {
        setVotes((prev) => ({ ...prev, [vote.clientId]: vote.choice }));
        if (!scoredRef.current.has(vote.clientId)) {
          scoredRef.current.add(vote.clientId);
          void onScore?.({
            studentId: vote.studentId ?? null,
            clientId: vote.clientId,
            displayName: vote.displayName,
            promptIndex: 1,
            points: 1,
            isCorrect: null,
          });
        }
      });
      return () => { onRegisterRemoteVoteHandler?.(null); };
    }
    onSetInputSpec?.(null);
    onRegisterRemoteVoteHandler?.(null);
    return undefined;
  }, [phase, buildBoardSpec, buildVoteSpec, onSetInputSpec, onRegisterRemoteVoteHandler, onScore]);

  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const countFor = useCallback(
    (name: string) => Object.values(votes).filter((v) => v === name).length,
    [votes],
  );
  // Winner = most-voted destination; the teacher can tap a chip to override.
  const topVoted = useMemo(() => {
    if (attractions.length === 0) return null;
    const ranked = [...attractions].sort((a, b) => countFor(b.name) - countFor(a.name));
    return countFor(ranked[0].name) > 0 ? ranked[0] : null;
  }, [attractions, countFor]);
  const winner = attractions.find((a) => a.id === winnerId) ?? topVoted ?? null;

  const start = () => { setPhase('discuss'); onPhaseChange?.('discuss'); };
  const toVote = () => { setPhase('vote'); onPhaseChange?.('vote'); };
  const reveal = () => {
    const chosen = winner ?? attractions[0] ?? null;
    if (!chosen) return;
    if (!winnerId) setWinnerId(chosen.id);
    const drawn = drawTravelMoment({ place: chosen.name, localColor: content.localColor });
    setMoment(drawn);
    addTripLogEntry({ stageId: 'attraction', text: `Visited ${chosen.name} — ${drawn.situation}` });
    setPhase('moment');
    onPhaseChange?.('moment');
  };
  const finish = () => { setPhase('done'); onPhaseChange?.('finished'); };

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <MapPin className="relative h-20 w-20 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Out &amp; About</p>
          <h3 className="mt-2 text-4xl font-game text-white">Where to in {content.city}?</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{content.framingPrompt}</p>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-400">
            Each place gets its own column — students add reasons and concerns from their devices while the class talks. Then everyone votes for the destination, and something happens there.
          </p>
        </div>
        <ul className="w-full max-w-lg space-y-2 text-left">
          {attractions.map((a) => (
            <li key={a.id} className="flex items-start gap-3 rounded-xl border border-cyan-300/15 bg-slate-950/40 px-4 py-3">
              {a.imageUrl && (
                <ExpandableImage
                  src={a.imageUrl}
                  alt={a.name}
                  caption={a.imageCaption ?? a.whatItIs}
                  credit={a.imageCredit}
                  thumbClassName="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-game text-base text-cyan-100">{a.name}</p>
                <p className="mt-0.5 text-sm text-slate-300">{a.whatItIs}</p>
                {a.whyVisit && <p className="mt-1 text-xs text-slate-400">{a.whyVisit}</p>}
              </div>
            </li>
          ))}
        </ul>
        <button onClick={start} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">OPEN BOARD</button>
      </div>
    );
  }

  if (phase === 'moment' && moment) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl" />
          <Sparkles className="relative h-16 w-16 text-amber-300" />
        </div>
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300/80">Speaking moment · you went to {winner?.name ?? 'your spot'}</p>
          <h3 className="mt-3 text-3xl font-game leading-snug text-white">{moment.situation}</h3>
          <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-amber-300/20 bg-amber-500/10 px-5 py-4 text-base text-amber-100">
            {moment.speakingTask}
          </p>
          <p className="mx-auto mt-3 max-w-md text-xs text-slate-400">
            Talk it through together as a class — then finish the stop.
          </p>
        </div>
        <button onClick={finish} className="rounded-2xl bg-white/10 px-10 py-4 font-game text-lg text-white transition hover:bg-white/20">FINISH</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <MapPin className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">Good day out</h3>
        <p className="max-w-md text-sm text-slate-300">The class visited {winner?.name ?? 'a local spot'} in {content.city}. Next: a local meal.</p>
      </div>
    );
  }

  // phase === 'vote' — students vote for the destination on their devices
  if (phase === 'vote') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Out &amp; About · The vote</p>
            <h3 className="mt-1 text-2xl font-game text-white">Where should the class go?</h3>
          </div>
          <button
            onClick={reveal}
            disabled={!winner}
            className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-2.5 font-game text-sm text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            WHAT HAPPENS?
          </button>
        </div>
        <p className="text-sm text-slate-400">
          Students vote for the destination on their device. The top pick wins — tap a place to override if the class decides otherwise out loud.
        </p>
        <ul className="space-y-2">
          {attractions.map((a) => {
            const selected = a.id === (winner?.id ?? null);
            const tally = countFor(a.name);
            return (
              <li key={a.id}>
                <button
                  onClick={() => setWinnerId(a.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    selected
                      ? 'border-cyan-300/60 bg-cyan-500/[0.12]'
                      : 'border-white/10 bg-slate-950/40 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-game text-base text-cyan-100">{a.name}</span>
                      {selected && <span className="shrink-0 text-cyan-300">✓</span>}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-300">{a.whatItIs}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-cyan-400/15 px-3 py-1.5 font-game text-lg text-cyan-200">{tally}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // phase === 'discuss' — the live board
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Out &amp; About</p>
          <h3 className="mt-1 text-2xl font-game text-white">Where should the class go?</h3>
        </div>
        <button
          onClick={toVote}
          disabled={attractions.length === 0}
          className="rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 px-5 py-2.5 font-game text-sm text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          CALL THE VOTE
        </button>
      </div>
      <p className="text-sm text-slate-400">
        Discuss each place out loud — students add reasons and concerns under it from their devices, and you can add notes too. When the talking&apos;s done, call the vote.
      </p>

      {sessionId ? (
        <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/45">
          <ClassBoardCanvas
            sessionId={sessionId}
            boardKey={BOARD_KEY}
            presetKey={PRESET_KEY}
            zonesOverride={attractionZones}
            includePending
          />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">Start a live session to open the board.</p>
      )}
    </div>
  );
}
