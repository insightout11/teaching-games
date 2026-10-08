/** Identify the exact rows behind nonzero Round 19 audit counters. */
import fs from 'node:fs';

type Level = { facts: string[]; vocab: { word: string }[]; expressions: { example: string }[] };
type Topic = { title: string; aliases: string[]; levels: Record<string, Level> };
const topics = JSON.parse(fs.readFileSync('src/data/topic-briefings.json', 'utf8')) as Topic[];
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const tokens = (value: string) => normalize(value).replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
const owners = new Map<string, Set<string>>();
for (const topic of topics) {
  for (const levelName of Object.keys(topic.levels)) {
    const level = topic.levels[levelName];
    for (const card of level.vocab) {
      const word = normalize(card.word);
      if (word === normalize(topic.title) || topic.aliases.some((alias) => normalize(alias) === word)) {
        console.log(`TITLE_OR_ALIAS ${topic.title} ${levelName}: ${card.word}`);
      }
      if (!owners.has(word)) owners.set(word, new Set<string>());
      owners.get(word)?.add(topic.title);
    }
    for (const expression of level.expressions) for (const fact of level.facts) {
      const a = tokens(fact); const b = tokens(expression.example);
      const n = Math.ceil(a.length * 0.8);
      let copied = false;
      for (let i = 0; i <= a.length - n; i += 1) {
        const piece = a.slice(i, i + n).join(' ');
        for (let j = 0; j <= b.length - n; j += 1) if (b.slice(j, j + n).join(' ') === piece) copied = true;
      }
      if (copied) console.log(`FACT_IN_SPEECH ${topic.title} ${levelName}: ${expression.example} <> ${fact}`);
    }
  }
}
for (const [word, topicOwners] of Array.from(owners.entries())) {
  if (topicOwners.size > 4) console.log(`OVERUSED ${word}: ${Array.from(topicOwners).join(', ')}`);
}
