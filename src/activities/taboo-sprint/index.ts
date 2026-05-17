import type { ActivityPlugin } from '../types';
import { TabooSprintActivity } from './activity';
import { Ban } from 'lucide-react';

export const tabooSprintPlugin: ActivityPlugin = {
  key: 'taboo-sprint',
  name: 'Taboo Sprint',
  description: 'Like Password — but speakers can\'t use the secret word OR the 4 forbidden words. How creative can you be?',
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Listening', 'Vocabulary'],
  component: TabooSprintActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 20,
  defaultTimerSeconds: 30,
  icon: Ban,
  flightPlanOnly: false,
};

export { TabooSprintActivity };
