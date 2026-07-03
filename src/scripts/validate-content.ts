/**
 * Content QA validation script for landing page JSON files.
 * Run via: pnpm validate-content
 * Exits non-zero on any failure.
 */

import fs from 'fs';
import path from 'path';
import { getAllGames } from '../games/registry';
import { getAllActivities } from '../activities/registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FAQItem {
  q: string;
  a: string;
}

interface LandingContent {
  slug: string;
  schemaVersion: number;
  headline: string;
  outcomes: string[];
  howItWorks: string[];
  faq: FAQItem[];
  related: string[];
  ogImageTheme: string;
  problemStatement?: string;
  teacherUseCases?: string[];
  estimatedTime?: string;
  groupSize?: string;
  relatedWorksheets?: string[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '../../');
const GAMES_DIR = path.join(ROOT, 'src/content/games');
const ACTIVITIES_DIR = path.join(ROOT, 'src/content/activities');
const MIN_WORD_COUNT = 250;
const MIN_OUTCOMES = 3;
const MIN_HOW_IT_WORKS = 3;
const MIN_FAQ = 4;
const MAX_RELATED = 6;
const FAQ_SIMILARITY_THRESHOLD = 0.6;

const VALID_GAME_SLUG_LIST = [
  'vocab-sprint', 'synonym-showdown', 'word-chain', 'sentence-scramble',
  'grammar-boss', 'error-hunter', 'story-sprint', 'dialogue-detective',
  'connections', 'twenty-questions',
  'flash-quiz', 'brain-teasers', 'defend-it',
  'grid-rush', 'sector-strike', 'radar-fix', 'world-lens',
];

const VALID_ACTIVITY_SLUG_LIST = [
  'would-you-rather', 'two-truths', 'rank-it', 'fact-detective',
  'expert-panel', 'scenario-simulator', 'problem-solvers', 'hot-take-arena',
  'bluff-definition', 'taboo-sprint', 'wonder-board', 'password', 'in-your-words',
  'quick-pulse', 'vocab-radar', 'prediction-round', 'imposter', 'scene-igniter',
  'listening-gap-fill', 'conversation-rounds', 'decision-council', 'cabin-mystery',
];

const VALID_SLUGS = new Set([...VALID_GAME_SLUG_LIST, ...VALID_ACTIVITY_SLUG_LIST]);

const RESERVED_CATEGORY_SLUGS = new Set([
  'quiz', 'vocabulary', 'grammar', 'logic', 'icebreakers', 'learning', 'practice', 'debate', 'closing',
]);

const VALID_OG_THEMES = RESERVED_CATEGORY_SLUGS;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function countWords(content: LandingContent): number {
  const fields = [
    content.headline,
    content.problemStatement ?? '',
    ...(content.outcomes ?? []),
    ...(content.howItWorks ?? []),
    ...(content.faq ?? []).flatMap((f) => [f.q, f.a]),
    ...(content.teacherUseCases ?? []),
  ];
  return tokenize(fields.join(' ')).length;
}

function bigrams(tokens: string[]): Set<string> {
  const bg = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    bg.add(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return bg;
}

function jaccardSimilarity(a: string, b: string): number {
  const ta = bigrams(tokenize(a));
  const tb = bigrams(tokenize(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  let intersection = 0;
  Array.from(ta).forEach((item) => {
    if (tb.has(item)) intersection++;
  });
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Main validation
// ---------------------------------------------------------------------------

let errors = 0;
let warnings = 0;

function fail(msg: string): void {
  console.error(`  ✗ ${msg}`);
  errors++;
}

function warn(msg: string): void {
  console.warn(`  ⚠ ${msg}`);
  warnings++;
}

function loadDir(dir: string): { file: string; content: LandingContent }[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const filePath = path.join(dir, f);
      const raw = fs.readFileSync(filePath, 'utf-8');
      return { file: f, content: JSON.parse(raw) as LandingContent };
    });
}

function validateFile(
  file: string,
  content: LandingContent
): void {
  console.log(`\n  Checking ${file}`);
  const expectedSlug = file.replace('.json', '');

  // 1. Required fields
  const required: (keyof LandingContent)[] = [
    'slug', 'schemaVersion', 'headline', 'outcomes', 'howItWorks', 'faq', 'related', 'ogImageTheme',
  ];
  for (const field of required) {
    if (content[field] === undefined || content[field] === null || content[field] === '') {
      fail(`Missing required field: ${field}`);
    }
  }

  // 2. Slug matches filename
  if (content.slug !== expectedSlug) {
    fail(`slug "${content.slug}" does not match filename "${expectedSlug}"`);
  }

  // 3. Slug collision guard — no game/activity slug should equal a reserved category slug
  if (RESERVED_CATEGORY_SLUGS.has(content.slug)) {
    fail(`slug "${content.slug}" collides with a reserved category slug`);
  }

  // 4. Array minimum counts
  if (!Array.isArray(content.outcomes) || content.outcomes.length < MIN_OUTCOMES) {
    fail(`outcomes must have at least ${MIN_OUTCOMES} items (found ${content.outcomes?.length ?? 0})`);
  }
  if (!Array.isArray(content.howItWorks) || content.howItWorks.length < MIN_HOW_IT_WORKS) {
    fail(`howItWorks must have at least ${MIN_HOW_IT_WORKS} items (found ${content.howItWorks?.length ?? 0})`);
  }
  if (!Array.isArray(content.faq) || content.faq.length < MIN_FAQ) {
    fail(`faq must have at least ${MIN_FAQ} items (found ${content.faq?.length ?? 0})`);
  }

  // 5. OG image theme valid
  if (!VALID_OG_THEMES.has(content.ogImageTheme)) {
    fail(`ogImageTheme "${content.ogImageTheme}" is not valid. Use one of: ${Array.from(VALID_OG_THEMES).join(', ')}`);
  }

  // 6. Related slugs resolve
  if (Array.isArray(content.related)) {
    if (content.related.length > MAX_RELATED) {
      fail(`related has ${content.related.length} items (max ${MAX_RELATED})`);
    }
    for (const relSlug of content.related) {
      if (!VALID_SLUGS.has(relSlug)) {
        fail(`related slug "${relSlug}" does not resolve to a valid game or activity`);
      }
    }
  }

  // 7. Word count
  const wordCount = countWords(content);
  if (wordCount < MIN_WORD_COUNT) {
    fail(`Total word count is ${wordCount} (minimum ${MIN_WORD_COUNT})`);
  }
}

// ---------------------------------------------------------------------------
// Cross-file checks
// ---------------------------------------------------------------------------

function crossFileChecks(
  all: { file: string; content: LandingContent }[]
): void {
  // Collect all FAQ questions and answers
  const allQuestions: { question: string; file: string }[] = [];
  const allAnswers: { answer: string; file: string }[] = [];

  for (const { file, content } of all) {
    if (!Array.isArray(content.faq)) continue;

    // Duplicate questions within same file
    const seenInFile = new Set<string>();
    for (const item of content.faq) {
      if (seenInFile.has(item.q)) {
        console.error(`\n  Checking ${file}`);
        fail(`Duplicate FAQ question within ${file}: "${item.q}"`);
      }
      seenInFile.add(item.q);
    }

    for (const item of content.faq) {
      allQuestions.push({ question: item.q, file });
      allAnswers.push({ answer: item.a, file });
    }
  }

  // Duplicate questions across files (exact match)
  const questionCounts: Record<string, string[]> = {};
  for (const { question, file } of allQuestions) {
    if (!questionCounts[question]) questionCounts[question] = [];
    questionCounts[question].push(file);
  }
  Object.entries(questionCounts).forEach(([question, files]) => {
    if (files.length > 1) {
      console.error(`\n  Cross-file duplicate FAQ question:`);
      fail(`"${question}" appears in: ${files.join(', ')}`);
    }
  });

  // Bigram Jaccard similarity check on FAQ answers (across all files)
  for (let i = 0; i < allAnswers.length; i++) {
    for (let j = i + 1; j < allAnswers.length; j++) {
      const sim = jaccardSimilarity(allAnswers[i].answer, allAnswers[j].answer);
      if (sim > FAQ_SIMILARITY_THRESHOLD) {
        const short = (s: string) => s.slice(0, 60) + (s.length > 60 ? '…' : '');
        warn(
          `High FAQ answer similarity (${(sim * 100).toFixed(0)}%) between:\n` +
          `    [${allAnswers[i].file}] "${short(allAnswers[i].answer)}"\n` +
          `    [${allAnswers[j].file}] "${short(allAnswers[j].answer)}"`
        );
      }
    }
  }
}

function registryCoverageChecks(
  gameFiles: { file: string; content: LandingContent }[],
  activityFiles: { file: string; content: LandingContent }[]
): void {
  const gameSlugs = new Set(gameFiles.map(({ content }) => content.slug));
  const activitySlugs = new Set(activityFiles.map(({ content }) => content.slug));

  const missingGames = getAllGames().filter((plugin) => !gameSlugs.has(plugin.key));
  const missingPublicActivities = getAllActivities().filter(
    (plugin) => !plugin.flightPlanOnly && !activitySlugs.has(plugin.key)
  );

  if (missingGames.length > 0) {
    warn(
      `Registered games without SEO content: ${missingGames
        .map((plugin) => plugin.key)
        .join(', ')}`
    );
  }

  if (missingPublicActivities.length > 0) {
    warn(
      `Public activities without SEO content: ${missingPublicActivities
        .map((plugin) => plugin.key)
        .join(', ')}`
    );
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log('\n=== Validating game content ===');
const gameFiles = loadDir(GAMES_DIR);
for (const { file, content } of gameFiles) {
  validateFile(file, content);
}

console.log('\n=== Validating activity content ===');
const activityFiles = loadDir(ACTIVITIES_DIR);
for (const { file, content } of activityFiles) {
  validateFile(file, content);
}

console.log('\n=== Cross-file checks ===');
crossFileChecks([...gameFiles, ...activityFiles]);
registryCoverageChecks(gameFiles, activityFiles);

// Summary
console.log('\n─────────────────────────────────');
console.log(`Files validated: ${gameFiles.length} games, ${activityFiles.length} activities`);
console.log(`Errors:   ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors > 0) {
  console.error('\n✗ Validation FAILED\n');
  process.exit(1);
} else {
  console.log('\n✓ Validation passed\n');
  process.exit(0);
}
