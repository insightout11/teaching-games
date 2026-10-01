'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { ChevronRight, Users, Zap, Check } from 'lucide-react';
import { pickTripProblem, type ProblemStop } from '@/lib/world-flight/trip-problems';
import type { Difficulty } from '@/lib/difficulty';
import type { Student } from '@/lib/supabase/types';
import { useSessionStore } from '@/stores/session-store';
import type { ActivityProps } from '../types';
import { useTravelRoles, TravelRoleBanner, SwapRoleButton } from './travel-roles';

// Soft default: feature about this many travellers per stop before the primary button suggests
// wrapping up. Never a hard cap — "NEXT TRAVELLER" stays available until everyone has gone, and
// the teacher can keep rotating past that. Scaled to class size so tiny classes finish everyone.
const WRAP_SUGGESTION = 3;

// Line-by-line performed dialogue engine for the Travel arc's functional stops (Arrival,
// Getting There ticket desk, Local Table ordering). This is the scaffolded structure the
// stops are designed around — NOT a static phrase table:
//  - one "service" student (officer / agent / waiter) + travellers, assigned from the roster
//  - each traveller takes a full turn through the script against the service student
//  - the CURRENT line is highlighted; the teacher steps line by line
//  - blanks (___) mark where the student personalises, with hints
//  - both roles' key phrases are pushed to student devices as scaffolding
//  - each completed turn scores the traveller (and the service student once at the end)

export interface ExchangeLine {
  speaker: 'service' | 'traveller';
  text: string;
  hint?: string;
}

/**
 * Script tier derived from the session's CEFR difficulty — every stop's script adapts:
 * basic = shorter lines, fewer blanks, concrete hints; standard = the full exchange;
 * advanced = extra follow-up turns and more open blanks.
 */
export type ScriptTier = 'basic' | 'standard' | 'advanced';

export function scriptTierFor(difficulty: Difficulty): ScriptTier {
  if (difficulty === 'Beginner' || difficulty === 'Easy') return 'basic';
  if (difficulty === 'Intermediate') return 'standard';
  return 'advanced';
}

interface PerformedExchangeProps {
  students: Student[];
  gameKey: string;
  /** One-line scene setup shown above the script and on student devices. */
  context: string;
  serviceRole: string;
  travellerRole: string;
  serviceHint?: string;
  travellerHint?: string;
  ServiceIcon: ComponentType<{ className?: string }>;
  accent?: 'cyan' | 'amber';
  /** Script for one traveller's turn — personalised per traveller (their dish, their ticket…). */
  scriptFor: (traveller: Student | null) => ExchangeLine[];
  /** Key phrases pushed to student devices as scaffolding chips. */
  servicePhrases: string[];
  travellerPhrases: string[];
  onSetInputSpec?: ActivityProps['onSetInputSpec'];
  onScore?: ActivityProps['onScore'];
  onFinished: () => void;
  /** Travel v2: after the scripted Take 1, offer a Take 2 with a problem card, in own words. */
  problemStop?: ProblemStop;
}

function renderWithBlanks(text: string): React.ReactNode {
  const parts = text.split('___');
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="mx-0.5 border-b-2 border-amber-400 px-1 font-semibold text-amber-300">___</span>
      )}
    </React.Fragment>
  ));
}

export function PerformedExchange({
  students,
  gameKey,
  context,
  serviceRole,
  travellerRole,
  serviceHint,
  travellerHint,
  ServiceIcon,
  accent = 'cyan',
  scriptFor,
  servicePhrases,
  travellerPhrases,
  onSetInputSpec,
  onScore,
  onFinished,
  problemStop,
}: PerformedExchangeProps) {
  const { service, others, swap, canSwap } = useTravelRoles(students);
  const recordFeature = useSessionStore((s) => s.recordFeature);
  // Travellers queue, ordered by fair rotation ACROSS stops: least-featured students (lowest
  // session callCounts) go first, so featured turns spread over the whole trip instead of always
  // starting with the top of the roster. Snapshotted once at mount so the order doesn't reshuffle
  // mid-stop as we record features. With no roster, one unnamed "class" turn so the scene still runs.
  // Keyed on the ids (not the array, which is new every render) so recording a turn doesn't
  // re-sort the queue mid-stop and repeat one traveller while skipping another.
  const othersKey = others.map((o) => o.id).join(',');
  const othersRef = useRef(others); othersRef.current = others;
  const travellers = useMemo<Array<Student | null>>(() => {
    const list = othersRef.current;
    if (list.length === 0) return [null];
    const counts = useSessionStore.getState().callCounts;
    return [...list].sort((a, b) => (counts[a.id] ?? 0) - (counts[b.id] ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: re-snapshot only when the roster ids change
  }, [othersKey]);

  // Soft wrap suggestion, scaled down for small classes so everyone goes before "WRAP UP" appears.
  const wrapThreshold = Math.min(travellers.length, WRAP_SUGGESTION);

  const [turnIndex, setTurnIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  // Take 2: 'off' (scripted Take 1), 'on' (problem being played), 'done' (solved).
  const [take2, setTake2] = useState<'off' | 'on' | 'done'>('off');
  const travellerCards = useSessionStore((s) => s.lessonThread.travellers);
  const scoredTurnsRef = useRef<Set<number>>(new Set());
  const serviceScoredRef = useRef(false);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const traveller = travellers[Math.min(turnIndex, travellers.length - 1)] ?? null;
  const script = useMemo(() => scriptFor(traveller), [scriptFor, traveller]);
  const take1Done = lineIndex >= script.length;
  const problem = useMemo(
    () => (problemStop ? pickTripProblem(problemStop, traveller ? travellerCards?.[traveller.id] : undefined, turnIndex) : null),
    [problemStop, traveller, travellerCards, turnIndex],
  );
  // With a problem stop, a turn is done once Take 2 is solved (or skipped).
  const turnDone = take1Done && (!problem || take2 === 'done');
  const isLastTurn = turnIndex >= travellers.length - 1;
  // Once the current turn completes we'll have featured turnIndex + 1 travellers; at/past the
  // soft threshold the primary action becomes "WRAP UP" (but NEXT TRAVELLER stays available).
  const reachedWrap = turnIndex + 1 >= wrapThreshold;

  // Scaffolding on student devices: both roles' key phrases, spoken-first (confirm only).
  useEffect(() => {
    if (problem && take2 === 'on') {
      onSetInputSpec?.({
        type: 'confirm',
        gameKey,
        prompt: `Take 2: ${problem.title}`,
        instruction: problem.goal,
        buttonLabel: 'Ready',
        keywordGroups: [{ label: 'Useful phrases', phrases: problem.phrases }],
      });
      return;
    }
    onSetInputSpec?.({
      type: 'confirm',
      gameKey,
      prompt: context,
      buttonLabel: 'Ready',
      keywordGroups: [
        { label: serviceRole, phrases: servicePhrases },
        { label: travellerRole, phrases: travellerPhrases },
      ],
    });
  }, [onSetInputSpec, gameKey, context, serviceRole, travellerRole, servicePhrases, travellerPhrases, problem, take2]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  // Keep the current line in view.
  useEffect(() => {
    lineRefs.current[lineIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [lineIndex]);

  const advanceLine = useCallback(() => {
    setLineIndex((i) => Math.min(i + 1, script.length));
  }, [script.length]);

  // Score + record the traveller who just performed (once per turn). Recording bumps their
  // session callCount so they're deprioritised as a featured traveller at the next stop.
  const scoreCurrentTraveller = useCallback(async () => {
    if (traveller && !scoredTurnsRef.current.has(turnIndex)) {
      scoredTurnsRef.current.add(turnIndex);
      recordFeature(traveller.id);
      await onScore?.({
        studentId: traveller.id,
        clientId: null,
        displayName: traveller.name,
        promptIndex: turnIndex + 1,
        points: 3,
        isCorrect: null,
      });
    }
  }, [traveller, turnIndex, onScore, recordFeature]);

  // Feature the next traveller (soft default — always available until everyone has gone).
  const nextTraveller = useCallback(async () => {
    await scoreCurrentTraveller();
    setTurnIndex((i) => i + 1);
    setLineIndex(0);
    setTake2('off');
  }, [scoreCurrentTraveller]);

  // Take 2 solved: an extra +2 for handling it in their own words.
  const solveTake2 = useCallback(async () => {
    setTake2('done');
    if (traveller) {
      await onScore?.({ studentId: traveller.id, clientId: null, displayName: traveller.name, promptIndex: turnIndex + 1, points: 2, isCorrect: null });
    }
  }, [traveller, turnIndex, onScore]);

  // End the stop. The current traveller performed, so score them; the service student held the
  // scene the whole time — score them once too.
  const finish = useCallback(async () => {
    await scoreCurrentTraveller();
    if (service && !serviceScoredRef.current) {
      serviceScoredRef.current = true;
      await onScore?.({
        studentId: service.id,
        clientId: null,
        displayName: service.name,
        promptIndex: travellers.length + 1,
        points: 3,
        isCorrect: null,
      });
    }
    onFinished();
  }, [scoreCurrentTraveller, service, travellers.length, onScore, onFinished]);

  const speakerName = (line: ExchangeLine) =>
    line.speaker === 'service'
      ? (service ? service.name : 'Teacher')
      : (traveller ? traveller.name : 'Class');

  const accentText = accent === 'amber' ? 'text-amber-300' : 'text-cyan-300';
  const currentBg = accent === 'amber'
    ? 'border-amber-300/50 bg-amber-500/[0.12]'
    : 'border-cyan-300/50 bg-cyan-500/[0.12]';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{context}</p>
        {canSwap && <SwapRoleButton onClick={swap} label={`Swap ${serviceRole.toLowerCase()}`} />}
      </div>

      <TravelRoleBanner
        service={service}
        others={traveller ? [traveller] : others}
        serviceRole={serviceRole}
        otherRole={`${travellerRole} — turn ${Math.min(turnIndex + 1, travellers.length)} of ${travellers.length}`}
        serviceHint={serviceHint}
        otherHint={travellerHint}
        ServiceIcon={ServiceIcon}
        OtherIcon={Users}
        accent={accent}
      />

      {problem && take2 === 'on' ? (
        <div className="rounded-2xl border-2 border-rose-400/40 bg-rose-500/[0.08] p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.24em] text-rose-300">
            <Zap className="h-4 w-4" aria-hidden />Take 2 · Problem
          </p>
          <h4 className="mt-2 text-2xl font-game text-white">{problem.title}</h4>
          <p className="mt-3 text-sm text-slate-200">
            <span className={`font-semibold ${accentText}`}>{service ? service.name : 'Teacher'} starts:</span> “{problem.serviceOpener}”
          </p>
          <p className="mt-2 text-sm text-slate-200">
            <span className="font-semibold text-slate-300">{traveller ? traveller.name : 'The class'}’s goal:</span> {problem.goal}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {problem.phrases.map((ph) => (
              <span key={ph} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200">{ph}</span>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">No script this time. Say it your own way.</p>
        </div>
      ) : (
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          The exchange — line by line
        </p>
        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {script.map((line, i) => {
            const isCurrent = i === lineIndex;
            const isDone = i < lineIndex;
            return (
              <div
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                className={`rounded-xl border px-4 py-2.5 transition ${
                  isCurrent ? currentBg : isDone ? 'border-white/5 bg-white/[0.02] opacity-60' : 'border-white/10 bg-white/[0.04]'
                }`}
              >
                <p className="text-sm text-slate-200">
                  <span className={`font-semibold ${line.speaker === 'service' ? accentText : 'text-slate-400'}`}>
                    {speakerName(line)}:
                  </span>{' '}
                  {renderWithBlanks(line.text)}
                </p>
                {isCurrent && line.hint && (
                  <p className="mt-1 text-xs text-slate-400">{line.hint}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          {take2 === 'on'
            ? 'Play the scene again with the problem. Solve it in your own words.'
            : take1Done && problem && take2 === 'off'
              ? 'Take 1 done. Now the same scene with a problem.'
              : turnDone
                ? `${traveller ? traveller.name : 'The class'} made it through!`
                : 'Students speak the highlighted line, then advance.'}
        </p>
        {take1Done && problem && take2 === 'off' ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setTake2('done')} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-game text-sm text-slate-300 transition hover:bg-white/10">
              SKIP TAKE 2
            </button>
            <button onClick={() => setTake2('on')} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">
              <Zap className="h-4 w-4" aria-hidden />TAKE 2 · PROBLEM
            </button>
          </div>
        ) : take2 === 'on' ? (
          <button onClick={() => void solveTake2()} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">
            <Check className="h-4 w-4" aria-hidden />SOLVED · +2
          </button>
        ) : turnDone ? (
          isLastTurn ? (
            <button
              onClick={() => void finish()}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]"
            >
              FINISH
            </button>
          ) : reachedWrap ? (
            // Soft default reached: WRAP UP is the primary action, but featuring another
            // traveller stays available (no hard cap).
            <div className="flex items-center gap-2">
              <button
                onClick={() => void nextTraveller()}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-game text-sm text-slate-200 transition hover:bg-white/10"
              >
                NEXT {travellerRole.toUpperCase()} · +3
              </button>
              <button
                onClick={() => void finish()}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]"
              >
                WRAP UP
              </button>
            </div>
          ) : (
            <button
              onClick={() => void nextTraveller()}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]"
            >
              NEXT {travellerRole.toUpperCase()} · +3
            </button>
          )
        ) : (
          <button
            onClick={advanceLine}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]"
          >
            NEXT LINE
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
