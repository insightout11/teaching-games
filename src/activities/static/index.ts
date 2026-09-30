import type { ActivityPlugin } from '../types';
import { StaticActivity } from './activity';
import { Zap } from 'lucide-react';

export const staticPlugin: ActivityPlugin = {
  key: 'static',
  name: 'Static',
  description: 'A fast listening break: the sentence is on the screen, but the voice says one word differently (ship/sheep, fifteen/fifty). Spot the swap on your phone and build a streak.',
  category: 'learning',
  pppStage: 'practice',
  skills: ['Listening', 'Vocabulary'],
  component: StaticActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 5,
  defaultTimerSeconds: 0,
  icon: Zap,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { StaticActivity };
