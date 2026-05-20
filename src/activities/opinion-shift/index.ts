import type { ActivityPlugin } from '../types';
import { OpinionShiftActivity } from './activity';
import { ArrowRightLeft } from 'lucide-react';

export const opinionShiftPlugin: ActivityPlugin = {
  key: 'opinion-shift',
  name: 'Opinion Shift',
  description: 'Students reflect on how their thinking has changed. Before vs. now.',
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
};

export { OpinionShiftActivity };
