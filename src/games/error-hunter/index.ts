import type { GamePlugin } from '../types';
import { ErrorHunterGame } from './game';

export const errorHunterPlugin: GamePlugin = {
  key: 'error-hunter',
  name: 'Error Hunter',
  description: 'Find and fix grammar errors hidden in paragraphs. Detective-style proofreading!',
  skills: ['Grammar', 'Proofreading', 'Attention'],
  component: ErrorHunterGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};
