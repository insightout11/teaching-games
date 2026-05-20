import type { GamePlugin } from '../types';
import { GrammarBossGame } from './game';
import { PenLine } from 'lucide-react';

export const grammarBossPlugin: GamePlugin = {
  key: 'grammar-boss',
  name: 'Grammar Boss',
  description: 'topic-generated grammar challenges. Practice speaking with targeted feedback.',
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
};
