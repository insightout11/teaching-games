'use client';

import { useEffect, useState } from 'react';

/**
 * Reports whether a CSS media query currently matches.
 *
 * The room drawer changes semantics, not just styling, across breakpoints: at
 * narrow widths it is a real modal dialog (aria-modal, focus trap, Escape) and
 * at wide widths it is an inline side panel. CSS alone cannot express that
 * difference honestly to assistive technology, so the breakpoint is read here.
 *
 * SSR-safe: returns false until the client effect runs.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);

    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/** Below Tailwind `md`: the single-column layout with a modal drawer. */
export const NARROW_QUERY = '(max-width: 767px)';
