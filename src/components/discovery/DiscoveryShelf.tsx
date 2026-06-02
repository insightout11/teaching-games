'use client';

// A teacher-job shelf: header + horizontal scroll-snap rail with partial card peek,
// edge fade masks, and arrow paging. Thin shelves (≤4) fall back to a grid so a rail
// never looks broken/sparse. No auto-scrolling.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiscoveryItem } from '@/lib/discovery-shelves';
import { LessonCard } from './LessonCard';

interface DiscoveryShelfProps {
  label: string;
  description: string;
  items: DiscoveryItem[];
  onSelect: (item: DiscoveryItem) => void;
  viewAllHref?: string;
}

export function DiscoveryShelf({
  label,
  description,
  items,
  onSelect,
  viewAllHref = '/explore',
}: DiscoveryShelfProps) {
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
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows, items.length]);

  function page(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  const isGrid = items.length <= 4;

  return (
    <section aria-label={label} className="relative">
      {/* Header */}
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-lc-text">{label}</h2>
          <p className="mt-0.5 truncate text-[13px] text-lc-text3">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isGrid && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <ShelfArrow direction="left" disabled={!canLeft} onClick={() => page(-1)} />
              <ShelfArrow direction="right" disabled={!canRight} onClick={() => page(1)} />
            </div>
          )}
          <Link
            href={viewAllHref}
            className="font-instrument inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-cyan-400/80 transition-colors hover:text-cyan-300"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      {isGrid ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <LessonCard key={item.key} item={item} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Edge fade masks */}
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-lc-bg to-transparent transition-opacity',
              canLeft ? 'opacity-100' : 'opacity-0',
            )}
          />
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-lc-bg to-transparent transition-opacity',
              canRight ? 'opacity-100' : 'opacity-0',
            )}
          />
          <div
            ref={scrollerRef}
            onScroll={updateArrows}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item) => (
              <div key={item.key} className="w-[300px] shrink-0 snap-start">
                <LessonCard item={item} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ShelfArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full border border-lc-border bg-lc-card/80 text-lc-text2 transition-colors',
        disabled ? 'cursor-not-allowed opacity-30' : 'hover:border-cyan-400/40 hover:text-lc-text',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
