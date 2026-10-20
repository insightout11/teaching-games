import { Globe2 } from 'lucide-react';
import type { GamePlugin } from '../types';
import { WorldQuizGame } from './game';

export const worldQuizPlugin: GamePlugin = {
  key: 'world-quiz',
  name: 'World Quiz',
  description: 'Guess the country from its flag, its shape (zooming out) or a ladder of clues. Kahoot-style on the phones; instant, no setup.',
  category: 'quiz',
  pppStage: 'practice',
  icon: Globe2,
  skills: ['Vocabulary', 'Critical Thinking'],
  component: WorldQuizGame,
  configSchema: [],
  maxPointsPerTurn: 150,
  defaultTimerSeconds: 20,
  estimatedMinutes: 10,
  scoringProfile: { displayMode: 'competitive', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};
