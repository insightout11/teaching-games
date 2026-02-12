import type { GamePlugin } from '../types';
import { WordChainGame } from './game';
import { BookA } from 'lucide-react';

export const wordChainPlugin: GamePlugin = {
  key: 'word-chain',
  name: 'Word Chain',
  description: 'Build chains of connected words. Each word must relate to the previous!',
  category: 'vocabulary',
  icon: BookA,
  skills: ['Vocabulary', 'Association', 'Creativity'],
  component: WordChainGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};
