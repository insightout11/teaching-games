import type { Difficulty } from '@/lib/difficulty';

const MIN_TARGET_WORDS = 14;
const DEFAULT_MAX_WORDS_PER_TURN = 38;

const TURN_WORD_TARGETS: Record<Difficulty, number> = {
  Beginner: 18,
  Easy: 22,
  Intermediate: 32,
  Advanced: 42,
  Expert: 48,
};

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function splitLongSentence(sentence: string, maxWordsPerTurn: number): string[] {
  const words = sentence.trim().split(/\s+/);
  if (words.length <= maxWordsPerTurn) return [sentence.trim()];

  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += maxWordsPerTurn) {
    chunks.push(words.slice(index, index + maxWordsPerTurn).join(' '));
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

  const sentences = cleaned
    .split(/\n\s*\n/)
    .flatMap((paragraph) => paragraph.replace(/\n/g, ' ').trim().match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .flatMap((sentence) => splitLongSentence(sentence, wordCap));

  if (sentences.length === 0) return [];

  const totalWords = wordCount(cleaned);
  const classTargetWords = studentCount > 0 ? Math.ceil(totalWords / studentCount) : wordCap;
  const targetWords = Math.min(wordCap, Math.max(MIN_TARGET_WORDS, classTargetWords));
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
