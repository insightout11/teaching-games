'use client';

import type { InputContextItem, InputSpec } from '@/lib/input-spec';

/** Original public context, shared by the existing input types. */
export function InputContext({ items, collapsible = false }: { items?: InputContextItem[]; collapsible?: boolean }) {
  if (!items?.length) return null;
  const content = (
    <div className="mb-4 space-y-2" aria-label="Question context">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-lc-border bg-lc-card px-3 py-3">
          {item.text && <p className="whitespace-pre-line break-words text-sm leading-relaxed text-lc-text">{item.text}</p>}
          {!!item.images?.length && (
            <div className={`mt-2 grid gap-2 ${item.images.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {item.images.map((image, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={image.url} alt={image.alt} className="max-h-40 w-full rounded-lg object-contain" referrerPolicy="no-referrer" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
  return collapsible ? <details className="mb-4 rounded-xl border border-lc-border p-3"><summary className="cursor-pointer text-sm font-semibold text-lc-text">Read the passage</summary><div className="mt-3">{content}</div></details> : content;
}

export function SectorBoard({ cells }: { cells?: InputSpec['sectorBoard'] }) {
  if (!cells?.length) return null;
  return (
    <div className="mb-4 space-y-2" aria-label="Sector board">
      <p className="text-xs text-lc-text2">Blue: Azure · Orange: Ember · Outlined: available</p>
      <div className="grid grid-cols-8 gap-1">
        {cells.map(cell => (
          <span key={cell.label} aria-label={`${cell.label}: ${cell.owner ?? 'open'}${cell.selectable ? ', available' : ''}`}
            className={`flex aspect-square items-center justify-center rounded border font-mono text-xs ${cell.owner === 'Azure' ? 'border-sky-400 bg-sky-500/30 text-sky-100' : cell.owner === 'Ember' ? 'border-amber-400 bg-amber-500/30 text-amber-100' : cell.selectable ? 'border-lc-text2 text-lc-text' : 'border-lc-border text-lc-text3'}`}>
            {cell.label}
          </span>
        ))}
      </div>
    </div>
  );
}
