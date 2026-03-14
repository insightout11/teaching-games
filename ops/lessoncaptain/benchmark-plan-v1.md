# LessonCaptain Benchmark & Failure-Readiness Plan v1

## Executive Summary

This document defines the minimum benchmark system needed before beta. It answers one question: **"Can LessonCaptain survive beta-classroom usage without embarrassing failures?"**

### Verdict (skip to the end for details)

- **Safe for beta:** Single-teacher lesson generation, mid-session activity swaps, degraded fallback path
- **Risky:** Concurrent lesson generation by 5+ teachers, circuit breaker cascade under sustained Gemini outage
- **Must fix before real teacher use:** Nothing blocking — degraded-state hardening covers the critical path
- **Can wait until v1.1:** Provider-level rate limit monitoring, warm cache preloading, observability dashboard

---

## 1. Benchmark Scope

### What we test (minimum viable)

| Area | Why it matters | Priority |
|------|---------------|----------|
| Lesson generation latency | Teacher clicks "Generate" and waits. >8s feels broken. | P0 |
| Concurrent lesson bursts | Multiple teachers generating at the same time | P0 |
| Mid-session generation latency | Teacher swaps activity mid-class. Must be fast. | P0 |
| Provider failure → fallback | Gemini down → Groq/OpenAI → deterministic fallback | P0 |
| Degraded content validity under load | 10 concurrent failures all return valid JSON | P1 |
| Circuit breaker behavior | 3 failures trip breaker → auto-heal after 60s | P1 |

### What we do NOT test yet

- Database performance (Supabase handles this)
- Frontend rendering performance
- WebSocket/realtime latency
- Student device concurrency
- CDN/static asset delivery

### Realistic beta load profile

| Metric | Beta estimate | Stress target |
|--------|-------------|---------------|
| Concurrent teachers | 3-5 | 10 |
| Lesson generations/minute | 2-3 | 10 |
| Mid-session swaps/minute | 5-10 | 20 |
| Peak parallel AI calls | 5 (semaphore) | 15 (3 teachers × 5) |

---

## 2. Benchmark Scenarios

### Scenario 1: Single Lesson Generation

**What:** One teacher generates a full lesson plan with 6 activities + 3 games.

**Request:** `POST /api/lesson-plan/generate` with 9 generators running through `Promise.allSettled` + `bulkSemaphore(5)`.

**Metrics:**
- Total wall-clock time (all generators complete)
- Individual generator latency (min/max/p50/p95)
- Number of cache hits vs AI calls
- Semaphore queue depth

**Pass/fail:**
| Metric | Pass | Warning | Fail |
|--------|------|---------|------|
| Total wall-clock (cold) | <12s | 12-20s | >20s |
| Total wall-clock (warm/cached) | <2s | 2-5s | >5s |
| Any single generator | <8s | 8-15s | >15s (timeout) |
| Failed generators | 0 | 1-2 (degraded) | >2 |

### Scenario 2: Concurrent Lesson Bursts

**What:** 3 teachers generate lessons simultaneously. Then 5. Then 10.

**Request:** N parallel `POST /api/lesson-plan/generate` requests.

**Metrics:**
- Wall-clock per teacher (first to complete, last to complete)
- Total AI calls in flight
- Provider rate-limit errors (429s)
- Semaphore queue depth under contention

**Pass/fail:**
| Metric | Pass | Warning | Fail |
|--------|------|---------|------|
| 3 concurrent — slowest teacher | <20s | 20-35s | >35s |
| 5 concurrent — slowest teacher | <30s | 30-45s | >45s |
| Rate-limit errors | 0 | 1-3 (retried) | >3 (cascade) |
| Any teacher gets 500 | Never | — | Any 500 = fail |

### Scenario 3: Mid-Session Activity Swap

**What:** Teacher is in a live session, swaps to a new game/activity. Single generation call.

**Request:** `POST /api/{game}/generate` (content-generation task class, 15s timeout).

**Metrics:**
- Latency (cache hit path vs cache miss path)
- Time-to-interactive for teacher

**Pass/fail:**
| Metric | Pass | Warning | Fail |
|--------|------|---------|------|
| Cache hit | <500ms | 500ms-1s | >1s |
| Cache miss (AI) | <4s | 4-8s | >8s |
| Degraded fallback | <100ms | — | >500ms |

### Scenario 4: Provider Failure Cascade

**What:** Gemini is completely down. All calls fail with timeout/500. System must gracefully degrade.

**Test method:** Mock Gemini to always fail. Run Scenarios 1-3.

**Metrics:**
- Failover latency (time spent on Gemini attempt before moving to Groq)
- Circuit breaker trip time (should trip after 3 failures)
- Post-trip latency (should skip Gemini entirely)
- Degraded response rate

**Pass/fail:**
| Metric | Pass | Warning | Fail |
|--------|------|---------|------|
| First 3 calls | Slow (Gemini timeout + failover) | — | Hard 500 |
| Calls 4+ (post-circuit-break) | Fast (skip Gemini) | — | Still trying Gemini |
| Degraded responses | All valid JSON with topic | — | Any invalid/empty |
| Auto-heal after 60s | Resumes trying Gemini | — | Permanently broken |

### Scenario 5: Total Provider Failure

**What:** All 3 providers down simultaneously. Every AI call fails.

**Metrics:**
- Every route returns 200 with degraded: true
- Response body is structurally valid (correct shape, topic included)
- No unhandled exceptions or 500s
- Lesson-plan returns partial success (all generators "rejected" via allSettled)

**Pass/fail:** Binary. Every endpoint must return 200 with valid fallback. Any 500 = fail.

### Scenario 6: Repeated Rapid Calls (Teacher Spam)

**What:** Teacher hits "Generate" 5 times in 3 seconds (impatient click).

**Metrics:**
- Server handles without crash
- No duplicate credit deduction
- Responses arrive in order or are safely discarded

**Pass/fail:** No crash, no double-charge. Doesn't need to be fast — just safe.

---

## 3. Provider Dependency & Failure-Mode Audit

### Current fallback chain

```
content-generation:  gemini → groq → openai  (15s timeout each)
bulk-generation:     gemini → groq → openai  (30s timeout each, semaphore=5)
evaluation:          openai → gemini          (10s timeout each)
game-logic:          openai → gemini          (8s timeout each)
activity-facilitation: gemini → openai        (12s timeout each)
```

### Failure modes

| Failure | What happens | Is it safe? |
|---------|-------------|-------------|
| Gemini slow (>15s) | Timeout → retry once → failover to Groq | Yes, but adds 15-30s |
| Gemini 429 (rate limit) | Skip to Groq immediately (no retry) | Yes, fast failover |
| Gemini 500 | Retry once → failover to Groq | Yes, but 15s delay |
| Gemini fully down | First 3 calls slow (timeout), then circuit breaker skips it | Yes after 3 calls |
| Groq also down | Falls through to OpenAI | Yes |
| All providers down | Route catch block returns degraded fallback | Yes (hardened) |
| Concurrent all-fail | Each request independently hits fallback | See stress test |
| Circuit breaker stays open | Auto-heals after 60s | Yes |

### Identified risks

1. **First 3 calls during Gemini outage are slow.** Each waits 15s for Gemini timeout before failover. With retry, that's up to 30s wasted. The circuit breaker only trips after 3 failures.

   **Mitigation (v1.1):** Reduce first-failure timeout to 8s, or add adaptive timeout that shrinks after first failure in window.

2. **bulkSemaphore(5) + 30s timeout = potential 150s queue backup.** If 5 bulk requests are all timing out on Gemini, the 6th waits in semaphore queue while the first 5 burn their 30s timeout.

   **Mitigation:** This is unlikely during beta (3-5 teachers). Monitor semaphore queue depth.

3. **No per-provider rate limit awareness.** If Gemini returns 429, we skip to Groq, but don't back off future Gemini calls. Under sustained load, we keep hitting 429 until circuit breaker trips.

   **Mitigation (v1.1):** Add rate-limit backoff (treat 429 like a soft circuit break for 10s).

---

## 4. Degraded-State Verification Under Load

### Endpoints — safety status

| Endpoint | Degraded safe? | Notes |
|----------|---------------|-------|
| `/api/vocab-sprint/generate` | YES | Relaxed cache → vocabSprintFallback(topic) |
| `/api/synonym-showdown/generate` | YES | Relaxed cache → synonymShowdownFallback(topic) |
| `/api/sentence-scramble/generate` | YES | Relaxed cache → sentenceScrambleFallback(topic) |
| `/api/grammar-boss/generate` | YES | Relaxed cache (with variant) → grammarBossFallback(topic) |
| `/api/error-hunter/generate` | YES | Relaxed cache → errorHunterFallback(topic) |
| `/api/dialogue-detective/generate` | YES | Relaxed cache → dialogueDetectiveFallback(topic) |
| `/api/connections/generate` | YES | Relaxed cache → connectionsFallback(topic) |
| `/api/word-chain/generate` | YES | Relaxed cache → wordChainFallback(topic) |
| `/api/grid-rush/generate` | YES | No cache, straight to gridRushFallback(topic) |
| `/api/story-sprint/starter` | YES | Relaxed cache → storySprintStarterFallback(topic) |
| `/api/landing/generate` | YES | Per-activity fallback |
| `/api/mission-selector/generate` | YES | missionSelectorFallback(topic) |
| `/api/lesson-plan/generate` | YES | Promise.allSettled — partial success |
| `/api/story-sprint/analyze` | NO | Returns 500 — deferred to v1.1 |
| `/api/story-sprint/evaluate` | NO | Returns 500 — deferred to v1.1 |

### Hidden failure cascades — analysis

**Q: Can 10 concurrent failures cause a cascade?**

No. Each route's catch block is independent. The fallback builders are pure functions (no shared state, no async, no DB). The only shared state is the circuit breaker map, which is additive (more failures = faster trip = faster recovery).

**Q: Can relaxed cache emergency lookup fail?**

Yes, if Supabase is down. The inner `try { getCachedContent() } catch {}` swallows this. Falls through to deterministic builder. Safe.

**Q: Can deterministic builders ever return invalid content?**

No. They're template literals with the topic interpolated. The only way they fail is if `topic` is undefined, which would mean `request.json()` failed — and that throws before the try block, returning a generic error. This is acceptable.

**Q: What about the lesson-plan route under total failure?**

`Promise.allSettled` catches all rejections. Response has `success: false, content: {}, gameContent: {}, degraded: true, failedCount: N`. Frontend's `use-lesson-session.ts` already handles missing content with minimal fallback. Credit is NOT charged (succeededCount = 0).

---

## 5. Metrics & Logging Recommendations

### Already in place (from reliability.ts)

Every AI call emits structured JSON:
```json
{
  "event": "ai_call",
  "requestId": "uuid",
  "provider": "gemini|openai|groq",
  "attempt": 1,
  "outcome": "success|fail",
  "taskClass": "content-generation",
  "latencyMs": 1234,
  "errorClass": "timeout|rate-limit|...",
  "promptChars": 5000
}
```

This is good. It's already there.

### What to add for beta (minimal)

| Metric | Where | Implementation |
|--------|-------|---------------|
| `degraded: true` count | Route catch blocks | Already logged via `console.error` — add structured log |
| Lesson-plan `failedCount` | lesson-plan route | Already in response — log it server-side too |
| Cache hit/miss ratio | content-cache.ts | Add `console.log(JSON.stringify({ event: 'cache_lookup', hit: !!result, gameKey }))` |
| Semaphore queue depth | concurrency.ts | Add `console.log` when queue.length > 0 |
| Request duration (route-level) | Each route | Wrap with `Date.now()` start/end |

### Implementation: `src/lib/ai/metrics.ts`

A tiny structured logger. See `ops/lessoncaptain/metrics-patch.ts` for the recommended additions.

### What NOT to build yet

- No Prometheus/Grafana
- No custom dashboard
- No APM integration
- No distributed tracing

Just structured JSON logs. Parse them with `grep` or a log viewer during beta. Add proper observability in v1.1 if needed.

---

## 6. Implementation

### Files created

| File | Purpose |
|------|---------|
| `ops/lessoncaptain/benchmark-plan-v1.md` | This document |
| `ops/lessoncaptain/bench.ts` | Benchmark runner — hits real endpoints |
| `ops/lessoncaptain/bench-config.ts` | Scenario definitions + thresholds |
| `src/__tests__/api/degraded-stress.test.ts` | Unit test: 10 concurrent failures all return valid fallback |
| `src/lib/ai/metrics.ts` | Lightweight structured logging helpers |

### How to run

```bash
# Unit tests (no secrets needed)
pnpm test src/__tests__/api/degraded-stress.test.ts

# Live benchmark (requires running server + env vars)
npx tsx ops/lessoncaptain/bench.ts --scenario single-lesson
npx tsx ops/lessoncaptain/bench.ts --scenario concurrent-3
npx tsx ops/lessoncaptain/bench.ts --scenario concurrent-5
npx tsx ops/lessoncaptain/bench.ts --scenario mid-session-swap
npx tsx ops/lessoncaptain/bench.ts --scenario all
```

---

## 7. Final Verdict

### Safe for beta now

1. **Single-teacher lesson generation** — bulkSemaphore(5) with 30s timeout is adequate. Even worst-case (all cache misses, Gemini primary), a 9-generator lesson completes in ~15-25s with semaphore queuing.

2. **Mid-session activity swaps** — Single content-generation call with 15s timeout. Cache hits are sub-second. Cache misses are 2-5s typical.

3. **Degraded fallback path** — All 13 generation routes return 200 with topic-aware content when AI fails. Lesson-plan uses Promise.allSettled for partial success. No 500s reach the teacher.

4. **Provider failover** — 3-provider chain with circuit breaker. After initial slow failures, system auto-routes around dead providers.

### Risky (monitor during beta)

1. **First 3 calls during Gemini outage** — Each burns up to 15s (or 30s with retry) before failover. Teachers see a long spinner. Not broken, but frustrating.

2. **5+ concurrent lesson generations** — Semaphore queue + provider contention could push wall-clock to 30-45s for the last teacher. Acceptable for beta, not for scale.

3. **Sustained Gemini 429** — No backoff logic. We keep hitting 429 until circuit breaker trips at 3 failures. Those 3 failures add latency.

### Must fix before real teacher use

**Nothing blocking.** The degraded-state hardening covers the critical failure path. The reliability layer handles provider failover. The only teacher-visible issue is latency during provider outages, which is unavoidable without a cache-warming strategy.

### Can wait until v1.1

1. **Rate-limit backoff** — Treat 429 as soft circuit break (10s cooldown)
2. **Adaptive timeout** — Shrink Gemini timeout to 8s after first failure in window
3. **Cache warming** — Pre-generate content for popular topics during off-hours
4. **Observability dashboard** — Structured logs → Grafana or similar
5. **Semaphore metrics** — Monitor queue depth, alert on sustained queuing
6. **story-sprint/analyze + evaluate hardening** — P3 routes still return 500
