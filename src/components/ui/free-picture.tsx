'use client';

import { useState } from 'react';
import type { FreePicture } from '@/lib/sources/wikimedia-images';
import { checkedPicture } from '@/lib/free-picture-cache';
import { useFreePicture } from '@/lib/use-free-picture';

/** Resolved, credited picture. Safe on phones without a teacher-only lookup. */
export function FreePictureView({ picture, className = '' }: { picture?: FreePicture | null; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const safe = checkedPicture(picture);
  if (!safe || safe.thumbUrl === failedUrl) return null;
  return (
    <figure className={`mx-auto max-w-lg space-y-1 ${className}`}>
      {/* Thumbnail is capped by the existing service, unlike an original multi-megapixel file. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={safe.thumbUrl} alt={safe.title} onError={() => setFailedUrl(safe.thumbUrl)}
        className="max-h-48 w-full rounded-xl object-contain" referrerPolicy="no-referrer" />
      <figcaption className="break-words text-center text-[11px] leading-snug opacity-60">
        <a href={safe.pageUrl} target="_blank" rel="noopener noreferrer" className="underline">{safe.credit}</a>
      </figcaption>
    </figure>
  );
}

/** Public teacher cards only. Secret phone cards use FreePictureView with private metadata. */
export function FreePictureCard({ sessionId, query }: { sessionId?: string | null; query?: string }) {
  const picture = useFreePicture(sessionId, query);
  return <FreePictureView picture={picture} />;
}
