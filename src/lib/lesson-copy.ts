import type { SlotType } from './flight-plan-config';

/** Teacher-facing labels for the pedagogical role of each activity in a lesson. */
export const ACTIVITY_TYPE_LABELS: Record<SlotType, string> = {
  takeoff: 'Warm-up',
  presentation: 'Teach',
  practice: 'Practice',
  production: 'Use',
  landing: 'Wrap-up',
};
