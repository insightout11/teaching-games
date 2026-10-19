/**
 * First-lesson milestones on this computer (the Home checklist), and the teacher-side drop-off events.
 * No student data and no student analytics: only what the teacher does.
 */

import { trackEvent } from '@/lib/analytics/posthog';

export type First = 'shared' | 'picked' | 'ran' | 'landed';
export const FIRSTS: Array<{ key: First; label: string }> = [
  { key: 'shared', label: 'Share the join code (a student joins)' },
  { key: 'picked', label: 'Try “Pick a student”' },
  { key: 'ran', label: 'Run one activity' },
  { key: 'landed', label: 'Land the plane' },
];
const KEY = 'lc-teacher-firsts';

export function readFirsts(): Partial<Record<First, true>> {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}

/** Records a milestone once (and its event, for the drop-off counts). */
export function markFirst(first: First) {
  const done = readFirsts();
  if (done[first]) return;
  try { localStorage.setItem(KEY, JSON.stringify({ ...done, [first]: true })); } catch { /* storage blocked */ }
  trackEvent('teacher_first', { step: first });
}

/** Drop-off funnel (teacher side only): class_set_up, test_flight_started, test_flight_finished, lesson_landed. */
export function trackFunnel(event: 'class_set_up' | 'guided_test_flight_started' | 'guided_test_flight_finished' | 'lesson_landed', props?: Record<string, unknown>) {
  trackEvent(event, props);
}
