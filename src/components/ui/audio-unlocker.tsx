'use client';

import { useEffect } from 'react';
import { unlock } from '@/lib/audio/manager';

/**
 * Banks browser audio permission on the teacher's first interaction anywhere in
 * the app.
 *
 * Browsers only grant playback synchronously inside a real gesture, and our first
 * cue (the brand sting) can fire on a route change rather than a click — so rather
 * than hunting for one specific button, we listen once at the document level and
 * prime every clip the first time the teacher touches anything.
 *
 * Renders nothing.
 */
export function AudioUnlocker() {
  useEffect(() => {
    const events: (keyof DocumentEventMap)[] = ['pointerdown', 'keydown', 'touchstart'];
    const handler = () => {
      unlock();
      events.forEach((e) => document.removeEventListener(e, handler));
    };
    events.forEach((e) => document.addEventListener(e, handler, { once: false, passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, handler));
  }, []);

  return null;
}
