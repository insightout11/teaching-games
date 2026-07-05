'use client';

import { Users } from 'lucide-react';
import { GOAL_LABELS, getClassSizeMetadata } from '@/lib/flight-plan-config';
import type { FlightPlanPreset } from '@/lib/flight-plan-presets';
import { goalToScoringMode } from '@/stores/session-store';
import type { ScoringMode } from '@/stores/session-store';
import { usePlannerStore } from '@/stores/planner-store';

/**
 * Highest `minStudents` across the preset's modules (takeoff, middle sequence, landing).
 * When ≥ 2, the preset contains a stage that needs a partner — warn solo classes up front.
 * Derived from plugin metadata via getClassSizeMetadata (single source of truth).
 */
function presetMinStudents(preset: FlightPlanPreset): number {
  const keys = [preset.takeoff, preset.landing, ...preset.moduleSequence.map((m) => m.key)]
    .filter((k): k is string => Boolean(k));
  return keys.reduce((max, key) => Math.max(max, getClassSizeMetadata(key)?.minStudents ?? 1), 1);
}

const SCORING_MODE_LABELS: Record<ScoringMode, string> = {
  competitive: 'Competitive',
  accuracy: 'Accuracy',
  participation: 'Participation',
};

const SCORING_MODE_CLASSES: Record<ScoringMode, string> = {
  competitive: 'text-amber-400 bg-amber-400/10',
  accuracy: 'text-lc-blue bg-lc-blue/10',
  participation: 'text-emerald-400 bg-emerald-400/10',
};

export function PresetCard({
  preset,
  disabled = false,
  onClick,
}: {
  preset: FlightPlanPreset;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const { loadPreset, setStep } = usePlannerStore();

  const handleClick = () => {
    if (disabled) return;
    if (onClick) { onClick(); return; }
    loadPreset(preset);
    setStep('flight-plan');
  };

  const scoringMode = preset.scoringMode ?? goalToScoringMode(preset.goal);
  const moduleCount = preset.moduleSequence.length + (preset.skipTakeoffLanding ? 0 : 2);
  const minStudents = presetMinStudents(preset);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`text-left p-4 bg-lc-surface rounded-xl border border-lc-border transition-all duration-200 group ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-lc-blue/50 hover:bg-lc-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-lc-blue/10 active:translate-y-0 active:scale-[0.99]'
      }`}
    >
      <h3 className="font-semibold text-lc-text group-hover:text-lc-blue transition-colors">
        {preset.name}
      </h3>
      <p className="text-sm text-lc-text2 mt-1">{preset.description}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-lc-text3">
        <span>{preset.lessonDurationMinutes} min</span>
        <span className="w-1 h-1 rounded-full bg-lc-border" />
        <span>{GOAL_LABELS[preset.goal]}</span>
        <span className="w-1 h-1 rounded-full bg-lc-border" />
        <span>{moduleCount} {moduleCount === 1 ? 'module' : 'modules'}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${SCORING_MODE_CLASSES[scoringMode]}`}>
          {SCORING_MODE_LABELS[scoringMode]}
        </span>
        {minStudents >= 2 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-lc-text2 bg-lc-border/40">
            <Users className="h-3 w-3" />
            Best with {minStudents}+
          </span>
        )}
      </div>
    </button>
  );
}
