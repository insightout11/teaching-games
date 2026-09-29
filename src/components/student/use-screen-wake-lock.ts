'use client';

import { useEffect } from 'react';

type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener?: (t: 'release', cb: () => void) => void };
type NavigatorWithWakeLock = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } };

/**
 * Keep the phone screen on while the student is in class, so it doesn't dim
 * mid-question. The browser drops the lock whenever the tab is hidden, so we
 * take it again when the student comes back. Unsupported browsers: no-op.
 */
export function useScreenWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined') return;
    const nav = navigator as NavigatorWithWakeLock;
    if (!nav.wakeLock) return;
    let lock: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (cancelled || lock || document.visibilityState !== 'visible') return;
      try {
        const next = await nav.wakeLock!.request('screen');
        if (cancelled) {
          void next.release().catch(() => {});
          return;
        }
        lock = next;
        next.addEventListener?.('release', () => { if (lock === next) lock = null; });
      } catch {
        // Denied (battery saver, iframe, no user gesture yet) — try again on the next visit
      }
    };

    void acquire();
    const onVisible = () => { if (document.visibilityState === 'visible') void acquire(); };
    document.addEventListener('visibilitychange', onVisible);
    // Some browsers only grant the lock after a tap.
    window.addEventListener('pointerdown', onVisible, { passive: true });
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pointerdown', onVisible);
      if (lock) void lock.release().catch(() => {});
      lock = null;
    };
  }, [active]);
}
