/**
 * "Can this class do this?" for a whole plan (a flight plan, a saved lesson) or one stage of it.
 * Same marks as single activities (src/lib/class-fit.ts), looked up from each stage's plugin.
 */

import { getGame } from '@/games/registry';
import { getActivity } from '@/activities/registry';
import { classFitMarks, fitsClass, type ClassFitContext, type FitMark } from '@/lib/class-fit';

/** Marks for one activity or game by key (none when the key is unknown). */
export function keyFitMarks(key: string, ctx: ClassFitContext): FitMark[] {
  const plugin = getGame(key) ?? getActivity(key);
  return plugin ? classFitMarks({ minStudents: plugin.minStudents, deviceFree: plugin.deviceFree }, ctx) : [];
}

/** A short note for a plan: "2 stages need phones", "1 stage needs more students" (null when everything fits). */
export function planFitNote(keys: string[], ctx: ClassFitContext): string | null {
  let phones = 0;
  let size = 0;
  for (const key of keys) {
    const marks = keyFitMarks(key, ctx);
    if (fitsClass(marks)) continue;
    if (marks.some((m) => m.kind === 'size')) size += 1;
    else if (marks.some((m) => m.kind === 'phones')) phones += 1;
  }
  const parts = [
    phones ? `${phones} stage${phones === 1 ? '' : 's'} need${phones === 1 ? 's' : ''} phones` : '',
    size ? `${size} stage${size === 1 ? '' : 's'} need${size === 1 ? 's' : ''} more students` : '',
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}
