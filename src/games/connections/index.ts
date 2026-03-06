import type { GamePlugin } from '../types';
import { ConnectionsGame } from './game';
import { Brain } from 'lucide-react';

export const connectionsPlugin: GamePlugin = {
  key: 'connections',
  name: 'Connections',
  description: 'Find 4 groups of 4 related words in a 16-word grid',
  category: 'logic-puzzles',
  pppStage: 'practice',
  icon: Brain,
  skills: ['Critical Thinking', 'Vocabulary', 'Pattern Recognition'],
  component: ConnectionsGame,
  configSchema: [],
  maxPointsPerTurn: 45,  // 10+10+10+10+5 bonus
  defaultTimerSeconds: 120,
  estimatedMinutes: 15,
};
