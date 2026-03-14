/**
 * Benchmark scenario definitions and thresholds.
 */

export const BASE_URL = process.env.BENCH_URL || 'http://localhost:3000';

// Auth cookie or header for authenticated requests
// Set BENCH_COOKIE to the full cookie string from a logged-in session
export const AUTH_COOKIE = process.env.BENCH_COOKIE || '';

export interface Threshold {
  pass: number;    // ms
  warning: number; // ms
  fail: number;    // ms
}

export const THRESHOLDS = {
  singleLesson: { pass: 12_000, warning: 20_000, fail: 30_000 } as Threshold,
  singleLessonCached: { pass: 2_000, warning: 5_000, fail: 8_000 } as Threshold,
  midSessionSwapCold: { pass: 4_000, warning: 8_000, fail: 15_000 } as Threshold,
  midSessionSwapCached: { pass: 500, warning: 1_000, fail: 3_000 } as Threshold,
  degradedFallback: { pass: 100, warning: 300, fail: 500 } as Threshold,
  concurrent3Slowest: { pass: 20_000, warning: 35_000, fail: 45_000 } as Threshold,
  concurrent5Slowest: { pass: 30_000, warning: 45_000, fail: 60_000 } as Threshold,
};

export const TOPICS = ['Animals', 'Technology', 'Travel', 'Food', 'Sports', 'Music'];
export const DIFFICULTIES = ['Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'];

export const LESSON_PLAN_BODY = {
  customTopic: 'Animals',
  difficulty: 'Intermediate',
  activities: ['would-you-rather', 'quick-pulse', 'rank-it', 'expert-panel', 'final-answer', 'lightning-round'],
  games: ['vocab-sprint', 'synonym-showdown', 'connections'],
};

export const GAME_ENDPOINTS = [
  { path: '/api/vocab-sprint/generate', body: { topic: 'Animals', difficulty: 'Intermediate', tone: 'Neutral' } },
  { path: '/api/synonym-showdown/generate', body: { topic: 'Animals', difficulty: 'Intermediate' } },
  { path: '/api/sentence-scramble/generate', body: { topic: 'Animals', difficulty: 'Intermediate' } },
  { path: '/api/grammar-boss/generate', body: { topic: 'Animals', difficulty: 'Intermediate', grammarTarget: 'present-perfect' } },
  { path: '/api/error-hunter/generate', body: { topic: 'Animals', difficulty: 'Intermediate' } },
  { path: '/api/dialogue-detective/generate', body: { topic: 'Animals', difficulty: 'Intermediate' } },
  { path: '/api/connections/generate', body: { topic: 'Animals', difficulty: 'Intermediate' } },
  { path: '/api/word-chain/generate', body: { topic: 'Animals', difficulty: 'Intermediate' } },
  { path: '/api/grid-rush/generate', body: { topic: 'Animals', difficulty: 'Intermediate' } },
];
