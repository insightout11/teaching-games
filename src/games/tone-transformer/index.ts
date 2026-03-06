import type { GamePlugin } from '../types';
import { ToneTransformerGame } from './game';
import { PenLine } from 'lucide-react';

export const toneTransformerPlugin: GamePlugin = {
  key: 'tone-transformer',
  name: 'Tone Transformer',
  description: 'Rewrite sentences to match a target tone. Master formal, casual, and professional registers.',
  category: 'grammar-writing',
  pppStage: 'practice',
  icon: PenLine,
  skills: ['Writing', 'Register', 'Vocabulary'],
  component: ToneTransformerGame,
  configSchema: [],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 30,
  estimatedMinutes: 8,
};
