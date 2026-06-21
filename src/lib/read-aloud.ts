import type { Difficulty } from '@/lib/difficulty';

const MIN_TARGET_WORDS = 14;
const DEFAULT_MAX_WORDS_PER_TURN = 38;

const TURN_WORD_TARGETS: Record<Difficulty, number> = {
  Beginner: 14,
  Easy: 14,
  Intermediate: 36,
  Advanced: 42,
  Expert: 48,
};

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function splitLongSentenceForShortTurns(sentence: string, wordCap: number) {
  const sentenceWords = wordCount(sentence);
  if (wordCap > TURN_WORD_TARGETS.Easy || sentenceWords <= wordCap + 6) return [sentence];

  const words = sentence.trim().split(/\s+/);
  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += wordCap) {
    chunks.push(words.slice(index, index + wordCap).join(' '));
  }
  return chunks;
}

export function getReadingTurnWordTarget(difficulty: Difficulty): number {
  return TURN_WORD_TARGETS[difficulty];
}

/**
 * Build sentence-aware reading turns. Authored paragraphs remain meaningful,
 * but they no longer limit participation to one student per paragraph. Class
 * size can make turns shorter, while the word cap prevents oversized turns
 * when only one device or student is connected.
 */
export function splitReadingTurns(
  text: string,
  studentCount: number,
  maxWordsPerTurn = DEFAULT_MAX_WORDS_PER_TURN,
): string[] {
  const cleaned = text.replace(/\*([^*]+)\*/g, '$1').replace(/\r/g, '').trim();
  if (!cleaned) return [];
  const wordCap = Math.max(MIN_TARGET_WORDS, maxWordsPerTurn);

  // Standard and advanced readers keep sentences intact. Easy readers get one
  // additional guardrail: oversized sentences can become phrase-sized turns so
  // more students participate and no one receives a long, difficult chunk.
  const sentences = cleaned
    .split(/\n\s*\n/)
    .flatMap((paragraph) => paragraph.replace(/\n/g, ' ').trim().match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) return [];

  const totalWords = wordCount(cleaned);
  const classTargetWords = studentCount > 0 ? Math.ceil(totalWords / studentCount) : wordCap;
  const targetWords = Math.min(wordCap, Math.max(MIN_TARGET_WORDS, classTargetWords));
  const turns: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const sentence of sentences) {
    for (const turnPart of splitLongSentenceForShortTurns(sentence, wordCap)) {
      const partWords = wordCount(turnPart);
      const shouldFlush = current.length > 0 && currentWords + partWords > targetWords;
      if (shouldFlush) {
        turns.push(current.join(' '));
        current = [];
        currentWords = 0;
      }
      current.push(turnPart);
      currentWords += partWords;
    }
  }

  if (current.length > 0) turns.push(current.join(' '));
  return turns;
}
