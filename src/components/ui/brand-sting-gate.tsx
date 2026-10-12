'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

// Before paint in the browser (so a client-side mount never shows the cover to someone who has seen the sting).
const useBeforePaint = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
import { BrandSting, type BrandStingProps } from './brand-sting';

interface BrandStingGateProps extends Omit<BrandStingProps, 'onComplete'> {
  /** sessionStorage key — the sting plays once per browser session per key. */
  storageKey: string;
  /** Overlay z-index (default 100). */
  z?: number;
}

const COVER_BG = 'radial-gradient(ellipse 95% 95% at 50% 48%, #ffffff 0%, #f4f8ff 55%, #e9f1fd 100%)';

/**
 * Full-screen overlay that plays a BrandSting exactly ONCE per browser session (gated by sessionStorage) and lets
 * the user click to skip.
 *
 * No flash of the page first: a white cover (the sting's own opening frame) is part of the server-rendered HTML, so
 * it is on screen from the first paint. An inline script right after it hides the cover before paint when the sting
 * has already played this session. Once React mounts, the sting takes over from the cover seamlessly.
 */
export function BrandStingGate({ storageKey, z = 100, ...sting }: BrandStingGateProps) {
  // 'pending' = cover up, deciding; 'play' = sting running; 'done' = nothing on screen.
  const [state, setState] = useState<'pending' | 'play' | 'done'>('pending');

  useBeforePaint(() => {
    try {
      if (sessionStorage.getItem(storageKey)) {
        setState('done');
        return;
      }
      sessionStorage.setItem(storageKey, '1');
    } catch {
      // sessionStorage blocked (e.g. private mode) — play once for this mount.
    }
    setState('play');
  }, [storageKey]);

  if (state === 'done') return null;

  return (
    <>
      {/* The cover: in the HTML from the first paint; hidden pre-paint by the script below when already seen.
          It leaves the moment the sting mounts (the sting opens on the same white), so nothing shows through. */}
      {state === 'pending' && (
      <div
        id={`${storageKey}-cover`}
        suppressHydrationWarning
        className="fixed inset-0"
        style={{ zIndex: z - 1, background: COVER_BG }}
        aria-hidden
      />
      )}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem(${JSON.stringify(storageKey)})){var c=document.getElementById(${JSON.stringify(`${storageKey}-cover`)});if(c)c.style.display='none'}}catch(e){}`,
        }}
      />
      {state === 'play' && (
        <div className="fixed inset-0 cursor-pointer" style={{ zIndex: z }} onClick={() => setState('done')} aria-hidden>
          <BrandSting {...sting} onComplete={() => setState('done')} />
        </div>
      )}
    </>
  );
}
