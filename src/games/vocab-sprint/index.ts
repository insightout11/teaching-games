import type { GamePlugin } from '../types';
import { VocabSprintGame } from './game';
import { BookA } from 'lucide-react';

export const vocabSprintPlugin: GamePlugin = {
  key: 'vocab-sprint',
  name: 'VocabSprint',
  description: 'AI-powered vocabulary upgrade. Replace weak words with stronger alternatives.',
  category: 'vocabulary',
  icon: BookA,
  skills: ['Vocabulary', 'Precision', 'Context'],
  component: VocabSprintGame,
  configSchema: [],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 30,
};
