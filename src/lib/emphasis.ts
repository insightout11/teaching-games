// Parses the AI's `*word*` emphasis markers (the preview prompt asks for them) into
// styled segments. Unmatched or empty markers render literally — we never want a stray
// asterisk to swallow the rest of a sentence.

export interface EmphasisSegment {
  text: string;
  emphasis: boolean;
}

export function parseEmphasis(input: string): EmphasisSegment[] {
  const segments: EmphasisSegment[] = [];
  const regex = /\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index), emphasis: false });
    }
    segments.push({ text: match[1], emphasis: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex), emphasis: false });
  }

  return segments;
}
