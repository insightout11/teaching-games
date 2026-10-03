'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon, Check, Vote, ArrowRight } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { ActivityProps } from '../types';
import { TRIP_STOP_CHOICES, TRIP_STOPS_TO_KEEP, picksPerPhone, winningStops } from '@/lib/world-flight/trip-stops';

// Plan the Day (Travel v2): the teacher shortlists the stops, the class votes on their phones,
// and the 3 most voted stay in the trip (the hook drops the rest from the plan). Votes are a
// class decision, so the live tally is fine on the shared screen.

type Phase = 'shortlist' | 'vote' | 'done';

export function TripPlanActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange }: ActivityProps) {
  const city = (generatedContent as { city?: string } | null)?.city || 'the city';
  const setTripStops = useSessionStore((s) => s.setTripStops);
  const [phase, setPhase] = useState<Phase>('shortlist');
  const [shortlist, setShortlist] = useState<string[]>(TRIP_STOP_CHOICES.map((c) => c.stageId));
  const [votes, setVotes] = useState<Record<string, string[]>>({});
  const [chosen, setChosen] = useState<string[]>([]);
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const votedRef = useRef<Set<string>>(new Set());

  const labelOf = (id: string) => TRIP_STOP_CHOICES.find((c) => c.stageId === id)?.label ?? id;
  const picks = picksPerPhone(shortlist.length);
  const tally = useMemo(() => {
    const t: Record<string, number> = {};
    Object.keys(votes).forEach((v) => votes[v].forEach((id) => { t[id] = (t[id] ?? 0) + 1; }));
    return t;
  }, [votes]);
  const leading = useMemo(() => winningStops(shortlist, votes), [shortlist, votes]);

  useEffect(() => {
    if (phase !== 'vote') { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({
      type: 'multi-select',
      gameKey: 'trip-plan',
      prompt: picks === 2 ? `Pick your 2 favourite stops in ${city}` : `Pick your favourite stop in ${city}`,
      options: shortlist.map(labelOf),
      selectCount: picks,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labelOf is a pure lookup
  }, [phase, shortlist, picks, city, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'vote') return;
      let labels: string[] = [];
      try { labels = JSON.parse(vote.choice) as string[]; } catch { labels = [vote.choice]; }
      const ids = labels.map((l) => TRIP_STOP_CHOICES.find((c) => c.label === l)?.stageId).filter((x): x is string => !!x);
      setVotes((prev) => ({ ...prev, [vote.clientId]: ids }));
      if (!votedRef.current.has(vote.clientId)) {
        votedRef.current.add(vote.clientId);
        void onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: 1, points: 1, isCorrect: null });
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, onScore]);

  const toggle = (id: string) => setShortlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : TRIP_STOP_CHOICES.map((c) => c.stageId).filter((x) => x === id || prev.includes(x))));

  const lockIn = useCallback((stops: string[]) => {
    setChosen(stops);
    setTripStops(stops);
    setPhase('done');
    onPhaseChange?.('finished');
  }, [setTripStops, onPhaseChange]);

  const openVote = () => {
    if (shortlist.length <= TRIP_STOPS_TO_KEEP) { lockIn(shortlist); return; }
    setPhase('vote');
    onPhaseChange?.('vote');
  };

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 py-6 text-center">
        <MapIcon className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">Today in {city}</h3>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {chosen.map((id, i) => (
            <span key={id} className="inline-flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-4 w-4 text-slate-500" aria-hidden />}
              <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 font-semibold text-cyan-50">{labelOf(id)}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  const voters = Object.keys(votes).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Plan the Day · {city}</p>
        {phase === 'vote' && <span className="text-sm text-slate-400">{voters} voted</span>}
      </div>
      <div className="rounded-2xl border-2 border-cyan-500/30 bg-cyan-500/[0.08] p-5 text-center">
        <h3 className="text-2xl font-game text-white">{phase === 'shortlist' ? 'Where shall we go today?' : 'Vote on your phone'}</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-300">
          {phase === 'shortlist'
            ? `We have time for ${TRIP_STOPS_TO_KEEP} stops. Shortlist the ones you want to offer, then open the vote.`
            : `Talk about it first: which stops do you want, and why? Then pick ${picks === 2 ? 'your 2 favourites' : 'your favourite'}. The top ${TRIP_STOPS_TO_KEEP} stay in the trip.`}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TRIP_STOP_CHOICES.filter((c) => phase === 'shortlist' || shortlist.includes(c.stageId)).map((c) => {
          const on = shortlist.includes(c.stageId);
          const lead = phase === 'vote' && leading.includes(c.stageId) && voters > 0;
          return (
            <button key={c.stageId} type="button" disabled={phase !== 'shortlist'} onClick={() => toggle(c.stageId)}
              className={`rounded-xl border px-4 py-3 text-left transition ${lead ? 'border-emerald-400/50 bg-emerald-500/10' : on ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-white/[0.02] opacity-50'}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">{c.label}</span>
                {phase === 'shortlist'
                  ? on && <Check className="h-4 w-4 text-cyan-300" aria-hidden />
                  : <span className="text-sm font-semibold text-slate-200">{tally[c.stageId] ?? 0}</span>}
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">{c.blurb}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2">
        {phase === 'shortlist' ? (
          <button onClick={openVote} disabled={shortlist.length < TRIP_STOPS_TO_KEEP}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02] disabled:opacity-40">
            <Vote className="h-4 w-4" aria-hidden />{shortlist.length <= TRIP_STOPS_TO_KEEP ? 'GO WITH THESE' : 'OPEN THE VOTE'}
          </button>
        ) : (
          <button onClick={() => lockIn(leading)}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">
            LOCK IN: {leading.map(labelOf).join(' · ')}
          </button>
        )}
      </div>
    </div>
  );
}
