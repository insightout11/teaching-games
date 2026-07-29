import type { ActivityPlugin } from '../types';
import { OpinionShiftActivity } from './activity';
import { ArrowRightLeft } from 'lucide-react';

export const opinionShiftPlugin: ActivityPlugin = {
  key: 'opinion-shift',
  name: 'Final Reflection',
  description: 'Students reflect on the lesson in their own words — what they think now, changed or not.',
  category: 'closing',
  pppStage: 'landing',
  skills: ['Critical Thinking', 'Speaking'],
  component: OpinionShiftActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 60,
  icon: ArrowRightLeft,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { OpinionShiftActivity };
