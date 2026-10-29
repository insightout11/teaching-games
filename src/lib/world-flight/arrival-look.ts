/**
 * The postcard arrival look (Oct 2026): water reflections, the seasonal branch, the local animal, the vintage postcard
 * with its lettering and stamp, and the painted weather. On by default since 29 Oct 2026 (passed the rehearsal); `?arrival=old` turns it off for one page.
 *
 * ONE switch for every place that shows an arrival scene: the live room landing, the phones' landing card (they follow
 * the room), the passport replay and the home page cards. To turn it on everywhere, set the default to true.
 * Until then `?arrival=new` turns it on for one page, and `?arrival=old` turns it off once it is the default.
 */
export const POSTCARD_LOOK_DEFAULT = true;

export function postcardLookOn(): boolean {
  if (typeof window === 'undefined') return POSTCARD_LOOK_DEFAULT;
  const v = new URLSearchParams(window.location.search).get('arrival');
  if (v === 'new') return true;
  if (v === 'old') return false;
  return POSTCARD_LOOK_DEFAULT;
}
