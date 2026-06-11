import 'server-only';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';

// Light lesson PREVIEW for the public /video-lesson demo. Exactly ONE generateJSON
// call per uncached video — NOT the full parallel lesson-plan fan-out (that is the
// single most expensive call in the app and must never run for anonymous visitors).

export interface VideoPreviewVocab {
  word: string;
  definition: string;
  example: string;
}

export interface VideoPreviewContent {
  title: string;
  /** false when no transcript was available and the preview was built from the title/topic alone. */
  transcriptUsed: boolean;
  suggestedLevel: string; // CEFR phrasing, e.g. "B1 — Intermediate"
  hook: string; // one sentence: why this video works for ESL
  keyVocab: VideoPreviewVocab[]; // 6
  comprehensionQuestions: string[]; // 3
  discussionPrompts: string[]; // 2
}

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

/** Generate a preview from a video title + summary. transcriptUsed flags title-only builds. */
export async function generateVideoPreview(
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

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'you', 'how',
  'why', 'what', 'when', 'who', 'are', 'was', 'were', 'will', 'can', 'his',
  'her', 'their', 'they', 'our', 'out', 'about', 'into', 'over', 'official',
  'video', 'full', 'part', 'feat', 'ft', 'lyrics', 'hd',
]);

/**
 * Topic-aware degraded preview when AI generation fails. Words are pulled from the
 * actual video title (never generic unrelated content — locked project rule). Honest
 * about being a light fallback rather than inventing fake definitions.
 */
export function buildDegradedPreview(title: string, transcriptUsed: boolean): VideoPreviewContent {
  const words = Array.from(
    new Set(
      title
        .replace(/[^a-zA-Z0-9\s'-]/g, ' ')
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 3 && !STOPWORDS.has(w.toLowerCase())),
    ),
  ).slice(0, 6);

  const keyVocab: VideoPreviewVocab[] = words.map((word) => ({
    word,
    definition: `A key term from this video — explore its meaning together as a class.`,
    example: `Let's talk about "${word}" and how it's used.`,
  }));

  return {
    title,
    transcriptUsed,
    suggestedLevel: 'B1 — Intermediate',
    hook: `Turn "${title}" into a full English lesson — vocabulary, comprehension, and discussion.`,
    keyVocab,
    comprehensionQuestions: [
      `What is "${title}" mainly about?`,
      `Which part of the video did you find most interesting, and why?`,
      `What new words or ideas did you notice while watching?`,
    ],
    discussionPrompts: [
      `How does the topic of "${title}" connect to your own life or country?`,
      `Do you agree with the ideas in this video? Why or why not?`,
    ],
  };
}
