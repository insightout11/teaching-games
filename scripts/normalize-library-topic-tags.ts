/** Normalize topic tags to lowercase canonical spellings and remove item-level duplicates. */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalTopicTag } from './library-topic-tags';

const dataDir = path.resolve('src/data');
const files = fs.readdirSync(dataDir).filter((file) => file.endsWith('-library.json')).sort();
let changedItems = 0;
let changedTags = 0;
let removedDuplicates = 0;

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Array<Record<string, unknown>>;
  let fileChanged = false;
  for (const item of items) {
    if (!Array.isArray(item.topicTags)) continue;
    const next: string[] = [];
    const seen: Record<string, boolean> = {};
    let itemChanged = false;
    for (const raw of item.topicTags) {
      if (typeof raw !== 'string') {
        itemChanged = true;
        changedTags += 1;
        continue;
      }
      const canonical = canonicalTopicTag(raw);
      if (canonical !== raw) {
        itemChanged = true;
        changedTags += 1;
      }
      if (seen[canonical]) {
        itemChanged = true;
        removedDuplicates += 1;
        continue;
      }
      seen[canonical] = true;
      next.push(canonical);
    }
    if (itemChanged) {
      item.topicTags = next;
      changedItems += 1;
      fileChanged = true;
    }
  }
  if (fileChanged) fs.writeFileSync(filePath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify({ changedItems, changedTags, removedDuplicates }, null, 2));
