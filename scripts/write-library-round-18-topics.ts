import fs from 'node:fs';
import path from 'node:path';
import { topicSeeds } from './library-round-18-topics';

if (topicSeeds.length !== 150 || topicSeeds.filter(topic => topic.ageBand === 'kids').length !== 80) {
  throw new Error('Expected 80 kids topics and 70 teen topics');
}
const aliases = new Set<string>();
for (const topic of topicSeeds) {
  if (topic.aliases.length < 3 || topic.aliases.length > 8) throw new Error(`${topic.id}: alias count`);
  for (const alias of topic.aliases) {
    const key = alias.toLowerCase();
    if (aliases.has(key)) throw new Error(`${topic.id}: duplicate alias ${alias}`);
    aliases.add(key);
  }
}
const file = path.resolve('src/data/topic-briefings.json');
fs.writeFileSync(file, `${JSON.stringify(topicSeeds, null, 2)}\n`, 'utf8');
console.log(`Wrote ${topicSeeds.length} topic entries with ${aliases.size} unique aliases.`);
