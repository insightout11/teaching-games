import { Zap } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { QuickFireActivity } from './activity';

// Speak v2 warm-up: everyone answers each question in 10 seconds, the turn passes on.
export const quickFirePlugin: ActivityPlugin = {
  key: 'quick-fire',
  name: 'Quick-fire',
  description: 'One fun question, everyone answers in 10 seconds, the turn passes on. Everyone talks in the first few minutes.',
  category: 'learning',
  pppStage: 'practice',
  skills: ['Speaking', 'Listening'],
  component: QuickFireActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 0,
  icon: Zap,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 2,
  idealStudents: { min: 3, max: null },
  deviceFree: true,
};

export { QuickFireActivity };
