import type { GamePlugin } from '../types';
import { TwentyQuestionsGame } from './game';
import { HelpCircle } from 'lucide-react';

export const twentyQuestionsPlugin: GamePlugin = {
  key: 'twenty-questions',
  name: '20 Questions',
  description: 'One student picks a secret — others ask questions to deduce it!',
  category: 'logic-puzzles',
  pppStage: 'production',
  icon: HelpCircle,
  skills: ['Critical Thinking', 'Questioning', 'Deduction'],
  component: TwentyQuestionsGame,
  configSchema: [],
  maxPointsPerTurn: 15,
  defaultTimerSeconds: 30,
};
