/**
 * Content sweep: runs every activity's generator against the REAL AI for a few topics and levels, and writes what
 * came back plus automatic warnings (stand-in content used, repeated lines, placeholders, off-topic, blanks).
 * It exists to find bad content before a class does.
 *
 * Skipped in the normal test run. To run it (costs a small amount in AI calls):
 *   set -a && . <path to>/.env.local && set +a && CONTENT_SWEEP=1 pnpm vitest run src/__tests__/sweep
 * Optional: SWEEP_ONLY=scene-igniter,cargo-hold   SWEEP_OUT=<file.json>
 */
import { describe, it, vi } from 'vitest';
import { writeFileSync } from 'fs';

const RUN = process.env.CONTENT_SWEEP === '1';

const ai = vi.hoisted(() => ({ calls: 0, failures: [] as string[] }));
vi.mock('@/lib/ai', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/ai')>();
  return {
    ...real,
    generateJSON: async (...args: Parameters<typeof real.generateJSON>) => {
      ai.calls += 1;
      try {
        return await real.generateJSON(...args);
      } catch (error) {
        ai.failures.push(error instanceof Error ? error.message.slice(0, 160) : String(error).slice(0, 160));
        throw error;
      }
    },
  };
});
vi.mock('@/lib/ai/concurrency', () => ({ bulkSemaphore: { run: <T>(fn: () => T) => fn() } }));
vi.mock('@/lib/content-cache', () => ({
  getCachedContent: vi.fn().mockResolvedValue(null),
  storeCachedContent: vi.fn().mockResolvedValue('sweep'),
  groundingVariant: vi.fn(() => undefined),
}));
vi.mock('@/lib/auth-credits', () => ({ requireAuthForGeneration: vi.fn().mockResolvedValue({ error: null }) }));

const CASES = [
  { topic: 'Rainbows and Unicorns', difficulty: 'Easy' },
  { topic: 'Food chains', difficulty: 'Intermediate' },
  { topic: 'The burial practices of Trunyan in Kintamani, Bali', difficulty: 'Advanced' },
];

// Every activity the lesson generator handles (games that generate inside themselves are swept separately).
const ACTIVITIES = `would-you-rather hot-take-arena decision-council team-debate two-truths-and-a-lie rank-it fact-detective
scenario-simulator wonder-board quick-pulse prediction-round language-toolkit scene-igniter final-answer opinion-shift
character-cards cargo-hold imposter bluff-definition taboo-sprint static black-box fix-the-captain tense-time-machine
compare-it answer-first grammar-spotlight flight-question say-it-again quick-fire speak-check pass-the-line flight-verdict
motion-pulse evidence-cards tag-team-debate radio-check hot-seat grammar-check-in grammar-proof grammar-clarify final-word
conversation-rounds story-sprint`.split(/\s+/).filter(Boolean);

const STOP = new Set(['the', 'and', 'of', 'in', 'a', 'an', 'to', 'for', 'with', 'practices']);

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => { if (k !== 'activityKey' && k !== 'topicContext' && k !== 'topic') strings(v, out); });
  return out;
}

function emptyArrays(value: unknown, path = '', out: string[] = []): string[] {
  if (Array.isArray(value)) { if (value.length === 0) out.push(path); value.forEach((v, i) => emptyArrays(v, `${path}[${i}]`, out)); }
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => emptyArrays(v, path ? `${path}.${k}` : k, out));
  return out;
}

function warningsFor(content: unknown, topic: string, aiCalls: number, aiFailures: string[]): string[] {
  const warn: string[] = [];
  if (!content) return ['NO CONTENT returned'];
  const texts = strings(content).map((t) => t.trim()).filter(Boolean);
  if (aiFailures.length) warn.push(`AI call failed and was replaced by stand-in content (${aiFailures[0]})`);
  if (aiCalls === 0) warn.push('no AI call: content came from a bank or hardcoded stand-in');
  const counts = new Map<string, number>();
  texts.filter((t) => t.length > 12).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  const repeated = Array.from(counts.entries()).filter(([, n]) => n >= 3).map(([t, n]) => `"${t.slice(0, 60)}" x${n}`);
  if (repeated.length) warn.push(`same text repeated: ${repeated.slice(0, 3).join('; ')}`);
  const placeholder = texts.filter((t) => /something about|lorem ipsum|\bTODO\b|\bundefined\b|\[object|placeholder|example (word|sentence) \d/i.test(t));
  if (placeholder.length) warn.push(`placeholder-looking text: "${placeholder[0].slice(0, 80)}"`);
  if (texts.some((t) => /â€|Ã©|ðŸ|�/.test(t))) warn.push('corrupted characters');
  const words = topic.toLowerCase().match(/[a-z]{4,}/g)?.filter((w) => !STOP.has(w)) ?? [];
  const blob = texts.join(' ').toLowerCase();
  const stems = words.map((w) => w.replace(/(s|es|ing)$/, ''));
  if (stems.length && !stems.some((w) => blob.includes(w))) warn.push(`may be off-topic: none of [${words.join(', ')}] appear`);
  const empties = emptyArrays(content).filter((p) => !/vocabulary|hint|tags|pictures|forbidden|evidence/i.test(p));
  if (empties.length) warn.push(`empty list: ${empties.slice(0, 3).join(', ')}`);
  if (texts.length < 3) warn.push(`very little content (${texts.length} text fields)`);
  const blanks = strings(content).filter((t) => t.trim() === '').length;
  if (blanks >= 3) warn.push(`${blanks} blank text fields`);
  return warn;
}

describe.skipIf(!RUN)('content sweep (real AI)', () => {
  it('runs every activity generator and writes the report', async () => {
    const { POST } = await import('@/app/api/lesson-plan/generate/route');
    const only = process.env.SWEEP_ONLY?.split(',').map((k) => k.trim()).filter(Boolean);
    const keys = only?.length ? only : ACTIVITIES;
    const results: Array<Record<string, unknown>> = [];

    for (const key of keys) {
      for (const sample of CASES) {
        ai.calls = 0;
        ai.failures = [];
        const started = Date.now();
        let content: unknown = null;
        let error: string | null = null;
        try {
          const res = await POST(new Request('http://localhost/api/lesson-plan/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customTopic: sample.topic,
              difficulty: sample.difficulty,
              activities: [key],
              studentCount: 6,
              ...(key.startsWith('grammar') || key === 'fix-the-captain' || key === 'tense-time-machine' ? { grammarTarget: 'past simple' } : {}),
            }),
          }) as never);
          const data = await res.json() as { success?: boolean; content?: Record<string, unknown>; error?: string };
          content = data.content?.[key] ?? null;
          if (data.success === false || !res.ok) error = data.error ?? `status ${res.status}`;
        } catch (e) {
          error = e instanceof Error ? e.message : String(e);
        }
        const warnings = error ? [`REQUEST FAILED: ${error}`] : warningsFor(content, sample.topic, ai.calls, [...ai.failures]);
        results.push({ key, ...sample, ms: Date.now() - started, aiCalls: ai.calls, warnings, content });
        // eslint-disable-next-line no-console
        console.log(`${warnings.length ? 'WARN' : ' ok '} ${key} · ${sample.topic.slice(0, 24)} · ${Date.now() - started}ms${warnings.length ? ' · ' + warnings.join(' | ') : ''}`);
      }
    }
    writeFileSync(process.env.SWEEP_OUT ?? 'content-sweep.json', JSON.stringify(results, null, 1));
  }, 60 * 60 * 1000);
});
