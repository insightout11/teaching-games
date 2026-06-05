'use client';

// A teacher-job shelf: branded header + a horizontal CardRail of module cards. Falls
// back to a grid when there are too few items for a rail to make sense.

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { DiscoveryItem } from '@/lib/discovery-shelves';
import { DiscoveryCard } from './DiscoveryCard';
import { CardRail } from './CardRail';

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
        <CardRail>
          {shown.map((item) => (
            <DiscoveryCard key={item.key} item={item} onSelect={onSelect} />
          ))}
        </CardRail>
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
