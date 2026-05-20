import type { ActivityPlugin } from '../types';
import { ImposterActivity } from './activity';
import { UserX } from 'lucide-react';

export const imposterPlugin: ActivityPlugin = {
  key: 'imposter',
  name: 'Imposter',
  description: 'One student gets ???. Everyone else knows the secret word. Can the class find the imposter?',
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
};

export { ImposterActivity };
