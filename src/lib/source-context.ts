import type { SourceMaterial } from '@/types/source-material';

/**
 * Source-grounding helpers shared by the lesson-plan generator and standalone
 * game/activity generate routes. Centralising this guarantees every module that
 * generates content can ground it in the lesson's source material the same way,
 * so a game can never silently fall back to topic-only (or unrelated) content.
 */

export function extractPlainText(rawTranscript: string): string {
  try {
    const parsed = JSON.parse(rawTranscript) as Array<{ text: string }>;
    if (Array.isArray(parsed)) return parsed.map((s) => s.text).join(' ');
  } catch { /* plain text */ }
  return rawTranscript;
}

/**
 * Build the prompt block that instructs the model to ground ALL generated
 * content in the lesson's source material. Returns '' when there is no source,
 * so callers can interpolate it unconditionally.
 */
export function buildSourceContext(source?: SourceMaterial, rawTranscript?: string): string {
  if (!source) return '';
  if (rawTranscript) {
    const text = extractPlainText(rawTranscript).slice(0, 10000);
    return `\nSource material — ground ALL content ONLY in this transcript. Every vocabulary word, fact, question, and example must come directly from this text. Do not use general knowledge.\nTitle: "${source.title}"\n\nTranscript:\n${text}\n`;
  }
  const body = source.briefingText ?? source.rawText ?? source.summary ?? '';
  if (!body) return '';
  const text = body.slice(0, 10000);
  if (source.briefingText || source.rawText) {
    return `\nSource material — ground ALL content ONLY in this source text. Every vocabulary word, fact, question, and example must come directly from this text. Do not use general knowledge.\nTitle: "${source.title}"\n\nText:\n${text}\n`;
  }
  return `\nSource material — ground ALL content in this specific source, not general knowledge:\nTitle: "${source.title}"\n${body}\n`;
}

export const VIDEO_SOURCE_TYPES = new Set<SourceMaterial['sourceType']>([
  'youtube', 'ted', 'teded', 'bbc', 'kurzgesagt',
  'bbc-ideas', 'bigthink', 'vox', 'kids',
  'natgeo', 'crash-course',
  'travel-english', 'business-english', 'internet-memes', 'minecraft',
]);

export function getGapFillMode(source?: SourceMaterial): 'listening' | 'reading' {
  return source && VIDEO_SOURCE_TYPES.has(source.sourceType) ? 'listening' : 'reading';
}

/**
 * Fetch the real prefetched transcript for a source from Supabase. Returns
 * undefined when there is no source key or no stored transcript (callers then
 * fall back to the briefing/summary text inside buildSourceContext).
 *
 * IMPORTANT: transcripts are never fetched from YouTube on the fly — they are
 * prefetched by scripts/prefetch-library-transcripts.ts into source_extractions.
 */
export async function fetchSourceTranscript(source?: SourceMaterial): Promise<string | undefined> {
  if (!source?.sourceKey) return undefined;
  try {
    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('source_extractions')
      .select('raw_transcript')
      .eq('source_type', source.sourceType)
      .eq('source_key', source.sourceKey)
      .single();
    if (data?.raw_transcript) return data.raw_transcript as string;
  } catch { /* continue — falls back to summary */ }
  return undefined;
}

/**
 * Convenience: fetch the transcript (if any) and build the grounding prompt
 * block in one call. Used by standalone generate routes that receive a
 * SourceMaterial directly.
 */
export async function resolveSourceContext(source?: SourceMaterial): Promise<string> {
  if (!source) return '';
  const transcript = await fetchSourceTranscript(source);
  return buildSourceContext(source, transcript);
}
