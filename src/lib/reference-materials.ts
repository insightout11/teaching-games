/** Where a phrasebook word came from — drives the card's colour ribbon. */
export type PhraseSource = 'topic' | 'reading' | 'ai' | 'teacher';
const PHRASE_SOURCES: PhraseSource[] = ['topic', 'reading', 'ai', 'teacher'];

/**
 * One Pocket Phrasebook card. `word` + `definition` are the original shape;
 * everything else is optional so older sessions still render.
 */
export interface ReferenceVocabItem {
  word: string;
  definition: string;
  /** One short sentence using the word in today's topic. */
  example?: string;
  /** "Use it" sentence starter, e.g. "I think a delta is good for farms because…" */
  starter?: string;
  /** noun / verb / adjective / phrase */
  partOfSpeech?: string;
  source?: PhraseSource;
}

export interface ReferenceExpressionItem {
  phrase: string;
  example: string;
}

/** AI schema for one phrasebook card (shared by every route that makes vocab). */
export const PHRASEBOOK_ITEM_SCHEMA = {
  type: 'object' as const,
  properties: {
    word: { type: 'string' as const },
    definition: { type: 'string' as const },
    partOfSpeech: { type: 'string' as const },
    example: { type: 'string' as const },
    starter: { type: 'string' as const },
  },
  required: ['word', 'definition', 'example', 'starter'],
};

/** Prompt lines describing each card's fields; append after the list request. */
export const PHRASEBOOK_FIELDS_PROMPT = `Each vocab item has:
  - "word": the word or short phrase
  - "definition": a plain meaning in 15 words or fewer, no jargon
  - "partOfSpeech": noun, verb, adjective, adverb or phrase
  - "example": one short sentence using the word about this topic
  - "starter": the start of a sentence a student can finish out loud using the word, ending with "…" (e.g. "I think a delta is good for farms because…")`;

/** Tag every item with where it came from (keeps an existing tag). */
export function withPhraseSource(items: ReferenceVocabItem[], source: PhraseSource): ReferenceVocabItem[] {
  return items.map((item) => (item.source ? item : { ...item, source }));
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function unwrapItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  const wrapped = value as { items?: unknown; data?: unknown };
  if (Array.isArray(wrapped.items)) return wrapped.items;
  if (Array.isArray(wrapped.data)) return wrapped.data;
  return [];
}

export function normalizeReferenceVocab(value: unknown): ReferenceVocabItem[] {
  return unwrapItems(value)
    .map((item) => {
      if (typeof item === 'string') {
        return { word: cleanText(item, 80), definition: '' };
      }
      if (!item || typeof item !== 'object') return null;

      const row = item as Record<string, unknown>;
      const word = cleanText(row.word ?? row.term ?? row.phrase, 80);
      const definition = cleanText(row.definition ?? row.meaning ?? row.description, 240);
      if (!word) return null;
      const out: ReferenceVocabItem = { word, definition };
      const example = cleanText(row.example ?? row.exampleSentence, 240);
      const starter = cleanText(row.starter ?? row.useIt, 160);
      const partOfSpeech = cleanText(row.partOfSpeech ?? row.pos, 24).toLowerCase();
      if (example) out.example = example;
      if (starter) out.starter = starter;
      if (partOfSpeech) out.partOfSpeech = partOfSpeech;
      if (PHRASE_SOURCES.includes(row.source as PhraseSource)) out.source = row.source as PhraseSource;
      return out;
    })
    .filter((item): item is ReferenceVocabItem => item !== null);
}

export function normalizeReferenceExpressions(value: unknown): ReferenceExpressionItem[] {
  return unwrapItems(value)
    .map((item) => {
      if (typeof item === 'string') {
        const phrase = cleanText(item, 160);
        return phrase ? { phrase, example: '' } : null;
      }
      if (!item || typeof item !== 'object') return null;

      const row = item as Record<string, unknown>;
      const phrase = cleanText(row.phrase ?? row.expression ?? row.text ?? row.title, 160);
      const example = cleanText(row.example ?? row.exampleSentence ?? row.use, 300);
      return phrase ? { phrase, example } : null;
    })
    .filter((item): item is ReferenceExpressionItem => item !== null);
}
