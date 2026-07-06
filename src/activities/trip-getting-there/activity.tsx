'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TramFront, Clock, Wallet, UserRound } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import type { ActivityProps, TripTransportContent, TripTransportOption } from '../types';
import { PerformedExchange, scriptTierFor, type ExchangeLine } from '../shared/performed-exchange';
import { useTripScript } from '../shared/use-trip-script';
import { applyTripTokens, transportKind } from '@/lib/trip-script';

// Getting There stage of the Travel arc. Two halves:
//  1. CHOOSE — the city's REAL ways in from the airport (mode + time + cost); students weigh
//     them and pick on their device.
//  2. RIDE — a line-by-line performed exchange at the ticket desk / taxi rank. Each traveller
//     takes a turn buying their way in, with THEIR chosen option woven into the script.

const STAFF_PHRASES: Record<'ticketed' | 'hailed', string[]> = {
  ticketed: [
    'Where are you heading?',
    'Single or return?',
    "That's ___, please.",
    'About ___ minutes.',
    'Right over there — follow the signs.',
  ],
  hailed: [
    'Where to?',
    'Whereabouts are you headed?',
    "It's about ___.",
    'About ___ minutes.',
    "Hop in — I'll take you there.",
  ],
};
const TRAVELLER_PHRASES: Record<'ticketed' | 'hailed', string[]> = {
  ticketed: [
    "I'd like to take the ___, please.",
    'How much is it?',
    'How long does it take?',
    'Where do I go?',
    'Thanks a lot!',
  ],
  hailed: [
    "I'll take the ___, please.",
    'To ___, please.',
    'How much will it be?',
    'How long does it take?',
    'Thanks a lot!',
  ],
};

type Phase = 'idle' | 'choose' | 'roleplay' | 'done';

export function TripGettingThereActivity({
  students,
  generatedContent,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onPhaseChange,
}: ActivityProps) {
  const content = generatedContent as TripTransportContent;
  const options = useMemo(() => content.options ?? [], [content.options]);
  const addTripLogEntry = useSessionStore((s) => s.addTripLogEntry);
  const tier = scriptTierFor(sessionSettings.difficulty);

  const [phase, setPhase] = useState<Phase>('idle');
  const [picks, setPicks] = useState<Record<string, string>>({}); // displayName -> mode
  const scoredRef = useRef<Set<string>>(new Set());

  const countFor = useCallback((mode: string) => Object.values(picks).filter((p) => p === mode).length, [picks]);
  const classPick = useMemo<TripTransportOption | null>(() => {
    if (options.length === 0) return null;
    const ranked = [...options].sort((a, b) => countFor(b.mode) - countFor(a.mode));
    return ranked[0] ?? null;
  }, [options, countFor]);
  // The shared scene family follows the class's majority choice: a ticket desk (ticketed) reads
  // nothing like a taxi rank (hailed), so we pick the skeleton — not just the {mode} noun — by kind.
  const pickKind = useMemo(() => transportKind(classPick?.mode), [classPick]);

  // AI-varied lines (grounded on the city + transport kind); locked when the roleplay begins so it
  // can't swap mid-scene. Per-traveller {mode}/{cost}/{time} are substituted at scriptFor time.
  const aiLines = useTripScript(useMemo(
    () => ({ stop: 'getting-there' as const, city: content.city, difficulty: sessionSettings.difficulty, tier, anchors: { airport: content.airport }, kind: pickKind }),
    [content.city, content.airport, sessionSettings.difficulty, tier, pickKind],
  ));
  const [lockedLines, setLockedLines] = useState<ExchangeLine[] | null>(null);

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
        setPicks((prev) => ({ ...prev, [vote.displayName]: vote.choice }));
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
    if (phase !== 'roleplay') onSetInputSpec?.(null);
    onRegisterRemoteVoteHandler?.(null);
    return undefined;
  }, [phase, buildSpec, onSetInputSpec, onRegisterRemoteVoteHandler, onScore]);

  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const optionFor = useCallback((traveller: Student | null): TripTransportOption | null => {
    if (traveller) {
      const picked = picks[traveller.name];
      const match = options.find((o) => o.mode === picked);
      if (match) return match;
    }
    return classPick;
  }, [picks, options, classPick]);

  const scriptFor = useCallback((traveller: Student | null): ExchangeLine[] => {
    const option = optionFor(traveller);
    const mode = option?.mode ?? '___';
    const cost = option?.approxCost ?? '___';
    const time = option?.approxTimeMin != null ? String(option.approxTimeMin) : '___';
    if (lockedLines) return applyTripTokens(lockedLines, { city: content.city, mode, cost, time, traveller: traveller?.name ?? 'the traveller' });

    // A taxi rank speaks nothing like a ticket desk — no ticket, no "single or return". Branch the
    // deterministic fallback on THIS traveller's own choice so a mixed class still reads right.
    const hailed = transportKind(option?.mode) === 'hailed';

    if (tier === 'basic') {
      return hailed
        ? [
            { speaker: 'service', text: 'Hello! Where are you going?' },
            { speaker: 'traveller', text: `Into the city, please — by ${mode}.` },
            { speaker: 'service', text: `Sure, hop in. It's about ${cost}.` },
            { speaker: 'traveller', text: 'Okay. Thank you!' },
            { speaker: 'service', text: `We'll be there in about ${time} minutes.` },
            { speaker: 'traveller', text: 'Thanks!' },
          ]
        : [
            { speaker: 'service', text: 'Hello! Where are you going?' },
            { speaker: 'traveller', text: `To the city, please. The ${mode}, please.` },
            { speaker: 'service', text: `That's ${cost}.` },
            { speaker: 'traveller', text: 'Here you are. Thank you!' },
            { speaker: 'service', text: 'The next one leaves soon — right over there!' },
            { speaker: 'traveller', text: 'Thanks!' },
          ];
    }

    const standard: ExchangeLine[] = hailed
      ? [
          { speaker: 'service', text: 'Hi there — where to?' },
          { speaker: 'traveller', text: `Into ${content.city}, please. I'll take the ${mode}.` },
          { speaker: 'service', text: 'Sure. Whereabouts are you headed?' },
          { speaker: 'traveller', text: '___, please. How much will it be?', hint: 'your hotel, an address, the centre…' },
          { speaker: 'service', text: `It's about ${cost}.` },
          { speaker: 'traveller', text: 'And how long does it take?' },
          { speaker: 'service', text: `About ${time} minutes.` },
        ]
      : [
          { speaker: 'service', text: 'Hi there — where are you heading?' },
          { speaker: 'traveller', text: `Into ${content.city}, please. I'd like to take the ${mode}.` },
          { speaker: 'service', text: 'No problem. Single or return?' },
          { speaker: 'traveller', text: '___, please. How much is it?', hint: 'single or return?' },
          { speaker: 'service', text: `That's ${cost}.` },
          { speaker: 'traveller', text: 'And how long does it take?' },
          { speaker: 'service', text: `About ${time} minutes.` },
        ];

    const closing: ExchangeLine[] = hailed
      ? [
          { speaker: 'traveller', text: 'Great. Shall we go?' },
          { speaker: 'service', text: 'Hop in — I\'ll take you there.', hint: 'wave them in' },
          { speaker: 'traveller', text: 'Thanks a lot!' },
        ]
      : [
          { speaker: 'traveller', text: 'Great. Where do I go?' },
          { speaker: 'service', text: 'Right over there — follow the signs.', hint: 'point them the way' },
          { speaker: 'traveller', text: 'Thanks a lot!' },
        ];

    if (tier === 'standard') return [...standard, ...closing];

    // advanced — a small complication to negotiate before the closing.
    const complication: ExchangeLine[] = hailed
      ? [
          { speaker: 'service', text: 'One thing — the traffic is heavy right now, so it may take a bit longer.' },
          { speaker: 'traveller', text: 'Oh no. Is there a quicker route to ___?', hint: 'say where you\'re headed — your hotel, the centre…' },
          { speaker: 'service', text: 'I can try the back roads, but the fare might be a little higher.' },
          { speaker: 'traveller', text: '___', hint: 'decide — take it or not, and say why' },
        ]
      : [
          { speaker: 'service', text: 'One thing — there are delays today, so it might take a bit longer.' },
          { speaker: 'traveller', text: 'Oh no. Is there a faster way to get to ___?', hint: 'say where you\'re headed — your hotel, the centre…' },
          { speaker: 'service', text: 'You could take a taxi, but it costs quite a bit more.' },
          { speaker: 'traveller', text: '___', hint: 'decide — stick with your choice or switch, and say why' },
        ];
    return [...standard, ...complication, ...closing];
  }, [optionFor, content.city, tier, lockedLines]);

  const start = () => { setPhase('choose'); onPhaseChange?.('choose'); };
  const toRoleplay = () => {
    if (classPick) {
      addTripLogEntry({ stageId: 'getting-there', text: `Took the ${classPick.mode} into ${content.city}`, vocab: [classPick.mode] });
    }
    setLockedLines(aiLines);
    setPhase('roleplay');
    onPhaseChange?.('roleplay');
  };
  const finish = useCallback(() => { setPhase('done'); onPhaseChange?.('finished'); }, [onPhaseChange]);

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
      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Getting There · Ticket desk</p>
          <h3 className="mt-1 text-2xl font-game text-white">Buy your way into {content.city}</h3>
        </div>
        <PerformedExchange
          students={students}
          gameKey="trip-getting-there"
          context={`At ${content.airport} — buy a ticket (or grab a taxi) for the way you chose into ${content.city}.`}
          serviceRole="Staff / Driver"
          travellerRole="Traveller"
          serviceHint="Sells the ticket / drives."
          travellerHint="Buys their chosen way in."
          ServiceIcon={UserRound}
          accent="cyan"
          scriptFor={scriptFor}
          servicePhrases={STAFF_PHRASES[pickKind]}
          travellerPhrases={TRAVELLER_PHRASES[pickKind]}
          onSetInputSpec={onSetInputSpec}
          onScore={onScore}
          onFinished={finish}
        />
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <TramFront className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">On your way</h3>
        <p className="max-w-md text-sm text-slate-300">The class is heading into {content.city}. Next stop: the city itself.</p>
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
      <p className="text-sm text-slate-400">Students weigh time vs cost and pick on their device — these are the real ways in from {content.airport}. Then each traveller buys their ticket, line by line.</p>
      <OptionList showCounts />
    </div>
  );
}
