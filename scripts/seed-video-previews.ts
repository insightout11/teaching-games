// scripts/seed-video-previews.ts
// Warms the public /video-lesson demo: for each curated DEMO_VIDEO it populates
//   1. source_extractions ('youtube', videoId)  — title + summary (+ raw transcript)
//   2. generated_content   ('video-lesson-preview', videoId, 'Intermediate') — the preview
// so the page's instant-gratification chips ALWAYS hit cache (free, never fail) and a
// signed-up teacher who re-extracts the same video gets the full summary instantly.
//
// IMPORTANT: run LOCALLY against the prod DB — it calls Supadata (dev-only) for any
// video that isn't already extracted. Both phases are idempotent; re-running is safe.
//
// Usage:
//   npm run seed-video-previews            # warm every DEMO_VIDEO
//   npm run seed-video-previews -- --limit 10
//   npm run seed-video-previews -- --force # regenerate previews even if cached
//
// NOTE: this script INLINES the Supadata fetch + summarise + preview prompt rather than
// importing src/lib/youtube-extraction.ts / src/lib/video-preview.ts, because those start
// with `import 'server-only'`, which is not resolvable under tsx (plain Node). The prompts
// below mirror those modules — keep them in sync if the route's output schema changes.

import * as fs from 'fs';
import * as path from 'path';
import { createServiceClient } from '../src/lib/supabase/service';
import { getCachedContent, storeCachedContent } from '../src/lib/content-cache';
import { generateJSON } from '../src/lib/ai';
import type { AISchema } from '../src/lib/ai';
import { DEMO_VIDEOS } from '../src/lib/video-lesson-demos';

const PREVIEW_GAME_KEY = 'video-lesson-preview';
const PREVIEW_DIFFICULTY = 'Intermediate';

// ── Load .env.local ────────────────────────────────────────────────────────────
(function loadEnvLocal() {
  const envFile = path.join(path.resolve('.'), '.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
})();

// ── Types (mirror src/lib/video-preview.ts VideoPreviewContent) ─────────────────

interface PreviewVocab {
  word: string;
  definition: string;
  example: string;
}
interface VideoPreviewContent {
  title: string;
  transcriptUsed: boolean;
  suggestedLevel: string;
  hook: string;
  keyVocab: PreviewVocab[];
  comprehensionQuestions: string[];
  discussionPrompts: string[];
}

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

// ── Extraction (inlined from youtube-extraction.ts) ─────────────────────────────

function sanitizeText(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const lower = line.toLowerCase().trim();
      return !(
        lower.startsWith('ignore') ||
        lower.startsWith('system:') ||
        lower.startsWith('assistant:') ||
        lower.startsWith('<|') ||
        lower.startsWith('[inst]')
      );
    })
    .join('\n')
    .slice(0, 60000);
}

async function fetchOEmbedTitle(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (!res.ok) return null;
    const d = (await res.json()) as { title?: string };
    return d.title ?? null;
  } catch {
    return null;
  }
}

async function summariseText(text: string, title: string): Promise<string> {
  const schema: AISchema = {
    type: 'object',
    properties: { summary: { type: 'string' } },
    required: ['summary'],
  };
  const prompt = `Summarise the following educational content in 400–500 words of plain prose.
Title: ${title}

Preserve:
- Key vocabulary and domain-specific terms (bold them with *word*)
- Main arguments and claims made
- Memorable examples, statistics, or quotes
- The overall structure and flow of ideas

Write for an ESL teacher who will use this summary to generate interactive classroom activities.

Content:
${text.slice(0, 12000)}

Return JSON with a single "summary" field.`;
  const result = await generateJSON<{ summary: string }>(prompt, schema, { taskClass: 'bulk-generation' });
  return result.summary;
}

/** Fetch + summarise a transcript via Supadata. Throws SUPADATA_NOT_CONFIGURED / NO_TRANSCRIPT. */
async function fetchYouTubeTranscript(
  videoId: string,
): Promise<{ title: string; summary: string; rawTranscript: string }> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error('SUPADATA_NOT_CONFIGURED');

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?url=https://www.youtube.com/watch?v=${videoId}`,
    { headers: { 'x-api-key': apiKey }, cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`NO_TRANSCRIPT:${res.status}`);
  const data = (await res.json()) as { content?: TranscriptSegment[] | string };

  let segments: TranscriptSegment[] = [];
  let plainText = '';
  if (Array.isArray(data.content) && data.content.length > 0) {
    segments = data.content;
    plainText = segments.map((s) => s.text).join(' ');
  } else if (typeof data.content === 'string') {
    plainText = data.content;
  }
  if (!plainText.trim()) throw new Error('NO_TRANSCRIPT');

  const title = (await fetchOEmbedTitle(videoId)) ?? `YouTube Video (${videoId})`;
  const summary = await summariseText(sanitizeText(plainText), title);
  const rawTranscript = segments.length > 0 ? JSON.stringify(segments) : plainText;
  return { title, summary, rawTranscript };
}

async function getCachedExtraction(videoId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('source_extractions')
    .select('summary, title')
    .eq('source_type', 'youtube')
    .eq('source_key', videoId)
    .maybeSingle();
  return data ?? null;
}

async function storeExtraction(videoId: string, title: string, summary: string, rawTranscript?: string) {
  const supabase = createServiceClient();
  await supabase.from('source_extractions').upsert(
    {
      source_type: 'youtube',
      source_key: videoId,
      title,
      summary,
      raw_transcript: rawTranscript ?? null,
    },
    { onConflict: 'source_type,source_key', ignoreDuplicates: false },
  );
}

// ── Preview generation (inlined from video-preview.ts) ──────────────────────────

const PREVIEW_SCHEMA: AISchema = {
  type: 'object',
  properties: {
    suggestedLevel: { type: 'string', description: 'CEFR level phrasing, e.g. "B1 — Intermediate"' },
    hook: { type: 'string', description: 'One sentence: why this video works for an ESL class' },
    keyVocab: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          word: { type: 'string' },
          definition: { type: 'string' },
          example: { type: 'string' },
        },
        required: ['word', 'definition', 'example'],
      },
    },
    comprehensionQuestions: { type: 'array', items: { type: 'string' } },
    discussionPrompts: { type: 'array', items: { type: 'string' } },
  },
  required: ['suggestedLevel', 'hook', 'keyVocab', 'comprehensionQuestions', 'discussionPrompts'],
};

async function generateVideoPreview(
  title: string,
  summary: string,
  transcriptUsed: boolean,
): Promise<VideoPreviewContent> {
  const source = transcriptUsed
    ? `Video title: ${title}\n\nVideo summary:\n${summary.slice(0, 6000)}`
    : `Video title: ${title}\n\n(No transcript was available — base the preview on the video's topic as implied by the title. Keep vocabulary and questions clearly tied to that topic.)`;

  const prompt = `You are an expert ESL/EFL teacher. A teacher wants to turn this YouTube video into a live English lesson. Produce a SHORT preview of what the lesson would cover.

${source}

Return JSON with:
- "suggestedLevel": the best CEFR level for this content, phrased like "B1 — Intermediate".
- "hook": ONE sentence explaining why this video works for an ESL class.
- "keyVocab": EXACTLY 6 useful vocabulary items from the topic. Each item: { "word", "definition" (one short learner-friendly sentence), "example" (a natural sentence using the word) }.
- "comprehensionQuestions": EXACTLY 3 clear comprehension questions a student could answer after watching.
- "discussionPrompts": EXACTLY 2 open-ended discussion questions for speaking practice.

Keep everything tightly grounded in this specific video's topic. No generic filler.`;

  const result = await generateJSON<Omit<VideoPreviewContent, 'title' | 'transcriptUsed'>>(
    prompt,
    PREVIEW_SCHEMA,
    { taskClass: 'bulk-generation' },
  );

  return {
    title,
    transcriptUsed,
    suggestedLevel: result.suggestedLevel,
    hook: result.hook,
    keyVocab: (result.keyVocab ?? []).slice(0, 6),
    comprehensionQuestions: (result.comprehensionQuestions ?? []).slice(0, 3),
    discussionPrompts: (result.discussionPrompts ?? []).slice(0, 2),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ────────────────────────────────────────────────────────────────────────

async function seedOne(
  videoId: string,
  fallbackTitle: string,
  force: boolean,
): Promise<'ok' | 'skip' | 'fail'> {
  // 1. Preview already cached → nothing to do (unless --force).
  if (!force) {
    const existing = await getCachedContent(PREVIEW_GAME_KEY, videoId, PREVIEW_DIFFICULTY);
    if (existing) return 'skip';
  }

  // 2. Extraction — reuse the cached extraction if present, else Supadata, else title-only.
  let title = fallbackTitle;
  let summary = '';
  let transcriptUsed = false;

  const cached = await getCachedExtraction(videoId);
  if (cached?.summary) {
    title = cached.title || fallbackTitle;
    summary = cached.summary;
    transcriptUsed = true;
  } else {
    try {
      const extracted = await fetchYouTubeTranscript(videoId);
      title = extracted.title;
      summary = extracted.summary;
      transcriptUsed = true;
      await storeExtraction(videoId, extracted.title, extracted.summary, extracted.rawTranscript);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const oembed = await fetchOEmbedTitle(videoId);
      if (oembed) title = oembed;
      transcriptUsed = false;
      console.log(`    ⚠ no transcript (${msg}) — title-only preview`);
    }
  }

  // 3. One AI call → preview, then cache it.
  const content = await generateVideoPreview(title, summary, transcriptUsed);
  await storeCachedContent(PREVIEW_GAME_KEY, videoId, PREVIEW_DIFFICULTY, content);
  return 'ok';
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1] ?? '', 10) : NaN;

  let videos = DEMO_VIDEOS;
  if (Number.isFinite(limit) && limit > 0) videos = videos.slice(0, limit);

  console.log(`\nSeeding ${videos.length} video previews${force ? ' (force)' : ''}…\n`);
  const stats = { ok: 0, skip: 0, fail: 0 };

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    process.stdout.write(`[${i + 1}/${videos.length}] ${v.videoId} — ${v.title.slice(0, 50)}… `);
    try {
      const result = await seedOne(v.videoId, v.title, force);
      stats[result]++;
      console.log(result.toUpperCase());
    } catch (err) {
      stats.fail++;
      console.log(`FAIL — ${err instanceof Error ? err.message : String(err)}`);
    }
    await sleep(1500);
  }

  console.log(`\nDone: warmed=${stats.ok}  skipped=${stats.skip}  failed=${stats.fail}\n`);
  if (stats.fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
