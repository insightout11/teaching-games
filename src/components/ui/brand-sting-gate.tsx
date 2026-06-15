'use client';

import { useEffect, useState } from 'react';
import { BrandSting, type BrandStingProps } from './brand-sting';

interface BrandStingGateProps extends Omit<BrandStingProps, 'onComplete'> {
  /** sessionStorage key — the sting plays once per browser session per key. */
  storageKey: string;
  /** Overlay z-index (default 100). */
  z?: number;
}

/**
 * Full-screen overlay that plays a BrandSting exactly ONCE per browser session
 * (gated by sessionStorage so it never replays on re-render or navigation) and
 * lets the user click to skip. Renders nothing on the server / first paint, so
 * there's no hydration mismatch.
 */
export function BrandStingGate({ storageKey, z = 100, ...sting }: BrandStingGateProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, '1');
      setShow(true);
    } catch {
      // sessionStorage blocked (e.g. private mode) — play once for this mount.
      setShow(true);
    }
  }, [storageKey]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 cursor-pointer"
      style={{ zIndex: z }}
      onClick={() => setShow(false)}
      aria-hidden
    >
      <BrandSting {...sting} onComplete={() => setShow(false)} />
    </div>
  );
}
