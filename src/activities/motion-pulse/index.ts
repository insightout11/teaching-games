import { Scale } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { MotionPulseActivity } from './activity';

// Debate v2 takeoff: the motion itself, "Where do you stand?" (1–5) — the before the Opinion Shift re-asks.
export const motionPulsePlugin: ActivityPlugin = {
  key: 'motion-pulse',
  name: 'Motion Pulse',
  description: 'The debate motion on phones: where do you stand (1–5)? The before that the Opinion Shift re-asks at the end.',
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Speaking', 'Critical Thinking'],
  component: MotionPulseActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 2,
  defaultTimerSeconds: 0,
  icon: Scale,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 2, max: null },
  deviceFree: false,
};

export { MotionPulseActivity };
