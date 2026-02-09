import type { GamePlugin } from '../types';
import { VocabSprintGame } from './game';

export const vocabSprintPlugin: GamePlugin = {
  key: 'vocab-sprint',
  name: 'VocabSprint',
  description: 'AI-powered vocabulary upgrade. Replace weak words with stronger alternatives.',
  skills: ['Vocabulary', 'Precision', 'Context'],
  component: VocabSprintGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};
