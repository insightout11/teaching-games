import type { GamePlugin } from '../types';
import { WordChainGame } from './game';
import { BookA } from 'lucide-react';

export const wordChainPlugin: GamePlugin = {
  key: 'word-chain',
  name: 'Word Chain',
  description: 'Build chains of connected words. Each word must relate to the previous!',
  category: 'vocabulary',
  pppStage: 'practice',
  icon: BookA,
  skills: ['Vocabulary', 'Association', 'Creativity'],
  component: WordChainGame,
  configSchema: [],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 20,
  estimatedMinutes: 10,
  scoringProfile: { displayMode: 'competitive', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 2, max: null },
  deviceFree: true,
};
