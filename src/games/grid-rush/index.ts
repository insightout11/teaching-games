import type { GamePlugin } from '../types';
import { GridRushGame } from './game';
import { Grid3x3 } from 'lucide-react';

export const gridRushPlugin: GamePlugin = {
  key: 'grid-rush',
  name: 'GridRush',
  description: '2-round race: build words from a shared letter grid, then write your best sentence.',
  category: 'vocabulary',
  pppStage: 'practice',
  icon: Grid3x3,
  skills: ['Vocabulary', 'Spelling', 'Grammar', 'Writing'],
  component: GridRushGame,
  configSchema: [],
  maxPointsPerTurn: 40,
  defaultTimerSeconds: 60,
};
