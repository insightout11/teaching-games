'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plane, MapPin, Users } from 'lucide-react';
import type { Difficulty } from '@/lib/difficulty';
import { useSessionStore } from '@/stores/session-store';
import type { ActivityProps } from '../types';

// Trip Recap — the Travel arc's purpose-built landing. Data-seeded from the trip log the stops
// wrote to the session store (no AI): the class retells their real journey. Each student gives a
// spoken highlight using a difficulty-tiered frame; the teacher steps through the class in fair
// rotation (least-featured first) and scores participation. Spoken-first — devices only show the
// trip board + sentence starters as scaffolding.

type Phase = 'idle' | 'retell' | 'done';

// Display order + labels for the stops that write a trip-log entry. Unknown stages fall to the end.
const STOP_LABELS: Record<string, string> = {
  arrival: 'Arrival',
  'getting-there': 'Getting There',
  attraction: 'Out & About',
  'local-table': 'Local Table',
};
const STAGE_ORDER = ['arrival', 'getting-there', 'attraction', 'local-table'];

type Tier = 'basic' | 'standard' | 'advanced';
function tierFor(difficulty: Difficulty): Tier {
  if (difficulty === 'Beginner' || difficulty === 'Easy') return 'basic';
  if (difficulty === 'Intermediate') return 'standard';
  return 'advanced';
}
const FRAMES: Record<Tier, string[]> = {
  basic: ['My favourite stop was ___.', 'The best part was ___.'],
  standard: ['The best part of the trip was ___ because ___.', 'I really liked ___ because ___.'],
  advanced: ['The highlight for me was ___, because ___.', 'If I did this trip again, I would ___.'],
};

const POINTS_PER_HIGHLIGHT = 2;

export function TripRecapActivity({
  students,
  sessionSettings,
  onPhaseChange,
  onSetInputSpec,
  onScore,
}: ActivityProps) {
  const tripLog = useSessionStore((s) => s.tripLog);
  const recordFeature = useSessionStore((s) => s.recordFeature);

  const [phase, setPhase] = useState<Phase>('idle');
  const [index, setIndex] = useState(0);
  const scoredRef = useMemo(() => new Set<number>(), []);

  const frames = FRAMES[tierFor(sessionSettings.difficulty)];

  // The journey in stop order, with any unknown stages appended.
  const stops = useMemo(() => {
    return [...tripLog].sort((a, b) => {
      const ai = STAGE_ORDER.indexOf(a.stageId);
      const bi = STAGE_ORDER.indexOf(b.stageId);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [tripLog]);

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
  const orderedStudents = useMemo(() => {
    const counts = useSessionStore.getState().callCounts;
    return [...students].sort((a, b) => (counts[a.id] ?? 0) - (counts[b.id] ?? 0));
  }, [students]);

  const current = orderedStudents[index] ?? null;
  const isLast = index >= orderedStudents.length - 1;

  // Scaffolding on student devices during the retell — spoken-first, confirm only.
  useEffect(() => {
    if (phase !== 'retell') { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'trip-recap',
      prompt: 'Share your trip highlight out loud when it’s your turn.',
      buttonLabel: 'Ready',
      keywords: vocabChips,
      keywordGroups: [{ label: 'Sentence starters', phrases: frames }],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const finish = useCallback(() => {
    onSetInputSpec?.(null);
    setPhase('done');
    onPhaseChange?.('finished');
  }, [onSetInputSpec, onPhaseChange]);

  const advance = useCallback(async () => {
    const s = orderedStudents[index];
    if (s && !scoredRef.has(index)) {
      scoredRef.add(index);
      recordFeature(s.id);
      await onScore?.({ studentId: s.id, clientId: null, displayName: s.name, promptIndex: index + 1, points: POINTS_PER_HIGHLIGHT, isCorrect: null });
    }
    if (isLast) { finish(); return; }
    setIndex((i) => i + 1);
  }, [orderedStudents, index, scoredRef, recordFeature, onScore, isLast, finish]);

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
          <h3 className="text-3xl font-game text-white">Trip Recap</h3>
          <p className="max-w-md text-sm text-slate-300">Look back over the journey together — then everyone shares their highlight.</p>
        </div>
        {TripBoard}
        <div className="text-center">
          <button
            onClick={startRetell}
            className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95"
          >
            START RECAP
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
        <p className="max-w-md text-sm text-slate-300">Everyone shared their highlight. Safe travels home.</p>
      </div>
    );
  }

  // ─── Retell ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {TripBoard}

      <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/[0.1] p-5 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
          <Users className="h-3.5 w-3.5" />
          {current ? `Highlight — ${Math.min(index + 1, orderedStudents.length)} of ${orderedStudents.length}` : 'Share as a class'}
        </p>
        <p className="mt-2 text-3xl font-game text-white">{current ? current.name : 'The class'}</p>
        <div className="mt-3 space-y-1">
          {frames.map((f) => (
            <p key={f} className="text-sm text-emerald-100/90">&ldquo;{f}&rdquo;</p>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">Each student speaks their highlight, then you move on.</p>
        <button
          onClick={() => void advance()}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]"
        >
          {isLast ? `FINISH · +${POINTS_PER_HIGHLIGHT}` : `NEXT · +${POINTS_PER_HIGHLIGHT}`}
        </button>
      </div>
    </div>
  );
}
