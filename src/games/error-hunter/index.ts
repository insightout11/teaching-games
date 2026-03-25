import type { GamePlugin } from '../types';
import { ErrorHunterGame } from './game';
import { PenLine } from 'lucide-react';

export const errorHunterPlugin: GamePlugin = {
  key: 'error-hunter',
  name: 'Error Hunter',
  description: 'Find and fix grammar errors hidden in paragraphs. Detective-style proofreading!',
  category: 'grammar-writing',
  pppStage: 'practice',
  icon: PenLine,
  skills: ['Grammar', 'Proofreading', 'Attention'],
  component: ErrorHunterGame,
  configSchema: [],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 90,
  estimatedMinutes: 10,
};
