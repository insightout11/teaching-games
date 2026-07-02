import type { ActivityPlugin } from '../types';
import { FinalWordActivity } from './activity';
import { Mic } from 'lucide-react';

export const finalWordPlugin: ActivityPlugin = {
  key: 'final-word',
  name: 'Final Word',
  description: 'Every student delivers one sentence to the class — their real opinion, in their own voice',
  category: 'closing',
  pppStage: 'landing',
  skills: ['Speaking', 'Critical Thinking'],
  component: FinalWordActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 3,
  defaultTimerSeconds: 30,
  icon: Mic,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 1,
  // Every student speaks once — in a large classroom that turn-taking runs long enough
  // to lose the closing-moment energy this is built for.
  idealStudents: { min: 1, max: 6 },
  deviceFree: false,
};

export { FinalWordActivity };
