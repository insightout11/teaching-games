'use client';

// "Ready to Teach" lane — fully pre-built, ZERO-prep lessons. Each card pairs a REAL
// library source (video or article) with a real preset and a pre-chosen topic. The
// teacher picks nothing: "Launch — no prep" attaches the source, loads the preset, and
// opens the launcher straight at the class picker. Often timely (the World Cup card),
// so each card carries an occasion tag and names the exact source inside.
//
// Distinct from Full Flights (you pick the topic) and from the normal "attach your own
// source" capability. The value here is "we already chose everything — just launch."

import { useState } from 'react';
import { Video, FileText, Clock, Zap } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { CardRail } from './CardRail';
import { FeaturedFlightLaunchModal } from './FeaturedFlightLaunchModal';
import { READY_LESSONS, type ReadyLesson, type ReadySourceKind } from './ready-lessons';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import { usePlannerStore } from '@/stores/planner-store';

const SOURCE_ICON: Record<ReadySourceKind, ComponentType<{ className?: string }>> = {
  video: Video,
  article: FileText,
};
const SOURCE_LABEL: Record<ReadySourceKind, string> = {
  video: 'Video',
  article: 'Article',
};

export function ReadyToTeachLane() {
  const setSourceMaterial = usePlannerStore((s) => s.setSourceMaterial);
  const setDifficulty = usePlannerStore((s) => s.setDifficulty);
  const [active, setActive] = useState<ReadyLesson | null>(null);

  const activePreset = active ? FLIGHT_PLAN_PRESETS.find((p) => p.id === active.presetId) ?? null : null;

  function launch(lesson: ReadyLesson) {
    // Pre-load everything so the teacher only confirms the class:
    // difficulty + an optimistic source (so the launcher shows it attached), then
    // re-extract by id to enrich the grounding (same pattern as the hero handoff).
    setDifficulty(lesson.difficulty);
    setSourceMaterial({
      sourceType: lesson.sourceType,
      sourceKey: lesson.sourceId,
      title: lesson.sourceTitle,
      summary: '',
    });
    setActive(lesson);

    void (async () => {
      try {
        const res = await fetch('/api/source/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: lesson.sourceType, payload: lesson.sourceId }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.summary) return;
        setSourceMaterial({
          sourceType: lesson.sourceType,
          sourceKey: data.sourceKey ?? lesson.sourceId,
          title: data.title ?? lesson.sourceTitle,
          summary: data.summary,
          duration: data.duration,
          rawText: data.rawText,
          wordCount: data.wordCount,
        });
      } catch {
        /* keep the optimistic attach */
      }
    })();
  }

  function closeLauncher() {
    setActive(null);
    setSourceMaterial(null); // don't leave a pre-attached source behind on cancel
  }

  return (
    <section aria-label="Ready to Teach">
      <div className="mb-5">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <span aria-hidden className="h-6 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
            <h2 className="text-2xl font-bold tracking-tight text-lc-text">Ready to Teach</h2>
          </div>
          <div className="hud-rule hidden sm:block" aria-hidden />
        </div>
        <p className="mt-1.5 text-sm text-lc-text3">Complete lessons with the topic and material already chosen — zero prep, just launch.</p>
      </div>

      <CardRail itemWidthClass="w-[340px] sm:w-[440px]">
        {READY_LESSONS.map((l) => {
          const SourceIcon = SOURCE_ICON[l.sourceKind];
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => launch(l)}
              className={cn(
                'group relative flex h-full min-h-[300px] w-full flex-col items-start overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-left backdrop-blur-md transition-all hover:-translate-y-0.5',
                l.gradient,
                l.ring,
              )}
            >
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/[0.06] to-transparent" />

              {/* Occasion tag */}
              <span className={cn('font-instrument inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]', l.tagColor)}>
                {l.occasion}
              </span>

              <h3 className="mt-3 text-xl font-bold leading-tight text-lc-text">{l.title}</h3>

              {/* What's already loaded — the "no prep" proof */}
              <div className="mt-3 flex items-center gap-2 text-[12px] text-lc-text2">
                <SourceIcon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                <span className="font-instrument shrink-0 text-[10px] uppercase tracking-wider text-lc-text3">{SOURCE_LABEL[l.sourceKind]}</span>
                <span className="min-w-0 truncate">{l.sourceTitle}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[12px] text-lc-text2">
                <span className="font-instrument text-[10px] uppercase tracking-wider text-lc-text3">Topic</span>
                <span className="min-w-0 truncate">{l.topic}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-lc-text3"><Clock className="h-3.5 w-3.5" aria-hidden />≈ {l.durationMinutes} min</span>
              </div>

              {/* CTA — emphasizes zero prep */}
              <span className="mt-auto inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-3.5 py-2 text-[13px] font-semibold text-lc-text transition-colors group-hover:bg-white/[0.1]">
                <Zap className="h-4 w-4" aria-hidden />
                Launch — no prep
              </span>
            </button>
          );
        })}
      </CardRail>

      <FeaturedFlightLaunchModal
        open={!!active && !!activePreset}
        preset={activePreset}
        expandSource
        initialTopic={active?.topic}
        onClose={closeLauncher}
      />
    </section>
  );
}
