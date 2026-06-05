'use client';

// Reusable horizontal snap-rail used by every home lane (shelves + featured lanes).
// Whole cards snap cleanly (no half-clipped peek), soft edge fades signal more content,
// and large circular paging buttons appear only when there's somewhere to scroll. When
// the cards already fit, it degrades to a plain left-aligned row (no arrows/fades).

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardRailProps {
  children: ReactNode;
  /** Fixed width per item — bigger for richer featured cards (size = commitment). */
  itemWidthClass?: string;
}

export function CardRail({ children, itemWidthClass = 'w-[300px] sm:w-[320px]' }: CardRailProps) {
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
    const el = scrollerRef.current;
    el?.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el?.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, children]);

  const page = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const arrowBase =
    'absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/30 bg-[#0a1424]/90 text-lc-text shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)] backdrop-blur transition-all hover:border-cyan-300/70 hover:bg-[#0d1a30]';

  return (
    <div className="relative">
      {/* Edge fades — signal off-screen content without hard-clipping a card */}
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#060b16] to-transparent transition-opacity duration-300', canLeft ? 'opacity-100' : 'opacity-0')}
      />
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#060b16] to-transparent transition-opacity duration-300', canRight ? 'opacity-100' : 'opacity-0')}
      />

      {canLeft && (
        <button type="button" onClick={() => page(-1)} aria-label="Scroll left" className={cn(arrowBase, '-left-3')}>
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      )}
      {canRight && (
        <button type="button" onClick={() => page(1)} aria-label="Scroll right" className={cn(arrowBase, '-right-3')}>
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      )}

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (child) => (
          <div className={cn('shrink-0 snap-start', itemWidthClass)}>{child}</div>
        ))}
      </div>
    </div>
  );
}
