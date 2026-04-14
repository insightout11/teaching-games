import { Brain } from 'lucide-react';
import type { GamePlugin } from '../types';
import { BrainTeasersGame } from './game';

export const brainTeasersPlugin: GamePlugin = {
  key: 'brain-teasers',
  name: 'Brain Teasers',
  description: 'Classic lateral thinking riddles — students type their answer, teacher reveals the trick.',
  category: 'logic-puzzles',
  pppStage: 'practice',
  icon: Brain,
  skills: ['Critical Thinking', 'Logic'],
  component: BrainTeasersGame,
  configSchema: [],
  maxPointsPerTurn: 3,
  defaultTimerSeconds: 0,
  estimatedMinutes: 10,
};
