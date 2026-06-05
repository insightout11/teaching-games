'use client';

// A teacher-job shelf. Improved horizontal snap-rail (restored + fixed from the old
// version that was removed in bbc1d3f): whole cards that snap cleanly (no half-clipped
// "peek"), soft edge fades that signal more content, and large circular paging buttons
// (not tiny chevrons). Falls back to a grid when there are too few items to scroll.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DiscoveryItem } from '@/lib/discovery-shelves';
import { DiscoveryCard } from './DiscoveryCard';

interface DiscoveryShelfProps {
  label: string;
  description: string;
  items: DiscoveryItem[];
  onSelect: (item: DiscoveryItem) => void;
  viewAllHref?: string;
}

// Below this count a rail looks sparse — render a grid instead.
const RAIL_MIN = 5;
// Cap the rail length; the rest live in Browse via "View all".
const RAIL_MAX = 12;

export function DiscoveryShelf({
  label,
  description,
  items,
  onSelect,
  viewAllHref = '/explore',
}: DiscoveryShelfProps) {
  const isRail = items.length >= RAIL_MIN;
  const shown = isRail ? items.slice(0, RAIL_MAX) : items.slice(0, 4);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    if (!isRail) return;
    updateArrows();
    const el = scrollerRef.current;
    el?.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el?.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [isRail, updateArrows]);

  const page = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section aria-label={label}>
      {/* Branded header: accent tick + big title + glow rule + view all */}
      <div className="mb-5">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <span aria-hidden className="h-6 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            <h2 className="text-2xl font-bold tracking-tight text-lc-text">{label}</h2>
          </div>
          <div className="hud-rule hidden sm:block" aria-hidden />
          <Link
            href={viewAllHref}
            className="font-instrument inline-flex shrink-0 items-center gap-1 text-[11px] uppercase tracking-wider text-cyan-300/80 transition-colors hover:text-cyan-200"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <p className="mt-1.5 text-sm text-lc-text3">{description}</p>
      </div>

      {isRail ? (
        <div className="relative">
          {/* Edge fades — signal that more is off-screen without clipping a card hard */}
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#060b16] to-transparent transition-opacity duration-300 ${canLeft ? 'opacity-100' : 'opacity-0'}`}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#060b16] to-transparent transition-opacity duration-300 ${canRight ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Paging buttons — large, circular, only when there's somewhere to go */}
          {canLeft && (
            <button
              type="button"
              onClick={() => page(-1)}
              aria-label="Scroll left"
              className="absolute -left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/30 bg-[#0a1424]/90 text-lc-text shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)] backdrop-blur transition-all hover:border-cyan-300/70 hover:bg-[#0d1a30]"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
          )}
          {canRight && (
            <button
              type="button"
              onClick={() => page(1)}
              aria-label="Scroll right"
              className="absolute -right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/30 bg-[#0a1424]/90 text-lc-text shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)] backdrop-blur transition-all hover:border-cyan-300/70 hover:bg-[#0d1a30]"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          )}

          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {shown.map((item) => (
              <div key={item.key} className="w-[300px] shrink-0 snap-start sm:w-[320px]">
                <DiscoveryCard item={item} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {shown.map((item) => (
            <DiscoveryCard key={item.key} item={item} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}
