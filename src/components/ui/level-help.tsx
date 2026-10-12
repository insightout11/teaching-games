'use client';

import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { DIFFICULTIES, LEVEL_INFO } from '@/lib/difficulty';

/**
 * "What do the levels mean?" A small help button for anywhere a level is chosen or shown: hover, focus or tap it
 * for the five levels, their international letters and one line on each.
 */
export function LevelHelp({ align = 'left', className = '' }: { align?: 'left' | 'right'; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`relative inline-flex ${className}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label="What do the levels mean?"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="rounded-full p-1 text-white/45 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute top-full z-50 mt-1 w-[min(22rem,80vw)] rounded-xl border border-white/10 bg-[#0a121e] p-3 text-left shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">What the levels mean</span>
          <span className="mt-2 block space-y-1.5">
            {DIFFICULTIES.map((d) => (
              <span key={d} className="flex gap-2 text-xs leading-snug">
                <span className="w-[7.5rem] shrink-0 font-semibold text-white">{d} <span className="font-mono text-amber-200/90">{LEVEL_INFO[d].cefr}</span></span>
                <span className="text-white/65">{LEVEL_INFO[d].means}</span>
              </span>
            ))}
          </span>
          <span className="mt-2 block text-[11px] leading-snug text-white/40">The letters are the CEFR scale, the international standard used by schools, coursebooks and exams.</span>
        </span>
      )}
    </span>
  );
}
