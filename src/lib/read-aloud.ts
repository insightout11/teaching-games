const MIN_TARGET_WORDS = 18;
const MAX_WORDS_PER_TURN = 70;

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function splitLongSentence(sentence: string): string[] {
  const words = sentence.trim().split(/\s+/);
  if (words.length <= MAX_WORDS_PER_TURN) return [sentence.trim()];

  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += MAX_WORDS_PER_TURN) {
    chunks.push(words.slice(index, index + MAX_WORDS_PER_TURN).join(' '));
  }
  return chunks;
}

/**
 * Build sentence-aware reading turns. Authored paragraphs remain meaningful,
 * but they no longer limit participation to one student per paragraph.
 */
export function splitReadingTurns(text: string, studentCount: number): string[] {
  const cleaned = text.replace(/\*([^*]+)\*/g, '$1').replace(/\r/g, '').trim();
  if (!cleaned) return [];

  const sentences = cleaned
    .split(/\n\s*\n/)
    .flatMap((paragraph) => paragraph.replace(/\n/g, ' ').trim().match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .flatMap(splitLongSentence);

  if (sentences.length === 0) return [];

  const totalWords = wordCount(cleaned);
  const maxUsefulTurns = Math.max(1, Math.ceil(totalWords / MIN_TARGET_WORDS));
  const desiredTurns = Math.max(1, Math.min(studentCount || sentences.length, maxUsefulTurns));
  const targetWords = Math.min(MAX_WORDS_PER_TURN, Math.max(MIN_TARGET_WORDS, Math.ceil(totalWords / desiredTurns)));
  const turns: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = wordCount(sentence);
    const shouldFlush = current.length > 0 && currentWords + sentenceWords > targetWords;
    if (shouldFlush) {
      turns.push(current.join(' '));
      current = [];
      currentWords = 0;
    }
    current.push(sentence);
    currentWords += sentenceWords;
  }

  if (current.length > 0) turns.push(current.join(' '));
  return turns;
}
