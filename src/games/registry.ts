import type { GamePlugin } from './types';
import { sentenceScramblePlugin } from './sentence-scramble';
import { vocabSprintPlugin } from './vocab-sprint';
import { grammarBossPlugin } from './grammar-boss';
import { storySprintPlugin } from './story-sprint';
import { toneTransformerPlugin } from './tone-transformer';
import { synonymShowdownPlugin } from './synonym-showdown';
import { errorHunterPlugin } from './error-hunter';
import { wordChainPlugin } from './word-chain';
import { dialogueDetectivePlugin } from './dialogue-detective';
import { connectionsPlugin } from './connections';

const games: GamePlugin[] = [
  vocabSprintPlugin,
  sentenceScramblePlugin,
  grammarBossPlugin,
  storySprintPlugin,
  toneTransformerPlugin,
  synonymShowdownPlugin,
  errorHunterPlugin,
  wordChainPlugin,
  dialogueDetectivePlugin,
  connectionsPlugin,
];

export function getGame(key: string): GamePlugin | undefined {
  return games.find((g) => g.key === key);
}

export function getAllGames(): GamePlugin[] {
  return games;
}
