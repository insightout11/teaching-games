import type { GamePlugin } from '../types';
import { ConnectionsGame } from './game';

export const connectionsPlugin: GamePlugin = {
  key: 'connections',
  name: 'Connections',
  description: 'Find 4 groups of 4 related words in a 16-word grid',
  skills: ['Critical Thinking', 'Vocabulary', 'Pattern Recognition'],
  component: ConnectionsGame,
  configSchema: [],
  maxPointsPerTurn: 45,  // 10+10+10+10+5 bonus
};
