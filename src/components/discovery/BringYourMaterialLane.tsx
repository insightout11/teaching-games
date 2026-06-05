'use client';

// "Build from your material" lane — the third way to start a whole lesson (alongside
// Full Flights and Special Features): bring a video, article/PDF, or topic and we
// sequence the lesson around it. Deliberate, BYO-content intent — so these are
// action LAUNCHPADS (input-forward), not playful themed feature tickets.
//
// PROTOTYPE: presentational for now. Wiring to the source/topic build flow is a
// follow-up. See docs/home-screen-redesign-audit-jun2026.md.

import { Video, FileText, Type, ArrowRight } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

interface MaterialTile {
  id: string;
  title: string;
  blurb: string;
  icon: ComponentType<{ className?: string }>;
  ring: string;
  iconWrap: string;
}

const TILES: MaterialTile[] = [
  {
    id: 'from-video', title: 'From a video', blurb: 'Drop a YouTube or TED link — comprehension, talk, and a game, built around it.',
    icon: Video, ring: 'border-cyan-300/30 hover:border-cyan-300/65', iconWrap: 'border-cyan-300/30 bg-cyan-400/12 text-cyan-200',
  },
  {
    id: 'from-reading', title: 'From an article or PDF', blurb: 'Paste a reading and get a full lesson — vocabulary, questions, discussion.',
    icon: FileText, ring: 'border-emerald-300/30 hover:border-emerald-300/65', iconWrap: 'border-emerald-300/30 bg-emerald-400/12 text-emerald-200',
  },
  {
    id: 'from-topic', title: 'From a topic', blurb: 'Just name a theme — we generate the source brief and the whole sequence.',
    icon: Type, ring: 'border-amber-300/30 hover:border-amber-300/65', iconWrap: 'border-amber-300/30 bg-amber-400/12 text-amber-200',
  },
];

export function BringYourMaterialLane() {
  return (
    <section aria-label="Build from your material">
      <div className="mb-5">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <span aria-hidden className="h-6 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            <h2 className="text-2xl font-bold tracking-tight text-lc-text">Build from your material</h2>
          </div>
          <div className="hud-rule hidden sm:block" aria-hidden />
        </div>
        <p className="mt-1.5 text-sm text-lc-text3">Bring a video, reading, or topic — we sequence the whole lesson around it.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {TILES.map(({ id, title, blurb, icon: Icon, ring, iconWrap }) => (
          <button
            key={id}
            type="button"
            className={cn(
              'group relative flex flex-col items-start overflow-hidden rounded-2xl border bg-white/[0.03] p-6 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/[0.05]',
              ring,
            )}
          >
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.05] to-transparent" />
            <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl border', iconWrap)}>
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-lg font-bold text-lc-text">{title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-lc-text2">{blurb}</p>
            <span className="font-instrument mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-lc-text2 transition-colors group-hover:text-lc-text">
              Build a lesson
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
