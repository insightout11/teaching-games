# Degraded-State Hardening v1

## Problem

All generation routes returned HTTP 500 when AI providers failed and content cache missed. During live classroom sessions this broke the teacher's flow — games showed error states instead of content.

## Solution

Routes now return HTTP 200 with `degraded: true` flag instead of 500, using a three-tier fallback hierarchy:

1. **Relaxed cache lookup** — retry cache without `excludeCacheIds` filter (better to show a repeated entry than nothing)
2. **Topic-aware deterministic builder** — template functions using the request's own `topic` parameter
3. Never off-topic: every fallback sentence/word/prompt includes the requested topic

## Fallback Content

All builders live in `src/lib/fallback-content.ts`. Each takes `(topic: string)` and returns the exact response shape the route expects.

## Route Inventory

| Route | Tier 1 (relaxed cache) | Tier 2 (builder) | Status |
|-------|----------------------|------------------|--------|
| `/api/vocab-sprint/generate` | Yes | `vocabSprintFallback` | Done |
| `/api/synonym-showdown/generate` | Yes | `synonymShowdownFallback` | Done |
| `/api/sentence-scramble/generate` | Yes | `sentenceScrambleFallback` | Done |
| `/api/grammar-boss/generate` | Yes (with variant) | `grammarBossFallback` | Done |
| `/api/error-hunter/generate` | Yes | `errorHunterFallback` | Done |
| `/api/dialogue-detective/generate` | Yes | `dialogueDetectiveFallback` | Done |
| `/api/connections/generate` | Yes | `connectionsFallback` | Done |
| `/api/word-chain/generate` | Yes | `wordChainFallback` | Done |
| `/api/grid-rush/generate` | N/A (no cache) | `gridRushFallback` | Done |
| `/api/story-sprint/starter` | Yes | `storySprintStarterFallback` | Done |
| `/api/landing/generate` | Yes | per-activity fallback | Done |
| `/api/mission-selector/generate` | N/A (cache in lib) | `missionSelectorFallback` | Done |
| `/api/lesson-plan/generate` | N/A (Promise.allSettled) | Partial success | Done |
| `/api/story-sprint/analyze` | — | — | P3 (deferred) |
| `/api/story-sprint/evaluate` | — | — | P3 (deferred) |

## Lesson Plan: Promise.allSettled

`/api/lesson-plan/generate` switched from `Promise.all` to `Promise.allSettled`. Failed generators simply don't populate their key. Response includes `degraded: true` and `failedCount` when any generator fails. Credit is only charged if at least one generator succeeds.

## Response Contract

All hardened routes add two optional fields to their response:

```ts
{
  // ... normal response fields ...
  degraded?: true;   // present only when fallback was used
  cacheId: string | null;  // null when using deterministic builder
}
```

## Test Coverage

- `vocab-sprint-generate.test.ts` — degraded fallback + relaxed cache emergency
- `synonym-showdown-generate.test.ts` — degraded fallback
- `grid-rush-generate.test.ts` — degraded grid with topic-derived letters
- `landing-generate.test.ts` — all 4 activity key fallbacks
- `lesson-plan-generate-degraded.test.ts` — partial failure + credit gating
