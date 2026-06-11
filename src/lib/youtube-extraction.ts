import 'server-only';
import { generateJSON } from '@/lib/ai';
import { createServiceClient } from '@/lib/supabase/service';

// Shared YouTube extraction helpers, used by both the authenticated source/extract
// route and the public video-lesson-preview route. Extraction is cached in
// source_extractions keyed by (source_type, source_key) so repeat videos are free.

interface TranscriptSegment {
  text: string;
  offset: number; // milliseconds
  duration: number; // milliseconds
}

/** Parse a YouTube video ID from a URL or bare 11-char ID. Returns null when not YouTube. */
export function parseYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Best-effort YouTube oEmbed title. ⚠️ May be blocked from some server IPs — never throws. */
export async function fetchOEmbedTitle(videoId: string): Promise<string | null> {
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

/** Fetch + summarise a YouTube transcript via Supadata. Throws SUPADATA_NOT_CONFIGURED / NO_TRANSCRIPT. */
export async function fetchYouTubeTranscript(
  videoId: string,
): Promise<{ title: string; summary: string; rawTranscript: string }> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error('SUPADATA_NOT_CONFIGURED');

  // Fetch without text=true to get timestamped segments
  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?url=https://www.youtube.com/watch?v=${videoId}`,
    { headers: { 'x-api-key': apiKey }, cache: 'no-store' },
  );
  if (!res.ok) {
    const body = await res.text();
    console.error(`[supadata] ${res.status}:`, body);
    throw new Error('NO_TRANSCRIPT');
  }
  const data = (await res.json()) as { content?: TranscriptSegment[] | string; lang?: string };

  let segments: TranscriptSegment[] = [];
  let plainText = '';

  if (Array.isArray(data.content) && data.content.length > 0) {
    segments = data.content as TranscriptSegment[];
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

// ─── Text sanitisation ───────────────────────────────────────────────────────

export function sanitizeText(text: string): string {
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

// ─── AI summarisation ────────────────────────────────────────────────────────

export async function summariseText(text: string, title: string): Promise<string> {
  const schema = {
    type: 'object' as const,
    properties: { summary: { type: 'string' as const } },
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

// ─── Cache helpers ───────────────────────────────────────────────────────────

export async function getCachedExtraction(sourceType: string, sourceKey: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('source_extractions')
    .select('summary, title, duration_secs, raw_transcript')
    .eq('source_type', sourceType)
    .eq('source_key', sourceKey)
    .single();
  return data ?? null;
}

export async function storeExtraction(params: {
  sourceType: string;
  sourceKey: string;
  title: string;
  summary: string;
  durationSecs?: number;
  rawTranscript?: string;
}) {
  const supabase = createServiceClient();
  await supabase.from('source_extractions').upsert(
    {
      source_type: params.sourceType,
      source_key: params.sourceKey,
      title: params.title,
      summary: params.summary,
      duration_secs: params.durationSecs ?? null,
      raw_transcript: params.rawTranscript ?? null,
    },
    { onConflict: 'source_type,source_key', ignoreDuplicates: false },
  );
}
