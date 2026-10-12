'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, DraftingCompass, LockKeyhole, Radar, Sparkles, X } from 'lucide-react';
import { DesignBlueprint } from './design-blueprint';
import type { WorldFlightInvestigationProgress } from '@/lib/world-flight/investigations';

export function InvestigationProgressPanel({
  investigations,
  onLaunchDesignMission,
  onPracticeMission,
  practiceBusyId,
  practiceError,
}: {
  investigations: WorldFlightInvestigationProgress[];
  onLaunchDesignMission?: (investigationId: string) => void;
  /** Try a mission before the class has unlocked it, using three city lessons from the library. Never saved. */
  onPracticeMission?: (investigationId: string) => void;
  practiceBusyId?: string | null;
  practiceError?: string | null;
}) {
  const [openBlueprintId, setOpenBlueprintId] = useState<string | null>(null);
  const openBlueprint = investigations.find((investigation) => investigation.id === openBlueprintId && investigation.completedBlueprint) ?? null;
  const readyCount = investigations.filter((investigation) => investigation.designMissionStatus === 'ready').length;
  const completedCount = investigations.filter((investigation) => investigation.designMissionStatus === 'completed').length;
  const evidenceCount = investigations.reduce((total, investigation) => total + investigation.completedCount, 0);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {practiceError && <p role="alert" className="border-b border-red-300/20 bg-red-400/10 px-5 py-3 text-xs text-red-200">{practiceError}</p>}
      <section className="border-b border-white/15 bg-cyan-300/[0.055] px-5 py-5">
        <p className="font-instrument flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/85">
          <Radar className="h-4 w-4" aria-hidden />
          Design missions
        </p>
        <h2 className="font-display mt-2 text-2xl text-lc-text">Connect what the class discovers.</h2>
        <p className="mt-2 text-xs leading-relaxed text-lc-text2">
          Completed city lessons collect field notes. Visit three different cities to unlock each design mission.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
          <MissionStat label="Field notes" value={evidenceCount} />
          <MissionStat label="Ready" value={readyCount} />
          <MissionStat label="Completed" value={completedCount} />
        </div>
      </section>

      <div className="space-y-0">
        {investigations.map((investigation) => (
          <section key={investigation.id} className="border-b border-white/15 px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-lc-text">{investigation.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-lc-text2">{investigation.question}</p>
              </div>
              <span className={`shrink-0 text-xs font-semibold ${investigation.complete ? 'text-lc-success' : 'text-cyan-100/80'}`}>
                {investigation.completedCount}/{investigation.totalCount}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {investigation.requirements.map((requirement) => (
                <div key={requirement.id} className="flex items-start gap-2.5 text-xs">
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                    requirement.complete
                      ? 'border-lc-success/40 bg-lc-success/15 text-lc-success'
                        : 'border-white/35 text-transparent'
                  }`}>
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className={requirement.complete ? 'font-medium text-lc-text' : 'text-lc-text2'}>{requirement.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-lc-text2">{requirement.description}</span>
                    {requirement.evidence && (
                      <span className="mt-1 block text-[11px] font-semibold text-violet-200/90">
                        {requirement.evidence.city}: {requirement.evidence.focusTitle}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className={`mt-4 flex items-center gap-1.5 border-t border-white/15 pt-3 text-[11px] font-semibold uppercase tracking-wide ${
              investigation.designMissionStatus === 'completed'
                ? 'text-lc-success'
                : investigation.complete ? 'text-lc-amber' : 'text-lc-text2'
            }`}>
              {investigation.designMissionStatus === 'completed'
                ? <Check className="h-3 w-3" aria-hidden />
                : investigation.complete
                ? <Sparkles className="h-3 w-3" aria-hidden />
                : <LockKeyhole className="h-3 w-3" aria-hidden />}
              {investigation.designMissionStatus === 'completed'
                ? `Completed: ${investigation.completedDesignTitle}`
                : investigation.complete
                ? `Design mission ready: ${investigation.designMissionTitle}`
                : 'Design mission locked'}
            </div>
            {investigation.designMissionStatus === 'locked' && onPracticeMission && (
              <button
                type="button"
                onClick={() => onPracticeMission(investigation.id)}
                disabled={Boolean(practiceBusyId)}
                title="Runs the mission with three city lessons from the library. Nothing is saved to the class journey."
                className="mt-3 flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-white/15 px-3 text-xs font-semibold text-lc-text2 transition-colors hover:border-white/30 hover:text-lc-text disabled:opacity-60"
              >
                <DraftingCompass className="h-3.5 w-3.5" aria-hidden />
                {practiceBusyId === investigation.id ? 'Starting…' : 'Try a practice run'}
              </button>
            )}
            {investigation.designMissionStatus === 'completed' && investigation.completedBlueprint && (
              <button
                type="button"
                onClick={() => setOpenBlueprintId(investigation.id)}
                className="mt-3 flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-lc-success/30 bg-lc-success/10 px-3 text-xs font-semibold text-lc-success transition-colors hover:bg-lc-success/15"
              >
                <DraftingCompass className="h-3.5 w-3.5" aria-hidden />
                Open blueprint
              </button>
            )}
            {investigation.designMissionStatus === 'ready' && onLaunchDesignMission && (
              <button
                type="button"
                onClick={() => onLaunchDesignMission(investigation.id)}
                className="mt-3 flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-lc-amber/30 bg-lc-amber/10 px-3 text-xs font-semibold text-lc-amber transition-colors hover:bg-lc-amber/15"
              >
                <DraftingCompass className="h-3.5 w-3.5" aria-hidden />
                Launch {investigation.designMissionTitle}
              </button>
            )}
          </section>
        ))}
      </div>
      {/* The class's finished design, reopened full screen (portalled out of the narrow side panel). */}
      {openBlueprint?.completedBlueprint && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#05070d]/90 p-4 backdrop-blur-sm sm:p-10" role="dialog" aria-modal="true" aria-label={`${openBlueprint.title} blueprint`} onClick={() => setOpenBlueprintId(null)}>
          <button type="button" onClick={() => setOpenBlueprintId(null)} className="fixed right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1.5 text-sm text-white hover:bg-slate-900">
            <X className="h-4 w-4" aria-hidden /> Close
          </button>
          <div className="py-8" onClick={(event) => event.stopPropagation()}>
            <DesignBlueprint
              brief={openBlueprint.completedBlueprint.brief}
              decisions={openBlueprint.completedBlueprint.decisions}
              cities={openBlueprint.requirements.flatMap((requirement) => (requirement.evidence ? [{ city: requirement.evidence.city, found: requirement.evidence.focusTitle }] : []))}
              missionTitle={openBlueprint.title}
              completedAt={openBlueprint.designMissionCompletedAt}
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function MissionStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-lc-text2">{label}</p>
      <p className="mt-1 text-lg font-bold text-lc-text">{value}</p>
    </div>
  );
}
