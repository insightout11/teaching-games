'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { FLIGHT_PLAN_PRESETS, type FlightPlanPreset } from '@/lib/flight-plan-presets';
import { PresetCard } from './preset-card';
import { ScenarioPickerModal } from './scenario-picker-modal';
import { SourceInputPanel } from './source-input-panel';
import { DescribePanel } from './describe-panel';
import { Paperclip } from 'lucide-react';

export function MissionSetupScreen() {
  const { sourceMaterial, setTopic, setStep, loadPreset } = usePlannerStore();
  const [pendingPreset, setPendingPreset] = useState<FlightPlanPreset | null>(null);
  const [showSource, setShowSource] = useState(false);

  function handlePresetClick(preset: FlightPlanPreset) {
    // Source-backed lessons and presets without scenarios load directly.
    if (sourceMaterial || !preset.scenarios) {
      loadPreset(preset);
      setStep('flight-plan');
      return;
    }
    setPendingPreset(preset);
  }

  const sourceOpen = showSource || !!sourceMaterial;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Create — one flow: describe + level/time chips (merges old Describe + Build) */}
      <DescribePanel />

      {/* Optional source material — collapsed so it never buries the main input */}
      <div>
        {sourceOpen ? (
          <SourceInputPanel />
        ) : (
          <button
            onClick={() => setShowSource(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-lc-border bg-lc-surface/60 px-4 py-3.5 text-sm font-semibold text-lc-text2 hover:border-lc-blue/50 hover:bg-lc-blue/5 hover:text-lc-text transition-all"
          >
            <Paperclip className="h-4 w-4 text-lc-blue" />
            Add a video, reading, or document
            <span className="font-normal text-lc-text3">— optional</span>
          </button>
        )}
      </div>

      {/* Templates — quick-start from a ready-made lesson */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-lc-border" />
          <span className="text-xs font-semibold uppercase tracking-wide text-lc-text3">or start from a template</span>
          <div className="flex-1 h-px bg-lc-border" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {FLIGHT_PLAN_PRESETS.map((preset) => (
            <PresetCard key={preset.id} preset={preset} onClick={() => handlePresetClick(preset)} />
          ))}
        </div>
      </div>

      {pendingPreset?.scenarios && (
        <ScenarioPickerModal
          preset={pendingPreset}
          onConfirm={(scenario) => {
            setTopic(scenario);
            loadPreset(pendingPreset);
            setStep('flight-plan');
            setPendingPreset(null);
          }}
          onCancel={() => setPendingPreset(null)}
        />
      )}
    </div>
  );
}
