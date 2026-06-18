'use client';

// Grammar Clarify — the "teach the rule" step before the drills. Teacher-presented
// (projected); no student-device input. Content is pre-generated around the lesson's
// grammar target + topic, with depth scaled by whether a grammar source already taught it.

import { useEffect } from 'react';
import { BookOpen, Lightbulb, AlertTriangle } from 'lucide-react';
import type { ActivityProps, GrammarClarifyContent } from '../types';

export function GrammarClarifyActivity({ generatedContent, onSetInputSpec }: ActivityProps) {
  const content = generatedContent as GrammarClarifyContent;
  const target = content?.grammarTarget ?? 'the target structure';

  // No student-device input — this is a teacher-presented explainer.
  useEffect(() => {
    onSetInputSpec?.(null);
    return () => onSetInputSpec?.(null);
  }, [onSetInputSpec]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-sky-400" aria-hidden />
        <h3 className="text-lg font-semibold text-sky-400">
          Today&apos;s structure: <span className="text-white">{target}</span>
        </h3>
      </div>

      {content?.form && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-lc-text3">How it works</p>
          <p className="text-base text-white">{content.form}</p>
        </div>
      )}

      {content?.examples?.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-lc-text3">Examples</p>
          <ul className="space-y-1.5">
            {content.examples.map((ex, i) => (
              <li key={i} className="text-base text-white">• {ex}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {content?.whenToUse && (
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-200/80">
              <Lightbulb className="h-3.5 w-3.5" aria-hidden /> When to use it
            </p>
            <p className="text-sm text-white/90">{content.whenToUse}</p>
          </div>
        )}
        {content?.pitfall && (
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-200/80">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Watch out
            </p>
            <p className="text-sm text-white/90">{content.pitfall}</p>
          </div>
        )}
      </div>
    </div>
  );
}
