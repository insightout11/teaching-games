'use client';

import { useEffect, useState } from 'react';
import type { FreePicture } from '@/lib/sources/wikimedia-images';
import { createPictureCache, pictureQuery } from './free-picture-cache';

// Used only in the teacher client. Phones receive the resolved metadata; this route
// requires teacher session ownership and must not be called by student clients.
const pictures = createPictureCache(async (sessionId, query) => {
  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/sources/free-pictures`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return null;
  const data = await response.json() as { pictures?: FreePicture[] };
  return data.pictures?.[0] ?? null;
});

export function useFreePicture(sessionId: string | null | undefined, value: unknown): FreePicture | null {
  const query = pictureQuery(value);
  const key = JSON.stringify([sessionId, query.toLowerCase()]);
  const [result, setResult] = useState<{ key: string; picture: FreePicture | null } | null>(null);
  useEffect(() => {
    if (!sessionId || !query) return;
    let live = true;
    void pictures.get(sessionId, query).then(picture => { if (live) setResult({ key, picture }); });
    return () => { live = false; };
  }, [sessionId, query, key]);
  return sessionId && query && result?.key === key ? result.picture : null;
}
