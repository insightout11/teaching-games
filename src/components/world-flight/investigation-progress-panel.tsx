'use client';

import { Check, DraftingCompass, FlaskConical, LockKeyhole, Sparkles } from 'lucide-react';
import type { WorldFlightInvestigationProgress } from '@/lib/world-flight/investigations';

export function InvestigationProgressPanel({
  investigations,
  onLaunchDesignMission,
}: {
  investigations: WorldFlightInvestigationProgress[];
  onLaunchDesignMission?: (investigationId: string) => void;
}) {
  const readyCount = investigations.filter((investigation) => investigation.designMissionStatus === 'ready').length;
  const completedCount = investigations.filter((investigation) => investigation.designMissionStatus === 'completed').length;
  const evidenceCount = investigations.reduce((total, investigation) => total + investigation.completedCount, 0);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="border-b border-white/10 bg-cyan-300/[0.035] px-5 py-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
          <FlaskConical className="h-4 w-4" aria-hidden />
          Cross-city investigations
        </p>
        <h2 className="mt-2 text-2xl font-bold text-lc-text">Connect what the class discovers.</h2>
        <p className="mt-2 text-xs leading-relaxed text-lc-text3">
          Completed city lessons automatically collect evidence. Three different cities unlock each Design Mission.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
          <MissionStat label="Evidence" value={evidenceCount} />
          <MissionStat label="Ready" value={readyCount} />
          <MissionStat label="Completed" value={completedCount} />
        </div>
      </section>

      <div className="space-y-0">
        {investigations.map((investigation) => (
          <section key={investigation.id} className="border-b border-white/10 px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-lc-text">{investigation.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-lc-text3">{investigation.question}</p>
              </div>
              <span className={`shrink-0 text-xs font-semibold ${investigation.complete ? 'text-lc-success' : 'text-cyan-200/70'}`}>
                {investigation.completedCount}/{investigation.totalCount}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {investigation.requirements.map((requirement) => (
                <div key={requirement.id} className="flex items-start gap-2.5 text-xs">
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                    requirement.complete
                      ? 'border-lc-success/40 bg-lc-success/15 text-lc-success'
                      : 'border-white/15 text-transparent'
                  }`}>
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className={requirement.complete ? 'text-lc-text2' : 'text-lc-text3'}>{requirement.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-lc-text3">{requirement.description}</span>
                    {requirement.evidence && (
                      <span className="mt-1 block text-[10px] font-semibold text-cyan-200/60">
                        {requirement.evidence.city}: {requirement.evidence.focusTitle}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className={`mt-4 flex items-center gap-1.5 border-t border-white/10 pt-3 text-[10px] font-semibold uppercase tracking-wider ${
              investigation.designMissionStatus === 'completed'
                ? 'text-lc-success'
                : investigation.complete ? 'text-lc-amber' : 'text-lc-text3'
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
    </div>
  );
}

function MissionStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-lc-text3">{label}</p>
      <p className="mt-1 text-lg font-bold text-lc-text">{value}</p>
    </div>
  );
}
