import type { ActivityPlugin } from '../types';
import { FinalWordActivity } from './activity';
import { Mic } from 'lucide-react';

export const finalWordPlugin: ActivityPlugin = {
  key: 'final-word',
  name: 'Final Word',
  description: 'Every student delivers one sentence to the class — their real opinion, in their own voice',
  category: 'closing',
  pppStage: 'landing',
  skills: ['Speaking', 'Critical Thinking'],
  component: FinalWordActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 3,
  defaultTimerSeconds: 30,
  icon: Mic,
  flightPlanOnly: true,
};

export { FinalWordActivity };
