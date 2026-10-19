/**
 * "Can this class do this?" One check for every place an activity can be launched (the room's quick bar and
 * catalogue, Explore, the Home drawer...). Activities are marked, never hidden: the teacher can always launch them.
 * Built on the metadata every game and activity already declares (minStudents, deviceFree).
 */

import type { SecondScreens } from '@/lib/class-profile';

export interface ClassFitContext {
  /** Students in the class (aboard, or on the class list). 0 = unknown: no size marks. */
  students: number;
  /** How many have a second screen (from the class type settings, or the old devices setting). */
  screens?: SecondScreens;
}

export interface FitMark {
  kind: 'phones' | 'size';
  /** Short label for a badge. */
  label: string;
  /** One sentence for a tooltip or the launch dialog. */
  hint: string;
}

export function classFitMarks(plugin: { minStudents: number; deviceFree: boolean }, ctx: ClassFitContext): FitMark[] {
  const marks: FitMark[] = [];
  if (ctx.students > 0 && plugin.minStudents > ctx.students) {
    marks.push(ctx.students === 1
      ? { kind: 'size', label: 'Group game', hint: `Needs ${plugin.minStudents}+ students; this is a 1-on-1 class.` }
      : { kind: 'size', label: `Needs ${plugin.minStudents}+`, hint: `Needs ${plugin.minStudents}+ students; this class has ${ctx.students}.` });
  }
  if (!plugin.deviceFree && ctx.screens === 'none') {
    marks.push({ kind: 'phones', label: 'Needs phones', hint: 'Students answer on phones; this class has no second screens.' });
  } else if (!plugin.deviceFree && ctx.screens === 'some') {
    marks.push({ kind: 'phones', label: 'Phones', hint: 'Students answer on phones. Students without one answer out loud: tap their seat to mark it.' });
  }
  return marks;
}

/** True when nothing stops this class doing it ("Phones" in a some-phones class still fits: seats cover the rest). */
export const fitsClass = (marks: FitMark[]) => marks.every((m) => m.kind === 'phones' && m.label === 'Phones');

/**
 * Fewer than `min` good fits in a list: add good fits from `pool` (device-free first) so the teacher always has
 * something that works. Order inside each group is kept.
 */
export function withFallback<T extends { key: string; minStudents: number; deviceFree: boolean }>(list: T[], pool: T[], ctx: ClassFitContext, min = 3, max = 6): T[] {
  const good = list.filter((p) => fitsClass(classFitMarks(p, ctx)));
  if (good.length >= min) return list.slice(0, max);
  const extra = pool
    .filter((p) => !list.some((l) => l.key === p.key) && fitsClass(classFitMarks(p, ctx)))
    .sort((a, b) => Number(b.deviceFree) - Number(a.deviceFree))
    .slice(0, min - good.length);
  const bad = list.filter((p) => !good.includes(p));
  return [...good, ...extra, ...bad].slice(0, max);
}
