'use client';

import type { ReactNode } from 'react';
import type { FlightPresetConfig, FlightStageDefinition } from '@/lib/flight-plan-presets';
import type { LessonPhase, LessonSlot } from '@/hooks/use-lesson-session';
import { FlightPathTrack } from '@/components/ui/flight-path-track';
import type { PathSegmentConfig, PathNodeConfig } from '@/components/ui/flight-path-track';

// ── Layout constants ───────────────────────────────────────────────────────
const NODE_SPACING = 88;
const PAD_X = NODE_SPACING / 2;  // 44 — first/last node inset
const CY = 44;                   // track y-centre
const PLANE_Y = 20;              // ✈ baseline (above track)
const SVG_H = 58;
const MAIN_R = 9;
const MICRO_R = 4;

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

function getStageIndex(stages: FlightStageDefinition[], stageId?: string | null) {
  if (!stageId) return -1;
  return stages.findIndex((s) => s.stageId === stageId);
}

function FlightStageBar({
  stages,
  currentStageId,
  slots,
  onGoToSlot,
}: {
  stages: FlightStageDefinition[];
  currentStageId?: string;
  slots: LessonSlot[];
  onGoToSlot?: (index: number) => void;
}) {
  const n = stages.length;
  const currentIndex = getStageIndex(stages, currentStageId);
  const svgWidth = PAD_X * 2 + (n - 1) * NODE_SPACING;

  // stageId → first matching slot index (for click navigation)
  const stageIdToSlotIndex = new Map<string, number>();
  slots.forEach((slot, i) => {
    if (slot.stageId && !stageIdToSlotIndex.has(slot.stageId)) {
      stageIdToSlotIndex.set(slot.stageId, i);
    }
  });

  // ── Segment configs (index i = gap between node i and node i+1) ───────
  const segments: PathSegmentConfig[] = stages.slice(1).map((_, i) => {
    // Completed when node i+1 has been reached, i.e. i < currentIndex
    const isCompleted = i < currentIndex;
    return {
      stroke: isCompleted ? 'rgba(34,211,238,0.50)' : 'rgba(255,255,255,0.08)',
      strokeDasharray: isCompleted ? undefined : '5 4',
      strokeWidth: 1.5,
    };
  });

  // ── Node configs ──────────────────────────────────────────────────────
  const nodes: PathNodeConfig[] = stages.map((stage, i) => {
    const isMicro = stage.kind === 'micro-event';
    const isCurrent = i === currentIndex;
    const isComplete = i < currentIndex;
    const slotIndex = stageIdToSlotIndex.get(stage.stageId) ?? -1;
    const isClickable = !!onGoToSlot && slotIndex >= 0 && !isCurrent;
    const r = isMicro ? MICRO_R : MAIN_R;

    return {
      r,
      fill: isCurrent
        ? 'rgba(34,211,238,0.95)'
        : isComplete
          ? 'rgba(34,211,238,0.38)'
          : 'rgba(255,255,255,0.04)',
      stroke: isCurrent
        ? '#22d3ee'
        : isComplete
          ? 'rgba(34,211,238,0.55)'
          : 'rgba(255,255,255,0.16)',
      strokeWidth: isCurrent ? 2 : 1.5,
      glow: isCurrent,
      showCheck: !isMicro && isComplete,
      hitRadius: isClickable ? r + 10 : undefined,
      onClick: isClickable ? () => onGoToSlot(slotIndex) : undefined,
    };
  });

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-[#07111f]/85 px-2 pt-2 pb-3 shadow-[0_16px_48px_rgba(0,0,0,0.25)] overflow-x-auto">
      <div style={{ width: svgWidth, minWidth: svgWidth }}>

        <FlightPathTrack
          count={n}
          nodeSpacing={NODE_SPACING}
          paddingX={PAD_X}
          cy={CY}
          svgHeight={SVG_H}
          segments={segments}
          nodes={nodes}
          planeNodeIndex={currentIndex >= 0 ? currentIndex : undefined}
          planeY={PLANE_Y}
        />

        {/* Label row — each slot is NODE_SPACING wide, centred on its node */}
        <div className="flex">
          {stages.map((stage, i) => {
            const isMicro = stage.kind === 'micro-event';
            const isCurrent = i === currentIndex;
            const isComplete = i < currentIndex;
            const slotIndex = stageIdToSlotIndex.get(stage.stageId) ?? -1;
            const isClickable = !!onGoToSlot && slotIndex >= 0 && !isCurrent && !isMicro;

            return (
              <div
                key={stage.stageId}
                style={{ width: NODE_SPACING, minWidth: NODE_SPACING }}
                onClick={isClickable ? () => onGoToSlot(slotIndex) : undefined}
                className={[
                  'shrink-0 text-center px-0.5 text-[9px] font-semibold uppercase tracking-wide leading-tight',
                  isClickable ? 'cursor-pointer hover:text-white/60 transition-colors' : '',
                  isCurrent
                    ? 'text-white'
                    : isComplete
                      ? 'text-cyan-200/60'
                      : 'text-white/25',
                ].join(' ')}
              >
                {/* micro-event slots intentionally blank — the dot is enough */}
                {!isMicro ? stage.label : null}
              </div>
            );
          })}
        </div>
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
  onGoToSlot,
  children,
}: FlightSessionViewProps) {
  const currentSlot = slots[currentSlotIndex] ?? null;
  const nextSlot = slots[currentSlotIndex + 1] ?? null;
  const currentStage =
    flightConfig.stages.find((stage) => stage.stageId === currentSlot?.stageId) ??
    null;
  const currentStageLabel = currentSlot?.stageLabel ?? currentStage?.label;
  const nextLabel = nextSlot?.stageLabel ?? nextSlot?.name;
  const isFinalSlot = currentSlotIndex + 1 >= slots.length;
  const actionLabel = isFinalSlot ? 'Complete Flight' : `Continue to ${nextLabel}`;
  const phaseLabel =
    phase === 'landing' ? 'Landing' : currentSlot?.isMicroEvent ? 'Micro-event' : 'Flight stage';

  return (
    <div className="space-y-4">
      <FlightStageBar
        stages={flightConfig.stages}
        currentStageId={currentSlot?.stageId}
        slots={slots}
        onGoToSlot={onGoToSlot}
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
