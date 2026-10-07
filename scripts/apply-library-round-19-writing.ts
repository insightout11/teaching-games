/** Apply handwritten Round 19 copy without touching topic metadata or other libraries. */
import fs from 'node:fs';
import path from 'node:path';
import type { WritingSeed, TermSeed } from './library-round-19-overrides';
import { animalWriting } from './library-round-19-animals';
import { earthWriting } from './library-round-19-earth';

type Vocab = { word: string; definition: string; partOfSpeech: string; example: string; starter: string };
type Level = { briefing: string; facts: string[]; angles: string[]; vocab: Vocab[]; expressions: { phrase: string; example: string }[] };
type Topic = { title: string; ageBand: 'kids' | 'teens'; levels: Record<string, Level> };
const dataPath = path.resolve('src/data/topic-briefings.json');
const topics = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as Topic[];
const writings: WritingSeed[] = [...animalWriting, ...earthWriting];
const byTitle = new Map(writings.map((writing) => [writing.title, writing]));
if (byTitle.size !== writings.length) throw new Error('Duplicate Round 19 writing title');

function description(word: TermSeed, old: Level): string {
  if (word.definition) return word.definition;
  const oldCard = old.vocab.find((card) => card.word.toLowerCase() === word.word.toLowerCase());
  if (!oldCard) throw new Error(`No definition for ${word.word}`);
  return oldCard.definition;
}

function sentenceContaining(word: string, source: string[]): string | undefined {
  return source.find((sentence) => sentence.toLowerCase().includes(word.toLowerCase()));
}

function stem(example: string): string {
  const words = example.replace(/[.!?]$/, '').split(/\s+/);
  return words.slice(0, Math.min(6, Math.max(2, words.length - 2))).join(' ') + '…';
}

function buildLevel(topic: Topic, writing: WritingSeed, levelName: string, old: Level): Level {
  const kids = topic.ageBand === 'kids';
  const lines = levelName === 'A1' || (levelName === 'B1' && !kids) ? writing.low
    : levelName === 'A2' ? [writing.low[0], writing.high[0], writing.high[1]] : writing.high;
  const talk = levelName === 'A1' || (levelName === 'B1' && !kids) ? writing.talkLow
    : levelName === 'A2' ? [...writing.talkLow.slice(0, 3), ...writing.talkHigh.slice(3)] : writing.talkHigh;
  const briefing = lines.join(' ');
  const sources = [...lines, ...old.facts, ...talk];
  const vocab = writing.vocab.map((term, index): Vocab => {
    const example = sentenceContaining(term.word, sources) || term.example;
    if (!example) throw new Error(`${topic.title} ${levelName}: no example for ${term.word}`);
    return {
      word: term.word,
      definition: description(term, old),
      partOfSpeech: term.word.includes(' ') ? 'phrase' : /^(run|hide|leap|hunt|climb|purr|stalk|glide|migrate|erupt|float|soar|swim|dive|hop|graze|forage|sprout|pollinate)$/.test(term.word) ? 'verb' : 'noun',
      example,
      starter: [`If I saw ${term.word}, I would…`, `I could describe ${term.word} by…`, `I wonder whether ${term.word} can…`, `One question about ${term.word} is…`, `I would compare ${term.word} with…`, `My idea about ${term.word} is…`, `I might use ${term.word} when…`][index],
    };
  });
  return { briefing, facts: old.facts, angles: writing.angles || old.angles, vocab,
    expressions: talk.map((example) => ({ phrase: stem(example), example })) };
}

let applied = 0;
for (const topic of topics) {
  const writing = byTitle.get(topic.title);
  if (!writing) continue;
  for (const levelName of Object.keys(topic.levels)) topic.levels[levelName] = buildLevel(topic, writing, levelName, topic.levels[levelName]);
  applied += 1;
}
if (applied !== writings.length) throw new Error(`Only applied ${applied} of ${writings.length} topics`);
fs.writeFileSync(dataPath, JSON.stringify(topics, null, 2) + '\n');
console.log(`Applied Round 19 handwritten writing to ${applied} topics.`);
