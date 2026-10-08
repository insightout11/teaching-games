/** Compact, manually authored per-level facts and discussion questions. */
export type LevelCopy = { facts: string[]; angles: string[] };
export type TopicCopy = { title: string; levels: Record<string, LevelCopy> };

export function parseLevelCopy(source: string): TopicCopy[] {
  return source.trim().split(/\n\s*\n/).map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const title = lines[0];
    const levels: Record<string, LevelCopy> = {};
    for (const line of lines.slice(1)) {
      const equal = line.indexOf('=');
      if (equal < 1) throw new Error(`Bad Round 20 line for ${title}: ${line}`);
      const key = line.slice(0, equal);
      const match = /^(A1|A2|B1|B2)(F|Q)$/.exec(key);
      if (!match) throw new Error(`Bad Round 20 field ${key} for ${title}`);
      const values = line.slice(equal + 1).split('|').map((part) => part.trim());
      const expected = match[2] === 'F' ? 4 : 3;
      if (values.length !== expected || values.some((value) => !value)) throw new Error(`${title} ${key} needs ${expected} items`);
      if (!levels[match[1]]) levels[match[1]] = { facts: [], angles: [] };
      const field = match[2] === 'F' ? 'facts' : 'angles';
      if (levels[match[1]][field].length) throw new Error(`Repeated ${key} for ${title}`);
      levels[match[1]][field] = values;
    }
    for (const level of Object.keys(levels)) {
      if (levels[level].facts.length !== 4 || levels[level].angles.length !== 3) throw new Error(`${title} ${level} incomplete`);
    }
    return { title, levels };
  });
}
