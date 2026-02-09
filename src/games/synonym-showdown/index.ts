import type { GamePlugin } from '../types';
import { SynonymShowdownGame } from './game';

export const synonymShowdownPlugin: GamePlugin = {
  key: 'synonym-showdown',
  name: 'Synonym Showdown',
  description: 'Race to list synonyms before time runs out. Build streaks for bonus points!',
  skills: ['Vocabulary', 'Speed', 'Word Knowledge'],
  component: SynonymShowdownGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};
