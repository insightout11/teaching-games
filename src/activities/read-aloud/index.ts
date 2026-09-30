import type { ActivityPlugin } from '../types';
import { ReadAloudActivity } from './activity';
import { BookOpen } from 'lucide-react';

export const readAloudPlugin: ActivityPlugin = {
  key: 'read-aloud',
  name: 'Read it together',
  description: 'Read any text as a class: class-level version, turns reading aloud, everyone else follows on phones and taps tricky words. Start it from a cargo item with text.',
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Speaking', 'Listening'],
  component: ReadAloudActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 10,
  defaultTimerSeconds: 30,
  icon: BookOpen,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true, defaultOutcome: 'on-task' },
  minStudents: 1,
  // Round-robin reading turns don't scale to a full classroom — each student would only
  // get a tiny sliver of the passage.
  idealStudents: { min: 1, max: 6 },
  deviceFree: false,
};

export { ReadAloudActivity };
