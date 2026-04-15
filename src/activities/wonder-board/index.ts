import type { ActivityPlugin } from '../types';
import { WonderBoardActivity } from './activity';
import { HelpCircle } from 'lucide-react';

export const wonderBoardPlugin: ActivityPlugin = {
  key: 'wonder-board',
  name: 'Wonder Board',
  description: 'Students ask questions about the topic — assigned starters, live board, upvotes, AI answers',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: ['Critical Thinking', 'Question Formation'],
  component: WonderBoardActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  defaultTimerSeconds: 0,
  icon: HelpCircle,
};

export { WonderBoardActivity };
