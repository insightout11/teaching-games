import type { ActivityPlugin } from '../types';
import { HotSeatActivity } from './activity';
import { Armchair } from 'lucide-react';

export const hotSeatPlugin: ActivityPlugin = {
  key: 'hot-seat',
  name: 'Hot Seat',
  description: 'One student can\'t see the word; everyone else has it on their phone and takes turns giving spoken clues. The whole class talks.',
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Listening', 'Vocabulary'],
  component: HotSeatActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  defaultTimerSeconds: 60,
  icon: Armchair,
  flightPlanOnly: false,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 3,
  idealStudents: { min: 4, max: null },
  deviceFree: false,
};

export { HotSeatActivity };
