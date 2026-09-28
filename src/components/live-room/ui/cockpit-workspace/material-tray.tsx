'use client';

/**
 * The material tray.
 *
 * Compact rows, and only the selected one opens. The old layout expanded every
 * card's excerpt, URL and provenance at once, which is what pushed the teaching
 * area off the screen — so the rule here is that a row is a *title and one
 * line*, and the detail lives on the stage where there is room for it.
 *
 * Three markers, three meanings, never merged: selected (open on your stage),
 * focus (the room's working item), and shown (what the class can see).
 */

import { FileText, Image as ImageIcon, MapPin, Radio, StickyNote, Type, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MaterialKind, TrayItem } from './types';

const ICON: Record<MaterialKind, typeof FileText> = {
  source: FileText,
  note: StickyNote,
  image: ImageIcon,
  place: MapPin,
  video: Video,
  vocabulary: Type,
};

export function MaterialTray({
  items,
  selectedId,
  focusedId,
  shownId,
  drafts,
  onSelect,
  onOpenDrawer,
}: {
  items: TrayItem[];
  selectedId: string | null;
  focusedId: string | null;
  shownId: string | null;
  drafts: Record<string, string>;
  onSelect: (id: string) => void;
  onOpenDrawer: () => void;
}) {
  return (
    <>
      <div className="flex shrink-0 items-baseline justify-between border-b border-lc-border-subtle px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-lc-text3">
          In this room
        </h2>
        <span className="font-[family-name:var(--font-instrument)] text-xs tabular-nums text-lc-text3">
          {items.length}
        </span>
      </div>

      {/* The only scrolling in this column, and it stays in this column. */}
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2" data-testid="material-tray">
        {items.map(item => {
          const Icon = ICON[item.kind];
          const selected = item.id === selectedId;
          const draft = drafts[item.id]?.trim();
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={selected ? 'true' : undefined}
                className={cn(
                  'flex w-full items-start gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow',
                  selected
                    ? 'border-lc-blue bg-lc-blue/10'
                    : 'border-transparent hover:border-lc-border hover:bg-lc-card',
                )}
              >
                <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-lc-text3" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-lc-text">{item.title}</span>
                  <span className="block truncate text-[11px] text-lc-text3">{item.caption}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  {item.id === shownId ? (
                    <span
                      title="The class can see this"
                      className="flex items-center gap-1 text-[10px] text-lc-amber"
                    >
                      <Radio aria-hidden="true" className="h-3 w-3" />
                      Shown
                    </span>
                  ) : null}
                  {item.id === focusedId ? (
                    <span className="text-[10px] text-lc-blue">Focus</span>
                  ) : null}
                  {draft ? (
                    <span title="You have an unsaved note here" className="text-[10px] text-lc-text3">
                      Draft
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}

        {items.length === 0 ? (
          <li className="rounded-xl border border-dashed border-lc-border p-4 text-xs text-lc-text3">
            Nothing saved yet. Open Sources to find something, or paste a link you already have.
          </li>
        ) : null}
      </ul>

      <div className="shrink-0 border-t border-lc-border-subtle p-2">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="w-full rounded-xl border border-lc-border bg-lc-card px-3 py-2 text-xs text-lc-text2 hover:bg-lc-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow"
        >
          Find or paste a source
        </button>
      </div>
    </>
  );
}

/** The tray as a horizontal strip, for widths where a column would not fit. */
export function MaterialStrip({
  items,
  selectedId,
  shownId,
  onSelect,
}: {
  items: TrayItem[];
  selectedId: string | null;
  shownId: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div
      data-testid="material-strip"
      className="flex shrink-0 gap-2 overflow-x-auto border-b border-lc-border bg-lc-surface px-3 py-2 lg:hidden"
    >
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          aria-current={item.id === selectedId ? 'true' : undefined}
          className={cn(
            // 44px min target: this row is the phone's primary navigation.
            'flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs',
            item.id === selectedId
              ? 'border-lc-blue bg-lc-blue/10 text-lc-text'
              : 'border-lc-border bg-lc-card text-lc-text2',
          )}
        >
          <span className="max-w-[9rem] truncate">{item.title}</span>
          {item.id === shownId ? (
            <Badge tone="warning" variant="outline" size="xs">
              Shown
            </Badge>
          ) : null}
        </button>
      ))}
    </div>
  );
}
