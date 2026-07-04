'use client';

import { useEffect, useState } from 'react';
import { X, Expand } from 'lucide-react';

// Tap-to-expand image thumbnail for the Travel arc's real dish/attraction photos.
// The expanded view shows the caption and the Wikimedia credit (licensed images must
// stay attributed when shown large on a projected screen).

interface ExpandableImageProps {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  /** Classes for the thumbnail image (size/rounding). */
  thumbClassName?: string;
}

export function ExpandableImage({ src, alt, caption, credit, thumbClassName = 'h-16 w-16 rounded-lg object-cover' }: ExpandableImageProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative shrink-0 cursor-zoom-in"
        aria-label={`Expand photo: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={thumbClassName} />
        <span className="absolute bottom-0.5 right-0.5 rounded bg-slate-950/70 p-0.5 opacity-0 transition group-hover:opacity-100">
          <Expand className="h-3 w-3 text-white" aria-hidden />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-slate-950/90 p-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[78vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
          <div className="max-w-2xl text-center">
            {caption && <p className="text-sm text-slate-200">{caption}</p>}
            {credit && <p className="mt-1 text-xs text-slate-500">{credit}</p>}
          </div>
        </div>
      )}
    </>
  );
}
