import type { ActivityPlugin } from '../types';
import { MicDropActivity } from './activity';
import { Mic } from 'lucide-react';

export const micDropPlugin: ActivityPlugin = {
  key: 'mic-drop',
  name: 'Mic Drop',
  description: 'Write your most powerful line. AI finds the standout voices.',
  category: 'closing',
  pppStage: 'landing',
  skills: ['Vocabulary', 'Creativity'],
  component: MicDropActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 60,
  icon: Mic,
  flightPlanOnly: true,
};

export { MicDropActivity };
