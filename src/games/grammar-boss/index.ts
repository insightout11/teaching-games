import type { GamePlugin } from '../types';
import { GrammarBossGame } from './game';
import { PenLine } from 'lucide-react';

export const grammarBossPlugin: GamePlugin = {
  key: 'grammar-boss',
  name: 'Grammar Boss',
  description: 'Topic-generated grammar challenges for speaking with targeted feedback.',
  category: 'grammar-writing',
  pppStage: 'practice',
  icon: PenLine,
  skills: ['Grammar', 'Speaking', 'Fluency'],
  component: GrammarBossGame,
  configSchema: [],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 45,
  estimatedMinutes: 10,
  scoringProfile: { displayMode: 'competitive', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 2, max: null },
  deviceFree: true,
};
