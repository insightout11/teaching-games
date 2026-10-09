/** Expand reviewed Round 27 topic situations without changing earlier rows. */
import fs from 'node:fs';

const file = 'src/data/speak-situations.json';
const briefingRows = JSON.parse(fs.readFileSync('src/data/topic-briefings.json', 'utf8'));
const briefings = new Map(briefingRows.map((row) => [row.id, row]));
const blocks = ['kids', 'teens'].flatMap((age) => fs.readFileSync(`docs/library-round-27-${age}-seeds.txt`, 'utf8')
  .trim().split(/\r?\n\s*\r?\n/));
const added = blocks.map((block, index) => {
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length !== 3) throw new Error(`Expected header/B/A lines in block ${index + 1}`);
  const [slug, ageBand, cefr, suffixField, situation, canDo] = lines[0].split('|').map((part) => part.trim());
  if (!slug || !['kids', 'teens'].includes(ageBand) || !cefr || !suffixField || !situation || !canDo) {
    throw new Error(`Bad heading: ${lines[0]}`);
  }
  const topicIds = suffixField.split(/\s+/).map((suffix) => `topic-${ageBand}-${suffix}`);
  const topics = topicIds.map((id) => {
    const briefing = briefings.get(id);
    if (!briefing) throw new Error(`Unknown topic ${id}`);
    return briefing.title.toLowerCase();
  });
  const replyRound = (line, kind, slot) => {
    const [prefix, naturalReply, ...others] = line.split('|').map((part) => part.trim());
    if (prefix !== kind || !naturalReply || others.length !== 3 || others.some((reply) => !reply)) {
      throw new Error(`${slug}: bad ${kind} replies`);
    }
    const replies = [...others];
    replies.splice(slot, 0, naturalReply);
    return { replies, natural: slot };
  };
  return {
    id: `speak-r27-${slug}`, topics, topicIds, ageBand, cefr, situation, canDo,
    before: replyRound(lines[1], 'B', index % 4),
    after: replyRound(lines[2], 'A', (index + 1) % 4),
  };
});
const newIds = new Set(added.map((row) => row.id));
if (newIds.size !== added.length) throw new Error('Duplicate Round 27 situation id');
const old = JSON.parse(fs.readFileSync(file, 'utf8'));
const rows = old.filter((row) => !newIds.has(row.id)).concat(added);
fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n');
console.log(`Added ${added.length} topic situations; bank now has ${rows.length}.`);
