'use client';

// A teacher-job shelf. Shows a responsive row of FULL cards (no forced clipping /
// tiny chevrons): 1 / 2 / 4 columns by width, capped to a preview count with a
// "View all" into Browse. Header is a branded, premium discovery title.

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { DiscoveryItem } from '@/lib/discovery-shelves';
import { DiscoveryCard } from './DiscoveryCard';

interface DiscoveryShelfProps {
  label: string;
  description: string;
  items: DiscoveryItem[];
  onSelect: (item: DiscoveryItem) => void;
  viewAllHref?: string;
}

const PREVIEW_COUNT = 4;

export function DiscoveryShelf({
  label,
  description,
  items,
  onSelect,
  viewAllHref = '/explore',
}: DiscoveryShelfProps) {
  const shown = items.slice(0, PREVIEW_COUNT);
  const total = items.length;

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
            View all{total > PREVIEW_COUNT ? ` · ${total}` : ''}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <p className="mt-1.5 text-sm text-lc-text3">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((item) => (
          <DiscoveryCard key={item.key} item={item} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
