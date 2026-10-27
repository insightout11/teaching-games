import { createClient } from '@/lib/supabase/client';
import type { WorldLandmarkKind } from '@/components/live-room/flight/world-landmarks';

/**
 * The view out of the window, room to phones (Oct 2026): while a landmark is in good view, the room tells the phones,
 * so each student can take a window selfie. A live broadcast with no table: the room repeats it every few seconds
 * while the landmark is in view, so a phone that joins late still gets it, and sends null when it has passed.
 */
export interface WindowView {
  landmarkId: string;
  name: string;
  kind: WorldLandmarkKind;
  terrain: string;
  region: string | null;
  timeOfDay: string;
  from: string;
  to: string;
}

export const WINDOW_VIEW_HEARTBEAT_MS = 6000;
/** A view not repeated for this long has passed (the room closed or lost its connection). */
export const WINDOW_VIEW_STALE_MS = 15000;

export function openWindowViewChannel(sessionId: string, onView?: (v: WindowView | null) => void) {
  const supabase = createClient();
  const channel = supabase.channel(`window:${sessionId}`, { config: { broadcast: { self: false } } });
  if (onView) channel.on('broadcast', { event: 'view' }, ({ payload }: { payload: { view: WindowView | null } }) => onView(payload?.view ?? null));
  channel.subscribe();
  return {
    send: (view: WindowView | null) => { void channel.send({ type: 'broadcast', event: 'view', payload: { view } }); },
    close: () => { void supabase.removeChannel(channel); },
  };
}

/** A window selfie the student kept: the scene is redrawn from these, so nothing heavy is stored. */
export interface KeptSelfie extends WindowView { sessionId: string; seat: string | null; takenAt: number; expression?: string; mascot?: { name: string; look: unknown } | null; item?: string | null; accessory?: { type: import('@/lib/accessories').AccessoryType; colors: [string, string] } | null }

const KEY = 'lc-window-selfies';
export function keptSelfies(): KeptSelfie[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v as KeptSelfie[] : []; } catch { return []; }
}
export function keepSelfie(s: KeptSelfie): KeptSelfie[] {
  const next = [s, ...keptSelfies().filter((x) => !(x.sessionId === s.sessionId && x.landmarkId === s.landmarkId))].slice(0, 40);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: kept for this visit only */ }
  return next;
}
