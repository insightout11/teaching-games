/**
 * Matching a lesson topic against the hand-checked banks (speaking situations, debate motions).
 *
 * A bank item wins over the AI, so a wrong match puts the whole lesson on the wrong subject. Two rules keep that
 * from happening (Oct 2026: a lesson on burial practices in Bali got a situation about bus shelters, matched on the
 * word "the"):
 *  - filler words never count
 *  - the item must share MOST of the topic's meaningful words, not just one of them
 * When nothing in a bank passes, the caller lets the AI write it for the real topic.
 */
const FILLER = new Set([
  'the', 'and', 'for', 'are', 'was', 'were', 'with', 'from', 'about', 'into', 'over', 'your', 'our', 'their', 'his', 'her',
  'its', 'this', 'that', 'these', 'those', 'what', 'when', 'where', 'which', 'who', 'why', 'how', 'more', 'most', 'than',
  'all', 'any', 'some', 'every', 'each', 'have', 'has', 'had', 'should', 'would', 'could', 'can', 'will', 'not', 'but',
  'you', 'they', 'them', 'out', 'off', 'day', 'way', 'thing', 'things', 'people', 'practice', 'practices', 'use', 'using',
  'make', 'making', 'get', 'new', 'old', 'big', 'good', 'best', 'life', 'world', 'time', 'today',
]);

const stem = (word: string) => (word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word);

/** The words of a phrase, lower-cased and lightly stemmed (plural s). Filler is kept: use topicWords for a topic. */
export function matchWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-zé]{3,}/g) ?? []).map(stem);
}

/** The meaningful words of a lesson topic. */
export function topicWords(topic: string): string[] {
  return Array.from(new Set((topic.toLowerCase().match(/[a-zé]{3,}/g) ?? []).filter((w) => !FILLER.has(w)).map(stem)));
}

/** True when a bank item that shares `matched` of the topic's meaningful words is really about that topic. */
export function coversTopic(matched: number, topic: string[]): boolean {
  if (!topic.length) return false;
  return matched >= Math.max(1, Math.ceil(topic.length * 0.6));
}
