'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { ChevronRight, Users } from 'lucide-react';
import type { Student } from '@/lib/supabase/types';
import type { ActivityProps } from '../types';
import { useTravelRoles, TravelRoleBanner, SwapRoleButton } from './travel-roles';

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
}: PerformedExchangeProps) {
  const { service, others, swap, canSwap } = useTravelRoles(students);
  // Travellers queue: every non-service student takes a full turn. With no roster, one
  // unnamed "class" turn so the scene still runs.
  const travellers = useMemo<Array<Student | null>>(
    () => (others.length > 0 ? others : [null]),
    [others],
  );

  const [turnIndex, setTurnIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const scoredTurnsRef = useRef<Set<number>>(new Set());
  const serviceScoredRef = useRef(false);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const traveller = travellers[Math.min(turnIndex, travellers.length - 1)] ?? null;
  const script = useMemo(() => scriptFor(traveller), [scriptFor, traveller]);
  const turnDone = lineIndex >= script.length;
  const isLastTurn = turnIndex >= travellers.length - 1;

  // Scaffolding on student devices: both roles' key phrases, spoken-first (confirm only).
  useEffect(() => {
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
    return () => onSetInputSpec?.(null);
  }, [onSetInputSpec, gameKey, context, serviceRole, travellerRole, servicePhrases, travellerPhrases]);

  // Keep the current line in view.
  useEffect(() => {
    lineRefs.current[lineIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [lineIndex]);

  const advanceLine = useCallback(() => {
    setLineIndex((i) => Math.min(i + 1, script.length));
  }, [script.length]);

  const completeTurn = useCallback(async () => {
    // Score the traveller who just performed (once per turn).
    if (traveller && !scoredTurnsRef.current.has(turnIndex)) {
      scoredTurnsRef.current.add(turnIndex);
      await onScore?.({
        studentId: traveller.id,
        clientId: null,
        displayName: traveller.name,
        promptIndex: turnIndex + 1,
        points: 3,
        isCorrect: null,
      });
    }
    if (isLastTurn) {
      // The service student held the scene the whole time — score them once.
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
      return;
    }
    setTurnIndex((i) => i + 1);
    setLineIndex(0);
  }, [traveller, turnIndex, isLastTurn, service, travellers.length, onScore, onFinished]);

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

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          {turnDone
            ? `${traveller ? traveller.name : 'The class'} made it through!`
            : 'Students speak the highlighted line, then advance.'}
        </p>
        {turnDone ? (
          <button
            onClick={() => void completeTurn()}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]"
          >
            {isLastTurn ? 'FINISH' : `NEXT ${travellerRole.toUpperCase()} · +3`}
          </button>
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
