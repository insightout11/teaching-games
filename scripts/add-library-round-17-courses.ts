import fs from 'node:fs';
import path from 'node:path';
import { readingPassages, readingSentences } from './library-reading-sentences';
import { newStories, type NewStory } from './library-round-17-new-courses';
import { simpleMeanings } from './library-round-17-pack-data';

type Question = { q: string; options: string[]; correctIndex: number };
const a2Focus: Record<string, string[]> = {
  'book-potter-1': ['Mother warns Peter', 'Peter enters garden', 'Mr McGregor chases', 'Peter leaves coat', 'A mouse cannot answer', 'Peter finds gate', 'Tea and bed'],
  'book-potter-2': ['Benjamin visits Peter', 'Clothes on scarecrow', 'Onions for aunt', 'Cat traps rabbits', 'Father drives cat', 'Peter returns home'],
  'book-potter-3': ['Jemima wants nest', 'Fox offers shed', 'Nine eggs', 'Kep hears truth', 'Dogs chase fox', 'Eggs are eaten', 'More eggs hatch'],
  'book-potter-4': ['Nutkin crosses lake', 'Gifts for owl', 'Nutkin sings riddles', 'Owl loses patience', 'Owl catches Nutkin', 'Nutkin escapes'],
  'book-fairy-1': ['Hen finds grain', 'Hen plants wheat', 'Hen cuts wheat', 'Hen bakes bread', 'Neighbours want bread', 'Chicks eat bread'],
  'book-fairy-2': ['Woman bakes boy', 'Gingerbread Man runs', 'Cow joins chase', 'Horse joins chase', 'Fox offers help', 'Fox eats him'],
  'book-fairy-3': ['Bears go walking', 'Goldilocks enters', 'Three chairs', 'Porridge bowls', 'Goldilocks sleeps', 'Bears find clues', 'Goldilocks runs away'],
  'book-fairy-4': ['Shoemaker cuts leather', 'A new pair', 'More shoes appear', 'Couple sees Elves', 'Gifts for helpers', 'Elves find gifts', 'Shop stays busy']
};
const falseOutcomes: Record<string, [string, string]> = {
  'book-potter-1': ['Peter stays in the garden', 'Mother enters the garden'],
  'book-potter-2': ['The cat keeps both rabbits', 'Mr McGregor finds the rabbits'],
  'book-potter-3': ['Jemima stays with the fox', 'The fox raises the ducklings'],
  'book-potter-4': ['Old Brown gives Nutkin nuts', 'Nutkin never leaves the island'],
  'book-fairy-1': ['The neighbours bake the bread', 'The Goose plants the wheat'],
  'book-fairy-2': ['The cow catches the boy', 'The horse takes him home'],
  'book-fairy-3': ['Goldilocks stays with the Bears', 'The Bears leave their house'],
  'book-fairy-4': ['The Elves buy the shop', 'The Shoemaker stops making shoes']
};
const links: Record<string, string> = {
  'book-fairy-1': 'https://www.gutenberg.org/files/473/473-h/473-h.htm#redhen',
  'book-fairy-2': 'https://www.gutenberg.org/files/473/473-h/473-h.htm#gingerbread',
  'book-fairy-3': 'https://www.gutenberg.org/files/49001/49001-h/49001-h.htm',
  'book-fairy-4': 'https://www.gutenberg.org/files/473/473-h/473-h.htm#elves'
};

function question(labels: string[], index: number, q: string): Question {
  const options = [labels[index], labels[(index + 1) % labels.length], labels[(index + 2) % labels.length]];
  const correctIndex = index % 3;
  const shift = (3 - correctIndex) % 3;
  return { q, options: options.slice(shift).concat(options.slice(0, shift)), correctIndex };
}

function makePack(story: NewStory, level: 'A1' | 'A2', text: string) {
  const passages = level === 'A1'
    ? story.a1.map(paragraph => paragraph.trim())
    : readingPassages(text);
  const labels = level === 'A1' ? story.focus : a2Focus[story.id];
  if (labels.length !== passages.length) throw new Error(`${story.id} ${level}: focus/passage mismatch`);
  const points = [0, Math.floor(passages.length / 2), passages.length - 1];
  const checkPrompts = ['What happens near the start?', 'What happens in the middle?', 'How does this story end?'];
  const check = points.map((point, index) => {
    const options = [labels[points[(index + 1) % 3]], labels[points[(index + 2) % 3]]];
    options.splice(index, 0, labels[point]);
    return { q: checkPrompts[index], options, correctIndex: index };
  });
  const words = story.words.map(word => {
    if (!new RegExp(`(^|[^A-Za-z])${word}([^A-Za-z]|$)`, 'i').test(text)) throw new Error(`${story.id} ${level}: ${word} missing`);
    const meaning = simpleMeanings[word.toLowerCase()];
    if (!meaning) throw new Error(`${story.id}: ${word} has no meaning`);
    return { word, meaning };
  });
  for (const character of story.cast) {
    if (!text.toLowerCase().includes(character.name.toLowerCase())) throw new Error(`${story.id} ${level}: cast ${character.name} missing`);
  }
  const wrong = falseOutcomes[story.id];
  const last = level === 'A1' ? story.focus[story.focus.length - 1] : a2Focus[story.id][a2Focus[story.id].length - 1];
  return {
    passages: passages.map((part, index) => ({ text: part, gist: question(labels, index, 'What happens in this part?') })),
    predict: { q: 'What will happen by the end?', options: [last, ...wrong], outcomeIndex: 0 },
    check,
    words,
    cast: story.cast,
    talk: story.talk
  };
}

const file = path.join(process.cwd(), 'src/data/book-library.json');
const items = JSON.parse(fs.readFileSync(file, 'utf8')) as Array<Record<string, unknown>>;
for (const story of newStories) {
  if (items.some(item => item.id === story.id)) throw new Error(`Already present: ${story.id}`);
  const a1 = story.a1.join('\n\n');
  const a2 = story.a2.join('\n\n');
  const a1Words = a1.trim().split(/\s+/).length;
  const a2Words = a2.trim().split(/\s+/).length;
  const a1Sentences = readingSentences(a1);
  if (a1Words < 150 || a1Words > 220 || a1Words / a1Sentences.length > 10 || a1Sentences.some(s => s.trim().split(/\s+/).length > 14)) {
    throw new Error(`${story.id}: A1 words/sentences invalid`);
  }
  if (a2Words < 250 || a2Words > 450) throw new Error(`${story.id}: A2 word count invalid`);
  items.push({
    id: story.id, title: story.title, kind: 'text', author: 'LessonCaptain (retelling)',
    url: links[story.id] || story.sourceUrl, youtubeId: null, durationSecs: null,
    wordCount: a1Words, summary: a1, shortSummary: story.shortSummary,
    description: `Levelled reading from ${story.title}.`, topicTags: story.tags,
    genre: 'narrative', difficultyLevel: 'Beginner', cefr: 'A1', ageBand: 'kids', place: null,
    license: 'CC BY 4.0',
    attribution: `Original retelling by LessonCaptain, licensed CC BY 4.0; based on the public-domain text ${story.sourceTitle}. No source illustrations used.`,
    needsReview: false, flightQuestion: story.question,
    source: { title: story.sourceTitle, url: story.sourceUrl },
    retellings: {
      A1: { cefr: 'A1', ageBand: 'kids', text: a1, wordCount: a1Words },
      A2: { cefr: 'A2', ageBand: 'kids', text: a2, wordCount: a2Words }
    },
    series: { id: story.seriesId, title: story.seriesTitle, order: story.order },
    readingPack: { A1: makePack(story, 'A1', a1), A2: makePack(story, 'A2', a2) }
  });
}
fs.writeFileSync(file, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
console.log('Added two early-reader courses with eight A1/A2 lessons and 16 reading packs.');
