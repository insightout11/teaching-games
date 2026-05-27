'use client';

import type { ReactNode } from 'react';
import type { FlightPresetConfig, FlightStageDefinition } from '@/lib/flight-plan-presets';
import type { LessonPhase, LessonSlot } from '@/hooks/use-lesson-session';

// ── Layout constants for the flight path ──────────────────────────────────
const NODE_SPACING = 88;         // px between node centres
const PAD_X = NODE_SPACING / 2;  // 44px — first/last node inset from SVG edge
const CY = 44;                   // track y-centre in SVG
const PLANE_Y = 20;              // ✈ text baseline y (sits above the track)
const SVG_H = 58;                // total SVG height
const MAIN_R = 9;                // main-stage node radius
const MICRO_R = 4;               // micro-event node radius

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
  const xs = stages.map((_, i) => PAD_X + i * NODE_SPACING);

  const trackStart = xs[0];
  const trackEnd = xs[n - 1];
  const completedEnd = currentIndex >= 0 ? xs[Math.min(currentIndex, n - 1)] : trackStart;

  // Map stageId → first matching slot index for click navigation
  const stageIdToSlotIndex = new Map<string, number>();
  slots.forEach((slot, i) => {
    if (slot.stageId && !stageIdToSlotIndex.has(slot.stageId)) {
      stageIdToSlotIndex.set(slot.stageId, i);
    }
  });

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-[#07111f]/85 px-2 pt-2 pb-3 shadow-[0_16px_48px_rgba(0,0,0,0.25)] overflow-x-auto">
      <div style={{ width: svgWidth, minWidth: svgWidth }}>

        {/* SVG: track segments + nodes + animated plane */}
        <svg
          width={svgWidth}
          height={SVG_H}
          viewBox={`0 0 ${svgWidth} ${SVG_H}`}
          className="block"
        >
          {/* Upcoming track — dashed dim */}
          <line
            x1={completedEnd} y1={CY}
            x2={trackEnd} y2={CY}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />

          {/* Completed track — solid cyan */}
          {currentIndex > 0 && (
            <line
              x1={trackStart} y1={CY}
              x2={completedEnd} y2={CY}
              stroke="rgba(34,211,238,0.50)"
              strokeWidth="1.5"
            />
          )}

          {/* Stage nodes */}
          {stages.map((stage, i) => {
            const isMicro = stage.kind === 'micro-event';
            const isCurrent = i === currentIndex;
            const isComplete = i < currentIndex;
            const r = isMicro ? MICRO_R : MAIN_R;
            const cx = xs[i];
            const slotIndex = stageIdToSlotIndex.get(stage.stageId) ?? -1;
            const isClickable = onGoToSlot && slotIndex >= 0 && !isCurrent;

            return (
              <g
                key={stage.stageId}
                onClick={isClickable ? () => onGoToSlot(slotIndex) : undefined}
                style={isClickable ? { cursor: 'pointer' } : undefined}
              >
                {/* Ambient glow ring for the current stage */}
                {isCurrent && (
                  <circle
                    cx={cx} cy={CY} r={r + 7}
                    fill="rgba(34,211,238,0.13)"
                    className="animate-pulse"
                  />
                )}

                {/* Transparent wider hit area for easier clicking */}
                {isClickable && (
                  <circle cx={cx} cy={CY} r={r + 10} fill="transparent" />
                )}

                {/* Node circle */}
                <circle
                  cx={cx} cy={CY} r={r}
                  fill={
                    isCurrent
                      ? 'rgba(34,211,238,0.95)'
                      : isComplete
                        ? 'rgba(34,211,238,0.38)'
                        : 'rgba(255,255,255,0.04)'
                  }
                  stroke={
                    isCurrent
                      ? '#22d3ee'
                      : isComplete
                        ? 'rgba(34,211,238,0.55)'
                        : 'rgba(255,255,255,0.16)'
                  }
                  strokeWidth={isCurrent ? 2 : 1.5}
                  className={isClickable && !isComplete ? 'hover:fill-white/10' : undefined}
                />

                {/* Check mark inside completed main-stage nodes */}
                {!isMicro && isComplete && (
                  <path
                    d={`M ${cx - 4} ${CY + 0.5} l 3 2.5 l 5.5 -5.5`}
                    fill="none"
                    stroke="rgba(34,211,238,0.85)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            );
          })}

          {/* Plane marker — translates smoothly when stage advances */}
          {currentIndex >= 0 && (
            <text
              x={0}
              y={PLANE_Y}
              textAnchor="middle"
              fontSize="16"
              fill="rgba(34,211,238,0.92)"
              style={{
                transform: `translateX(${xs[currentIndex]}px)`,
                transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              ✈
            </text>
          )}
        </svg>

        {/* Label row — each slot is NODE_SPACING wide, centred on its node */}
        <div className="flex">
          {stages.map((stage, i) => {
            const isMicro = stage.kind === 'micro-event';
            const isCurrent = i === currentIndex;
            const isComplete = i < currentIndex;
            const slotIndex = stageIdToSlotIndex.get(stage.stageId) ?? -1;
            const isClickable = onGoToSlot && slotIndex >= 0 && !isCurrent && !isMicro;

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
  const nextLabel = nextSlot?.stageLabel ?? nextSlot?.name;
  const isFinalSlot = currentSlotIndex + 1 >= slots.length;
  const actionLabel = isFinalSlot ? 'Complete Flight' : `Continue to ${nextLabel}`;
  const phaseLabel =
    phase === 'landing' ? 'Landing' : currentSlot?.isMicroEvent ? 'Micro-event' : 'Flight stage';

  return (
    <div className="space-y-4">
      <FlightStageBar stages={flightConfig.stages} currentStageId={currentSlot?.stageId} slots={slots} onGoToSlot={onGoToSlot} />

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
