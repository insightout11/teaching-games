import type { ActivityPlugin } from '../types';
import { CompareItActivity } from './activity';
import { Scale } from 'lucide-react';

export const compareItPlugin: ActivityPlugin = {
  key: 'compare-it',
  name: 'Compare It',
  description: "Two (or three) things on screen; when it's your turn, compare them out loud: bigger than, more expensive than, the fastest. Phones show the adjectives and their forms.",
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Critical Thinking'],
  component: CompareItActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  defaultTimerSeconds: 0,
  icon: Scale,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: true, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 2, max: null },
  deviceFree: false,
};

export { CompareItActivity };
