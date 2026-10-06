import fs from 'node:fs';
import path from 'node:path';
import { a1Stories } from './library-round-17-a1';

const file = path.join(process.cwd(), 'src/data/book-library.json');
const items = JSON.parse(fs.readFileSync(file, 'utf8')) as Array<{
  id: string;
  ageBand: string;
  retellings: Record<string, unknown>;
}>;
const expected = items.slice(0, 24).map(item => item.id);
if (expected.length !== 24 || expected.some(id => !a1Stories[id]) || Object.keys(a1Stories).length !== 24) {
  throw new Error('Round 17 A1 story IDs must match the original 24 lessons');
}
for (const item of items.slice(0, 24)) {
  const text = a1Stories[item.id].join('\n\n');
  const wordCount = text.trim().split(/\s+/).length;
  item.retellings.A1 = { cefr: 'A1', ageBand: item.ageBand, text, wordCount };
}
fs.writeFileSync(file, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
console.log('Added A1 retellings to 24 original book lessons.');
