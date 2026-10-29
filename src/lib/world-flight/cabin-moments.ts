/**
 * Cabin moments (flight experience arc, Oct 2026): the descent as a cabin moment (seatbelt sign, warm light) and the
 * arrival reward sequence (stamp, souvenirs, flight hour), one tap each. On trial: off until it passes a rehearsal.
 * `?moments=on` turns them on for one page, `?moments=off` turns them off once they are the default.
 */
export const CABIN_MOMENTS_DEFAULT = false;

export function cabinMomentsOn(): boolean {
  if (typeof window === 'undefined') return CABIN_MOMENTS_DEFAULT;
  const v = new URLSearchParams(window.location.search).get('moments');
  if (v === 'on') return true;
  if (v === 'off') return false;
  return CABIN_MOMENTS_DEFAULT;
}
