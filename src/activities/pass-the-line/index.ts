import { MessagesSquare } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { PassTheLineActivity } from './activity';

// Speak v2 main event: the whole class builds one conversation, the mic passing every line.
export const passTheLinePlugin: ActivityPlugin = {
  key: 'pass-the-line',
  name: 'Pass the Line',
  description: 'The whole class builds one conversation together: the mic passes every line. Cues, then a twist, then your own words.',
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking', 'Listening', 'Role-play'],
  component: PassTheLineActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 12,
  defaultTimerSeconds: 0,
  icon: MessagesSquare,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 2,
  idealStudents: { min: 3, max: null },
  deviceFree: true,
};

export { PassTheLineActivity };
