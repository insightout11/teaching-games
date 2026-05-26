'use client';

import type { ReactNode } from 'react';
import type { FlightPresetConfig, FlightStageDefinition } from '@/lib/flight-plan-presets';
import type { LessonPhase, LessonSlot } from '@/hooks/use-lesson-session';

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
  children: ReactNode;
}

function getStageIndex(stages: FlightStageDefinition[], stageId?: string | null) {
  if (!stageId) return -1;
  return stages.findIndex((stage) => stage.stageId === stageId);
}

function FlightStageBar({
  stages,
  currentStageId,
}: {
  stages: FlightStageDefinition[];
  currentStageId?: string;
}) {
  const currentIndex = getStageIndex(stages, currentStageId);

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-[#07111f]/85 px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between gap-2">
        {stages.map((stage, index) => {
          const isMicro = stage.kind === 'micro-event';
          const isCurrent = index === currentIndex;
          const isComplete = currentIndex > index;
          const isUpcoming = currentIndex < index;

          if (isMicro) {
            return (
              <div key={stage.stageId} className="flex flex-col items-center gap-1 min-w-9">
                <div
                  className={[
                    'h-3 w-3 rounded-full border transition-colors',
                    isCurrent
                      ? 'border-amber-300 bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.75)]'
                      : isComplete
                        ? 'border-cyan-300 bg-cyan-300/70'
                        : 'border-white/20 bg-white/5',
                  ].join(' ')}
                  aria-label={stage.label}
                />
                <span
                  className={[
                    'hidden text-[10px] font-medium uppercase tracking-wide sm:block',
                    isCurrent ? 'text-amber-200' : isComplete ? 'text-cyan-200/70' : 'text-white/30',
                  ].join(' ')}
                >
                  Check
                </span>
              </div>
            );
          }

          return (
            <div
              key={stage.stageId}
              className={[
                'flex min-h-11 flex-1 items-center justify-center rounded-xl border px-2 text-center text-xs font-semibold transition-colors',
                isCurrent
                  ? 'border-cyan-300 bg-cyan-300/15 text-white shadow-[0_0_18px_rgba(34,211,238,0.22)]'
                  : isComplete
                    ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100/70'
                    : isUpcoming
                      ? 'border-white/10 bg-white/[0.03] text-white/35'
                      : 'border-white/10 bg-white/[0.03] text-white/45',
              ].join(' ')}
            >
              {stage.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FlightSessionView({
  slots,
  currentSlotIndex,
  phase,
  flightConfig,
  currentModuleName,
  isModuleFinished,
  onExit,
  onSwap,
  onNext,
  children,
}: FlightSessionViewProps) {
  const currentSlot = slots[currentSlotIndex] ?? null;
  const nextSlot = slots[currentSlotIndex + 1] ?? null;
  const currentStage =
    flightConfig.stages.find((stage) => stage.stageId === currentSlot?.stageId) ??
    null;
  const nextLabel = nextSlot?.stageLabel ?? nextSlot?.name;
  const isFinalSlot = currentSlotIndex + 1 >= slots.length;
  const actionLabel = isFinalSlot ? 'Complete Flight' : `Continue to ${nextLabel}`;
  const phaseLabel = phase === 'landing' ? 'Landing' : currentSlot?.isMicroEvent ? 'Micro-event' : 'Flight stage';

  return (
    <div className="space-y-4">
      <FlightStageBar stages={flightConfig.stages} currentStageId={currentSlot?.stageId} />

      <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-100">
                {phaseLabel}
              </span>
              {currentStage && (
                <span className="text-sm font-semibold text-white">{currentStage.label}</span>
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
                isModuleFinished ? 'ring-2 ring-cyan-200 ring-offset-2 ring-offset-[#0d1117] shadow-[0_0_18px_rgba(34,211,238,0.45)]' : '',
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
