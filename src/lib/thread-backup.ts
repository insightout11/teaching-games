import type { LessonThread } from '@/stores/session-store';

/**
 * The takeoff "before" (and the rest of the lesson thread) is held in memory, so a mid-lesson
 * refresh used to lose it and break the landing reveal. It's backed up to session_private_state
 * ('flight-before'), tied to the plan in progress so a Live Room's next plan can't restore it.
 * Names are stripped (that table is publicly readable): only anonymous device ids and choices,
 * which is all the class-level counts need.
 */
export interface ThreadBackup { planKey: string; thread: LessonThread }

export function planKeyOf(plan: { customTopic?: string; flightPresetId?: string | null; callsign?: string } | null | undefined): string {
  if (!plan) return '';
  return [plan.flightPresetId ?? '', plan.customTopic ?? '', plan.callsign ?? ''].join('|');
}

const strip = <T extends { name: string }>(rec: Record<string, T> | undefined): Record<string, T> | undefined =>
  rec ? Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, { ...v, name: '' }])) : rec;

export function anonymiseThread(t: LessonThread): LessonThread {
  return {
    ...t,
    pulse: t.pulse.map((p) => ({ ...p, votes: strip(p.votes) ?? {} })),
    ...(t.grammarCheck ? { grammarCheck: { ...t.grammarCheck, results: strip(t.grammarCheck.results) ?? {} } } : {}),
    ...(t.hunt ? { hunt: strip(t.hunt) } : {}),
  };
}

/** Anything worth restoring? (an empty thread is the state right after a refresh) */
export function threadHasContent(t: LessonThread): boolean {
  return t.pulse.length > 0 || !!t.grammarCheck || !!t.canDo || !!t.speakCheck || !!t.flightQuestion || !!t.travellers || !!t.tripStops;
}

/** Restore only a backup made for the same plan. */
export function restorableThread(backup: unknown, planKey: string): LessonThread | null {
  const b = backup as Partial<ThreadBackup> | null;
  if (!b || !planKey || b.planKey !== planKey || !b.thread || !Array.isArray(b.thread.pulse)) return null;
  return b.thread;
}
