'use client';

import { useState } from 'react';
import { Info, Maximize2 } from 'lucide-react';
import type { PlaceMediaAsset } from '@/lib/place-media';
import { ImageFocusModal } from './image-focus-modal';

interface DestinationMediaCardProps {
  media: PlaceMediaAsset;
  placeName: string;
  label?: string;
  compact?: boolean;
  className?: string;
  showSource?: boolean;
  enableFocus?: boolean;
}

export function DestinationMediaCard({
  media,
  placeName,
  label = 'Place media',
  compact = false,
  className = '',
  showSource = true,
  enableFocus = true,
}: DestinationMediaCardProps) {
  const [isImageFocusOpen, setIsImageFocusOpen] = useState(false);
  const imageUrl = media.url ?? media.thumbnailUrl;
  if (!imageUrl) return null;

  return (
    <>
      <div className={`overflow-hidden rounded-xl border border-cyan-300/18 bg-slate-950/55 ${className}`}>
        <div className={compact ? 'grid gap-0 sm:grid-cols-[150px_1fr]' : ''}>
          <div className={`relative overflow-hidden bg-slate-900 ${compact ? 'min-h-[110px]' : 'h-44'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={media.alt}
              className="h-full w-full object-cover"
              style={{ objectPosition: media.focalPoint ? `${media.focalPoint.x}% ${media.focalPoint.y}%` : 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
            {enableFocus ? (
              <button
                type="button"
                onClick={() => setIsImageFocusOpen(true)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 text-white shadow-lg transition hover:border-cyan-300/35 hover:bg-cyan-400/20"
                aria-label="Enlarge place image"
              >
                <Maximize2 className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <div className={compact ? 'p-3' : 'p-4'}>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/70">{label}</p>
            <h3 className="mt-1 text-sm font-semibold text-white">{media.title}</h3>
            <p className="mt-1 text-xs text-cyan-100/75">{placeName}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{media.caption}</p>
            {showSource && (
              <a
                href={media.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-cyan-200"
              >
                <Info className="h-3 w-3" aria-hidden />
                Source: {media.sourceName}{media.license ? ` - ${media.license}` : ''}
              </a>
            )}
          </div>
        </div>
      </div>
      <ImageFocusModal
        media={media}
        isOpen={isImageFocusOpen}
        onClose={() => setIsImageFocusOpen(false)}
        label={label}
        placeName={placeName}
        showSource={showSource}
      />
    </>
  );
}
