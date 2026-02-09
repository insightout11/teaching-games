import type { GamePlugin } from '../types';
import { WordChainGame } from './game';

export const wordChainPlugin: GamePlugin = {
  key: 'word-chain',
  name: 'Word Chain',
  description: 'Build chains of connected words. Each word must relate to the previous!',
  skills: ['Vocabulary', 'Association', 'Creativity'],
  component: WordChainGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};
