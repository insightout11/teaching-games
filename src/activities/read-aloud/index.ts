import type { ActivityPlugin } from '../types';
import { ReadAloudActivity } from './activity';
import { BookOpen } from 'lucide-react';

export const readAloudPlugin: ActivityPlugin = {
  key: 'read-aloud',
  name: 'Read Aloud',
  description: 'Students take turns reading paragraphs aloud — round-robin with a live queue on every device',
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Speaking', 'Listening'],
  component: ReadAloudActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 10,
  defaultTimerSeconds: 30,
  icon: BookOpen,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true, defaultOutcome: 'on-task' },
  minStudents: 1,
  // Round-robin reading turns don't scale to a full classroom — each student would only
  // get a tiny sliver of the passage.
  idealStudents: { min: 1, max: 6 },
  deviceFree: false,
};

export { ReadAloudActivity };
