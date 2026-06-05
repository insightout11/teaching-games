'use client';

// "Ready to Teach" lane — fully pre-built, ZERO-prep lessons. The lesson preset AND a
// specific topic + source are already chosen and loaded. The teacher picks nothing and
// attaches nothing — one tap and they're teaching. Often timely (a holiday, a trending
// story), so each card carries an occasion tag and names the exact source inside.
//
// Distinct from Full Flights (you pick the topic) and from the normal "attach your own
// source" capability (that exists on every lesson). The value here is "we already chose
// everything — just launch."
//
// PROTOTYPE: SAMPLE_READY_LESSONS are placeholder visuals while the real curated set is
// built. See docs/home-screen-redesign-audit-jun2026.md.

import { Video, FileText, Type, Clock, Zap } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { CardRail } from './CardRail';

type SourceKind = 'video' | 'article' | 'topic';

interface ReadyLesson {
  id: string;
  occasion: string;
  title: string;
  /** The exact pre-chosen source, named so it's clearly "already done". */
  sourceKind: SourceKind;
  sourceTitle: string;
  lessonType: string;
  durationMinutes: number;
  gradient: string;
  ring: string;
  tagColor: string;
  preview?: boolean;
}

const SOURCE_ICON: Record<SourceKind, ComponentType<{ className?: string }>> = {
  video: Video,
  article: FileText,
  topic: Type,
};
const SOURCE_LABEL: Record<SourceKind, string> = {
  video: 'Video',
  article: 'Article',
  topic: 'Topic',
};

// ── PROTOTYPE sample data ─────────────────────────────────────────────────────
const SAMPLE_READY_LESSONS: ReadyLesson[] = [
  {
    id: 'ready-thanksgiving', occasion: 'Seasonal', title: 'Gratitude & Traditions',
    sourceKind: 'article', sourceTitle: '“A Short History of Thanksgiving”', lessonType: 'Speaking Circle', durationMinutes: 60,
    gradient: 'from-amber-500/25 via-orange-500/10 to-transparent', ring: 'border-amber-300/35 hover:border-amber-300/70',
    tagColor: 'text-amber-200 border-amber-300/30 bg-amber-400/10',
  },
  {
    id: 'ready-consumerism', occasion: 'Trending', title: 'Why We Buy Things We Don’t Need',
    sourceKind: 'video', sourceTitle: 'TED — The psychology of impulse buying', lessonType: 'Debate Ready', durationMinutes: 60,
    gradient: 'from-violet-500/25 via-fuchsia-500/10 to-transparent', ring: 'border-violet-300/35 hover:border-violet-300/70',
    tagColor: 'text-violet-200 border-violet-300/30 bg-violet-400/10',
  },
  {
    id: 'ready-new-year', occasion: 'Seasonal', title: 'New Year, New Goals',
    sourceKind: 'topic', sourceTitle: 'Resolutions & habits', lessonType: 'Conversation Rounds', durationMinutes: 45,
    gradient: 'from-cyan-500/25 via-sky-500/10 to-transparent', ring: 'border-cyan-300/35 hover:border-cyan-300/70',
    tagColor: 'text-cyan-200 border-cyan-300/30 bg-cyan-400/10',
  },
];
// ──────────────────────────────────────────────────────────────────────────────

export function ReadyToTeachLane() {
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
        {SAMPLE_READY_LESSONS.map((l) => {
          const SourceIcon = SOURCE_ICON[l.sourceKind];
          return (
            <button
              key={l.id}
              type="button"
              className={cn(
                'group relative flex h-full flex-col items-start overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-left backdrop-blur-md transition-all hover:-translate-y-0.5',
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
                <span className="font-instrument text-[10px] uppercase tracking-wider text-lc-text3">Lesson</span>
                <span>{l.lessonType}</span>
                <span className="inline-flex items-center gap-1 text-lc-text3"><Clock className="h-3.5 w-3.5" aria-hidden />≈ {l.durationMinutes} min</span>
              </div>

              {/* CTA — emphasizes zero prep */}
              <span className="mt-auto inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-3.5 py-2 text-[13px] font-semibold text-lc-text transition-colors group-hover:bg-white/[0.1]">
                <Zap className="h-4 w-4" aria-hidden />
                Launch — no prep
              </span>

              {l.preview && (
                <span className="font-instrument absolute right-4 top-5 rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-lc-text3">
                  Preview
                </span>
              )}
            </button>
          );
        })}
      </CardRail>
    </section>
  );
}
