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

  let primary = '';
  if (source.backgroundOnly && !rawTranscript) {
    // A typed topic: these are the room's own notes, not something the class has seen.
    const notes = (source.rawText ?? source.summary ?? '').slice(0, 6000);
    primary = notes
      ? `\nBackground notes on the topic "${source.title}" (for accuracy only). The class has NOT read or watched anything: there is no text, passage, article or video. NEVER write "according to the text", "in the passage", "the article says" or anything like it, and never ask what a text says. Write about the topic itself; use these notes only so your facts and examples are right, and feel free to go beyond them.\n\nNotes:\n${notes}\n`
      : '';
  } else if (rawTranscript) {
    const text = extractPlainText(rawTranscript).slice(0, 10000);
    primary = `\nSource material — ground ALL content ONLY in this transcript. Every vocabulary word, fact, question, and example must come directly from this text. Do not use general knowledge.\nTitle: "${source.title}"\n\nTranscript:\n${text}\n`;
  } else {
    const body = source.briefingText ?? source.rawText ?? source.summary ?? '';
    if (body) {
      const text = body.slice(0, 10000);
      primary = (source.briefingText || source.rawText)
        ? `\nSource material — ground ALL content ONLY in this source text. Every vocabulary word, fact, question, and example must come directly from this text. Do not use general knowledge.\nTitle: "${source.title}"\n\nText:\n${text}\n`
        : `\nSource material — ground ALL content in this specific source, not general knowledge:\nTitle: "${source.title}"\n${body}\n`;
    }
  }

  const supporting = buildSupportingContext(source.supportingSources);
  if (!primary && !supporting) return '';
  return primary + buildTeachingNotesContext(source.teachingNotes) + supporting;
}

/**
 * Teaching notes written with the text. They were checked against the text and the class level, so an activity
 * should use them before inventing its own words or questions.
 */
function buildTeachingNotesContext(notes?: SourceMaterial['teachingNotes']): string {
  if (!notes) return '';
  const parts: string[] = [];
  const words = (notes.words ?? []).filter((w) => w.word?.trim()).slice(0, 8);
  if (words.length) parts.push(`KEY WORDS for this text (when this activity teaches or tests vocabulary, use these first, with these meanings): ${words.map((w) => `${w.word} = ${w.meaning}`).join('; ')}`);
  const questions = (notes.questions ?? []).filter((x) => x.q?.trim()).slice(0, 5);
  if (questions.length) parts.push(`QUESTIONS ABOUT THE TEXT (when this activity asks what the text says, use these questions first, word for word, with these answers; add your own only if more are needed): ${questions.map((x) => `"${x.q}" (answer: ${x.a})`).join(' ')}`);
  const talk = (notes.talk ?? []).filter((t) => t?.trim()).slice(0, 4);
  if (talk.length) parts.push(`QUESTIONS TO TALK ABOUT (when this activity asks for opinions or discussion, use these first, word for word): ${talk.map((t) => `"${t}"`).join(' ')}`);
  return parts.length ? `\nTeaching notes prepared for this text:\n${parts.join('\n')}\n` : '';
}

/**
 * Supporting-source block (primary + supporting policy). The primary source above
 * leads; these add extra context. Each is bounded so several sources stay within budget.
 */
function buildSupportingContext(supporting?: SourceMaterial['supportingSources']): string {
  if (!supporting || supporting.length === 0) return '';
  const blocks = supporting
    .filter((s) => s.text?.trim())
    .map((s, i) => `Supporting source ${i + 1} — "${s.title}":\n${s.text.slice(0, 4000)}`);
  if (blocks.length === 0) return '';
  return `\nAdditional supporting material — extra context only; the main source above leads. Use it to enrich, not override.\n\n${blocks.join('\n\n')}\n`;
}

export const VIDEO_SOURCE_TYPES = new Set<SourceMaterial['sourceType']>([
  'youtube', 'ted', 'teded', 'bbc', 'kurzgesagt',
  'bbc-ideas', 'bigthink', 'vox', 'kids',
  'natgeo', 'crash-course',
  'travel-english', 'world-flight', 'business-english', 'internet-memes', 'minecraft', 'sports', 'grammar', 'hooks',
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
/**
 * True when stored captions are English speech we can build a lesson from. A library audit (Oct 2026) found 112
 * videos whose stored captions are a TRANSLATION in another script (Arabic, for example): an English lesson built
 * from those is built from text nobody in the class hears. Such captions are ignored, and the lesson falls back to
 * the video's summary, until they are fetched again in English.
 */
export function isUsableEnglishTranscript(rawTranscript: string): boolean {
  const text = extractPlainText(rawTranscript);
  // Letters of any script: ASCII letters plus everything above the Latin-1 punctuation block.
  const letters = text.match(/[A-Za-zÀ-￿]/g) ?? [];
  if (letters.length < 40) return false;
  const latin = letters.filter((ch) => /[A-Za-z\u00C0-\u024F]/.test(ch)).length;
  return latin / letters.length >= 0.85;
}

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
    if (data?.raw_transcript && isUsableEnglishTranscript(data.raw_transcript as string)) return data.raw_transcript as string;
  } catch { /* continue — falls back to summary */ }
  return undefined;
}

/**
 * Convenience: fetch the transcript (if any) and build the grounding prompt
 * block in one call. Used by standalone generate routes that receive a
 * SourceMaterial directly.
 */
export async function resolveSourceContext(source?: SourceMaterial, kit?: LessonKit | null): Promise<string> {
  const kitCtx = buildKitContext(kit);
  if (!source) return kitCtx;
  const transcript = await fetchSourceTranscript(source);
  return `${buildSourceContext(source, transcript)}${kitCtx}`;
}

/**
 * Lesson Kit: what earlier stages of THIS lesson established, sent by every stage so later
 * games reuse the lesson's language instead of only knowing the topic.
 */
export interface LessonKit {
  phrases?: string[];
  scene?: { title: string; context: string; characters?: string[] };
  grammarTarget?: string;
  /** What the class got wrong earlier (missed mistakes, needed models): review stages bring these back. */
  struggles?: Array<{ text: string; fix?: string }>;
  /** Captain's Flight: the question the whole lesson investigates. */
  flightQuestion?: string;
}

export function hasLessonKit(kit?: LessonKit | null): boolean {
  return !!(kit && (kit.phrases?.length || kit.scene || kit.grammarTarget || kit.struggles?.length || kit.flightQuestion));
}

export function buildKitContext(kit?: LessonKit | null): string {
  if (!hasLessonKit(kit)) return '';
  const parts: string[] = [];
  if (kit!.flightQuestion) parts.push(`THE LESSON'S FLIGHT QUESTION (the whole lesson investigates it; build this activity around it): "${kit!.flightQuestion}"`);
  if (kit!.phrases?.length) parts.push(`LESSON KEY PHRASES (taught earlier in this lesson; reuse several of them naturally): ${kit!.phrases.slice(0, 8).join(', ')}`);
  if (kit!.scene) parts.push(`SCENE ALREADY PLAYED IN THIS LESSON: "${kit!.scene.title}". ${kit!.scene.context}${kit!.scene.characters?.length ? ` Characters: ${kit!.scene.characters.join(', ')}.` : ''}`);
  if (kit!.grammarTarget) parts.push(`LESSON GRAMMAR TARGET: ${kit!.grammarTarget} (use it naturally where it fits).`);
  if (kit!.struggles?.length) parts.push(`THE CLASS STRUGGLED WITH THESE EARLIER IN THIS LESSON (bring them back: build several items around them first, as a second chance): ${kit!.struggles.slice(0, 4).map((x) => (x.fix ? `"${x.text}" (correct: ${x.fix})` : `"${x.text}"`)).join('; ')}`);
  return `\n\n${parts.join('\n')}`;
}
