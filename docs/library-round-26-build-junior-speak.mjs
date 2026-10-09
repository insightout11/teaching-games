/** Expand editorial Junior speaking seeds into the existing Speak bank. */
import fs from 'node:fs';

const file = 'src/data/speak-situations.json';
const seeds = fs.readFileSync('docs/library-round-26-junior-speak-seeds.txt', 'utf8').trim()
  .split(/\r?\n\s*\r?\n/);
const rows = seeds.map((block, index) => {
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length !== 3) throw new Error(`Expected three lines in block ${index + 1}`);
  const [id, topicField, situation, canDo, pictureField] = lines[0].split('|').map((part) => part.trim());
  if (!id || !topicField || !situation || !canDo || !pictureField) throw new Error(`Bad heading: ${lines[0]}`);
  const round = (line, label, slot) => {
    const [kind, naturalReply, ...others] = line.split('|').map((part) => part.trim());
    if (kind !== label || !naturalReply || others.length !== 3 || others.some((reply) => !reply)) {
      throw new Error(`${id}: bad ${label} replies`);
    }
    const replies = [...others];
    replies.splice(slot, 0, naturalReply);
    return { replies, natural: slot };
  };
  return {
    id: `speak-${id}`, topics: topicField.split(',').map((topic) => topic.trim()), ageBand: 'junior', cefr: 'A1',
    situation, canDo, pictures: pictureField.split(/\s+/),
    before: round(lines[1], 'B', index % 4), after: round(lines[2], 'A', (index + 2) % 4),
  };
});
if (rows.length !== 30) throw new Error(`Expected 30 seeds, found ${rows.length}`);
const existing = JSON.parse(fs.readFileSync(file, 'utf8'));
const newIds = new Set(rows.map((row) => row.id));
const output = existing.filter((row) => !newIds.has(row.id)).concat(rows);
fs.writeFileSync(file, JSON.stringify(output, null, 2) + '\n');
console.log(`Added ${rows.length} Junior speaking situations; bank now has ${output.length}.`);
