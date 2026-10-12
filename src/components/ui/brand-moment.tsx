'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { BrandSting } from './brand-sting';
import { BRAND_MOMENTS, claimBrandMoment, type BrandMoment } from '@/lib/brand-moments';

// Before paint in the browser, so the "should it play?" check never shows a frame of anything.
const useBeforePaint = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Plays the brand reveal for one moment of a lesson (takeoff, landing, phone-join) if the rulebook allows it
 * (src/lib/brand-moments.ts): once per lesson, never straight after another reveal. Click to skip. Mount it at the
 * moment itself; it renders nothing when the moment shouldn't play.
 */
export function BrandMomentOverlay({
  moment,
  sessionId,
  variant,
  markSize,
  z = 120,
  onDone,
}: {
  moment: Exclude<BrandMoment, 'app-open'>;
  sessionId: string;
  /** Override the rulebook's version (takeoff: full for a first lesson). */
  variant?: 'full' | 'short';
  markSize?: number;
  z?: number;
  onDone?: () => void;
}) {
  const [state, setState] = useState<'pending' | 'play' | 'done'>('pending');

  useBeforePaint(() => {
    if (claimBrandMoment(moment, sessionId)) setState('play');
    else {
      setState('done');
      onDone?.();
    }
    // Decided once, when the moment happens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state !== 'play') return null;
  const rule = BRAND_MOMENTS[moment];
  const finish = () => {
    setState('done');
    onDone?.();
  };
  return (
    <div className="fixed inset-0 cursor-pointer" style={{ zIndex: z }} onClick={finish} aria-hidden>
      <BrandSting variant={variant ?? rule.variant} silent={rule.silent} markSize={markSize} onComplete={finish} />
    </div>
  );
}
