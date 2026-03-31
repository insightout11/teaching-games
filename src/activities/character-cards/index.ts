import type { ActivityPlugin } from '../types';
import { CharacterCardsActivity } from './activity';
import { Theater } from 'lucide-react';

export const characterCardsPlugin: ActivityPlugin = {
  key: 'character-cards',
  name: 'Character Cards',
  description: 'Each student is assigned a character with a viewpoint — speak one sentence as your character to kick off the lesson',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: ['Speaking', 'Critical Thinking'],
  component: CharacterCardsActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 30,
  icon: Theater,
  flightPlanOnly: true,
};

export { CharacterCardsActivity };
