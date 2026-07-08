'use client';

import type { ReactNode } from 'react';
import type { LessonPhase, LessonSlot } from '@/hooks/use-lesson-session';
import { LessonCaptainFlightPlan } from '@/components/ui/flight-plan';
import { buildRuntimeFlightPlanSteps, getFlightPlanActiveIndex } from '@/lib/flight-plan-helpers';
import { StageCoachHint } from '@/components/session/stage-coach-hint';

interface FlightSessionViewProps {
  slots: LessonSlot[];
  currentSlotIndex: number;
  phase: LessonPhase;
  currentModuleName: string;
  isModuleFinished: boolean;
  onExit: () => void;
  onSwap: () => void;
  onNext: () => void;
  onGoToSlot?: (index: number) => void;
  /** Show first-run stage coaching hints (teacher is early in their tenure). */
  coachingEligible?: boolean;
  children: ReactNode;
}

export function FlightSessionView({
  slots,
  currentSlotIndex,
  phase,
  currentModuleName,
  isModuleFinished,
  onExit,
  onSwap,
  onNext,
  onGoToSlot,
  coachingEligible = false,
  children,
}: FlightSessionViewProps) {
  const currentSlot = slots[currentSlotIndex] ?? null;
  const nextSlot = slots[currentSlotIndex + 1] ?? null;

  // Single shared builder + active-index helper — same path styling as everywhere.
  const steps = buildRuntimeFlightPlanSteps(slots);
  const activeIndex = getFlightPlanActiveIndex(phase, currentSlotIndex, slots.length);

  const currentStageLabel = currentSlot?.stageLabel ?? currentSlot?.name;
  const nextLabel = nextSlot?.stageLabel ?? nextSlot?.name;
  const isFinalSlot = currentSlotIndex + 1 >= slots.length;
  const actionLabel = isFinalSlot ? 'Complete Flight' : `Continue to ${nextLabel}`;
  const phaseLabel = currentSlot?.isMicroEvent ? 'Micro-event' : 'Flight stage';

  return (
    <div className="space-y-4">
      <LessonCaptainFlightPlan
        steps={steps}
        mode="runtime"
        activeIndex={activeIndex}
        height={140}
        onNodeClick={
          onGoToSlot
            ? (id) => {
                const idx = Number(id.replace('slot-', ''));
                if (!Number.isNaN(idx) && idx !== currentSlotIndex) onGoToSlot(idx);
              }
            : undefined
        }
      />

      <div className="panel-card px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-100">
                {phaseLabel}
              </span>
              {currentStageLabel && (
                <span className="text-sm font-semibold text-white">{currentStageLabel}</span>
              )}
            </div>
            <p className="mt-1 truncate text-xs text-white/55">{currentModuleName}</p>
            <StageCoachHint moduleKey={currentSlot?.key} eligible={coachingEligible} />
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExit}
              className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Exit Lesson
            </button>
            <button
              type="button"
              onClick={onSwap}
              className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Swap
            </button>
            <button
              type="button"
              onClick={onNext}
              className={[
                'min-h-10 rounded-lg px-4 text-sm font-semibold transition-all',
                isModuleFinished
                  // Activity is done → the flight's forward action is now THE next
                  // step, so it goes loud.
                  ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 ring-2 ring-cyan-200 ring-offset-2 ring-offset-[#0d1117] shadow-[0_0_18px_rgba(34,211,238,0.45)]'
                  // During the activity, the activity's own CTA is primary — keep this
                  // quiet (forward-hint outline) so it doesn't compete.
                  : 'border border-cyan-300/30 text-cyan-100 hover:bg-cyan-300/10',
              ].join(' ')}
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
