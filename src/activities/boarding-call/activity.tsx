'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PlaneTakeoff, Luggage, Check, User } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import { dealTravellerCards, type TravellerCard } from '@/lib/world-flight/traveller-cards';
import { TRIP_CAN_DOS, countTicks } from '@/lib/world-flight/trip-can-do';
import type { ActivityProps, BoardingCallContent } from '../types';

// Boarding Call — the Travel takeoff. The whole class flies together from a shared origin, so the
// three prompts are about the DESTINATION ahead. Spoken-first: students answer each prompt ALOUD;
// their devices only show the prompt (with a packing hint) and a "Ready" tap that registers
// participation. No answers are typed, stored, or fed anywhere — reflection stays oral.

// Travel v2: boarding opens with Traveller Cards. Each phone gets a persona + budget tier + food
// need + a want; students introduce themselves aloud as it. Cards are stored for the later stops.
// Then the can-do check (the trip's BEFORE): phones tick what they could do in the city today.
type Phase = 'idle' | 'cards' | 'cando' | 'prompting' | 'done';

const FALLBACK_PROMPTS = [
  'What are you packing for the trip?',
  'What are you most excited to see?',
  'What’s one worry about the trip?',
];

export function BoardingCallActivity({
  generatedContent,
  students,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as BoardingCallContent;
  const prompts = content.prompts?.length ? content.prompts : FALLBACK_PROMPTS;
  const city = content.city || 'your destination';

  const setTravellers = useSessionStore((st) => st.setTravellers);
  const [cards] = useState<Record<string, TravellerCard>>(() => dealTravellerCards(students, `${city}:${students.map((x) => x.id).join(',')}`));
  const [introduced, setIntroduced] = useState<string[]>([]);
  const recordCanDo = useSessionStore((st) => st.recordCanDo);
  const before = useSessionStore((st) => st.lessonThread.canDo?.before);
  const beforeCounts = countTicks(before ?? {});
  useEffect(() => { setTravellers(cards); }, [cards, setTravellers]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [index, setIndex] = useState(0);
  const [readyByPrompt, setReadyByPrompt] = useState<Record<number, string[]>>({});

  const phaseRef = useRef(phase); phaseRef.current = phase;
  const indexRef = useRef(index); indexRef.current = index;
  const scoredRef = useRef<Set<string>>(new Set());

  const buttonLabel = index === 0 ? 'I’m packed' : 'I’m ready';

  // Device scaffolding — spoken-first: the prompt + (on prompt 1) the packing hint, plus a tap.
  useEffect(() => {
    if (phase === 'cards') {
      const per: Record<string, unknown> = { __room: true };
      students.forEach((st) => { per[st.id] = cards[st.id]; per[st.name] = cards[st.id]; });
      onSetInputSpec?.({ type: 'confirm', gameKey: 'boarding-call', prompt: `Your Traveller Card for ${city}`, perStudentData: per, stableInput: true });
      return;
    }
    if (phase === 'cando') {
      onSetInputSpec?.({ type: 'confirm', gameKey: 'boarding-call', prompt: `Could you do this in ${city} today?`, instruction: 'Tick the ones you could do now. It’s fine to tick none: that’s what the trip is for.', perStudentData: { __cando: TRIP_CAN_DOS.map((c) => ({ id: c.id, text: c.text })) }, stableInput: true });
      return;
    }
    if (phase !== 'prompting') { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'boarding-call',
      prompt: prompts[index],
      ...(index === 0 && content.packingHint ? { instruction: content.packingHint } : {}),
      buttonLabel,
    });
  }, [phase, index, prompts, content.packingHint, buttonLabel, onSetInputSpec, students, cards, city]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  // A tap registers participation (once per student per prompt) — the answer itself is spoken.
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current === 'cards') {
        setIntroduced((prev) => (prev.includes(vote.displayName) ? prev : [...prev, vote.displayName]));
        return;
      }
      if (phaseRef.current === 'cando') {
        try { recordCanDo('before', vote.clientId, JSON.parse(vote.choice) as string[]); } catch { /* not a can-do list */ }
        return;
      }
      if (phaseRef.current !== 'prompting') return;
      const idx = indexRef.current;
      const key = `${idx}:${vote.clientId}`;
      if (scoredRef.current.has(key)) return;
      scoredRef.current.add(key);
      setReadyByPrompt((prev) => ({ ...prev, [idx]: [...(prev[idx] ?? []), vote.displayName] }));
      void onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: idx + 1, points: 1, isCorrect: null });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, onScore, recordCanDo]);

  const start = useCallback(() => {
    if (students.length) { setPhase('cards'); onPhaseChange?.('cards'); return; }
    setIndex(0);
    setPhase('prompting');
    onPhaseChange?.('prompting');
  }, [onPhaseChange, students.length]);

  const toPrompts = useCallback(() => {
    setIndex(0);
    setPhase('prompting');
    onPhaseChange?.('prompting');
  }, [onPhaseChange]);

  const next = useCallback(() => {
    if (index >= prompts.length - 1) {
      onSetInputSpec?.(null);
      setPhase('done');
      onPhaseChange?.('finished');
      return;
    }
    setIndex((i) => i + 1);
  }, [index, prompts.length, onSetInputSpec, onPhaseChange]);

  const readyNames = readyByPrompt[index] ?? [];

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <PlaneTakeoff className="relative h-20 w-20 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Boarding Call</p>
          <h3 className="mt-2 text-4xl font-game text-white">Next stop: {city}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            You’re all flying to {city} together. Three quick questions before takeoff — answer each one out loud, then tap when you’re ready.
          </p>
        </div>
        <button onClick={start} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">BEGIN BOARDING</button>
      </div>
    );
  }

  if (phase === 'cards') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Boarding Call · Traveller Cards</p>
          <span className="text-sm text-slate-400">{introduced.length} of {students.length} introduced</span>
        </div>
        <div className="rounded-2xl border-2 border-cyan-500/30 bg-cyan-500/[0.08] p-6 text-center">
          <h3 className="text-2xl font-game text-white">Who are you on this trip?</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-300">Check your phone for your Traveller Card. Say who you are, your budget, and what you want to do in {city}.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {students.map((st) => {
            const done = introduced.includes(st.name);
            return (
              <div key={st.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${done ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-50' : 'border-white/10 bg-white/[0.03] text-slate-300'}`}>
                {done ? <Check className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden /> : <User className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />}
                <span className="font-semibold">{st.name}</span>
                {done && cards[st.id] && <span className="truncate text-emerald-100/80">· {cards[st.id].persona} · {cards[st.id].budget}</span>}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <button onClick={() => { setPhase('cando'); onPhaseChange?.('cando'); }} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">CAN-DO CHECK</button>
        </div>
      </div>
    );
  }

  if (phase === 'cando') {
    const answered = Object.keys(before ?? {}).length;
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Boarding Call · Before the trip</p>
          <span className="text-sm text-slate-400">{answered} answered</span>
        </div>
        <div className="rounded-2xl border-2 border-cyan-500/30 bg-cyan-500/[0.08] p-6 text-center">
          <h3 className="text-2xl font-game text-white">Could you do this in {city} today?</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-300">Be honest: tick what you could do now on your phone. We’ll check again when we land.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {TRIP_CAN_DOS.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
              <span>{c.text}</span>
              {answered > 0 && <span className="shrink-0 text-xs text-slate-400">{beforeCounts[c.id] ?? 0} of {answered}</span>}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={toPrompts} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">PACKING QUESTIONS</button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <PlaneTakeoff className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">Cleared for takeoff</h3>
        <p className="max-w-md text-sm text-slate-300">Everyone’s packed and ready. Next stop: {city}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Boarding Call · Question {index + 1} of {prompts.length}</p>
        <span className="text-sm text-slate-400">{readyNames.length} ready</span>
      </div>

      <div className="rounded-2xl border-2 border-cyan-500/30 bg-cyan-500/[0.08] p-6 text-center">
        <h3 className="text-2xl font-game text-white">{prompts[index]}</h3>
        {index === 0 && content.packingHint && (
          <p className="mx-auto mt-3 flex max-w-md items-center justify-center gap-2 text-sm text-cyan-100/90">
            <Luggage className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden />{content.packingHint}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-400">Everyone answers out loud, then taps “{buttonLabel}”.</p>
      </div>

      {readyNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {readyNames.map((name) => (
            <span key={name} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-100">
              <Check className="h-3.5 w-3.5" aria-hidden />{name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end">
        <button onClick={next} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">
          {index >= prompts.length - 1 ? 'CLEARED FOR TAKEOFF' : 'NEXT QUESTION'}
        </button>
      </div>
    </div>
  );
}
