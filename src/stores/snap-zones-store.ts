import { create } from 'zustand';

/**
 * Snap zones for floating widgets. A surface (the Live Room windscreen)
 * registers zones in viewport coordinates; widget windows snap to the nearest
 * one when dropped close to it. With no zones registered (everywhere outside
 * the Live Room) widgets float freely, exactly as before.
 */
export type SnapAnchor = 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';

export interface SnapZone {
  id: string;
  anchor: SnapAnchor;
  /** The point the widget's matching corner/edge snaps to. */
  x: number;
  y: number;
}

interface SnapZonesState {
  zones: SnapZone[];
  dragging: boolean;
  hot: string | null;
  setZones: (zones: SnapZone[]) => void;
  setDragging: (dragging: boolean) => void;
  setHot: (hot: string | null) => void;
}

export const useSnapZones = create<SnapZonesState>((set) => ({
  zones: [],
  dragging: false,
  hot: null,
  setZones: (zones) => set({ zones }),
  setDragging: (dragging) => set({ dragging, ...(dragging ? {} : { hot: null }) }),
  setHot: (hot) => set({ hot }),
}));

const SNAP_DISTANCE = 90;

/** Top-left position a widget of size w×h should take to sit in this zone. */
export function snappedPosition(zone: SnapZone, w: number, h: number): { x: number; y: number } {
  const x = zone.anchor.endsWith('l') ? zone.x : zone.anchor.endsWith('r') ? zone.x - w : zone.x - w / 2;
  const y = zone.anchor.startsWith('t') ? zone.y : zone.y - h;
  return { x: Math.round(x), y: Math.round(y) };
}

/** The zone a widget at (x, y) sized w×h would snap to, if any is close enough. */
export function nearestZone(zones: SnapZone[], x: number, y: number, w: number, h: number): SnapZone | null {
  let best: SnapZone | null = null;
  let bestD = SNAP_DISTANCE;
  for (const z of zones) {
    const p = snappedPosition(z, w, h);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) {
      bestD = d;
      best = z;
    }
  }
  return best;
}
