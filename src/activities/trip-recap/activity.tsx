'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plane, MapPin, Users, Mail, Stamp } from 'lucide-react';
import type { Difficulty } from '@/lib/difficulty';
import { useSessionStore } from '@/stores/session-store';
import { canDosFor, countTicks } from '@/lib/world-flight/trip-can-do';
import { saveFlightResult } from '@/lib/flight-result';
import type { ActivityProps } from '../types';

// Trip Recap — the Travel arc's purpose-built landing. Data-seeded from the trip log the stops
// wrote to the session store (no AI). Travel v2: each student says a spoken POSTCARD HOME, told
// as their Traveller Card, using a difficulty-tiered frame; the teacher steps through the class in
// fair rotation (least-featured first) and scores participation. Then the can-do check again (the
// AFTER, against boarding's BEFORE) with stamps for what the class can now do. Class counts only,
// never names. Spoken-first — devices show the trip words + postcard frame as scaffolding.

type Phase = 'idle' | 'retell' | 'after' | 'done';

// Display order + labels for the stops that write a trip-log entry. Unknown stages fall to the end.
const STOP_LABELS: Record<string, string> = {
  arrival: 'Arrival',
  'getting-there': 'Getting There',
  hotel: 'Hotel',
  attraction: 'Out & About',
  'local-table': 'Local Table',
};
const STAGE_ORDER = ['arrival', 'getting-there', 'hotel', 'attraction', 'local-table'];

type Tier = 'basic' | 'standard' | 'advanced';
function tierFor(difficulty: Difficulty): Tier {
  if (difficulty === 'Beginner' || difficulty === 'Easy') return 'basic';
  if (difficulty === 'Intermediate') return 'standard';
  return 'advanced';
}
function postcardFrames(tier: Tier, city: string): string[] {
  if (tier === 'basic') return [`Dear ___, I am in ${city}!`, 'I went to ___.', 'I ate ___.', 'See you soon!'];
  if (tier === 'standard') return [`Dear ___, greetings from ${city}!`, 'Yesterday I ___ and ___.', 'The best part was ___ because ___.', 'Wish you were here!'];
  return [`Dear ___, greetings from ${city}!`, 'The highlight was ___, because ___.', 'One thing went wrong: ___, but I ___.', 'Next time, I’d love to ___.'];
}

const POINTS_PER_HIGHLIGHT = 2;

export function TripRecapActivity({
  students,
  sessionSettings,
  onPhaseChange,
  onSetInputSpec,
  onScore,
  onRegisterRemoteVoteHandler,
}: ActivityProps) {
  const tripLog = useSessionStore((s) => s.tripLog);
  const recordFeature = useSessionStore((s) => s.recordFeature);
  const lessonThread = useSessionStore((s) => s.lessonThread);
  const recordCanDo = useSessionStore((s) => s.recordCanDo);
  const customTopic = useSessionStore((s) => s.settings.customTopic);
  const city = customTopic.replace(/^Trip to /, '').trim() || 'the city';
  const cards = lessonThread.travellers;

  const [phase, setPhase] = useState<Phase>('idle');
  const [index, setIndex] = useState(0);
  const scoredRef = useMemo(() => new Set<number>(), []);
  const phaseRef = useRef(phase); phaseRef.current = phase;

  const frames = postcardFrames(tierFor(sessionSettings.difficulty), city);

  // The journey in stop order, with any unknown stages appended.
  const stops = useMemo(() => {
    return [...tripLog].sort((a, b) => {
      const ai = STAGE_ORDER.indexOf(a.stageId);
      const bi = STAGE_ORDER.indexOf(b.stageId);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [tripLog]);

  // The AFTER: can-dos for the stops actually played.
  const canDos = useMemo(
    () => canDosFor(['arrival', 'announcement', ...(lessonThread.tripStops ?? tripLog.map((e) => e.stageId))]),
    [lessonThread.tripStops, tripLog],
  );
  const beforeTicks = lessonThread.canDo?.before ?? {};
  const afterTicks = lessonThread.canDo?.after ?? {};
  const beforeCounts = countTicks(beforeTicks);
  const afterCounts = countTicks(afterTicks);
  const beforeN = Object.keys(beforeTicks).length;
  const afterN = Object.keys(afterTicks).length;

  // Trip vocab chips = the class's real anchor words, de-duplicated across stops.
  const vocabChips = useMemo(() => {
    const seen = new Set<string>();
    const chips: string[] = [];
    for (const entry of stops) {
      for (const word of entry.vocab ?? []) {
        const w = word.trim();
        if (w && !seen.has(w.toLowerCase())) { seen.add(w.toLowerCase()); chips.push(w); }
      }
    }
    return chips;
  }, [stops]);

  // Retell order: least-featured students first, snapshotted once so it doesn't reshuffle mid-round.
  const studentKey = students.map((s) => s.id).join(',');
  const studentsRef = useRef(students); studentsRef.current = students;
  const orderedStudents = useMemo(() => {
    const counts = useSessionStore.getState().callCounts;
    return [...studentsRef.current].sort((a, b) => (counts[a.id] ?? 0) - (counts[b.id] ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-snapshot only when the roster ids change
  }, [studentKey]);

  const current = orderedStudents[index] ?? null;
  const isLast = index >= orderedStudents.length - 1;

  // Device scaffolding: the postcard frame while retelling; the can-do list at the end.
  useEffect(() => {
    if (phase === 'after') {
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'trip-recap',
        prompt: `Could you do this in ${city} now?`,
        instruction: 'Tick everything you could do now, after the trip.',
        perStudentData: { __cando: canDos.map((c) => ({ id: c.id, text: c.text })) },
        stableInput: true,
      });
      return;
    }
    if (phase !== 'retell') { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'trip-recap',
      prompt: 'Say your postcard home out loud when it’s your turn.',
      buttonLabel: 'Ready',
      keywords: vocabChips,
      keywordGroups: [{ label: 'Your postcard', phrases: frames }],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'after') return;
      try { recordCanDo('after', vote.clientId, JSON.parse(vote.choice) as string[]); } catch { /* not a can-do list */ }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, recordCanDo]);

  // The logbook: can-do stamps earned (a can-do is stamped when at least half the class ticks it).
  const sessionId = useSessionStore((s) => s.sessionId);
  const saveResult = useCallback(() => {
    if (afterN === 0) return;
    const stampedAfter = canDos.filter((c) => (afterCounts[c.id] ?? 0) * 2 >= afterN).length;
    const stampedBefore = canDos.filter((c) => (beforeCounts[c.id] ?? 0) * 2 >= beforeN).length;
    saveFlightResult(sessionId, {
      preset: 'travel-60', flight: 'Travel', topic: `Trip to ${city}`, city,
      measures: [
        { label: 'Can-do stamps', before: beforeN > 0 ? { count: stampedBefore, of: canDos.length } : null, after: { count: stampedAfter, of: canDos.length } },
        { label: 'Postcards home', before: null, after: { count: scoredRef.size, of: orderedStudents.length } },
      ],
      phrases: vocabChips.slice(0, 4),
    });
  }, [sessionId, afterN, beforeN, canDos, afterCounts, beforeCounts, city, scoredRef, orderedStudents.length, vocabChips]);

  const finish = useCallback(() => {
    if (phaseRef.current === 'after') saveResult();
    onSetInputSpec?.(null);
    setPhase('done');
    onPhaseChange?.('finished');
  }, [onSetInputSpec, onPhaseChange, saveResult]);

  const advance = useCallback(async () => {
    const s = orderedStudents[index];
    if (s && !scoredRef.has(index)) {
      scoredRef.add(index);
      recordFeature(s.id);
      await onScore?.({ studentId: s.id, clientId: null, displayName: s.name, promptIndex: index + 1, points: POINTS_PER_HIGHLIGHT, isCorrect: null });
    }
    if (isLast) { setPhase('after'); onPhaseChange?.('after'); return; }
    setIndex((i) => i + 1);
  }, [orderedStudents, index, scoredRef, recordFeature, onScore, isLast, onPhaseChange]);

  const startRetell = useCallback(() => {
    setIndex(0);
    setPhase('retell');
    onPhaseChange?.('retell');
  }, [onPhaseChange]);

  // ─── Trip board (shared across idle + retell) ──────────────────────────
  const TripBoard = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Your trip</p>
        {stops.length === 0 ? (
          <p className="text-sm text-slate-400">You made the journey together — think back over the stops.</p>
        ) : (
          <ol className="space-y-2">
            {stops.map((stop) => (
              <li key={stop.stageId} className="flex items-start gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span className="text-sm text-slate-200">
                  <span className="font-semibold text-white">{STOP_LABELS[stop.stageId] ?? stop.stageId}:</span>{' '}
                  {stop.text}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
      {vocabChips.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Trip words</p>
          <div className="flex flex-wrap gap-2">
            {vocabChips.map((w) => (
              <span key={w} className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-200">{w}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (phase === 'idle') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" />
            <Plane className="relative h-16 w-16 text-emerald-300" />
          </div>
          <h3 className="text-3xl font-game text-white">Postcard Home</h3>
          <p className="max-w-md text-sm text-slate-300">Look back over the trip. Then everyone tells a postcard home, out loud, as their traveller.</p>
        </div>
        {TripBoard}
        <div className="text-center">
          <button
            onClick={startRetell}
            className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95"
          >
            START POSTCARDS
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <Plane className="h-14 w-14 text-emerald-300" />
        <h3 className="text-3xl font-game text-white">What a trip!</h3>
        <p className="max-w-md text-sm text-slate-300">Postcards sent. Safe travels home.</p>
      </div>
    );
  }

  // ─── After: can-do stamps (class counts only) ──────────────────────────
  if (phase === 'after') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300/80">Landing · What can we do now?</p>
          <span className="text-sm text-slate-400">{afterN} answered</span>
        </div>
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/[0.08] p-5 text-center">
          <h3 className="text-2xl font-game text-white">Could you do this in {city} now?</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-300">Tick on your phone. Everything most of the class can do earns a stamp.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {canDos.map((c) => {
            const now = afterCounts[c.id] ?? 0;
            const was = beforeCounts[c.id] ?? 0;
            const stamped = afterN > 0 && now * 2 >= afterN;
            return (
              <div key={c.id} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${stamped ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${stamped ? 'rotate-[-8deg] border-emerald-300 text-emerald-200' : 'border-dashed border-white/20 text-white/20'}`}>
                  <Stamp className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex-1 text-sm text-slate-100">{c.text}</span>
                {afterN > 0 && (
                  <span className="shrink-0 text-right text-xs text-slate-400">
                    {beforeN > 0 && <span className="block">before {was} of {beforeN}</span>}
                    <span className="block font-semibold text-emerald-200">now {now} of {afterN}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <button onClick={finish} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">FINISH THE TRIP</button>
        </div>
      </div>
    );
  }

  // ─── Postcards ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {TripBoard}

      <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/[0.1] p-5 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
          {current ? <Mail className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
          {current ? `Postcard ${Math.min(index + 1, orderedStudents.length)} of ${orderedStudents.length}` : 'Tell it as a class'}
        </p>
        <p className="mt-2 text-3xl font-game text-white">{current ? current.name : 'The class'}</p>
        {current && cards?.[current.id] && (
          <p className="mt-1 text-sm text-emerald-100/80">writing as {cards[current.id].persona}</p>
        )}
        <div className="mt-3 space-y-1">
          {frames.map((f) => (
            <p key={f} className="text-sm text-emerald-100/90">&ldquo;{f}&rdquo;</p>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">Each student says their postcard, then you move on.</p>
        <button
          onClick={() => void advance()}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]"
        >
          {isLast ? `CAN-DO STAMPS · +${POINTS_PER_HIGHLIGHT}` : `NEXT · +${POINTS_PER_HIGHLIGHT}`}
        </button>
      </div>
    </div>
  );
}
