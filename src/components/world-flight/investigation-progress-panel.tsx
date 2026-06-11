'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, FlaskConical, LockKeyhole, Sparkles } from 'lucide-react';
import type { WorldFlightInvestigationProgress } from '@/lib/world-flight/investigations';

export function InvestigationProgressPanel({
  investigations,
}: {
  investigations: WorldFlightInvestigationProgress[];
}) {
  const [open, setOpen] = useState(false);
  const completed = investigations.filter((investigation) => investigation.complete).length;
  const closest = [...investigations].sort((a, b) => b.completedCount - a.completedCount)[0];

  return (
    <div className="border-t border-white/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.035]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-200">
          <FlaskConical className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lc-text2">
            Investigations
            {completed > 0 && (
              <span className="rounded-full border border-lc-success/25 bg-lc-success/10 px-1.5 py-0.5 text-[9px] tracking-normal text-lc-success">
                {completed} ready
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-lc-text3">
            {closest?.completedCount
              ? `${closest.title}: ${closest.completedCount}/${closest.totalCount} evidence found`
              : 'Completed city lessons automatically collect evidence'}
          </span>
        </span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-lc-text3" aria-hidden />
          : <ChevronDown className="h-4 w-4 shrink-0 text-lc-text3" aria-hidden />}
      </button>

      {open && (
        <div className="max-h-[330px] space-y-3 overflow-y-auto border-t border-white/10 px-5 py-4">
          {investigations.map((investigation) => (
            <section key={investigation.id} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-lc-text">{investigation.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-lc-text3">{investigation.question}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold ${investigation.complete ? 'text-lc-success' : 'text-cyan-200/70'}`}>
                  {investigation.completedCount}/{investigation.totalCount}
                </span>
              </div>

              <div className="mt-2.5 space-y-1.5">
                {investigation.requirements.map((requirement) => (
                  <div key={requirement.id} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                      requirement.complete
                        ? 'border-lc-success/40 bg-lc-success/15 text-lc-success'
                        : 'border-white/15 text-transparent'
                    }`}>
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className={requirement.complete ? 'text-lc-text2' : 'text-lc-text3'}>
                        {requirement.label}
                      </span>
                      {requirement.evidence && (
                        <span className="block truncate text-[10px] text-cyan-200/55">
                          {requirement.evidence.city}: {requirement.evidence.focusTitle}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                investigation.complete ? 'text-lc-amber' : 'text-lc-text3'
              }`}>
                {investigation.complete
                  ? <Sparkles className="h-3 w-3" aria-hidden />
                  : <LockKeyhole className="h-3 w-3" aria-hidden />}
                {investigation.complete
                  ? `Design mission ready: ${investigation.designMissionTitle}`
                  : 'Design mission locked'}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
