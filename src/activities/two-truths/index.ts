import type { ActivityPlugin } from '../types';
import { TwoTruthsActivity } from './activity';
import { Sparkles } from 'lucide-react';

export const twoTruthsPlugin: ActivityPlugin = {
  key: 'two-truths',
  name: 'Spot the Fib',
  description: 'Three AI statements about the topic — two true, one false. Students debate and vote on the fib before the reveal.',
  category: 'icebreaker',
  pppStage: 'practice',
  skills: ['Speaking', 'Critical Thinking', 'Listening'],
  component: TwoTruthsActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  defaultTimerSeconds: 45,
  icon: Sparkles,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { TwoTruthsActivity };
export * from './types';
