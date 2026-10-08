/** Editorial diagnosis for Round 20 level similarities and briefing collisions. */
import fs from 'node:fs';
type Level = { briefing: string; facts: string[]; angles: string[] };
type Topic = { title: string; levels: Record<string, Level> };
const topics = JSON.parse(fs.readFileSync('src/data/topic-briefings.json', 'utf8')) as Topic[];
const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const tokens = (text: string) => norm(text).split(' ').filter(Boolean);
function similar(first: string, second: string): boolean {
  const a = tokens(first); const b = tokens(second);
  const cells = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i += 1) for (let j = 1; j <= b.length; j += 1) {
    cells[i][j] = a[i - 1] === b[j - 1] ? cells[i - 1][j - 1] + 1 : Math.max(cells[i - 1][j], cells[i][j - 1]);
  }
  return cells[a.length][b.length] >= Math.ceil(Math.min(a.length, b.length) * 0.8);
}
const through = Number(process.argv[2] || topics.length);
for (const topic of topics.slice(0, through)) {
  const names = Object.keys(topic.levels);
  for (const name of names) {
    const level = topic.levels[name];
    for (const fact of level.facts) for (const sentence of level.briefing.match(/[^.!?]+[.!?]+/g) || []) {
      if (norm(fact).includes(norm(sentence)) || norm(sentence).includes(norm(fact))) {
        console.log(`BRIEFING ${topic.title} ${name}: ${fact} <> ${sentence.trim()}`);
      }
    }
  }
  for (let i = 0; i < names.length; i += 1) for (let j = i + 1; j < names.length; j += 1) {
    for (const field of ['facts', 'angles'] as const) for (const first of topic.levels[names[i]][field]) {
      for (const second of topic.levels[names[j]][field]) if (similar(first, second)) {
        console.log(`${field.toUpperCase()} ${topic.title} ${names[i]}/${names[j]}: ${first} <> ${second}`);
      }
    }
  }
}
