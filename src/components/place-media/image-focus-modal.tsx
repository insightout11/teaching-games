'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import type { PlaceMediaAsset } from '@/lib/place-media';

interface ImageFocusModalProps {
  media: PlaceMediaAsset | PlaceMediaAsset[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  label?: string;
  placeName?: string;
  showSource?: boolean;
  titleOverride?: string;
  captionOverride?: string;
}

function imageUrlFor(media: PlaceMediaAsset) {
  return media.url ?? media.thumbnailUrl;
}

export function ImageFocusModal({
  media,
  isOpen,
  onClose,
  initialIndex = 0,
  label = 'Place image',
  placeName,
  showSource = true,
  titleOverride,
  captionOverride,
}: ImageFocusModalProps) {
  const mediaList = useMemo(() => (Array.isArray(media) ? media : [media]).filter(imageUrlFor), [media]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!isOpen || mediaList.length === 0) return;
    setActiveIndex(Math.min(Math.max(initialIndex, 0), mediaList.length - 1));
  }, [initialIndex, isOpen, mediaList.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && mediaList.length > 1) {
        setActiveIndex((index) => (index + mediaList.length - 1) % mediaList.length);
      }
      if (event.key === 'ArrowRight' && mediaList.length > 1) {
        setActiveIndex((index) => (index + 1) % mediaList.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mediaList.length, onClose]);

  if (!isOpen || mediaList.length === 0) return null;

  const activeMedia = mediaList[Math.min(activeIndex, mediaList.length - 1)];
  const activeImageUrl = imageUrlFor(activeMedia);
  if (!activeImageUrl) return null;

  const hasMultipleImages = mediaList.length > 1;
  const title = titleOverride ?? activeMedia.title;
  const caption = captionOverride ?? activeMedia.caption;

  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-slate-950/92 p-4 text-white backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
    >
      <div
        className="relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#071426] shadow-[0_0_50px_rgba(34,211,238,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/65">{label}</p>
            <h3 className="mt-1 truncate text-lg font-semibold text-white">{title}</h3>
            {placeName ? <p className="mt-0.5 text-xs text-slate-400">{placeName}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-white"
            aria-label="Close enlarged image"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-950">
          <div
            aria-hidden
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-3xl"
            style={{ backgroundImage: `url(${activeImageUrl})` }}
          />
          <div className="absolute inset-0 bg-slate-950/35" aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImageUrl}
            alt={activeMedia.alt}
            className="relative z-10 h-full w-full object-contain"
            style={{ objectPosition: activeMedia.focalPoint ? `${activeMedia.focalPoint.x}% ${activeMedia.focalPoint.y}%` : 'center' }}
          />

          {hasMultipleImages ? (
            <>
              <button
                type="button"
                onClick={() => setActiveIndex((index) => (index + mediaList.length - 1) % mediaList.length)}
                className="absolute left-4 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/85 text-white shadow-xl transition hover:bg-cyan-400/20"
                aria-label="Previous enlarged image"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((index) => (index + 1) % mediaList.length)}
                className="absolute right-4 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/85 text-white shadow-xl transition hover:bg-cyan-400/20"
                aria-label="Next enlarged image"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </>
          ) : null}
        </div>

        <div className="border-t border-white/10 bg-slate-950/88 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {hasMultipleImages ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/65">
                  Image {Math.min(activeIndex, mediaList.length - 1) + 1} of {mediaList.length}
                </p>
              ) : null}
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-200">{caption}</p>
            </div>
            {showSource ? (
              <a
                href={activeMedia.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] text-white/65 transition-colors hover:border-cyan-300/35 hover:text-cyan-100"
              >
                <Info className="h-3 w-3" aria-hidden />
                {activeMedia.sourceName}{activeMedia.license ? ` - ${activeMedia.license}` : ''}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
