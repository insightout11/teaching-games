'use client';

import { usePlannerStore } from '@/stores/planner-store';
import { GOAL_LABELS } from '@/lib/flight-plan-config';
import { ReplaceDrawer } from './replace-drawer';
import { LessonCaptainFlightPlan } from '@/components/ui/flight-plan';
import { buildPlannerFlightPlanSteps, calculateSlotBudgets } from '@/lib/flight-plan-helpers';
import type { LessonSlot } from '@/hooks/use-lesson-session';
import { ArrowLeft, RefreshCw, ArrowRight, Plus } from 'lucide-react';

export function FlightPlanScreen() {
  const {
    topic,
    lessonDurationMinutes,
    goals,
    modules,
    setStep,
    initModules,
    setReplaceDrawerModuleId,
    setInsertAfterIndex,
    moveModule,
  } = usePlannerStore();

  // Large viewBox width → node cards shrink (by %) to fit the column with no
  // overlap and no horizontal scroll, however many modules there are.
  const planWidth = Math.max(1280, 188 * (modules.length - 1) + 470);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header bar */}
      <div className="bg-lc-card rounded-xl border border-lc-border p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lc-text truncate">{topic || 'Your lesson'}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-lc-text3">
              <span>{lessonDurationMinutes} min</span>
              {goals.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-lc-border" />
                  <span className="truncate">{goals.map((g) => GOAL_LABELS[g]).join(', ')}</span>
                </>
              )}
              <span className="w-1 h-1 rounded-full bg-lc-border" />
              <span>{modules.length} modules</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flight plan — the custom premium SVG route (same as in-session / landing).
          Fits the column (cards shrink by %); no horizontal scroll. */}
      {modules.length >= 3 && (
        <LessonCaptainFlightPlan
          steps={buildPlannerFlightPlanSteps(modules)}
          width={planWidth}
          height={Math.round(planWidth * 0.28)}
          mode="planner"
          slotBudgets={calculateSlotBudgets(lessonDurationMinutes, modules as unknown as LessonSlot[])}
          onMoveModule={(i, dir) => moveModule(i, dir === 'left' ? i - 1 : i + 1)}
          onNodeClick={(id) => setReplaceDrawerModuleId(id)}
        />
      )}

      <p className="text-xs text-lc-text3 text-center">
        Use ‹ › on a card to reorder · click a module to swap it
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setStep('mission-setup')}
          className="flex items-center gap-2 px-4 py-2.5 text-lc-text2 hover:text-lc-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setInsertAfterIndex(modules.length - 1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-lc-surface border border-lc-border rounded-xl text-sm font-medium text-lc-text2 hover:text-lc-text hover:border-lc-blue/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add module
          </button>
          <button
            onClick={() => initModules()}
            className="flex items-center gap-2 px-4 py-2.5 bg-lc-surface border border-lc-border rounded-xl text-sm font-medium text-lc-text2 hover:text-lc-text hover:border-lc-blue/40 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>

          <button
            onClick={() => setStep('launch')}
            disabled={modules.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-lc-blue text-white rounded-xl font-semibold hover:bg-lc-blue-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Replace / Insert drawer */}
      <ReplaceDrawer />
    </div>
  );
}
