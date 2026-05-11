import type { ComponentType } from 'react';
import type { GamePlugin, GameCategory } from './types';
import { sentenceScramblePlugin } from './sentence-scramble';
import { vocabSprintPlugin } from './vocab-sprint';
import { grammarBossPlugin } from './grammar-boss';
import { storySprintPlugin } from './story-sprint';
// VAULTED: toneTransformerPlugin (teacher transcription required, overlaps Vocab Sprint)
import { synonymShowdownPlugin } from './synonym-showdown';
import { errorHunterPlugin } from './error-hunter';
import { wordChainPlugin } from './word-chain';
import { dialogueDetectivePlugin } from './dialogue-detective';
import { connectionsPlugin } from './connections';
import { twentyQuestionsPlugin } from './twenty-questions';
import { gridRushPlugin } from './grid-rush';
import { BookA, PenLine, Brain, Zap } from 'lucide-react';
import { flashQuizPlugin } from './flash-quiz';
import { brainTeasersPlugin } from './brain-teasers';
import { defendItPlugin } from './defend-it';
import { sectorStrikePlugin } from './sector-strike';
import { zoneBoardPlugin } from './zone-board';

const games: GamePlugin[] = [
  flashQuizPlugin,
  brainTeasersPlugin,
  vocabSprintPlugin,
  synonymShowdownPlugin,
  wordChainPlugin,
  gridRushPlugin,
  sentenceScramblePlugin,
  grammarBossPlugin,
  errorHunterPlugin,
  storySprintPlugin,
  // VAULTED: toneTransformerPlugin
  dialogueDetectivePlugin,
  connectionsPlugin,
  twentyQuestionsPlugin,
  defendItPlugin,
  sectorStrikePlugin,
  zoneBoardPlugin,
];

export function getGame(key: string): GamePlugin | undefined {
  return games.find((g) => g.key === key);
}

export function getAllGames(): GamePlugin[] {
  return games;
}

/**
 * Get games filtered by category
 */
export function getGamesByCategory(category: GameCategory): GamePlugin[] {
  return games.filter((g) => g.category === category);
}

/**
 * Get games grouped by category
 */
export function getGamesGrouped(): Record<GameCategory, GamePlugin[]> {
  return {
    quiz: getGamesByCategory('quiz'),
    vocabulary: getGamesByCategory('vocabulary'),
    'grammar-writing': getGamesByCategory('grammar-writing'),
    'logic-puzzles': getGamesByCategory('logic-puzzles'),
  };
}

/**
 * Game category display names, descriptions, icons, and colors
 */
export const GAME_CATEGORY_INFO: Record<GameCategory, {
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}> = {
  quiz: {
    name: 'Quiz',
    description: 'Fast-paced simultaneous quiz games',
    icon: Zap,
    color: 'text-violet-400',
  },
  vocabulary: {
    name: 'Vocabulary',
    description: 'Build and strengthen word knowledge',
    icon: BookA,
    color: 'text-cyan-400',
  },
  'grammar-writing': {
    name: 'Grammar & Writing',
    description: 'Practice grammar, sentence structure, and writing skills',
    icon: PenLine,
    color: 'text-emerald-400',
  },
  'logic-puzzles': {
    name: 'Logic & Puzzles',
    description: 'Critical thinking and pattern recognition',
    icon: Brain,
    color: 'text-amber-400',
  },
};
