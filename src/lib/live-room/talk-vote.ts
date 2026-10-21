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

/** Choices for a quick class vote that the question itself gives: "would you rather A or B", "A or B?", or Yes/No for a
 * yes-no question. Undefined for an open question ("What do these animals eat?"): those need written choices. */
export function quickVoteOptions(question: string): string[] | undefined {
  const q = question.trim();
  const rather = parseWouldYouRather(q);
  if (rather) return rather;
  const either = q.match(/^(?:which|what)[^:]*?:\s*(.+?)\s+or\s+(.+?)\s*[?.!]*$/i) ?? q.match(/(?:like|prefer|choose|pick)\s+(.+?)\s+or\s+(.+?)\s*[?.!]*$/i);
  if (either) {
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const pair = cleanVoteOptions([cap(either[1]), cap(either[2])]);
    if (pair) return pair;
  }
  if (/^(do|does|did|is|are|was|were|can|could|would|will|should|have|has)\b/i.test(q) && !/\bor\b/i.test(q)) return ['Yes', 'No'];
  return undefined;
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
