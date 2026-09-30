import type { ActivityPlugin } from '../types';
import { ImposterActivity } from './activity';
import { UserX } from 'lucide-react';

export const imposterPlugin: ActivityPlugin = {
  key: 'imposter',
  name: 'Imposter',
  description: 'Secret cards on phones: everyone shares a word or question except the imposter. Clues in a new order every round, then the class votes. Modes: secret word, secret question, today’s words; Easy hint; two imposters.',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: ['Speaking', 'Critical Thinking', 'Listening'],
  component: ImposterActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  defaultTimerSeconds: 0,
  icon: UserX,
  flightPlanOnly: false,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 3,
  idealStudents: { min: 5, max: null },
  deviceFree: false,
};

export { ImposterActivity };
