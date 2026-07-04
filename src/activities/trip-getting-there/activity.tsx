'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TramFront, Clock, Wallet } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import type { ActivityProps, TripTransportContent } from '../types';

// Getting There stage of the Travel arc. Shows the city's REAL ways in from the airport
// (with time + cost), students weigh them and pick one on their device, then the class does a
// buy-a-ticket / direct-the-driver roleplay.

const TRAVELLER_PHRASES = [
  'A ticket to the city centre, please.',
  'How much is it?',
  'Which platform / stop is it?',
  'Does this go to ___?',
  'Can you take me to ___, please?',
];
const STAFF_PHRASES = [
  'Single or return?',
  "That's ___, please.",
  "It's over there, platform 2.",
  'Hop in — where to?',
  'That will be about ___ minutes.',
];

type Phase = 'idle' | 'choose' | 'roleplay' | 'done';

function PhraseCard({ title, phrases }: { title: string; phrases: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <ul className="space-y-1.5">
        {phrases.map((phrase) => (
          <li key={phrase} className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200">{phrase}</li>
        ))}
      </ul>
    </div>
  );
}

export function TripGettingThereActivity({
  generatedContent,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onPhaseChange,
}: ActivityProps) {
  const content = generatedContent as TripTransportContent;
  const options = useMemo(() => content.options ?? [], [content.options]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [picks, setPicks] = useState<Record<string, string>>({}); // clientId -> mode
  const scoredRef = useRef<Set<string>>(new Set());

  const buildSpec = useCallback((): InputSpec => ({
    type: 'choice',
    gameKey: 'trip-getting-there',
    prompt: `How will you get into ${content.city}?`,
    options: options.map((o) => o.mode),
  }), [content.city, options]);

  useEffect(() => {
    if (phase === 'choose') {
      onSetInputSpec?.(buildSpec());
      onRegisterRemoteVoteHandler?.((vote) => {
        setPicks((prev) => ({ ...prev, [vote.clientId]: vote.choice }));
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

  const countFor = useCallback((mode: string) => Object.values(picks).filter((p) => p === mode).length, [picks]);
  const chosen = useMemo(() => Array.from(new Set(Object.values(picks))), [picks]);

  const start = () => { setPhase('choose'); onPhaseChange?.('choose'); };
  const toRoleplay = () => { setPhase('roleplay'); onPhaseChange?.('roleplay'); };
  const finish = () => { setPhase('done'); onPhaseChange?.('finished'); };

  const OptionList = ({ showCounts }: { showCounts?: boolean }) => (
    <ul className="space-y-2">
      {options.map((option) => (
        <li key={option.id} className="flex items-start justify-between gap-3 rounded-xl border border-cyan-300/15 bg-slate-950/40 px-4 py-3">
          <div className="min-w-0">
            <p className="font-game text-base text-cyan-100">{option.mode}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              {option.approxTimeMin != null && (
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{option.approxTimeMin} min</span>
              )}
              {option.approxCost && (
                <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" aria-hidden />{option.approxCost}</span>
              )}
            </div>
            {option.note && <p className="mt-1 text-sm text-slate-300">{option.note}</p>}
          </div>
          {showCounts && countFor(option.mode) > 0 && (
            <span className="shrink-0 rounded-full bg-cyan-400/15 px-2.5 py-1 text-sm font-bold text-cyan-200">{countFor(option.mode)}</span>
          )}
        </li>
      ))}
    </ul>
  );

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <TramFront className="relative h-20 w-20 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Getting There</p>
          <h3 className="mt-2 text-4xl font-game text-white">Into {content.city}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{content.framingPrompt}</p>
        </div>
        <div className="w-full max-w-lg text-left"><OptionList /></div>
        <button onClick={start} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">SEE THE OPTIONS</button>
      </div>
    );
  }

  if (phase === 'roleplay') {
    return (
      <div className="space-y-5 py-2">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Buy your way in</p>
          <h3 className="mt-1 text-2xl font-game text-white">Traveller &amp; staff / driver</h3>
        </div>
        {chosen.length > 0 && (
          <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">The class is taking</p>
            <div className="flex flex-wrap gap-2">
              {chosen.map((mode) => (
                <span key={mode} className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-sm font-semibold text-cyan-100">{mode}</span>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <PhraseCard title="Traveller" phrases={TRAVELLER_PHRASES} />
          <PhraseCard title="Staff / Driver" phrases={STAFF_PHRASES} />
        </div>
        <div className="text-center">
          <button onClick={finish} className="rounded-2xl bg-white/10 px-10 py-4 font-game text-lg text-white transition hover:bg-white/20">FINISH</button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <TramFront className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">On your way</h3>
        <p className="max-w-md text-sm text-slate-300">The class is heading into {content.city}. Next stop: the hotel.</p>
      </div>
    );
  }

  // phase === 'choose'
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Getting There</p>
          <h3 className="mt-1 text-2xl font-game text-white">Pick your way into {content.city}</h3>
        </div>
        <button onClick={toRoleplay} className="rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 px-5 py-2.5 font-game text-sm text-white shadow-lg transition hover:scale-105 active:scale-95">BUY TICKETS</button>
      </div>
      <p className="text-sm text-slate-400">Students weigh time vs cost and pick on their device — these are the real ways in from {content.airport}.</p>
      <OptionList showCounts />
    </div>
  );
}
