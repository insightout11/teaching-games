import type { GamePlugin } from '../types';
import { GrammarBossGame } from './game';

export const grammarBossPlugin: GamePlugin = {
  key: 'grammar-boss',
  name: 'Grammar Boss',
  description: 'AI-generated grammar challenges. Practice speaking with targeted feedback.',
  skills: ['Grammar', 'Speaking', 'Fluency'],
  component: GrammarBossGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};
