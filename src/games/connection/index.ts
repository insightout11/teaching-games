import type { GamePlugin } from '../types';
import { ConnectionGame } from './game';

export const connectionPlugin: GamePlugin = {
  key: 'connection',
  name: "What's the Link?",
  description: 'Find the hidden connection between two words',
  skills: ['Critical Thinking', 'Vocabulary', 'Reasoning'],
  component: ConnectionGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};
