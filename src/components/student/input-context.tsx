'use client';

import type { InputContextItem } from '@/lib/input-spec';

/** Original public context, shared by the existing input types. */
export function InputContext({ items }: { items?: InputContextItem[] }) {
  if (!items?.length) return null;
  return (
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
}
