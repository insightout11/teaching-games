import type { GamePlugin } from '../types';
import { ToneTransformerGame } from './game';

export const toneTransformerPlugin: GamePlugin = {
  key: 'tone-transformer',
  name: 'Tone Transformer',
  description: 'Rewrite sentences to match a target tone. Master formal, casual, and professional registers.',
  skills: ['Writing', 'Register', 'Vocabulary'],
  component: ToneTransformerGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};
