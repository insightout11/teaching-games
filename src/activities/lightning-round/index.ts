import type { ActivityPlugin } from '../types';
import { LightningRoundActivity } from './activity';
import { Flame } from 'lucide-react';

export const lightningRoundPlugin: ActivityPlugin = {
  key: 'lightning-round',
  name: 'Lightning Round',
  description: 'Rapid-fire prompts. Every student writes fast. AI spots the best answers.',
  category: 'closing',
  pppStage: 'landing',
  skills: ['Vocabulary', 'Critical Thinking'],
  component: LightningRoundActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 6,
  defaultTimerSeconds: 30,
  icon: Flame,
  flightPlanOnly: true,
};

export { LightningRoundActivity };
