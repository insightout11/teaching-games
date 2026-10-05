import { Repeat } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { SayItAgainActivity } from './activity';

// Speak v2 fluency stage (4-3-2): the same answer three times, 40s → 30s → 20s.
export const sayItAgainPlugin: ActivityPlugin = {
  key: 'say-it-again',
  name: 'Say It Again, Better',
  description: 'Everyone answers one personal question three times: 40, 30, then 20 seconds. Same answer, better and faster.',
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking'],
  component: SayItAgainActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 12,
  defaultTimerSeconds: 0,
  icon: Repeat,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 1,
  idealStudents: { min: 2, max: 12 },
  deviceFree: true,
};

export { SayItAgainActivity };
