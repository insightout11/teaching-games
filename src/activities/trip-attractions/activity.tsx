'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { ClassBoardCanvas } from '@/components/session/class-board-canvas';
import { boardSpecFields, getClassBoardPreset } from '@/lib/class-board';
import { drawTravelMoment, type TravelMoment } from '@/lib/world-flight/travel-moments';
import type { InputSpec } from '@/lib/input-spec';
import type { ActivityProps, TripAttractionsContent } from '../types';

// Attraction stage of the Travel arc. The board (ranked-list) is seeded with the city's
// REAL attractions as info-bearing option cards; students discuss and the teacher ranks
// live (canvas mode, teacher inline-add). After ranking, a weighted travel moment lands on
// the chosen attraction — the structure is fixed every city; only the moment varies.

const BOARD_KEY = 'trip-attractions';
const PRESET_KEY = 'ranked-list';

type Phase = 'idle' | 'discuss' | 'moment' | 'done';

export function TripAttractionsActivity({
  sessionId,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
}: ActivityProps) {
  const content = generatedContent as TripAttractionsContent;
  const attractions = useMemo(() => content.attractions ?? [], [content.attractions]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [moment, setMoment] = useState<TravelMoment | null>(null);
  const seededRef = useRef(false);

  const buildSpec = useCallback((): InputSpec => {
    const preset = getClassBoardPreset(PRESET_KEY);
    return {
      type: 'board',
      gameKey: BOARD_KEY,
      prompt: content.framingPrompt,
      instruction: 'Add a reason or a concern',
      maxLength: 200,
      allowMultiple: true,
      ...boardSpecFields(preset, BOARD_KEY),
      boardTitle: 'Where to?',
    };
  }, [content.framingPrompt]);

  // Seed the board once with the real attractions as ranked option cards.
  const seedBoard = useCallback(async () => {
    if (seededRef.current || !sessionId || attractions.length === 0) return;
    seededRef.current = true;
    for (const attraction of attractions) {
      const info = attraction.whatItIs ? `${attraction.name} — ${attraction.whatItIs}` : attraction.name;
      try {
        await fetch('/api/class-board/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            boardKey: BOARD_KEY,
            authorType: 'teacher',
            displayName: 'Teacher',
            content: info.slice(0, 200),
            category: 'option',
            zoneKey: 'ranking',
            visibility: 'visible',
          }),
        });
      } catch {
        // Non-fatal: the teacher can add the card by hand if a seed request fails.
      }
    }
  }, [sessionId, attractions]);

  useEffect(() => {
    if (phase === 'discuss') {
      onSetInputSpec?.(buildSpec());
      void seedBoard();
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, buildSpec, seedBoard, onSetInputSpec]);

  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const start = useCallback(() => {
    setPhase('discuss');
    onPhaseChange?.('discuss');
  }, [onPhaseChange]);

  const revealMoment = useCallback(() => {
    const winner = attractions.find((a) => a.id === winnerId) ?? attractions[0];
    if (!winner) return;
    setMoment(drawTravelMoment({ place: winner.name }));
    setPhase('moment');
    onPhaseChange?.('moment');
  }, [attractions, winnerId, onPhaseChange]);

  const finish = useCallback(() => {
    setPhase('done');
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  const winner = attractions.find((a) => a.id === winnerId) ?? null;

  // Reusable info list so the class always sees what each place is.
  const AttractionInfo = () => (
    <ul className="space-y-2">
      {attractions.map((attraction) => (
        <li key={attraction.id} className="rounded-xl border border-cyan-300/15 bg-slate-950/40 px-4 py-3">
          <p className="font-game text-base text-cyan-100">{attraction.name}</p>
          <p className="mt-0.5 text-sm text-slate-300">{attraction.whatItIs}</p>
          {attraction.whyVisit && <p className="mt-1 text-xs text-slate-400">{attraction.whyVisit}</p>}
        </li>
      ))}
    </ul>
  );

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <MapPin className="relative h-20 w-20 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Out & About</p>
          <h3 className="mt-2 text-4xl font-game text-white">Where to in {content.city}?</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{content.framingPrompt}</p>
        </div>
        <div className="w-full max-w-lg text-left">
          <AttractionInfo />
        </div>
        <button
          onClick={start}
          className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95"
        >
          OPEN BOARD
        </button>
      </div>
    );
  }

  if (phase === 'moment' && moment) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl" />
          <Sparkles className="relative h-16 w-16 text-amber-300" />
        </div>
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300/80">
            You chose {winner?.name ?? 'your spot'}
          </p>
          <h3 className="mt-3 text-3xl font-game leading-snug text-white">{moment.situation}</h3>
          <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-amber-300/20 bg-amber-500/10 px-5 py-4 text-base text-amber-100">
            {moment.speakingTask}
          </p>
        </div>
        <button
          onClick={finish}
          className="rounded-2xl bg-white/10 px-10 py-4 font-game text-lg text-white transition hover:bg-white/20"
        >
          FINISH
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <MapPin className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">Nice trip out</h3>
        <p className="max-w-md text-sm text-slate-300">
          The class visited {winner?.name ?? 'a local spot'} in {content.city}. On to the next stop.
        </p>
      </div>
    );
  }

  // phase === 'discuss'
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Out & About</p>
          <h3 className="mt-1 text-2xl font-game text-white">Where to in {content.city}?</h3>
        </div>
        <button
          onClick={revealMoment}
          disabled={attractions.length === 0}
          className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-2.5 font-game text-sm text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          WHAT HAPPENS?
        </button>
      </div>

      {sessionId ? (
        <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/45">
          <ClassBoardCanvas sessionId={sessionId} boardKey={BOARD_KEY} presetKey={PRESET_KEY} />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">Start a live session to open the board.</p>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          The options — pick where the class decided to go
        </p>
        <div className="flex flex-wrap gap-2">
          {attractions.map((attraction) => {
            const selected = attraction.id === winnerId;
            return (
              <button
                key={attraction.id}
                onClick={() => setWinnerId(attraction.id)}
                title={attraction.whatItIs}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {attraction.name}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Then hit “What happens?” — a travel moment lands on the chosen spot.
        </p>
      </div>
    </div>
  );
}
