import type { GamePlugin } from '../types';
import { VocabSprintGame } from './game';
import { BookA } from 'lucide-react';

export const vocabSprintPlugin: GamePlugin = {
  key: 'vocab-sprint',
  name: 'VocabSprint',
  description: 'topic-generated vocabulary upgrade. Replace weak words with stronger alternatives.',
  category: 'vocabulary',
  pppStage: 'practice',
  icon: BookA,
  skills: ['Vocabulary', 'Precision', 'Context'],
  component: VocabSprintGame,
  configSchema: [],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 30,
  estimatedMinutes: 8,
  scoringProfile: { displayMode: 'competitive', supportsOnTask: true, supportsStandout: true, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 2, max: null },
  deviceFree: true,
};
