'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { ClassBoardCanvas } from '@/components/session/class-board-canvas';
import { boardSpecFields, getClassBoardPreset, type ClassBoardZone } from '@/lib/class-board';
import { drawTravelMoment, type TravelMoment } from '@/lib/world-flight/travel-moments';
import { useSessionStore } from '@/stores/session-store';
import type { InputSpec } from '@/lib/input-spec';
import type { ActivityProps, TripAttractionsContent } from '../types';

// Out & About stage of the Travel arc, built on the CLASS BOARD as designed:
//  - one board column per REAL attraction (name + what it is as the column header)
//  - students add reasons / concerns / questions under each place FROM THEIR DEVICES
//  - students upvote each other's notes; the teacher inline-adds while the class talks
//  - the class discusses aloud, the teacher marks the winning place
//  - then a travel moment lands on the pick — a framed class speaking moment

const BOARD_KEY = 'trip-attractions';
const PRESET_KEY = 'trip-attractions';

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
  const addTripLogEntry = useSessionStore((s) => s.addTripLogEntry);

  // One board zone per attraction — notes attach to the place they're about.
  const attractionZones = useMemo<ClassBoardZone[]>(
    () => attractions.map((a) => ({ key: a.id, label: a.name, description: a.whatItIs })),
    [attractions],
  );

  const buildSpec = useCallback((): InputSpec => {
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

  useEffect(() => {
    if (phase === 'discuss') {
      onSetInputSpec?.(buildSpec());
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, buildSpec, onSetInputSpec]);

  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const winner = attractions.find((a) => a.id === winnerId) ?? null;

  const start = () => { setPhase('discuss'); onPhaseChange?.('discuss'); };
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
            Each place gets its own column. Students add reasons and concerns from their devices and upvote — you can add notes too while the class talks.
          </p>
        </div>
        <ul className="w-full max-w-lg space-y-2 text-left">
          {attractions.map((a) => (
            <li key={a.id} className="flex items-start gap-3 rounded-xl border border-cyan-300/15 bg-slate-950/40 px-4 py-3">
              {a.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={a.imageUrl} alt={a.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
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

  // phase === 'discuss' — the live board
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Out &amp; About</p>
          <h3 className="mt-1 text-2xl font-game text-white">Where should the class go?</h3>
        </div>
        <button
          onClick={reveal}
          disabled={attractions.length === 0}
          className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-2.5 font-game text-sm text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          WHAT HAPPENS?
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          The class picked — tap the winning place, then hit “What happens?”
        </p>
        <div className="flex flex-wrap gap-2">
          {attractions.map((a) => {
            const selected = a.id === winnerId;
            return (
              <button
                key={a.id}
                onClick={() => setWinnerId(a.id)}
                title={a.whatItIs}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {selected ? '✓ ' : ''}{a.name}
              </button>
            );
          })}
        </div>
      </div>

      {sessionId ? (
        <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/45">
          <ClassBoardCanvas
            sessionId={sessionId}
            boardKey={BOARD_KEY}
            presetKey={PRESET_KEY}
            zonesOverride={attractionZones}
            sortByVotes
          />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">Start a live session to open the board.</p>
      )}
    </div>
  );
}
