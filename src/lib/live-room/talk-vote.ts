/**
 * Pull the two choices out of a typed "Would you rather A or B?" question.
 * Returns undefined when it isn't that shape (the vote then falls back to agree/disagree).
 */
export function parseWouldYouRather(question: string): string[] | undefined {
  const m = question.trim().match(/^would you rather\s+(.+?)\s*,?\s+or\s+(.+?)\s*[?.!]*$/i);
  if (!m) return undefined;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return cleanVoteOptions([cap(m[1]), cap(m[2])]);
}

/** Talk-view class votes: exactly two distinct, short options, or none. */
export function cleanVoteOptions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const opts = value
    .filter((o): o is string => typeof o === 'string')
    .map((o) => o.replace(/[?.!]+$/, '').trim().slice(0, 40))
    .filter(Boolean);
  if (opts.length !== 2 || opts[0].toLowerCase() === opts[1].toLowerCase()) return undefined;
  return opts;
}
