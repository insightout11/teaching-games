import fs from 'node:fs';
import path from 'node:path';
import { readingSentences } from './library-reading-sentences';
import { concreteWords, focus, simpleMeanings, talkQuestions } from './library-round-17-pack-data';

type Question = { q: string; options: string[]; correctIndex: number };
type Item = {
  id: string;
  retellings: Record<string, { text: string }>;
  readingPack: Record<string, {
    predict: { q: string; options: string[]; outcomeIndex: number };
    cast: Array<{ name: string; who: string }>;
  }>;
};
const file = path.join(process.cwd(), 'src/data/book-library.json');
const items = JSON.parse(fs.readFileSync(file, 'utf8')) as Item[];
for (const item of items.slice(0, 24)) {
  const text = item.retellings.A1?.text;
  if (!text) throw new Error(`${item.id}: missing A1 text`);
  const sentences = readingSentences(text);
  const parts: string[] = [];
  for (let offset = 0; offset < sentences.length; offset += 3) {
    parts.push(sentences.slice(offset, offset + 3).join(' '));
  }
  const labels = focus[item.id];
  if (!labels || labels.length !== parts.length || labels.some(label => label.split(/\s+/).length > 4)) {
    throw new Error(`${item.id}: focus labels do not match passages`);
  }
  const passages = parts.map((part, index) => {
    const optionIndexes = [index, (index + 1) % parts.length, (index + 2) % parts.length];
    const correctIndex = index % 3;
    const rotated = optionIndexes.slice(correctIndex === 0 ? 0 : 3 - correctIndex)
      .concat(optionIndexes.slice(0, correctIndex === 0 ? 0 : 3 - correctIndex));
    return {
      text: part,
      gist: { q: 'What happens in this part?', options: rotated.map(i => labels[i]), correctIndex }
    };
  });
  const checkPoints = [0, Math.floor(parts.length / 2), parts.length - 1];
  const checkPrompts = ['What happens near the start?', 'What happens in the middle?', 'What happens near the end?'];
  const check: Question[] = checkPoints.map((point, index) => {
    const options = [labels[checkPoints[(index + 1) % 3]], labels[checkPoints[(index + 2) % 3]]];
    options.splice(index, 0, labels[point]);
    return { q: checkPrompts[index], options, correctIndex: index };
  });
  const words = concreteWords[item.id]?.map(word => {
    if (!new RegExp(`(^|[^A-Za-z])${word}([^A-Za-z]|$)`, 'i').test(text)) {
      throw new Error(`${item.id}: word ${word} is absent`);
    }
    const meaning = simpleMeanings[word.toLowerCase()];
    if (!meaning) throw new Error(`${item.id}: no meaning for ${word}`);
    return { word, meaning };
  });
  if (!words || words.length !== 5) throw new Error(`${item.id}: needs five words`);
  const cast = item.readingPack.A2.cast.filter(character => {
    const escapedName = character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^A-Za-z])${escapedName}([^A-Za-z]|$)`, 'i').test(text);
  });
  if (!cast.length) throw new Error(`${item.id}: no matching cast member`);
  item.readingPack.A1 = {
    passages,
    predict: item.readingPack.A2.predict,
    check,
    words,
    cast,
    talk: talkQuestions[item.id]
  } as typeof item.readingPack.A2;
}
fs.writeFileSync(file, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
console.log('Built A1 reading packs for 24 original book lessons.');
