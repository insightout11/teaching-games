'use client';

/**
 * Modal keyboard behaviour for a covering panel.
 *
 * `aria-modal` tells assistive technology a dialog is modal; it does not stop
 * Tab from walking into the page behind it. This does three things:
 *
 *  1. Moves focus into the panel each time it opens.
 *  2. While `modal`, keeps Tab and Shift+Tab cycling inside it.
 *  3. Puts focus back on whatever opened it when it closes — unless something
 *     else has deliberately taken focus since (a drawer that opened in its
 *     place, say), which is left alone.
 *
 * `open` exists for a panel that is kept mounted while closed — the sources
 * drawer is retained so its preparation survives — and so opens and closes
 * without remounting. A non-modal side panel still receives focus when it
 * opens, but traps nothing: it must not hold the keyboard hostage.
 */

import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    node => !node.closest('[inert]') && !node.closest('[hidden]'),
  );
}

export function useFocusContainment<T extends HTMLElement>(
  ref: RefObject<T>,
  modal: boolean,
  open = true,
) {
  const trigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!open || !container) return;
    const previous = document.activeElement;
    trigger.current =
      previous instanceof HTMLElement && !container.contains(previous) ? previous : null;
    container.focus();

    return () => {
      const opener = trigger.current;
      // Restore only if focus is still inside the closing panel or has fallen
      // to the document. If another panel already claimed it, respect that.
      const current = document.activeElement;
      const lost = !current || current === document.body || container.contains(current);
      if (lost && opener && opener.isConnected) opener.focus();
    };
  }, [open, ref]);

  /** Attach to the panel's onKeyDown. A no-op unless the panel is modal. */
  return (event: KeyboardEvent<T>) => {
    if (!modal || !open || event.key !== 'Tab') return;
    const container = ref.current;
    if (!container) return;
    const nodes = focusables(container);
    if (nodes.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const current = document.activeElement;
    if (event.shiftKey) {
      if (current === first || current === container || !container.contains(current)) {
        event.preventDefault();
        last.focus();
      }
    } else if (current === last || !container.contains(current)) {
      event.preventDefault();
      first.focus();
    }
  };
}
