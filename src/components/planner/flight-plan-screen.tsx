'use client';

import { usePlannerStore } from '@/stores/planner-store';
import { GOAL_LABELS } from '@/lib/flight-plan-config';
import { ReplaceDrawer } from './replace-drawer';
import { ArrowLeft, RefreshCw, ArrowRight, Plus, X, Sparkles } from 'lucide-react';
import { getModuleDisplayInfo, isUndeterminedModule } from '@/lib/planner-utils';

const SLOT_COLORS: Record<string, string> = {
  takeoff:      'text-amber-400 bg-amber-500/10 border-amber-500/30',
  presentation: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  practice:     'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  production:   'text-violet-400 bg-violet-500/10 border-violet-500/30',
  landing:      'text-teal-400 bg-teal-500/10 border-teal-500/30',
};

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
    removeModule,
  } = usePlannerStore();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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

      {/* Module list editor — vertical, scales to any module count */}
      <div className="space-y-1">
        <InsertButton onClick={() => setInsertAfterIndex(-1)} />

        {modules.map((mod, i) => {
          const undetermined = isUndeterminedModule(mod);
          const info = getModuleDisplayInfo(mod.key);
          const colors = SLOT_COLORS[mod.slotType] ?? SLOT_COLORS.practice;
          const Icon = undetermined ? Sparkles : info?.icon;
          const name = undetermined ? 'Waypoint' : (info?.name ?? mod.key);

          return (
            <div key={mod.id}>
              <div className="flex items-center gap-3 bg-lc-card border border-lc-border rounded-xl px-4 py-3 group hover:border-lc-blue/40 transition-all">
                {/* Slot badge */}
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors} w-24 text-center shrink-0`}>
                  {mod.slotType}
                </span>

                {/* Icon + name */}
                <button
                  onClick={() => setReplaceDrawerModuleId(mod.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left hover:text-lc-blue transition-colors"
                  title="Click to replace"
                >
                  {Icon && <Icon className="w-4 h-4 text-lc-text3 shrink-0" />}
                  <span className="text-sm font-medium text-lc-text truncate">{name}</span>
                  <span className="text-xs text-lc-text3 ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">swap ↗</span>
                </button>

                {/* Remove button */}
                {modules.length > 1 && (
                  <button
                    onClick={() => removeModule(mod.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-lc-text3 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Remove module"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <InsertButton onClick={() => setInsertAfterIndex(i)} />
            </div>
          );
        })}
      </div>

      <p className="text-xs text-lc-text3 text-center -mt-2">
        Click any module to swap it · use + to add more
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

function InsertButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center gap-2 py-0.5 group/insert">
      <div className="flex-1 h-px bg-lc-border group-hover/insert:bg-lc-blue/30 transition-colors" />
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-lc-text3 hover:text-lc-blue hover:bg-lc-blue/10 border border-transparent hover:border-lc-blue/30 transition-all opacity-0 group-hover/insert:opacity-100"
      >
        <Plus className="w-3 h-3" />
        Add
      </button>
      <div className="flex-1 h-px bg-lc-border group-hover/insert:bg-lc-blue/30 transition-colors" />
    </div>
  );
}
