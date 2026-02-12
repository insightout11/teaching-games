import type { GamePlugin } from '../types';
import { ConnectionGame } from './game';
import { Brain } from 'lucide-react';

export const connectionPlugin: GamePlugin = {
  key: 'connection',
  name: "What's the Link?",
  description: 'Find the hidden connection between two words',
  category: 'logic-puzzles',
  icon: Brain,
  skills: ['Critical Thinking', 'Vocabulary', 'Reasoning'],
  component: ConnectionGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};
