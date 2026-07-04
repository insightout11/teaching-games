'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlaneLanding, ShieldCheck, Users, RefreshCw } from 'lucide-react';
import type { ActivityProps, TripArrivalContent } from '../types';

// Arrival stage of the Travel arc. A reliable, deterministic immigration scene (no flaky AI):
// one immigration officer + however many travellers are actually in the class. Roles are
// assigned to real students at runtime, so it always adapts to class size.

function exchangeFor(city: string): Array<{ officer: string; traveller: string }> {
  return [
    { officer: `Welcome to ${city}. Passport, please.`, traveller: 'Here you are.' },
    { officer: "What's the purpose of your visit?", traveller: "I'm here on holiday. / I'm here for work." },
    { officer: 'How long are you staying?', traveller: 'For ___ days.' },
    { officer: 'Where are you staying?', traveller: 'At the ___ Hotel. / With friends.' },
    { officer: `Enjoy your stay in ${city}!`, traveller: 'Thank you very much.' },
  ];
}

type Phase = 'idle' | 'running' | 'done';

export function TripArrivalActivity({ students, generatedContent, onSetInputSpec, onPhaseChange }: ActivityProps) {
  const content = generatedContent as TripArrivalContent;
  const [phase, setPhase] = useState<Phase>('idle');
  const [officerIdx, setOfficerIdx] = useState(0);

  // Device-free stage — make sure students aren't left on a previous stage's input.
  useEffect(() => { onSetInputSpec?.(null); }, [onSetInputSpec]);

  const exchange = useMemo(() => exchangeFor(content.city), [content.city]);

  // One officer + the rest travellers. With <2 students the teacher plays the officer.
  const officer = students.length >= 2 ? students[officerIdx % students.length] : null;
  const travellers = officer ? students.filter((s) => s.id !== officer.id) : students;

  const start = () => { setPhase('running'); onPhaseChange?.('running'); };
  const finish = () => { setPhase('done'); onPhaseChange?.('finished'); };
  const swapOfficer = useCallback(
    () => setOfficerIdx((i) => (i + 1) % Math.max(students.length, 1)),
    [students.length],
  );

  const officerName = officer ? officer.name : 'The teacher (you)';
  const travellerNames = travellers.length > 0 ? travellers.map((s) => s.name).join(', ') : 'the class';

  const RoleBanner = () => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/[0.07] px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />Immigration officer</p>
        <p className="mt-1 font-game text-lg text-cyan-100">{officerName}</p>
        <p className="mt-0.5 text-xs text-slate-400">Asks the questions.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"><Users className="h-3.5 w-3.5" aria-hidden />Travellers</p>
        <p className="mt-1 font-game text-lg text-white">{travellerNames}</p>
        <p className="mt-0.5 text-xs text-slate-400">Each one goes through the questions.</p>
      </div>
    </div>
  );

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <PlaneLanding className="relative h-20 w-20 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Arrival</p>
          <h3 className="mt-2 text-4xl font-game text-white">Immigration at {content.city}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{content.framingPrompt}</p>
        </div>
        <div className="w-full max-w-xl"><RoleBanner /></div>
        <button onClick={start} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">START THE SCENE</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <PlaneLanding className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">Through the border</h3>
        <p className="max-w-md text-sm text-slate-300">Welcome to {content.city}. Next: getting into the city.</p>
      </div>
    );
  }

  // phase === 'running'
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Arrival · Immigration</p>
          <h3 className="mt-1 text-2xl font-game text-white">Passport control, {content.city}</h3>
        </div>
        {students.length >= 2 && (
          <button onClick={swapOfficer} className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 font-game text-sm text-white transition hover:bg-white/20">
            <RefreshCw className="h-4 w-4" aria-hidden />Swap officer
          </button>
        )}
      </div>

      <RoleBanner />

      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">The exchange — each traveller takes a turn</p>
        <ol className="space-y-3">
          {exchange.map((line, i) => (
            <li key={i} className="grid gap-1.5 sm:grid-cols-2">
              <p className="rounded-lg bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100"><span className="font-semibold text-cyan-300/80">Officer:</span> {line.officer}</p>
              <p className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-slate-200"><span className="font-semibold text-slate-400">Traveller:</span> {line.traveller}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="text-center">
        <button onClick={finish} className="rounded-2xl bg-white/10 px-10 py-4 font-game text-lg text-white transition hover:bg-white/20">FINISH</button>
      </div>
    </div>
  );
}
