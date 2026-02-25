// scripts/nightly-prewarm.ts
// Nightly cache pre-warm: generates AI content for all (game, topic, difficulty, variant)
// combinations and stores them in the generated_content table.
//
// Usage:
//   pnpm prewarm [--target N] [--dry-run]
//   pnpm prewarm:dry

import * as fs from 'fs';
import * as path from 'path';
import { generateJSON } from '../src/lib/ai/index';
import type { AISchema } from '../src/lib/ai/types';
import { createServiceClient } from '../src/lib/supabase/service';
import { Semaphore } from '../src/lib/ai/concurrency';

// ── Load .env.local before calling any function that reads process.env ─────────
// Imports are hoisted but env vars are only READ when the imported functions are
// called (not at module init time), so loading here is sufficient.
(function loadEnvLocal() {
  const envFile = path.join(path.resolve('.'), '.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const raw = t.slice(eq + 1).trim();
    const val = raw.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
})();

// ── Constants ─────────────────────────────────────────────────────────────────

const TOPICS = [
  'General', 'Action', 'Business', 'Academic', 'Travel', 'Technology',
  'Literature', 'Space', 'Nature', 'Cooking', 'Art', 'Sports', 'History', 'Psychology',
] as const;

const DIFFICULTIES = ['Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'] as const;

const GRAMMAR_TARGETS = [
  'present simple', 'present continuous', 'past simple', 'past continuous',
  'present perfect', 'present perfect continuous', 'past perfect',
  'future (will)', 'future (going to)', 'future continuous',
  'conditional', 'passive voice', 'relative clause', 'reported speech',
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface GameConfig {
  gameKey: string;
  variants: () => Array<string | undefined>;
  buildPrompt: (topic: string, difficulty: string, variant?: string) => string;
  schema: AISchema;
  temperature?: number;
  transformForStorage?: (data: unknown) => unknown;
  validate?: (data: unknown) => void;
}

interface WorkItem {
  config: GameConfig;
  topic: string;
  difficulty: string;
  variant: string | undefined;
}

// ── Difficulty maps (copied verbatim from route files) ────────────────────────

// Source: src/app/api/vocab-sprint/generate/route.ts
const vocabSprintDifficulty: Record<string, string> = {
  'Beginner': 'Beginner (A1) level. Use very short, extremely simple sentences (4-6 words). Focus on basic everyday objects and actions.',
  'Easy': 'Easy (A2) level. Use simple sentences about familiar topics. Vocabulary should be basic but functional.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common but slightly simple vocabulary in standard sentences.',
  'Advanced': 'Advanced (C1) level. Use complex sentence structures and natural idioms.',
  'Expert': 'Expert (C2/Native) level. Use very sophisticated, nuanced, and academic language.',
};

// Source: src/app/api/synonym-showdown/generate/route.ts
const synonymShowdownDifficulty: Record<string, string> = {
  'Beginner': 'Beginner (A1) level. Use very common, basic words.',
  'Easy': 'Easy (A2) level. Use simple, everyday vocabulary.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common vocabulary.',
  'Advanced': 'Advanced (C1) level. Use sophisticated vocabulary.',
  'Expert': 'Expert (C2/Native) level. Use nuanced, academic vocabulary.',
};

// Source: src/app/api/sentence-scramble/generate/route.ts
const sentenceScrambleDifficulty: Record<string, string> = {
  'Beginner': 'Beginner (A1) level. Use 4-5 very common words per sentence.',
  'Easy': 'Easy (A2) level. Use 5-6 simple, everyday words per sentence.',
  'Intermediate': 'Intermediate (B1/B2) level. Use 7-9 words per sentence with varied structure.',
  'Advanced': 'Advanced (C1) level. Use 9-12 words per sentence with complex grammar.',
  'Expert': 'Expert (C2/Native) level. Use 10-14 words per sentence with sophisticated structures.',
};

// Source: src/app/api/grammar-boss/generate/route.ts
const grammarBossDifficulty: Record<string, string> = {
  'Beginner': 'Beginner (A1) level. Use very simple sentence structures.',
  'Easy': 'Easy (A2) level. Use simple but functional sentence patterns.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common sentence structures.',
  'Advanced': 'Advanced (C1) level. Use complex, nuanced sentence structures.',
  'Expert': 'Expert (C2/Native) level. Use sophisticated, academic structures.',
};

// Source: src/app/api/error-hunter/generate/route.ts
const errorHunterDifficultyConfig: Record<string, { errors: number; description: string }> = {
  'Beginner': { errors: 2, description: 'Beginner (A1) level. Use very simple sentences with obvious spelling/grammar errors.' },
  'Easy': { errors: 3, description: 'Easy (A2) level. Use simple sentences with basic grammar errors.' },
  'Intermediate': { errors: 4, description: 'Intermediate (B1/B2) level. Use standard sentences with grammar and word choice errors.' },
  'Advanced': { errors: 4, description: 'Advanced (C1) level. Use complex sentences with subtle grammar errors.' },
  'Expert': { errors: 5, description: 'Expert (C2/Native) level. Use sophisticated sentences with nuanced errors.' },
};

// Source: src/app/api/dialogue-detective/generate/route.ts
const dialogueDetectiveDifficulty: Record<string, string> = {
  'Beginner': 'Beginner (A1) level. Use very simple, short dialogue.',
  'Easy': 'Easy (A2) level. Use simple everyday conversation.',
  'Intermediate': 'Intermediate (B1/B2) level. Use natural conversation.',
  'Advanced': 'Advanced (C1) level. Use nuanced, contextual dialogue.',
  'Expert': 'Expert (C2/Native) level. Use sophisticated, idiomatic conversation.',
};

// Source: src/app/api/connections/generate/route.ts
const connectionsDifficulty: Record<string, string> = {
  'Beginner': `Beginner (A1) level:
- All 4 groups should have very obvious, straightforward connections
- Use basic vocabulary (common nouns, simple adjectives)
- Categories like: fruits, colors, animals, numbers, family members
- No wordplay or double meanings`,
  'Easy': `Easy (A2) level:
- Groups should be clear with common vocabulary
- Categories like: kitchen items, sports, weather words, school subjects
- Connections are obvious once you look for them
- Minimal red herrings`,
  'Intermediate': `Intermediate (B1/B2) level:
- Mix of obvious and moderate difficulty connections
- Include some red herrings (words that could fit multiple categories)
- Categories can be more specific: types of fabric, musical instruments, etc.
- Some thinking required but not tricky`,
  'Advanced': `Advanced (C1) level:
- Subtle connections that require thinking
- More abstract categories possible
- Include deliberate red herrings
- Categories like: things that can be "broken", words with silent letters`,
  'Expert': `Expert (C2/Native) level:
- Include wordplay, puns, or double meanings
- Categories can be tricky (e.g., "words that follow 'black'")
- Multiple plausible groupings that only have one correct answer
- Cultural references or idiomatic connections allowed`,
};

// Source: src/app/api/story-sprint/starter/route.ts
const storySprintDifficulty: Record<string, string> = {
  'Beginner': 'A1 beginner — use simple words and short sentences',
  'Easy': 'A2 elementary — use basic vocabulary and simple structure',
  'Intermediate': 'B1/B2 intermediate — use varied vocabulary and engaging detail',
  'Advanced': 'C1 advanced — use sophisticated language and vivid imagery',
  'Expert': 'C2/Native expert — use masterful prose with rich detail',
};

// Source: src/app/api/word-chain/generate/route.ts
const wordChainDifficulty: Record<string, string> = {
  'Beginner': 'Beginner (A1) level. Use very common, simple words.',
  'Easy': 'Easy (A2) level. Use simple, everyday words.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common vocabulary.',
  'Advanced': 'Advanced (C1) level. Use more sophisticated words.',
  'Expert': 'Expert (C2/Native) level. Use advanced vocabulary.',
};

// ── Game Config Matrix (9 entries) ────────────────────────────────────────────

const GAMES: GameConfig[] = [
  // ── vocab-sprint ─────────────────────────────────────────────────────────────
  // Source: src/app/api/vocab-sprint/generate/route.ts (tone='Neutral'; seenItems omitted)
  {
    gameKey: 'vocab-sprint',
    variants: () => [undefined],
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sentence: { type: 'string' },
          weakWord: { type: 'string' },
          hint: { type: 'string' },
        },
        required: ['sentence', 'weakWord', 'hint'],
      },
    },
    buildPrompt: (topic, difficulty) =>
      `Generate 5 unique, natural English sentences for an English learner at ${vocabSprintDifficulty[difficulty]}
Topic: ${topic}.
Tone: Maintain a balanced, standard tone.
CRITICAL RULES:
1. Each sentence must contain exactly ONE 'generic' or 'weak' word (the 'weakWord') to be replaced.
2. EVERY sentence must use a DIFFERENT weak word - NO REPEATS across the 5 sentences.
3. Prioritize VERBS and ADJECTIVES as weak words, not adverbs like "very" or "really".

Choose weak words from this list (use variety - pick 5 DIFFERENT ones):
- Adjectives: good, bad, big, small, nice, interesting, important, happy, sad, great, amazing, terrible, beautiful, ugly, old, new, fast, slow, hard, easy, fun, boring, cool, weird, strange, normal, different, same, special, basic, simple, difficult, pretty, handsome, smart, dumb, clever, stupid, rich, poor, expensive, cheap, loud, quiet, bright, dark, hot, cold, warm, clean, dirty, empty, full, heavy, light, strong, weak, young, angry, calm, tired, hungry, thirsty, sick, healthy, busy, free, early, late
- Verbs: said, went, got, think, look, make, do, take, give, show, change, tell, walk, run, eat, see, put, come, go, get, want, need, like, love, hate, try, start, stop, move, stay, leave, arrive, return, bring, carry, hold, drop, throw, catch, hit, push, pull, open, close, turn, fix, break, build, create, destroy, help, hurt, save, spend, pay, buy, sell, win, lose, find, keep, use, work, play, watch, listen, speak, talk, ask, answer, learn, teach, read, write, draw, sing, dance, cook, clean, wash, drive, fly, swim, climb, jump, sit, stand, lie, sleep, wake, wait, hope, believe, remember, forget, understand, decide, choose, plan, prepare, finish, complete
- Nouns: thing, stuff, place, person, way, people, man, woman, child, kid, guy, girl, friend, family, home, house, room, food, water, money, time, day, night, morning, evening, work, job, school, class, book, movie, game, problem, idea, question, answer, reason, result, part, group, team, world, country, city, area, situation, experience, moment, chance, opportunity
- Only occasionally use: very, really (max 1 per batch)

Also provide a 'hint' for each sentence—a short, friendly piece of advice (max 10 words) to help the student find a more precise word.

Return exactly 5 objects as a JSON array with varied weak words.`,
  },

  // ── synonym-showdown ──────────────────────────────────────────────────────────
  // Source: src/app/api/synonym-showdown/generate/route.ts (seenItems omitted; temperature=1.2)
  {
    gameKey: 'synonym-showdown',
    variants: () => [undefined],
    temperature: 1.2,
    schema: {
      type: 'object',
      properties: {
        targetWord: { type: 'string' },
        contextSentence: { type: 'string' },
        hint: { type: 'string' },
      },
      required: ['targetWord', 'contextSentence', 'hint'],
    },
    buildPrompt: (topic, difficulty) =>
      `Generate a synonym challenge for ${synonymShowdownDifficulty[difficulty]}
Topic: ${topic}.
Create:
1. A target word that has MANY possible synonyms (at least 5-10 valid alternatives)
2. A context sentence using that word, showing its meaning clearly
3. A short hint about the CONTEXT or FEELING, NOT listing synonyms (max 8 words)

Requirements:
- Choose a DIFFERENT word each time - be creative and varied!
- Choose a word with rich synonym options (adjectives and verbs work best)
- The context should make the word's specific meaning clear
- Avoid words with only 1-2 synonyms
- For ${difficulty} level, the word should be appropriately challenging
- CRITICAL: The hint must NEVER include actual synonyms! Instead, hint at the emotion, context, or part of speech.
  BAD hint: "Synonyms for 'start' or 'activate'" (gives away answers!)
  GOOD hint: "Think about actions with machines"
  GOOD hint: "Consider formal alternatives"
  GOOD hint: "How would you describe this feeling?"

Good target words have many alternatives: happy, big, said, walk, good, bad, nice, important, beautiful, fast, etc.`,
  },

  // ── sentence-scramble ─────────────────────────────────────────────────────────
  // Source: src/app/api/sentence-scramble/generate/route.ts (Math.random() seed per call)
  {
    gameKey: 'sentence-scramble',
    variants: () => [undefined],
    schema: {
      type: 'object',
      properties: {
        sentences: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['sentences'],
    },
    buildPrompt: (topic, difficulty) => {
      const randomSeed = Math.random().toString(36).substring(7);
      return `Generate 10 sentences for a "Sentence Scramble" language learning game.

Difficulty: ${sentenceScrambleDifficulty[difficulty]}
Topic: ${topic}
Random seed: ${randomSeed}

Requirements:
- Each sentence MUST relate to the topic "${topic}"
- Each sentence must be grammatically complete and properly punctuated
- Vary sentence structures (declarative, questions, conditionals, etc.)
- Do NOT repeat sentence patterns or openings
- Each sentence should be self-contained and make sense on its own
- Use natural, authentic language — not textbook-stilted
- Generate DIFFERENT sentences each time — be creative!`;
    },
  },

  // ── grammar-boss ──────────────────────────────────────────────────────────────
  // Source: src/app/api/grammar-boss/generate/route.ts (variants = GRAMMAR_TARGETS)
  {
    gameKey: 'grammar-boss',
    variants: () => [...GRAMMAR_TARGETS],
    schema: {
      type: 'object',
      properties: {
        task: { type: 'string' },
        exampleSentence: { type: 'string' },
      },
      required: ['task', 'exampleSentence'],
    },
    buildPrompt: (topic, difficulty, variant) =>
      `Generate a short speaking challenge for an English learner at ${grammarBossDifficulty[difficulty]}
Topic: ${topic}. The task MUST be directly about this topic — do not use a generic or unrelated scenario.
Target Grammar: ${variant}.

Provide:
1. A concise, engaging speaking task (1-2 sentences) appropriate for a ${difficulty} level student that naturally requires the target grammar (${variant}).
2. A perfect example sentence using the target grammar correctly, tailored to the ${difficulty} level complexity.

The task should prompt the student to speak about the given topic while using the specified grammar structure.`,
  },

  // ── error-hunter ──────────────────────────────────────────────────────────────
  // Source: src/app/api/error-hunter/generate/route.ts
  // transformForStorage renames errors → _errors (route reads _errors; AI returns errors)
  {
    gameKey: 'error-hunter',
    variants: () => [undefined],
    schema: {
      type: 'object',
      properties: {
        paragraph: { type: 'string' },
        errorCount: { type: 'integer' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              position: { type: 'integer' },
              word: { type: 'string' },
              errorType: { type: 'string' },
              correction: { type: 'string' },
            },
            required: ['position', 'word', 'errorType', 'correction'],
          },
        },
      },
      required: ['paragraph', 'errorCount', 'errors'],
    },
    buildPrompt: (topic, difficulty) => {
      const config = errorHunterDifficultyConfig[difficulty];
      return `Generate a paragraph with exactly ${config.errors} intentional errors for ${config.description}
Topic: ${topic}.

Create a 3-4 sentence paragraph about ${topic} that contains exactly ${config.errors} errors.

Error types to include (mix them):
- Spelling errors (e.g., "recieve" instead of "receive")
- Subject-verb agreement (e.g., "he go" instead of "he goes")
- Wrong tense (e.g., "Yesterday I go" instead of "Yesterday I went")
- Wrong word form (e.g., "beautiful" instead of "beautifully")
- Article errors (e.g., "a apple" instead of "an apple")
- Preposition errors (e.g., "good in" instead of "good at")

Requirements:
- Include exactly ${config.errors} errors, spread across the paragraph
- Each error should be a single word that needs fixing
- The paragraph should make sense (errors aside)
- Position is the word index (0-based) in the paragraph
- Include the incorrect word and the correct version

Return the paragraph with errors embedded, plus an array of error details.`;
    },
    transformForStorage: (data) => ({
      paragraph: (data as any).paragraph,
      errorCount: (data as any).errorCount,
      _errors: (data as any).errors,   // route reads _errors; AI returns errors
    }),
  },

  // ── dialogue-detective ────────────────────────────────────────────────────────
  // Source: src/app/api/dialogue-detective/generate/route.ts
  {
    gameKey: 'dialogue-detective',
    variants: () => [undefined],
    schema: {
      type: 'object',
      properties: {
        speakerA_before: { type: 'string' },
        speakerA_after: { type: 'string' },
        context: { type: 'string' },
        goal: { type: 'string' },
      },
      required: ['speakerA_before', 'speakerA_after', 'context', 'goal'],
    },
    buildPrompt: (topic, difficulty) =>
      `Generate a dialogue puzzle for ${dialogueDetectiveDifficulty[difficulty]}
Topic: ${topic}.

Create a 3-line conversation where:
- Speaker A says something (line 1)
- Speaker B responds (line 2) - THIS IS THE BLANK the student fills in
- Speaker A replies to B's response (line 3)

The student must figure out what B said that would:
1. Make sense as a response to line 1
2. Naturally lead to line 3

Provide:
- speakerA_before: What A says first
- speakerA_after: What A says after B's response
- context: Brief setting (e.g., "At a restaurant", "Job interview")
- goal: What B needs to accomplish (e.g., "Ask for directions", "Decline politely")

Requirements:
- The conversation should be natural and realistic
- B's response should be inferable from context
- There should be multiple valid ways to fill the blank
- The dialogue should relate to ${topic}
- Appropriate complexity for ${difficulty} level`,
  },

  // ── connections ───────────────────────────────────────────────────────────────
  // Source: src/app/api/connections/generate/route.ts
  // Math.random() seed per call; validate + transformForStorage applied
  {
    gameKey: 'connections',
    variants: () => [undefined],
    schema: {
      type: 'object',
      properties: {
        groups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              words: { type: 'array', items: { type: 'string' } },
              difficulty: { type: 'string' },
              color: { type: 'string' },
            },
            required: ['category', 'words', 'difficulty', 'color'],
          },
        },
      },
      required: ['groups'],
    },
    buildPrompt: (topic, difficulty) => {
      const randomSeed = Math.random().toString(36).substring(7);
      return `Generate a Connections puzzle (like NYT Connections) for ESL learners.
Topic: ${topic}
${connectionsDifficulty[difficulty]}
Random seed: ${randomSeed}

Create exactly 4 groups of 4 words each (16 words total). Each word must be a single word (no phrases).

CRITICAL REQUIREMENTS:
1. Each group must have EXACTLY 4 words
2. All 16 words must be UNIQUE - no word can appear in multiple groups
3. Words should be related to the topic when possible
4. Each group needs a clear, guessable connection

Group structure (in order of difficulty within the puzzle):
- Group 1 (Yellow/easy): Most obvious connection - should be findable first
- Group 2 (Green/medium): Clear but requires a bit more thinking
- Group 3 (Blue/hard): Subtle connection that's harder to spot
- Group 4 (Purple/tricky): Requires lateral thinking or is the "leftover" harder group

Return JSON with this exact structure:
{
  "groups": [
    { "category": "Clear category name", "words": ["WORD1", "WORD2", "WORD3", "WORD4"], "difficulty": "easy", "color": "yellow" },
    { "category": "Category name", "words": ["WORD5", "WORD6", "WORD7", "WORD8"], "difficulty": "medium", "color": "green" },
    { "category": "Category name", "words": ["WORD9", "WORD10", "WORD11", "WORD12"], "difficulty": "hard", "color": "blue" },
    { "category": "Category name", "words": ["WORD13", "WORD14", "WORD15", "WORD16"], "difficulty": "tricky", "color": "purple" }
  ]
}

IMPORTANT: Words should be in UPPERCASE. Category names should be clear and concise (e.g., "Types of bread", "Words that can follow 'fire'").`;
    },
    validate: (data) => {
      const d = data as any;
      if (!d.groups || d.groups.length !== 4) throw new Error('Need 4 groups');
      for (const g of d.groups) {
        if (g.words.length !== 4) throw new Error('Each group needs 4 words');
        g.words = g.words.map((w: string) => w.toUpperCase());
      }
      if (new Set(d.groups.flatMap((g: any) => g.words)).size !== 16)
        throw new Error('Words must be unique');
    },
    transformForStorage: (data) => ({ groups: (data as any).groups }),
  },

  // ── story-sprint ──────────────────────────────────────────────────────────────
  // Source: src/app/api/story-sprint/starter/route.ts
  {
    gameKey: 'story-sprint',
    variants: () => [undefined],
    schema: {
      type: 'object',
      properties: {
        starterSentence: { type: 'string' },
      },
      required: ['starterSentence'],
    },
    buildPrompt: (topic, difficulty) =>
      `Generate an engaging opening sentence for a collaborative story about "${topic}".
The sentence should hook readers and give students a clear direction to continue.
Write at ${storySprintDifficulty[difficulty]} level.
Keep it to exactly ONE sentence (15-30 words). Do not end the story — leave it open for continuation.`,
  },

  // ── word-chain ────────────────────────────────────────────────────────────────
  // Source: src/app/api/word-chain/generate/route.ts
  {
    gameKey: 'word-chain',
    variants: () => [undefined],
    schema: {
      type: 'object',
      properties: {
        startingWord: { type: 'string' },
        hint: { type: 'string' },
      },
      required: ['startingWord', 'hint'],
    },
    buildPrompt: (topic, difficulty) =>
      `Generate a starting word for a word association chain game at ${wordChainDifficulty[difficulty]}
Topic: ${topic}.

Choose a starting word that:
1. Has MANY possible associations (at least 10+ related concepts)
2. Is appropriate for ${difficulty} level
3. Relates to the ${topic} topic
4. Is a concrete noun or common concept (easier to associate)

Also provide a short hint about the type of associations expected (max 8 words).

Good starting words have rich associations: ocean, music, family, city, food, technology, nature, etc.`,
  },
];

// ── Coverage Query ────────────────────────────────────────────────────────────

async function fetchCoverage(): Promise<Map<string, number>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('generated_content')
    .select('game_key, topic, difficulty, variant')
    .eq('schema_version', 1);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = `${row.game_key}::${row.topic}::${row.difficulty}::${row.variant ?? '__none__'}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// ── Fisher-Yates Shuffle ──────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Work Queue ────────────────────────────────────────────────────────────────

function buildQueue(coverage: Map<string, number>, target: number): WorkItem[] {
  const queue: WorkItem[] = [];
  for (const config of GAMES) {
    for (const variant of config.variants()) {
      for (const topic of TOPICS) {
        for (const difficulty of DIFFICULTIES) {
          const key = `${config.gameKey}::${topic}::${difficulty}::${variant ?? '__none__'}`;
          const needed = Math.max(0, target - (coverage.get(key) ?? 0));
          for (let i = 0; i < needed; i++) {
            queue.push({ config, topic, difficulty, variant });
          }
        }
      }
    }
  }
  return shuffle(queue);  // Fisher-Yates spreads coverage across all games on partial runs
}

// ── Inline Supabase store (avoids importing ../src/lib/content-cache) ─────────

async function storeCachedContent(
  gameKey: string,
  topic: string,
  difficulty: string,
  data: unknown,
  schemaVersion: number,
  variant?: string,
): Promise<string | null> {
  const supabase = createServiceClient();
  const payload = {
    game_key: gameKey,
    topic,
    difficulty,
    variant: variant ?? null,
    schema_version: schemaVersion,
    data,
  };

  const { data: row, error } = await supabase
    .from('generated_content')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return (row as any)?.id ?? null;
}

// ── Generation Worker ─────────────────────────────────────────────────────────

async function generateOne(item: WorkItem): Promise<'ok' | 'skip' | 'error'> {
  try {
    const prompt = item.config.buildPrompt(item.topic, item.difficulty, item.variant);
    const raw = await generateJSON(prompt, item.config.schema, {
      taskClass: 'bulk-generation',
      temperature: item.config.temperature,
    });
    item.config.validate?.(raw);
    const toStore = item.config.transformForStorage
      ? item.config.transformForStorage(raw)
      : raw;
    const id = await storeCachedContent(
      item.config.gameKey, item.topic, item.difficulty, toStore, 1, item.variant,
    );
    return id ? 'ok' : 'skip';
  } catch (err) {
    console.error(
      `FAIL ${item.config.gameKey}/${item.topic}/${item.difficulty}/${item.variant ?? '-'}: ${String(err).slice(0, 120)}`,
    );
    return 'error';
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Parse CLI flags
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetIdx = args.indexOf('--target');
  const target = targetIdx !== -1 ? parseInt(args[targetIdx + 1], 10) : 5;

  if (isNaN(target) || target < 1) {
    console.error('--target must be a positive integer');
    process.exit(1);
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString().slice(0, 16) + 'Z';
  console.log(`\n=== Nightly Pre-warm (${timestamp}) target=${target} ===`);

  // Fetch current coverage
  const coverage = await fetchCoverage();
  const beforeCount = Array.from(coverage.values()).reduce((a, b) => a + b, 0);
  const queue = buildQueue(coverage, target);
  console.log(`Before: ${beforeCount} entries  |  Queue: ${queue.length} items`);

  if (dryRun) {
    console.log('(dry-run — no AI calls made)\n');
    process.exit(0);
  }

  if (queue.length === 0) {
    console.log('Cache already at target — nothing to do.\n');
    process.exit(0);
  }

  // Per-game stats
  const gameStats = new Map<string, { ok: number; error: number; skip: number; combos: Set<string> }>();
  for (const config of GAMES) {
    gameStats.set(config.gameKey, { ok: 0, error: 0, skip: 0, combos: new Set() });
  }

  // Process queue with concurrency cap of 5
  const sem = new Semaphore(5);
  const results = await Promise.all(
    queue.map((item) =>
      sem.run(async () => {
        const result = await generateOne(item);
        const gs = gameStats.get(item.config.gameKey)!;
        gs[result]++;
        gs.combos.add(`${item.topic}::${item.difficulty}::${item.variant ?? '__none__'}`);
        return result;
      }),
    ),
  );

  const ok = results.filter((r) => r === 'ok').length;
  const error = results.filter((r) => r === 'error').length;
  const skip = results.filter((r) => r === 'skip').length;
  const elapsedSec = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const elapsed = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  console.log(`Generated: ${ok} ok | ${error} error | ${skip} skip | ${elapsed}`);
  console.log(`After: ${beforeCount + ok} entries\n`);

  console.log('Per game:');
  for (const config of GAMES) {
    const gs = gameStats.get(config.gameKey)!;
    const total = gs.ok + gs.error + gs.skip;
    if (total === 0) continue;
    const label = config.gameKey.padEnd(20);
    console.log(`  ${label} ${gs.combos.size} combos →  ${gs.ok} ok / ${gs.error} err`);
  }

  console.log('');
  process.exit(error > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
