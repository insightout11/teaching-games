# Part A — Evidence Pack

## A1) AI API Abstraction

### Provider Interface

**`src/lib/ai/types.ts`**

```typescript
export type AISchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

export interface AISchema {
  type: AISchemaType;
  properties?: Record<string, AISchema>;
  items?: AISchema;
  required?: string[];
  enum?: string[];
  description?: string;
}

export interface GenerateJSONOptions {
  temperature?: number;
}

export interface AIProvider {
  generateJSON<T>(prompt: string, schema: AISchema, options?: GenerateJSONOptions): Promise<T>;
}
```

Single method interface — every provider must implement `generateJSON<T>()`.

### Provider Selection / Routing Logic

**`src/lib/ai/config.ts`**

```typescript
export type ProviderName = 'gemini' | 'openai' | 'groq';

export function getProviderName(): ProviderName {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  if (provider === 'openai' || provider === 'groq') return provider;
  return 'gemini';
}

export function getProviderApiKey(provider: ProviderName): string {
  switch (provider) {
    case 'gemini':  return process.env.GEMINI_API_KEY || '';
    case 'openai':  return process.env.OPENAI_API_KEY || '';
    case 'groq':    return process.env.GROQ_API_KEY || '';
  }
}
```

Routing is **static** — a single `AI_PROVIDER` env var selects one provider for the entire app. No per-task or per-route routing.

### Factory / Entry Point

**`src/lib/ai/index.ts`**

```typescript
import { getProviderName, getProviderApiKey } from './config';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { GroqProvider } from './providers/groq';
import type { AIProvider, AISchema, GenerateJSONOptions } from './types';

let cachedProvider: AIProvider | null = null;
let cachedProviderName: string | null = null;

function getProvider(): AIProvider {
  const name = getProviderName();
  const key = getProviderApiKey(name);

  if (cachedProvider && cachedProviderName === `${name}:${key}`) {
    return cachedProvider;
  }

  if (!key) {
    throw new Error(`API key not configured for provider: ${name}`);
  }

  switch (name) {
    case 'openai': cachedProvider = new OpenAIProvider(key); break;
    case 'groq':   cachedProvider = new GroqProvider(key); break;
    default:       cachedProvider = new GeminiProvider(key); break;
  }

  cachedProviderName = `${name}:${key}`;
  return cachedProvider;
}

export async function generateJSON<T>(
  prompt: string, schema: AISchema, options?: GenerateJSONOptions
): Promise<T> {
  const provider = getProvider();
  return provider.generateJSON<T>(prompt, schema, options);
}
```

Singleton cache, lazy init. All consumers import only `generateJSON()`.

### Provider Implementations

**`src/lib/ai/providers/openai.ts`** — OpenAI

```typescript
// Uses: openai SDK
// Model: gpt-4o-mini
// JSON mode: response_format.type = 'json_schema' (strict: true, additionalProperties: false)
// Default temperature: 1.0
```

**`src/lib/ai/providers/gemini.ts`** — Gemini

```typescript
// Uses: @google/generative-ai SDK
// Model: gemini-2.0-flash
// JSON mode: responseMimeType = 'application/json' + responseSchema
// Temperature: only set if explicitly provided
```

**`src/lib/ai/providers/groq.ts`** — Groq

```typescript
// Uses: openai SDK with baseURL = 'https://api.groq.com/openai/v1'
// Model: llama-3.3-70b-versatile
// JSON mode: response_format.type = 'json_object' + schema injected into system prompt
// Default temperature: 1.0
```

---

## A2) Providers + Models Summary

| Provider | Model ID | SDK | Base URL | Env Var | JSON Enforcement |
|----------|----------|-----|----------|---------|-----------------|
| Gemini (default) | `gemini-2.0-flash` | `@google/generative-ai` | Google default | `GEMINI_API_KEY` | Native `responseSchema` |
| OpenAI | `gpt-4o-mini` | `openai` | OpenAI default | `OPENAI_API_KEY` | `json_schema` strict mode |
| Groq | `llama-3.3-70b-versatile` | `openai` (compat) | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` | `json_object` + system prompt |

**Routing env var:** `AI_PROVIDER` (default: `gemini`)

**Fallbacks/retries/timeouts:** None implemented. A single failed call throws and the API route returns 500.

---

## A3) AI Task Classes

### Class 1: Content Generation (sentences, puzzles, prompts)

| Endpoint | Game/Activity | Input | Output (JSON) | Latency Sensitivity | Est. Tokens (in/out) |
|----------|--------------|-------|---------------|---------------------|---------------------|
| `POST /api/vocab-sprint/generate` | Vocab Sprint | difficulty, topic, tone | `GameSentence[]` (5 items) | **High** — blocks game start | ~600 / ~400 |
| `POST /api/grammar-boss/generate` | Grammar Boss | grammarTarget, topic, difficulty | `{ task, exampleSentence }` | **High** — blocks round | ~200 / ~100 |
| `POST /api/word-chain/generate` | Word Chain | topic, difficulty | `{ startingWord, hint }` | **High** — blocks game start | ~200 / ~60 |
| `POST /api/synonym-showdown/generate` | Synonym Showdown | topic, difficulty | `{ targetWord, contextSentence, hint }` | **High** — blocks round | ~300 / ~80 |
| `POST /api/dialogue-detective/generate` | Dialogue Detective | topic, difficulty | `{ speakerA_before, speakerA_after, context, goal }` | **High** — blocks round | ~300 / ~120 |
| `POST /api/error-hunter/generate` | Error Hunter | topic, difficulty | `{ paragraph, errorCount, errors[] }` | **High** — blocks round | ~400 / ~300 |
| `POST /api/sentence-scramble/generate` | Sentence Scramble | topic, difficulty | `{ sentences: string[] }` (10) | **High** — blocks game start | ~200 / ~200 |
| `POST /api/story-sprint/starter` | Story Sprint | topic, difficulty | `{ starterSentence }` | **High** — blocks game start | ~200 / ~40 |
| `POST /api/connections/generate` | Connections | topic, difficulty | `{ words[], groups[] }` (4×4) | **High** — blocks game start | ~400 / ~300 |
| `POST /api/tone-transformer/generate` | Tone Transformer (vaulted) | topic, difficulty | `{ originalSentence, currentTone, targetTone, context }` | High | ~300 / ~100 |
| `POST /api/connection/generate` | Connection (deleted) | topic, difficulty | `{ word1, word2, category, hint }` | High | ~200 / ~80 |

**Temperature range:** 1.0–1.2 (creative variety desired)

### Class 2: Evaluation / Scoring (structured rubric JSON)

| Endpoint | Game/Activity | Input | Output (JSON) | Latency Sensitivity | Est. Tokens (in/out) |
|----------|--------------|-------|---------------|---------------------|---------------------|
| `POST /api/vocab-sprint/evaluate` | Vocab Sprint | sentence, weakWord, replacement, difficulty | `{ score, comment, isValid, suggestions[] }` | **Med** — student waiting | ~200 / ~100 |
| `POST /api/grammar-boss/evaluate` | Grammar Boss | sentence, grammarTarget, task, difficulty | `{ grammarScore, fluencyScore, correctedSentence, feedback }` | **Med** | ~200 / ~120 |
| `POST /api/word-chain/evaluate` | Word Chain | previousWord, newWord, chainHistory, difficulty | `{ isValid, connectionStrength, score, feedback }` | **High** — real-time chain | ~300 / ~100 |
| `POST /api/synonym-showdown/evaluate` | Synonym Showdown | targetWord, contextSentence, synonym, difficulty | `{ isValid, score, quality, feedback }` | **Med** | ~150 / ~80 |
| `POST /api/dialogue-detective/evaluate` | Dialogue Detective | context fields, response, goal, difficulty | `{ contextFit, naturalness, leadIn, creativityBonus, feedback, exampleResponse, score }` | **Med** | ~300 / ~150 |
| `POST /api/error-hunter/evaluate` | Error Hunter | paragraph, corrections[], difficulty | `{ totalErrors, found, correctFixes, falsePositives, score, feedback, solutions[] }` | **Med** | ~400 / ~200 |
| `POST /api/story-sprint/analyze` | Story Sprint | sentence, context, difficulty, topic | `{ grammarScore, creativityScore, flowScore, feedback }` | **Med** — per-sentence | ~200 / ~100 |
| `POST /api/story-sprint/evaluate` | Story Sprint | sentences[], topic, difficulty | `{ title, overallScore, coherenceScore, creativityScore, endingScore, bestLine, summary }` | **Low** — end of game | ~500 / ~200 |
| `POST /api/tone-transformer/evaluate` | Tone Transformer (vaulted) | sentences, targetTone, difficulty | `{ toneMatch, meaningPreserved, grammarScore, feedback, alternatives[], score }` | Med | ~200 / ~150 |
| `POST /api/connection/evaluate` | Connection (deleted) | word1, word2, category, guess, difficulty | `{ isCorrect, score, quality, feedback, actualConnection }` | Med | ~200 / ~100 |

**Temperature:** Default (1.0) for all evaluation endpoints.

### Class 3: Game Logic / Q&A (factual correctness critical)

| Endpoint | Game/Activity | Input | Output (JSON) | Latency Sensitivity | Est. Tokens (in/out) |
|----------|--------------|-------|---------------|---------------------|---------------------|
| `POST /api/twenty-questions/answer` | 20 Questions | secret, question, tone, questionsHistory[] | `{ answer: 'yes'|'no'|'maybe', explanation }` | **High** — real-time game flow | ~300 / ~60 |

**Temperature:** 0.3 (deterministic, consistency critical)

### Class 4: Activity Facilitation (multi-turn follow-up)

| Endpoint | Activities | Input | Output (JSON) | Latency Sensitivity | Est. Tokens (in/out) |
|----------|-----------|-------|---------------|---------------------|---------------------|
| `POST /api/activity/continue` | Would You Rather, Hot Take Arena, Expert Panel, Interview Lab | activityKey, requestType, studentResponse, previousExchanges[], topicContext | `{ nextQuestion?, challenge?, hint?, evaluation?, teacherNote?, vocabularyHighlight? }` | **Med** — conversational | ~400 / ~150 |

**Request types:** 'follow-up', 'challenge', 'hint', 'evaluate'

### Class 5: Bulk Lesson Plan Generation

| Endpoint | Purpose | Input | Output (JSON) | Latency Sensitivity | Est. Tokens (in/out) |
|----------|---------|-------|---------------|---------------------|---------------------|
| `POST /api/lesson-plan/generate` | Generate content for multiple activities + games in parallel | customTopic, difficulty, activities[], games[] | `{ success, content: {}, gameContent: {} }` | **Low** — teacher prep, not real-time | ~2000–5000 / ~1500–4000 |

Runs up to 16 generators via `Promise.all()`. Largest single AI workload.

---

## A4) Routes/Components That Trigger AI Calls

### API Routes (server-side)

| Route | Trigger | Called From |
|-------|---------|-------------|
| `POST /api/vocab-sprint/generate` | Game start | `src/games/vocab-sprint/` |
| `POST /api/vocab-sprint/evaluate` | Student submission | `src/games/vocab-sprint/` |
| `POST /api/grammar-boss/generate` | Round start | `src/games/grammar-boss/` |
| `POST /api/grammar-boss/evaluate` | Student submission | `src/games/grammar-boss/` |
| `POST /api/word-chain/generate` | Game start | `src/games/word-chain/` |
| `POST /api/word-chain/evaluate` | Each chain link | `src/games/word-chain/` |
| `POST /api/synonym-showdown/generate` | Round start | `src/games/synonym-showdown/` |
| `POST /api/synonym-showdown/evaluate` | Student submission | `src/games/synonym-showdown/` |
| `POST /api/dialogue-detective/generate` | Round start | `src/games/dialogue-detective/` |
| `POST /api/dialogue-detective/evaluate` | Student submission | `src/games/dialogue-detective/` |
| `POST /api/error-hunter/generate` | Round start | `src/games/error-hunter/` |
| `POST /api/error-hunter/evaluate` | Student submission | `src/games/error-hunter/` |
| `POST /api/sentence-scramble/generate` | Game start | `src/games/sentence-scramble/` |
| `POST /api/story-sprint/starter` | Game start | `src/games/story-sprint/` |
| `POST /api/story-sprint/analyze` | Per-sentence (during game) | `src/games/story-sprint/` |
| `POST /api/story-sprint/evaluate` | Game end | `src/games/story-sprint/` |
| `POST /api/connections/generate` | Game start | `src/games/connections/` |
| `POST /api/twenty-questions/answer` | Each question asked | `src/games/twenty-questions/` |
| `POST /api/tone-transformer/generate` | Round start (vaulted) | `src/games/tone-transformer/` |
| `POST /api/tone-transformer/evaluate` | Student submission (vaulted) | `src/games/tone-transformer/` |
| `POST /api/connection/generate` | Game start (deleted) | `src/games/connection/` |
| `POST /api/connection/evaluate` | Student submission (deleted) | `src/games/connection/` |
| `POST /api/activity/continue` | Student interaction | Multiple activities |
| `POST /api/lesson-plan/generate` | Teacher prep | Lesson planner UI |

### Non-AI Evaluation (for completeness)

| Route | Notes |
|-------|-------|
| `POST /api/connections/evaluate` | Pure logic — no AI call, compares arrays |

### Streaming

**None.** All endpoints return complete JSON responses. No SSE or streaming used for AI.
