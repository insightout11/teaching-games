/** Apply authored Round 20 copy while preserving all Round 19 fields. */
import fs from 'node:fs';
import path from 'node:path';
import type { TopicCopy } from './library-round-20-levels';
import { animalLevelCopyA } from './library-round-20-animals-a';
import { animalLevelCopyB } from './library-round-20-animals-b';
import { animalLevelCopyC } from './library-round-20-animals-c';
import { animalLevelCopyD } from './library-round-20-animals-d';
import { spaceLevelCopyA } from './library-round-20-space-a';
import { spaceLevelCopyB } from './library-round-20-space-b';
import { earthLevelCopyC } from './library-round-20-earth-c';
import { natureLevelCopyA } from './library-round-20-nature-a';
import { natureLevelCopyB } from './library-round-20-nature-b';
import { everydayLevelCopyA } from './library-round-20-everyday-a';
import { everydayLevelCopyB } from './library-round-20-everyday-b';
import { everydayLevelCopyC } from './library-round-20-everyday-c';
import { playLevelCopyA } from './library-round-20-play-a';
import { playLevelCopyB } from './library-round-20-play-b';
import { playLevelCopyC } from './library-round-20-play-c';
import { playLevelCopyD } from './library-round-20-play-d';
import { digitalLevelCopyA } from './library-round-20-digital-a';
import { digitalLevelCopyB } from './library-round-20-digital-b';
import { digitalLevelCopyC } from './library-round-20-digital-c';

type DataLevel = { facts: string[]; angles: string[] };
type DataTopic = { title: string; levels: Record<string, DataLevel> };
const dataPath = path.resolve('src/data/topic-briefings.json');
const topics = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as DataTopic[];
const batches: TopicCopy[][] = [animalLevelCopyA, animalLevelCopyB, animalLevelCopyC, animalLevelCopyD,
  spaceLevelCopyA, spaceLevelCopyB, earthLevelCopyC, natureLevelCopyA, natureLevelCopyB,
  everydayLevelCopyA, everydayLevelCopyB, everydayLevelCopyC,
  playLevelCopyA, playLevelCopyB, playLevelCopyC, playLevelCopyD,
  digitalLevelCopyA, digitalLevelCopyB, digitalLevelCopyC];
const copy = batches.flat();
const seen = new Set<string>();
for (const item of copy) {
  if (seen.has(item.title)) throw new Error(`Duplicate Round 20 topic: ${item.title}`);
  seen.add(item.title);
  const topic = topics.find((candidate) => candidate.title === item.title);
  if (!topic) throw new Error(`Unknown Round 20 topic: ${item.title}`);
  if (Object.keys(topic.levels).sort().join(',') !== Object.keys(item.levels).sort().join(',')) throw new Error(`Level mismatch: ${item.title}`);
  for (const levelName of Object.keys(item.levels)) {
    topic.levels[levelName].facts = item.levels[levelName].facts;
    topic.levels[levelName].angles = item.levels[levelName].angles;
  }
}
fs.writeFileSync(dataPath, JSON.stringify(topics, null, 2) + '\n');
console.log(`Applied Round 20 facts and angles to ${copy.length} topics.`);
