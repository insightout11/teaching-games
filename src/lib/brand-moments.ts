/**
 * The rulebook for the LessonCaptain brand reveal (BrandSting): every place it plays, which version, and how often.
 * One file so the moments can't drift apart or pile up (Oct 2026, owner-approved):
 *
 *  - app-open   full   once a day per browser, when a signed-in page first opens
 *  - takeoff    short  each lesson as the class leaves the gate (full for the teacher's very first lesson)
 *  - landing    short  once per lesson, when it ends, before the results
 *  - phone-join short  once per lesson per phone, silent (a room of phones must not chime)
 *
 * Never two in a row: a reveal is skipped when another finished starting less than QUIET_MS ago in this browser.
 * A click always skips, and BrandSting itself collapses for reduced-motion users.
 */
export type BrandMoment = 'app-open' | 'takeoff' | 'landing' | 'phone-join';

export const BRAND_MOMENTS: Record<BrandMoment, { variant: 'full' | 'short'; silent?: boolean }> = {
  'app-open': { variant: 'full' },
  takeoff: { variant: 'short' },
  landing: { variant: 'short' },
  'phone-join': { variant: 'short', silent: true },
};

/** After any reveal, others stay quiet this long (app open straight into a takeoff would be two in a row). */
export const QUIET_MS = 45_000;

const LAST_KEY = 'lc-brand-last';
/** localStorage key holding the day app-open last played (read by the pre-paint script in BrandStingGate too). */
export const APP_OPEN_DAY_KEY = 'lc-brand-app-open-day';

/** Today's date in this browser, as stored under APP_OPEN_DAY_KEY. */
export function brandDay(d: Date = new Date()): string {
  return d.toDateString();
}

function read(storage: 'local' | 'session', key: string): string | null {
  try { return (storage === 'local' ? localStorage : sessionStorage).getItem(key); } catch { return null; }
}
function write(storage: 'local' | 'session', key: string, value: string): void {
  try { (storage === 'local' ? localStorage : sessionStorage).setItem(key, value); } catch { /* storage blocked */ }
}

/** The once-only key for a moment (per day for app-open, per lesson for the others). */
function onceKey(moment: BrandMoment, sessionId?: string): { storage: 'local' | 'session'; key: string; value: string } {
  if (moment === 'app-open') return { storage: 'local', key: APP_OPEN_DAY_KEY, value: brandDay() };
  return { storage: 'session', key: `lc-brand-${moment}-${sessionId ?? 'x'}`, value: '1' };
}

/**
 * Whether this moment should play now. When it returns true it has already been recorded as played, so call it once,
 * at the moment itself (not on every render).
 */
export function claimBrandMoment(moment: BrandMoment, sessionId?: string, now: number = Date.now()): boolean {
  if (typeof window === 'undefined') return false;
  const once = onceKey(moment, sessionId);
  if (read(once.storage, once.key) === once.value) return false;
  // Recorded even when skipped for quiet time: the moment has passed, and replaying it later would be out of place.
  write(once.storage, once.key, once.value);
  const last = Number(read('local', LAST_KEY) ?? 0);
  if (last && now - last < QUIET_MS) return false;
  write('local', LAST_KEY, String(now));
  return true;
}

/** Takeoff plays the full reveal for a teacher's very first lesson, the short one after that. */
export function takeoffVariant(priorLessons: number | null | undefined): 'full' | 'short' {
  return priorLessons === 0 ? 'full' : 'short';
}
