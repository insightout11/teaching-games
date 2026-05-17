/**
 * Content loader and types for landing page JSON files.
 * Handles slug mapping between registry keys and URL-friendly display slugs.
 */

import vocabSprintJson from '@/content/games/vocab-sprint.json';
import synonymShowdownJson from '@/content/games/synonym-showdown.json';
import wordChainJson from '@/content/games/word-chain.json';
import sentenceScrambleJson from '@/content/games/sentence-scramble.json';
import grammarBossJson from '@/content/games/grammar-boss.json';
import errorHunterJson from '@/content/games/error-hunter.json';
import storySprintJson from '@/content/games/story-sprint.json';
import dialogueDetectiveJson from '@/content/games/dialogue-detective.json';
import connectionsJson from '@/content/games/connections.json';
import twentyQuestionsJson from '@/content/games/twenty-questions.json';
import flashQuizJson from '@/content/games/flash-quiz.json';
import brainTeasersJson from '@/content/games/brain-teasers.json';
import defendItJson from '@/content/games/defend-it.json';

import wouldYouRatherJson from '@/content/activities/would-you-rather.json';
import twoTruthsJson from '@/content/activities/two-truths.json';
import rankItJson from '@/content/activities/rank-it.json';
import factDetectiveJson from '@/content/activities/fact-detective.json';
import expertPanelJson from '@/content/activities/expert-panel.json';
import scenarioSimulatorJson from '@/content/activities/scenario-simulator.json';
import problemSolversJson from '@/content/activities/problem-solvers.json';
import hotTakeArenaJson from '@/content/activities/hot-take-arena.json';
import bluffDefinitionJson from '@/content/activities/bluff-definition.json';
import tabooSprintJson from '@/content/activities/taboo-sprint.json';
import wonderBoardJson from '@/content/activities/wonder-board.json';
import passwordJson from '@/content/activities/password.json';
import inYourWordsJson from '@/content/activities/in-your-words.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FAQItem {
  q: string;
  a: string;
}

export interface LandingContent {
  slug: string;
  schemaVersion: number;
  headline: string;
  outcomes: string[];
  howItWorks: string[];
  faq: FAQItem[];
  related: string[];
  ogImageTheme: string;
  // Optional fields
  problemStatement?: string;
  teacherUseCases?: string[];
  estimatedTime?: string;
  groupSize?: string;
  relatedWorksheets?: string[];
}

// ---------------------------------------------------------------------------
// Category slug maps
// Registry key → URL-friendly display slug
// ---------------------------------------------------------------------------

export const GAME_CATEGORY_SLUGS: Record<string, string> = {
  vocabulary: 'vocabulary',
  'grammar-writing': 'grammar',
  'logic-puzzles': 'logic',
};

export const ACTIVITY_CATEGORY_SLUGS: Record<string, string> = {
  icebreaker: 'icebreakers',
  learning: 'learning',
  practice: 'practice',
  debate: 'debate',
};

// Reverse maps: display slug → registry key
export const GAME_CATEGORY_SLUG_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(GAME_CATEGORY_SLUGS).map(([k, v]) => [v, k])
);

export const ACTIVITY_CATEGORY_SLUG_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(ACTIVITY_CATEGORY_SLUGS).map(([k, v]) => [v, k])
);

// All valid category display slugs
export const GAME_CATEGORY_DISPLAY_SLUGS = new Set(Object.values(GAME_CATEGORY_SLUGS));
export const ACTIVITY_CATEGORY_DISPLAY_SLUGS = new Set(Object.values(ACTIVITY_CATEGORY_SLUGS));

// ---------------------------------------------------------------------------
// Content maps
// ---------------------------------------------------------------------------

const GAME_CONTENT: Record<string, LandingContent> = {
  'vocab-sprint': vocabSprintJson as LandingContent,
  'synonym-showdown': synonymShowdownJson as LandingContent,
  'word-chain': wordChainJson as LandingContent,
  'sentence-scramble': sentenceScrambleJson as LandingContent,
  'grammar-boss': grammarBossJson as LandingContent,
  'error-hunter': errorHunterJson as LandingContent,
  'story-sprint': storySprintJson as LandingContent,
  'dialogue-detective': dialogueDetectiveJson as LandingContent,
  'connections': connectionsJson as LandingContent,
  'twenty-questions': twentyQuestionsJson as LandingContent,
  'flash-quiz': flashQuizJson as LandingContent,
  'brain-teasers': brainTeasersJson as LandingContent,
  'defend-it': defendItJson as LandingContent,
};

const ACTIVITY_CONTENT: Record<string, LandingContent> = {
  'would-you-rather': wouldYouRatherJson as LandingContent,
  'two-truths': twoTruthsJson as LandingContent,
  'rank-it': rankItJson as LandingContent,
  'fact-detective': factDetectiveJson as LandingContent,
  'expert-panel': expertPanelJson as LandingContent,
  'scenario-simulator': scenarioSimulatorJson as LandingContent,
  'problem-solvers': problemSolversJson as LandingContent,
  'hot-take-arena': hotTakeArenaJson as LandingContent,
  'bluff-definition': bluffDefinitionJson as LandingContent,
  'taboo-sprint': tabooSprintJson as LandingContent,
  'wonder-board': wonderBoardJson as LandingContent,
  'password': passwordJson as LandingContent,
  'in-your-words': inYourWordsJson as LandingContent,
};

export function getGameContent(slug: string): LandingContent | undefined {
  return GAME_CONTENT[slug];
}

export function getActivityContent(slug: string): LandingContent | undefined {
  return ACTIVITY_CONTENT[slug];
}

export function getAllGameSlugs(): string[] {
  return Object.keys(GAME_CONTENT);
}

export function getAllActivitySlugs(): string[] {
  return Object.keys(ACTIVITY_CONTENT);
}
