#!/usr/bin/env tsx
/**
 * LessonCaptain Benchmark Runner v1
 *
 * Usage:
 *   npx tsx ops/lessoncaptain/bench.ts --scenario single-lesson
 *   npx tsx ops/lessoncaptain/bench.ts --scenario concurrent-3
 *   npx tsx ops/lessoncaptain/bench.ts --scenario concurrent-5
 *   npx tsx ops/lessoncaptain/bench.ts --scenario mid-session-swap
 *   npx tsx ops/lessoncaptain/bench.ts --scenario degraded-fallback
 *   npx tsx ops/lessoncaptain/bench.ts --scenario all
 *
 * Requires:
 *   - Running dev server: pnpm dev
 *   - BENCH_COOKIE env var set to a valid session cookie
 *   - Or BENCH_URL pointing to a deployed instance
 */

import {
  BASE_URL,
  AUTH_COOKIE,
  THRESHOLDS,
  LESSON_PLAN_BODY,
  GAME_ENDPOINTS,
  TOPICS,
  type Threshold,
} from './bench-config';

// ─── Helpers ────────────────────────────────────────────────────

interface RequestResult {
  endpoint: string;
  status: number;
  latencyMs: number;
  degraded: boolean;
  error?: string;
  body?: Record<string, unknown>;
}

async function timedFetch(path: string, body: Record<string, unknown>): Promise<RequestResult> {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_COOKIE ? { Cookie: AUTH_COOKIE } : {}),
      },
      body: JSON.stringify(body),
    });

    const latencyMs = Date.now() - start;
    const data = await res.json().catch(() => ({}));

    return {
      endpoint: path,
      status: res.status,
      latencyMs,
      degraded: !!data.degraded,
      body: data as Record<string, unknown>,
    };
  } catch (err) {
    return {
      endpoint: path,
      status: 0,
      latencyMs: Date.now() - start,
      degraded: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function grade(latencyMs: number, threshold: Threshold): string {
  if (latencyMs <= threshold.pass) return '✅ PASS';
  if (latencyMs <= threshold.warning) return '⚠️  WARN';
  return '❌ FAIL';
}

function stats(values: number[]): { min: number; max: number; p50: number; p95: number; avg: number } {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
  };
}

function printResult(label: string, result: RequestResult, threshold?: Threshold) {
  const gradeStr = threshold ? ` ${grade(result.latencyMs, threshold)}` : '';
  const degradedStr = result.degraded ? ' [DEGRADED]' : '';
  const errorStr = result.error ? ` ERROR: ${result.error}` : '';
  console.log(`  ${label}: ${result.latencyMs}ms (HTTP ${result.status})${degradedStr}${gradeStr}${errorStr}`);
}

function printStats(label: string, values: number[], threshold?: Threshold) {
  const s = stats(values);
  const gradeStr = threshold ? ` ${grade(s.max, threshold)}` : '';
  console.log(`  ${label}: min=${s.min}ms p50=${s.p50}ms p95=${s.p95}ms max=${s.max}ms avg=${s.avg}ms${gradeStr}`);
}

// ─── Scenarios ──────────────────────────────────────────────────

async function scenarioSingleLesson() {
  console.log('\n━━━ Scenario 1: Single Lesson Generation ━━━');

  // Cold run (likely cache miss)
  console.log('\n  Cold run (cache miss likely):');
  const cold = await timedFetch('/api/lesson-plan/generate', LESSON_PLAN_BODY);
  printResult('Total', cold, THRESHOLDS.singleLesson);

  if (cold.body) {
    const contentKeys = Object.keys((cold.body.content as object) || {});
    const gameKeys = Object.keys((cold.body.gameContent as object) || {});
    console.log(`  Generated: ${contentKeys.length} activities, ${gameKeys.length} games`);
    if (cold.body.degraded) console.log(`  ⚠️  Degraded: ${cold.body.failedCount} generators failed`);
  }

  // Warm run (should hit cache)
  console.log('\n  Warm run (cache hit expected):');
  const warm = await timedFetch('/api/lesson-plan/generate', LESSON_PLAN_BODY);
  printResult('Total', warm, THRESHOLDS.singleLessonCached);

  return [cold, warm];
}

async function scenarioConcurrent(count: number) {
  console.log(`\n━━━ Scenario 2: Concurrent Lesson Generation (${count} teachers) ━━━`);

  const bodies = Array.from({ length: count }, (_, i) => ({
    ...LESSON_PLAN_BODY,
    customTopic: TOPICS[i % TOPICS.length],
  }));

  const start = Date.now();
  const results = await Promise.all(
    bodies.map((body, i) => timedFetch('/api/lesson-plan/generate', body).then(r => ({ ...r, teacher: i + 1 }))),
  );
  const wallClock = Date.now() - start;

  const threshold = count <= 3 ? THRESHOLDS.concurrent3Slowest : THRESHOLDS.concurrent5Slowest;
  const latencies = results.map(r => r.latencyMs);

  for (const r of results) {
    const degradedStr = r.degraded ? ' [DEGRADED]' : '';
    console.log(`  Teacher ${r.teacher}: ${r.latencyMs}ms (HTTP ${r.status})${degradedStr}`);
  }

  printStats('Latency', latencies, threshold);
  console.log(`  Wall-clock: ${wallClock}ms`);
  console.log(`  500 errors: ${results.filter(r => r.status >= 500).length}`);
  console.log(`  Degraded: ${results.filter(r => r.degraded).length}`);

  const failed500 = results.filter(r => r.status >= 500);
  if (failed500.length > 0) console.log('  ❌ FAIL: Got 500 errors — no teacher should see a hard failure');

  return results;
}

async function scenarioMidSessionSwap() {
  console.log('\n━━━ Scenario 3: Mid-Session Activity Swap ━━━');

  const results: RequestResult[] = [];

  for (const ep of GAME_ENDPOINTS) {
    const r = await timedFetch(ep.path, ep.body);
    printResult(ep.path, r, THRESHOLDS.midSessionSwapCold);
    results.push(r);
  }

  const latencies = results.map(r => r.latencyMs);
  console.log('');
  printStats('All swaps', latencies, THRESHOLDS.midSessionSwapCold);
  console.log(`  500 errors: ${results.filter(r => r.status >= 500).length}`);

  // Second pass — should be cached
  console.log('\n  Second pass (cache expected):');
  const cached: RequestResult[] = [];
  for (const ep of GAME_ENDPOINTS) {
    const r = await timedFetch(ep.path, ep.body);
    printResult(ep.path, r, THRESHOLDS.midSessionSwapCached);
    cached.push(r);
  }
  printStats('Cached swaps', cached.map(r => r.latencyMs), THRESHOLDS.midSessionSwapCached);

  return { cold: results, warm: cached };
}

async function scenarioDegradedFallback() {
  console.log('\n━━━ Scenario 5: Degraded Fallback Validation ━━━');
  console.log('  (This tests deterministic fallback speed — not provider failure.)');
  console.log('  (To test actual provider failure, stop the AI provider and re-run scenarios 1-3.)');
  console.log('');

  // Hit all game endpoints in parallel — if any use degraded fallback, validate them
  const results = await Promise.all(
    GAME_ENDPOINTS.map(ep => timedFetch(ep.path, ep.body)),
  );

  let degradedCount = 0;
  let allValid = true;

  for (const r of results) {
    const status = r.status === 200 ? '✅' : '❌';
    const deg = r.degraded ? ' [DEGRADED]' : '';
    console.log(`  ${status} ${r.endpoint}: HTTP ${r.status}, ${r.latencyMs}ms${deg}`);

    if (r.degraded) {
      degradedCount++;
      // Validate response shape
      if (!r.body || r.status !== 200) {
        console.log(`    ❌ Invalid degraded response`);
        allValid = false;
      }
    }
  }

  console.log(`\n  Degraded responses: ${degradedCount}/${results.length}`);
  console.log(`  All responses valid: ${allValid ? '✅' : '❌'}`);

  return results;
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  const scenario = process.argv.find(a => a.startsWith('--scenario='))?.split('=')[1]
    || process.argv[process.argv.indexOf('--scenario') + 1]
    || 'all';

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  LessonCaptain Benchmark v1                  ║`);
  console.log(`║  Target: ${BASE_URL.padEnd(36)}║`);
  console.log(`║  Auth: ${AUTH_COOKIE ? 'configured' : '⚠️  NOT SET (use BENCH_COOKIE)'.padEnd(38)}║`);
  console.log(`╚══════════════════════════════════════════════╝`);

  if (!AUTH_COOKIE) {
    console.log('\n⚠️  BENCH_COOKIE not set. Requests may fail with 401.');
    console.log('   Set it to your session cookie value:');
    console.log('   BENCH_COOKIE="sb-xxx=..." npx tsx ops/lessoncaptain/bench.ts --scenario all\n');
  }

  const scenarios: Record<string, () => Promise<unknown>> = {
    'single-lesson': scenarioSingleLesson,
    'concurrent-3': () => scenarioConcurrent(3),
    'concurrent-5': () => scenarioConcurrent(5),
    'concurrent-10': () => scenarioConcurrent(10),
    'mid-session-swap': scenarioMidSessionSwap,
    'degraded-fallback': scenarioDegradedFallback,
    all: async () => {
      await scenarioSingleLesson();
      await scenarioConcurrent(3);
      await scenarioConcurrent(5);
      await scenarioMidSessionSwap();
      await scenarioDegradedFallback();
    },
  };

  const fn = scenarios[scenario];
  if (!fn) {
    console.error(`Unknown scenario: ${scenario}`);
    console.error(`Available: ${Object.keys(scenarios).join(', ')}`);
    process.exit(1);
  }

  await fn();

  console.log('\n━━━ Done ━━━\n');
}

main().catch(console.error);
