'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Sparkles, MessageSquare } from 'lucide-react';
import { drawTravelMoment, type TravelMoment } from '@/lib/world-flight/travel-moments';
import type { InputSpec } from '@/lib/input-spec';
import type { ActivityProps, TripAttractionsContent } from '../types';

// Out & About stage of the Travel arc. The city's REAL attractions are shown as cards;
// students vote for where to go on their devices (cards auto-rank by votes), the teacher jots
// a note on each as the class talks, then a clearly-framed travel moment lands on the pick.

type Phase = 'idle' | 'discuss' | 'moment' | 'done';

export function TripAttractionsActivity({
  generatedContent,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onPhaseChange,
}: ActivityProps) {
  const content = generatedContent as TripAttractionsContent;
  const attractions = useMemo(() => content.attractions ?? [], [content.attractions]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [votes, setVotes] = useState<Record<string, string>>({});   // clientId -> attraction name
  const [notes, setNotes] = useState<Record<string, string>>({});   // attractionId -> teacher note
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [moment, setMoment] = useState<TravelMoment | null>(null);
  const scoredRef = useRef<Set<string>>(new Set());

  const buildSpec = useCallback((): InputSpec => ({
    type: 'choice',
    gameKey: 'trip-attractions',
    prompt: `Where should the class go in ${content.city}?`,
    options: attractions.map((a) => a.name),
  }), [content.city, attractions]);

  useEffect(() => {
    if (phase === 'discuss') {
      onSetInputSpec?.(buildSpec());
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
    } else {
      onSetInputSpec?.(null);
      onRegisterRemoteVoteHandler?.(null);
    }
    return () => { onRegisterRemoteVoteHandler?.(null); };
  }, [phase, buildSpec, onSetInputSpec, onRegisterRemoteVoteHandler, onScore]);

  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const countFor = useCallback((name: string) => Object.values(votes).filter((v) => v === name).length, [votes]);
  const ranked = useMemo(
    () => [...attractions].sort((a, b) => countFor(b.name) - countFor(a.name)),
    [attractions, countFor],
  );
  const winner = attractions.find((a) => a.id === winnerId) ?? ranked[0] ?? null;

  const start = () => { setPhase('discuss'); onPhaseChange?.('discuss'); };
  const reveal = () => {
    if (!winner) return;
    setMoment(drawTravelMoment({ place: winner.name, localColor: content.localColor }));
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
        </div>
        <ul className="w-full max-w-lg space-y-2 text-left">
          {attractions.map((a) => (
            <li key={a.id} className="rounded-xl border border-cyan-300/15 bg-slate-950/40 px-4 py-3">
              <p className="font-game text-base text-cyan-100">{a.name}</p>
              <p className="mt-0.5 text-sm text-slate-300">{a.whatItIs}</p>
              {a.whyVisit && <p className="mt-1 text-xs text-slate-400">{a.whyVisit}</p>}
            </li>
          ))}
        </ul>
        <button onClick={start} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">START</button>
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
            Talk this through together as a class — then finish the stop.
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

  // phase === 'discuss'
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Out &amp; About</p>
          <h3 className="mt-1 text-2xl font-game text-white">Where should the class go?</h3>
        </div>
        <button onClick={reveal} disabled={!winner} className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-2.5 font-game text-sm text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100">
          WHAT HAPPENS?
        </button>
      </div>
      <p className="text-sm text-slate-400">Students vote on their device. Discuss each place out loud and jot a note — the top pick gets the ✓. Cards reorder by votes.</p>

      <ol className="space-y-2">
        {ranked.map((a, i) => {
          const selected = a.id === (winner?.id ?? null);
          return (
            <li key={a.id} className={`rounded-xl border px-4 py-3 transition ${selected ? 'border-cyan-300/60 bg-cyan-500/[0.08]' : 'border-white/10 bg-slate-950/40'}`}>
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => setWinnerId(a.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected ? 'bg-cyan-400/30 text-cyan-100' : 'bg-white/10 text-slate-300'}`}>{i + 1}</span>
                    <span className="truncate font-game text-base text-cyan-100">{a.name}</span>
                    {selected && <span className="shrink-0 text-cyan-300">✓</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{a.whatItIs}</p>
                </button>
                <span className="shrink-0 rounded-full bg-cyan-400/15 px-2.5 py-1 text-sm font-bold text-cyan-200" title="votes">{countFor(a.name)}</span>
              </div>
              <label className="mt-2 flex items-start gap-2">
                <MessageSquare className="mt-1.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                <input
                  value={notes[a.id] ?? ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
                  placeholder="Add a note or reason…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                />
              </label>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
