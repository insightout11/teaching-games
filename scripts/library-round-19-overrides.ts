/** Handwritten Round 19 topic copy. Each block contains independent briefing and speech ideas. */
export type TermSeed = { word: string; definition?: string; example?: string };
export type WritingSeed = {
  title: string;
  low: string[];
  high: string[];
  vocab: TermSeed[];
  talkLow: string[];
  talkHigh: string[];
  angles?: string[];
};

export function parseWritingBlocks(source: string): WritingSeed[] {
  return source.trim().split(/\n\s*\n/).map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const title = lines[0];
    const fields: Record<string, string[]> = {};
    for (const line of lines.slice(1)) {
      const equal = line.indexOf('=');
      if (equal < 1) throw new Error(`Bad writing line for ${title}: ${line}`);
      const key = line.slice(0, equal);
      if (fields[key]) throw new Error(`Repeated ${key} for ${title}`);
      fields[key] = line.slice(equal + 1).split('|').map((part) => part.trim());
    }
    for (const [name, count] of [['L', 3], ['H', 3], ['V', 7], ['S', 6], ['T', 6]] as const) {
      if (!fields[name] || fields[name].length !== count || fields[name].some((part) => !part)) {
        throw new Error(`${title}: ${name} requires ${count} entries`);
      }
    }
    if (fields.Q && fields.Q.length !== 3) throw new Error(`${title}: Q requires three angles`);
    return {
      title,
      low: fields.L,
      high: fields.H,
      vocab: fields.V.map((part) => {
        const [word, definition, example] = part.split('~');
        return { word, definition, example };
      }),
      talkLow: fields.S,
      talkHigh: fields.T,
      ...(fields.Q ? { angles: fields.Q } : {}),
    };
  });
}
