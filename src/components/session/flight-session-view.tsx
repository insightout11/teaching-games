'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { FlightPresetConfig } from '@/lib/flight-plan-presets';
import type { LessonPhase, LessonSlot } from '@/hooks/use-lesson-session';
import { LessonCaptainFlightPlan, type FlightPlanStep } from '@/components/ui/flight-plan';

interface FlightSessionViewProps {
  slots: LessonSlot[];
  currentSlotIndex: number;
  phase: LessonPhase;
  flightConfig: FlightPresetConfig;
  currentModuleName: string;
  isModuleFinished: boolean;
  onExit: () => void;
  onSwap: () => void;
  onNext: () => void;
  onGoToSlot?: (index: number) => void;
  children: ReactNode;
}

export function FlightSessionView({
  slots,
  currentSlotIndex,
  flightConfig,
  currentModuleName,
  isModuleFinished,
  onExit,
  onSwap,
  onNext,
  onGoToSlot,
  children,
}: FlightSessionViewProps) {
  const currentSlot = slots[currentSlotIndex] ?? null;
  const nextSlot = slots[currentSlotIndex + 1] ?? null;

  // stageId → first matching slot index (for click navigation)
  const stageIdToSlotIndex = useMemo(() => {
    const map = new Map<string, number>();
    slots.forEach((slot, i) => {
      if (slot.stageId && !map.has(slot.stageId)) {
        map.set(slot.stageId, i);
      }
    });
    return map;
  }, [slots]);

  // Convert flight stage definitions to FlightPlanStep[]
  const steps = useMemo<FlightPlanStep[]>(
    () =>
      flightConfig.stages.map((stage, i) => ({
        id: stage.stageId,
        type:
          i === 0
            ? 'Takeoff'
            : stage.kind === 'landing'
              ? 'Landing'
              : stage.kind === 'micro-event'
                ? 'Check'
                : 'Stage',
        name: stage.label,
        kind: i === 0 || stage.kind === 'landing' ? 'terminal' : 'module',
      })),
    [flightConfig.stages],
  );

  const currentStageIndex = flightConfig.stages.findIndex(
    (s) => s.stageId === currentSlot?.stageId,
  );
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  // Ensure cards don't overlap for wide stage lists (9 stages needs ~1720px)
  const planWidth = Math.max(1280, 280 + flightConfig.stages.length * 170);

  const currentStage =
    flightConfig.stages.find((stage) => stage.stageId === currentSlot?.stageId) ?? null;
  const currentStageLabel = currentSlot?.stageLabel ?? currentStage?.label;
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
        width={planWidth}
        height={140}
        onNodeClick={
          onGoToSlot
            ? (stageId) => {
                if (stageId === currentSlot?.stageId) return;
                const slotIdx = stageIdToSlotIndex.get(stageId) ?? -1;
                if (slotIdx >= 0) onGoToSlot(slotIdx);
              }
            : undefined
        }
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
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
              className="min-h-10 rounded-lg border border-amber-400/20 px-3 text-sm text-amber-200 transition-colors hover:bg-amber-400/10"
            >
              Swap
            </button>
            <button
              type="button"
              onClick={onNext}
              className={[
                'min-h-10 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition-shadow hover:bg-cyan-400',
                isModuleFinished
                  ? 'ring-2 ring-cyan-200 ring-offset-2 ring-offset-[#0d1117] shadow-[0_0_18px_rgba(34,211,238,0.45)]'
                  : '',
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
