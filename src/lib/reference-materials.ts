export interface ReferenceVocabItem {
  word: string;
  definition: string;
}

export interface ReferenceExpressionItem {
  phrase: string;
  example: string;
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
      return word ? { word, definition } : null;
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
