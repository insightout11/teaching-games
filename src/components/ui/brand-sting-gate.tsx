'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { BrandSting } from './brand-sting';
import { APP_OPEN_DAY_KEY, BRAND_MOMENTS, claimBrandMoment } from '@/lib/brand-moments';

// Before paint in the browser (so a client-side mount never shows the cover to someone who has seen the reveal).
const useBeforePaint = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const COVER_BG = 'radial-gradient(ellipse 95% 95% at 50% 48%, #ffffff 0%, #f4f8ff 55%, #e9f1fd 100%)';
const COVER_ID = 'lc-brand-cover';

/**
 * The app-open brand reveal: full version, once a day per browser (rules in src/lib/brand-moments.ts). Click to skip.
 *
 * No flash of the page first: a white cover (the reveal's own opening frame) is part of the server-rendered HTML, so
 * it is on screen from the first paint. An inline script right after it hides the cover before paint when the reveal
 * has already played today. Once React mounts, the reveal takes over from the cover seamlessly.
 */
export function BrandStingGate({ z = 100, holdMs }: { z?: number; holdMs?: number }) {
  // 'pending' = cover up, deciding; 'play' = reveal running; 'done' = nothing on screen.
  const [state, setState] = useState<'pending' | 'play' | 'done'>('pending');

  useBeforePaint(() => {
    setState(claimBrandMoment('app-open') ? 'play' : 'done');
  }, []);

  if (state === 'done') return null;

  return (
    <>
      {/* The cover: in the HTML from the first paint; hidden pre-paint by the script below when already seen today.
          It leaves the moment the reveal mounts (the reveal opens on the same white), so nothing shows through. */}
      {state === 'pending' && (
        <div id={COVER_ID} suppressHydrationWarning className="fixed inset-0" style={{ zIndex: z - 1, background: COVER_BG }} aria-hidden />
      )}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem(${JSON.stringify(APP_OPEN_DAY_KEY)})===new Date().toDateString()){var c=document.getElementById(${JSON.stringify(COVER_ID)});if(c)c.style.display='none'}}catch(e){}`,
        }}
      />
      {state === 'play' && (
        <div className="fixed inset-0 cursor-pointer" style={{ zIndex: z }} onClick={() => setState('done')} aria-hidden>
          <BrandSting variant={BRAND_MOMENTS['app-open'].variant} holdMs={holdMs} onComplete={() => setState('done')} />
        </div>
      )}
    </>
  );
}
