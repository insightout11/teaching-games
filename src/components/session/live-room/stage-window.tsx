'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The Stage window: a separate 16:9 browser window that shows only the
 * windscreen, for sharing in Zoom (or dragging onto a classroom projector).
 *
 * It's a same-origin pop-up that the Live Room renders INTO with a React
 * portal, so everything stays live (flight, games, reveals, boarding) with no
 * state syncing. Styles are copied from this page and kept in sync. The
 * teacher's panels never go there, so students only ever see the stage.
 */
export function useStageWindow({ title }: { title: string }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const winRef = useRef<Window | null>(null);
  const cleanup = useRef<() => void>(() => {});

  const close = useCallback(() => {
    cleanup.current();
    cleanup.current = () => {};
    const w = winRef.current;
    winRef.current = null;
    setContainer(null);
    try { if (w && !w.closed) w.close(); } catch { /* already gone */ }
  }, []);

  const open = useCallback((): boolean => {
    if (winRef.current && !winRef.current.closed) {
      winRef.current.focus();
      return true;
    }
    const w = window.open('', 'lc-stage', 'popup,width=1280,height=720');
    if (!w) return false;
    winRef.current = w;
    const doc = w.document;
    doc.title = title;
    doc.documentElement.className = document.documentElement.className;
    doc.documentElement.style.cssText = document.documentElement.style.cssText;
    doc.body.className = document.body.className;
    doc.body.style.cssText = 'margin:0;height:100vh;overflow:hidden;background:#0b1a33;';

    // Copy every stylesheet (Tailwind, fonts, maplibre…) and mirror late additions
    // (dev hot reload, lazily loaded CSS).
    const copy = (node: Node) => {
      if (node instanceof HTMLStyleElement || (node instanceof HTMLLinkElement && node.rel === 'stylesheet')) {
        doc.head.appendChild(node.cloneNode(true));
      }
    };
    doc.head.innerHTML = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
    document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(copy);
    const mo = new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach(copy)));
    mo.observe(document.head, { childList: true });

    const root = doc.createElement('div');
    root.id = 'lc-stage-root';
    root.style.cssText = 'position:relative;width:100vw;height:100vh;overflow:hidden;';
    doc.body.innerHTML = '';
    doc.body.appendChild(root);

    // Anything that sizes itself on window resize listens to THIS window.
    const onResize = () => window.dispatchEvent(new Event('resize'));
    w.addEventListener('resize', onResize);
    // Teacher closed the pop-up (or it navigated away): bring the stage home.
    const onGone = () => { if (winRef.current === w) close(); };
    w.addEventListener('pagehide', onGone);
    const poll = window.setInterval(() => { if (w.closed) onGone(); }, 1000);

    cleanup.current = () => {
      mo.disconnect();
      window.clearInterval(poll);
      try {
        w.removeEventListener('resize', onResize);
        w.removeEventListener('pagehide', onGone);
      } catch { /* window gone */ }
    };
    setContainer(root);
    window.setTimeout(onResize, 50);
    return true;
  }, [title, close]);

  const focus = useCallback(() => { try { winRef.current?.focus(); } catch { /* gone */ } }, []);

  // Leaving the Live Room closes the stage too.
  useEffect(() => close, [close]);

  return { container, isOpen: container !== null, open, close, focus };
}
