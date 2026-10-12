/**
 * Content sweep: runs every activity's generator against the REAL AI for a few topics and levels, and writes what
 * came back plus automatic warnings (stand-in content used, repeated lines, placeholders, off-topic, blanks).
 * It exists to find bad content before a class does.
 *
 * Skipped in the normal test run. To run it (costs a small amount in AI calls):
 *   set -a && . <path to>/.env.local && set +a && CONTENT_SWEEP=1 pnpm vitest run src/__tests__/sweep
 * Optional: SWEEP_ONLY=scene-igniter,cargo-hold   SWEEP_OUT=<file.json>
 *           SWEEP_MODE=topic (default: lessons from a topic alone)
 *                      source (lessons built from a library video or a text; needs the Supabase env for transcripts)
 *                      games  (the games that generate inside themselves)
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
vi.mock('@/lib/auth-credits', () => ({
  requireAuthForGeneration: vi.fn().mockResolvedValue({ error: null }),
  requireAuth: vi.fn().mockResolvedValue({ teacher: { id: 'content-sweep' }, error: null }),
  checkAndRecordAiUsage: vi.fn().mockResolvedValue(null),
}));

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

// Lessons built from material: the activities a video or text lesson actually runs.
const SOURCE_ACTIVITIES = `video-player read-aloud language-toolkit speak-check quick-fire fact-detective scene-igniter
pass-the-line say-it-again cargo-hold conversation-rounds would-you-rather hot-take-arena flight-question motion-pulse
taboo-sprint imposter static black-box answer-first compare-it prediction-round quick-pulse decision-council
fix-the-captain radio-check`.split(/\s+/).filter(Boolean);

const SOURCES: Array<{ ref: { kind: 'library'; sourceType: string; id: string; title: string } | null; text?: { title: string; text: string }; difficulty: string }> = [
  { ref: { kind: 'library', sourceType: 'kids', id: 'kids_fabulous_food_chains', title: 'Fabulous Food Chains' }, difficulty: 'Easy' },
  { ref: { kind: 'library', sourceType: 'bbc', id: 'bbc_tech_future_of_work', title: 'What Is the Future of Work?' }, difficulty: 'Intermediate' },
  {
    ref: null,
    difficulty: 'Easy',
    text: {
      title: 'A Fair First Job',
      text: 'Maya is fifteen and wants her first weekend job. The café near her home offers four hours on Saturday mornings. The pay is small, but the manager promises to teach her how to make coffee and use the till. Her friend Dan has a different offer: a delivery job that pays more, but he must use his own bicycle and work in the rain. Maya makes a list. She writes "learn new skills" and "close to home" under the café. Under the delivery job she writes "more money" and "outside all day". Her mother asks which job would still feel fair after a month. Maya thinks about tired legs, wet shoes and money for a new phone. In the end she chooses the café, but she asks the manager one brave question: could the pay go up after three months if she works well? The manager smiles and says yes.',
    },
  },
];

// Games that generate inside themselves, each with its own route and request.
const GAMES: Array<{ key: string; body: (topic: string, difficulty: string) => Record<string, unknown> }> = [
  { key: 'flash-quiz', body: (topic, difficulty) => ({ topic, difficulty, count: 6 }) },
  { key: 'grid-rush', body: (topic, difficulty) => ({ topic, difficulty }) },
  { key: 'connections', body: (topic, difficulty) => ({ topic, difficulty }) },
  { key: 'synonym-showdown', body: (topic, difficulty) => ({ topic, difficulty }) },
  { key: 'vocab-sprint', body: (topic, difficulty) => ({ topic, difficulty, tone: 'Neutral' }) },
  { key: 'sector-strike', body: (topic, difficulty) => ({ topic, difficulty, qType: 'written' }) },
  { key: 'error-hunter', body: (topic, difficulty) => ({ topic, difficulty }) },
  { key: 'sentence-scramble', body: (topic, difficulty) => ({ topic, difficulty }) },
  { key: 'dialogue-detective', body: (topic, difficulty) => ({ topic, difficulty }) },
  { key: 'grammar-boss', body: (topic, difficulty) => ({ topic, difficulty, grammarTarget: 'past simple' }) },
];

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

/** How much of the content's own vocabulary also appears in the lesson's material (0–1). Low = it ignored the material. */
function grounding(content: unknown, material: string): number {
  const ref = new Set(material.toLowerCase().match(/[a-z]{5,}/g) ?? []);
  const words = Array.from(new Set(strings(content).join(' ').toLowerCase().match(/[a-z]{6,}/g) ?? []));
  if (!words.length || !ref.size) return 0;
  return words.filter((w) => ref.has(w) || ref.has(w.replace(/(s|es|ed|ing)$/, ''))).length / words.length;
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

const MODE = process.env.SWEEP_MODE ?? 'topic';

describe.skipIf(!RUN || MODE !== 'source')('content sweep: lessons built from material (real AI)', () => {
  it('runs the material-based activities for a kids video, a teen video and a text', async () => {
    const { POST } = await import('@/app/api/lesson-plan/generate/route');
    const { getLibrarySourceMaterial } = await import('@/lib/library-source-material');
    const { fetchSourceTranscript, extractPlainText } = await import('@/lib/source-context');
    const only = process.env.SWEEP_ONLY?.split(',').map((k) => k.trim()).filter(Boolean);
    const keys = only?.length ? only : SOURCE_ACTIVITIES;
    const results: Array<Record<string, unknown>> = [];

    for (const sample of SOURCES) {
      const material = sample.ref
        ? getLibrarySourceMaterial(sample.ref as never)
        : { sourceType: 'text' as const, title: sample.text!.title, summary: sample.text!.text.slice(0, 500), rawText: sample.text!.text, originalText: sample.text!.text };
      if (!material) { results.push({ key: '(source)', topic: sample.ref?.id, warnings: ['LIBRARY ITEM NOT FOUND'] }); continue; }
      const transcript = sample.ref ? await fetchSourceTranscript(material).catch(() => undefined) : undefined;
      const reference = transcript ? extractPlainText(transcript) : material.rawText ?? material.summary;
      // eslint-disable-next-line no-console
      console.log(`SOURCE ${material.title} · transcript ${transcript ? `${reference.length} chars` : 'NONE (summary only)'}`);
      for (const key of keys) {
        if (key === 'read-aloud' && sample.ref) continue; // reading aloud is for texts
        if (key === 'video-player' && !sample.ref) continue;
        ai.calls = 0;
        ai.failures = [];
        const started = Date.now();
        let content: unknown = null;
        let error: string | null = null;
        try {
          const res = await POST(new Request('http://localhost/api/lesson-plan/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customTopic: material.title, difficulty: sample.difficulty, activities: [key], studentCount: 6, sourceMaterial: material, ...(key === 'fix-the-captain' ? { grammarTarget: 'past simple' } : {}) }),
          }) as never);
          const data = await res.json() as { success?: boolean; content?: Record<string, unknown>; error?: string };
          content = data.content?.[key] ?? null;
          if (data.success === false || !res.ok) error = data.error ?? `status ${res.status}`;
        } catch (e) {
          error = e instanceof Error ? e.message : String(e);
        }
        const share = content ? grounding(content, `${reference} ${material.title}`) : 0;
        const warnings = error
          ? [`REQUEST FAILED: ${error}`]
          : warningsFor(content, material.title, ai.calls, [...ai.failures]).filter((w) => !w.startsWith('may be off-topic'));
        if (!error && content && share < 0.3) warnings.push(`weakly tied to the material: only ${Math.round(share * 100)}% of its words appear there`);
        if (!transcript && sample.ref) warnings.push('no transcript stored for this video: built from the summary only');
        results.push({ key, topic: material.title, difficulty: sample.difficulty, ms: Date.now() - started, aiCalls: ai.calls, grounding: Math.round(share * 100), warnings, content });
        // eslint-disable-next-line no-console
        console.log(`${warnings.length ? 'WARN' : ' ok '} ${key} · ${material.title.slice(0, 22)} · tied ${Math.round(share * 100)}%${warnings.length ? ' · ' + warnings.join(' | ') : ''}`);
      }
    }
    writeFileSync(process.env.SWEEP_OUT ?? 'content-sweep-source.json', JSON.stringify(results, null, 1));
  }, 60 * 60 * 1000);
});

describe.skipIf(!RUN || MODE !== 'games')('content sweep: games that generate inside themselves (real AI)', () => {
  it('runs every game generator', async () => {
    const only = process.env.SWEEP_ONLY?.split(',').map((k) => k.trim()).filter(Boolean);
    const games = only?.length ? GAMES.filter((g) => only.includes(g.key)) : GAMES;
    const results: Array<Record<string, unknown>> = [];
    for (const game of games) {
      const { POST } = await import(`@/app/api/${game.key}/generate/route`) as { POST: (req: never) => Promise<Response> };
      for (const sample of CASES) {
        ai.calls = 0;
        ai.failures = [];
        const started = Date.now();
        let content: unknown = null;
        let error: string | null = null;
        try {
          const res = await POST(new Request(`http://localhost/api/${game.key}/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(game.body(sample.topic, sample.difficulty)) }) as never);
          content = await res.json();
          if (!res.ok) error = `status ${res.status}`;
        } catch (e) {
          error = e instanceof Error ? e.message : String(e);
        }
        const warnings = error ? [`REQUEST FAILED: ${error}`] : warningsFor(content, sample.topic, ai.calls, [...ai.failures]);
        if ((content as { degraded?: boolean } | null)?.degraded) warnings.unshift('STAND-IN CONTENT was served (degraded)');
        results.push({ key: game.key, ...sample, ms: Date.now() - started, aiCalls: ai.calls, warnings, content });
        // eslint-disable-next-line no-console
        console.log(`${warnings.length ? 'WARN' : ' ok '} ${game.key} · ${sample.topic.slice(0, 24)} · ${Date.now() - started}ms${warnings.length ? ' · ' + warnings.join(' | ') : ''}`);
      }
    }
    writeFileSync(process.env.SWEEP_OUT ?? 'content-sweep-games.json', JSON.stringify(results, null, 1));
  }, 60 * 60 * 1000);
});

describe.skipIf(!RUN || MODE !== 'topic')('content sweep (real AI)', () => {
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
