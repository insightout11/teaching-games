/** Preserve the retelling verbatim while splitting at sentence boundaries. */
export function readingSentences(text: string): string[] {
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const raw = Array.from(segmenter.segment(text), (part) => part.segment);
  const joined: string[] = [];
  for (const part of raw) {
    if (joined.length && /\b(?:Dr|Mr|Mrs|Ms|Prof)\.\s*$/i.test(joined[joined.length - 1])) joined[joined.length - 1] += part;
    else joined.push(part);
  }
  return joined.map((sentence) => sentence.trim()).filter(Boolean);
}

export function readingPassages(text: string): string[] {
  const sentences = readingSentences(text);
  const count = Math.ceil(sentences.length / 4);
  if (count < 4 || count > 8) throw new Error(`Retelling needs ${count} passages, outside 4–8`);
  const base = Math.floor(sentences.length / count);
  const extra = sentences.length % count;
  const passages: string[] = [];
  let offset = 0;
  for (let index = 0; index < count; index++) {
    const size = base + (index < extra ? 1 : 0);
    if (size < 2 || size > 4) throw new Error(`Passage ${index + 1} needs ${size} sentences`);
    passages.push(sentences.slice(offset, offset + size).join(' '));
    offset += size;
  }
  return passages;
}
