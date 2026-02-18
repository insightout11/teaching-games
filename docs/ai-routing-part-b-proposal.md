# Part B — Claude's Proposal

## B1) Progressive Routing Policy

### Design Principles

1. **Per-task-class routing** instead of the current single `AI_PROVIDER` env var
2. **Latency-critical tasks** → fastest provider (Gemini Flash or Groq)
3. **Accuracy-critical tasks** (scoring, factual Q&A) → highest quality model
4. **Bulk/async tasks** → cheapest model
5. **Escalation** on JSON parse failure or low-confidence signals

### Proposed Routing Table

| Task Class | Default Provider + Model | Escalation Model | Escalation Trigger | Fallback |
|------------|-------------------------|-------------------|-------------------|----------|
| **Content Generation** (sentences, puzzles) | Gemini `gemini-2.0-flash` | OpenAI `gpt-4o-mini` | JSON parse failure or 2 consecutive empty/malformed responses | Groq `llama-3.3-70b-versatile` |
| **Evaluation / Scoring** | OpenAI `gpt-4o-mini` | OpenAI `gpt-4o` | Score outside valid range, missing required fields, or JSON parse failure | Gemini `gemini-2.0-flash` |
| **Game Logic / Q&A** (20 Questions) | OpenAI `gpt-4o-mini` | OpenAI `gpt-4o` | Contradiction with previous answers (detected by caller) | Gemini `gemini-2.0-flash` |
| **Activity Facilitation** (multi-turn) | Gemini `gemini-2.0-flash` | OpenAI `gpt-4o-mini` | JSON parse failure | Return hardcoded default response |
| **Bulk Lesson Plan** | Gemini `gemini-2.0-flash` | — (retry same) | Individual generator failure | Skip failed generator, return partial |

### Rationale

- **Gemini 2.0 Flash** for generation: fastest, free tier generous, good creative output, native JSON schema
- **GPT-4o-mini** for evaluation/scoring: better instruction-following for rubric adherence, strict JSON schema enforcement
- **Groq** as speed fallback: fastest inference but weaker JSON schema compliance (prompt-based only)
- **GPT-4o** as quality escalation: only triggered on failures, not default (cost)

### Implementation Sketch

```typescript
// Extend config.ts
export interface TaskRoutingConfig {
  default: { provider: ProviderName; model?: string };
  escalation?: { provider: ProviderName; model?: string };
  fallback?: { provider: ProviderName; model?: string };
}

export const TASK_ROUTING: Record<string, TaskRoutingConfig> = {
  'content-generation': {
    default: { provider: 'gemini', model: 'gemini-2.0-flash' },
    escalation: { provider: 'openai', model: 'gpt-4o-mini' },
    fallback: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  },
  'evaluation': {
    default: { provider: 'openai', model: 'gpt-4o-mini' },
    escalation: { provider: 'openai', model: 'gpt-4o' },
    fallback: { provider: 'gemini', model: 'gemini-2.0-flash' },
  },
  'game-logic': {
    default: { provider: 'openai', model: 'gpt-4o-mini' },
    escalation: { provider: 'openai', model: 'gpt-4o' },
    fallback: { provider: 'gemini', model: 'gemini-2.0-flash' },
  },
  'activity-facilitation': {
    default: { provider: 'gemini', model: 'gemini-2.0-flash' },
    escalation: { provider: 'openai', model: 'gpt-4o-mini' },
    fallback: null, // hardcoded default response
  },
  'bulk-generation': {
    default: { provider: 'gemini', model: 'gemini-2.0-flash' },
  },
};

// Extend generateJSON signature
export async function generateJSON<T>(
  prompt: string,
  schema: AISchema,
  options?: GenerateJSONOptions & { taskClass?: string }
): Promise<T>;
```

The `generateJSON` wrapper would:
1. Resolve provider from `taskClass` routing config
2. Attempt default provider
3. On failure, try escalation provider
4. On second failure, try fallback or throw

---

## B2) Benchmark Plan

### Test Case Structure

Each task class gets a test suite of **20–50 test cases** stored as JSON:

```jsonc
// benchmarks/cases/content-generation.json
{
  "taskClass": "content-generation",
  "cases": [
    {
      "id": "cg-001",
      "endpoint": "/api/vocab-sprint/generate",
      "input": { "difficulty": "Intermediate", "topic": "Travel", "tone": "Casual" },
      "constraints": {
        "arrayLength": 5,
        "requiredFields": ["sentence", "weakWord", "hint"],
        "weakWordMustBeUnique": true
      },
      "humanRubricNotes": "Check: sentences natural, weak words are genuinely weak, hints are helpful"
    }
    // ... 19-49 more
  ]
}
```

### Metrics to Record

For every (test case × provider × model) combination:

| Metric | Type | How Measured |
|--------|------|-------------|
| `latency_ms` | number | `Date.now()` before/after call |
| `latency_p50` | number | Computed from 3+ runs per case |
| `latency_p95` | number | Computed from 3+ runs per case |
| `json_valid` | boolean | `JSON.parse()` succeeds |
| `schema_valid` | boolean | Validates against AISchema (use ajv) |
| `constraint_pass` | boolean | Per-case custom constraints (array length, uniqueness, score range) |
| `human_quality` | 1–5 | Manual rubric scoring (see below) |
| `human_accuracy` | 1–5 | Manual rubric scoring (evaluation tasks only) |
| `safety_pass` | boolean | No inappropriate content for ESL classroom |
| `cost_usd` | number | Computed from token counts × pricing |
| `input_tokens` | number | From API response metadata |
| `output_tokens` | number | From API response metadata |

### Human Rubric (1–5 scale)

**Quality rubric (all task classes):**

| Score | Label | Criteria |
|-------|-------|----------|
| 5 | Excellent | Natural, engaging, perfectly appropriate for the difficulty/topic. A teacher would use this as-is. |
| 4 | Good | Minor issues (slightly awkward phrasing, slightly off-topic). Usable with no changes. |
| 3 | Acceptable | Functional but bland, generic, or has a noticeable issue. Teacher might tweak. |
| 2 | Poor | Significant problems: wrong difficulty level, off-topic, unnatural language, or confusing. |
| 1 | Unusable | Broken, nonsensical, wrong language, or completely off-target. |

**Accuracy rubric (evaluation tasks only):**

| Score | Label | Criteria |
|-------|-------|----------|
| 5 | Spot-on | Score matches what 3 human raters would give (±1 point on 10-scale). Feedback is accurate and helpful. |
| 4 | Close | Score within ±2 of human consensus. Feedback mostly accurate. |
| 3 | Acceptable | Score within ±3. Feedback has minor inaccuracies. |
| 2 | Off | Score diverges by 4+. Feedback contains errors or is misleading. |
| 1 | Wrong | Score is clearly wrong. Feedback contradicts the submission. |

### Results Storage Schema

```jsonc
// benchmarks/results/run-2026-02-18.json
{
  "runId": "2026-02-18-001",
  "timestamp": "2026-02-18T14:30:00Z",
  "results": [
    {
      "caseId": "cg-001",
      "taskClass": "content-generation",
      "provider": "gemini",
      "model": "gemini-2.0-flash",
      "attempt": 1,
      "latency_ms": 1243,
      "input_tokens": 580,
      "output_tokens": 390,
      "cost_usd": 0.00012,
      "json_valid": true,
      "schema_valid": true,
      "constraint_pass": true,
      "safety_pass": true,
      "human_quality": null,    // filled in during review
      "human_accuracy": null,   // evaluation tasks only
      "raw_output": "...",      // for human review
      "error": null
    }
  ]
}
```

Also export a CSV summary for quick analysis:

```
caseId,taskClass,provider,model,latency_ms,json_valid,schema_valid,constraint_pass,human_quality,human_accuracy,cost_usd
cg-001,content-generation,gemini,gemini-2.0-flash,1243,true,true,true,4,,0.00012
```

### Benchmark Harness Script

A Node.js script (`benchmarks/run.ts`) that:

1. Loads test cases from JSON files
2. For each case × each provider/model:
   - Makes the API call 3 times (for latency percentiles)
   - Records all metrics
   - Saves raw output for human review
3. Outputs results JSON + CSV
4. Generates summary table to stdout

---

## B3) Cost/Speed Research TODOs

### Pricing Data to Gather

| Provider | Model | Input Price | Output Price | Source | Status |
|----------|-------|-------------|-------------|--------|--------|
| Google | `gemini-2.0-flash` | ? / 1M tokens | ? / 1M tokens | https://ai.google.dev/pricing | TODO |
| Google | `gemini-2.0-flash-lite` (potential cheaper alt) | ? / 1M tokens | ? / 1M tokens | https://ai.google.dev/pricing | TODO |
| OpenAI | `gpt-4o-mini` | ? / 1M tokens | ? / 1M tokens | https://openai.com/api/pricing/ | TODO |
| OpenAI | `gpt-4o` (escalation) | ? / 1M tokens | ? / 1M tokens | https://openai.com/api/pricing/ | TODO |
| Groq | `llama-3.3-70b-versatile` | ? / 1M tokens | ? / 1M tokens | https://groq.com/pricing/ | TODO |
| Groq | `llama-3.1-8b-instant` (potential fast alt) | ? / 1M tokens | ? / 1M tokens | https://groq.com/pricing/ | TODO |

### Throughput / Rate Limits to Gather

| Provider | Metric Needed | Source |
|----------|--------------|--------|
| Google Gemini | RPM (requests/min), TPM (tokens/min), free tier limits | https://ai.google.dev/gemini-api/docs/rate-limits |
| OpenAI | RPM, TPM by tier (free/tier-1/tier-2) | https://platform.openai.com/docs/guides/rate-limits |
| Groq | RPM, TPD (tokens/day), concurrent request limits | https://console.groq.com/docs/rate-limits |

### Latency Baselines to Measure

For each provider/model, measure with a standard prompt (~200 input tokens, ~100 output tokens):

- Cold start latency (first request)
- Warm latency (subsequent requests)
- p50 and p95 over 20 requests
- Response time variance

### Assumptions Being Made

1. **Gemini 2.0 Flash has a generous free tier** — need to verify current free tier limits (RPM, daily tokens) to confirm it can handle classroom usage without cost
2. **GPT-4o-mini is sufficient for evaluation** — benchmark must verify scoring accuracy vs GPT-4o; if quality gap is large, default evaluation to GPT-4o
3. **Groq's JSON compliance is acceptable** — prompt-based schema enforcement may produce malformed JSON more often than native schema modes; benchmark will quantify this
4. **Token estimates in Part A are rough** — actual usage must be measured during benchmarking to get accurate cost projections
5. **Classroom concurrency is low** — assuming 1 teacher + up to 30 students, with AI calls serialized per game round (not 30 simultaneous AI calls). Lesson plan generation is the exception (up to 16 parallel calls)
6. **No streaming needed** — all current tasks return complete JSON; if future tasks need streaming (e.g., real-time chat), architecture would need extension
7. **Model versions may change** — `gemini-2.0-flash` and `gpt-4o-mini` may be updated or deprecated; routing config should reference stable aliases where possible
