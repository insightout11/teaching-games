/**
 * Matching a lesson topic against the hand-checked banks (speaking situations, debate motions).
 *
 * OWNER'S RULE (Oct 2026): lessons are live and on whatever the class is talking about, so the AI writes for the
 * EXACT topic. A ready-made item that is merely close ("food waste" for "food chains") is worse than none: it puts
 * the lesson on the wrong subject. A bank item is used only when it was made for this topic:
 *  - filler words never count (a lesson on burial practices in Bali once got bus shelters, matched on "the")
 *  - EVERY meaningful word of the topic must be covered by the item
 * When nothing passes, the caller lets the AI write it for the real topic.
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

/** True when a bank item covers all `topic` words (`matched` of them): it was made for this topic, not a near one. */
export function coversTopic(matched: number, topic: string[]): boolean {
  return topic.length > 0 && matched >= topic.length;
}
