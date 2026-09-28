'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Pointer-based drag and drop for the flight deck (works with mouse, pen and
 * touch, unlike HTML5 drag events). Sources mark themselves with
 * `data-deck-drag="<type>:<id>"`, targets with `data-deck-drop="<zone>"`.
 * A drag starts after a 6px move, so plain clicks still click.
 */
export interface DeckDrop {
  type: string;
  id: string;
  zone: string;
  /** The drop target element (e.g. the material card a stamp landed on). */
  target: HTMLElement;
  clientX: number;
  clientY: number;
}

export function useDeckDrag(onDrop: (drop: DeckDrop) => void, accepts: (type: string, zone: string) => boolean) {
  const [dragging, setDragging] = useState<{ type: string; id: string; x: number; y: number; label: string } | null>(null);
  const [hotZone, setHotZone] = useState<HTMLElement | null>(null);
  const start = useRef<{ type: string; id: string; x: number; y: number; label: string; moved: boolean } | null>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const acceptsRef = useRef(accepts);
  acceptsRef.current = accepts;

  const zoneAt = useCallback((x: number, y: number, type: string): HTMLElement | null => {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      const zoneEl = (el as HTMLElement).closest<HTMLElement>('[data-deck-drop]');
      if (zoneEl && acceptsRef.current(type, zoneEl.dataset.deckDrop ?? '')) return zoneEl;
    }
    return null;
  }, []);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-deck-drag]');
      if (!el) return;
      const [type, ...rest] = (el.dataset.deckDrag ?? '').split(':');
      start.current = { type, id: rest.join(':'), x: e.clientX, y: e.clientY, label: el.dataset.deckLabel ?? el.textContent?.trim().slice(0, 40) ?? '', moved: false };
    };
    const move = (e: PointerEvent) => {
      const s = start.current;
      if (!s) return;
      if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 6) return;
      s.moved = true;
      e.preventDefault();
      setDragging({ type: s.type, id: s.id, x: e.clientX, y: e.clientY, label: s.label });
      setHotZone(zoneAt(e.clientX, e.clientY, s.type));
    };
    const up = (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s?.moved) return;
      setDragging(null);
      setHotZone(null);
      const zoneEl = zoneAt(e.clientX, e.clientY, s.type);
      if (zoneEl) onDropRef.current({ type: s.type, id: s.id, zone: zoneEl.dataset.deckDrop ?? '', target: zoneEl, clientX: e.clientX, clientY: e.clientY });
      // Swallow the click that follows a drag.
      const swallow = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [zoneAt]);

  return { dragging, hotZone };
}
