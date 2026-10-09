/** Build and validate the Junior picture story bank. */
import fs from 'node:fs';
import path from 'node:path';

type Story = {
  id?: unknown; title?: unknown; level?: unknown; topicIds?: unknown; cast?: unknown;
  pages?: unknown; questions?: unknown; words?: unknown;
};
type Page = { text?: unknown; pictures?: unknown };
type Question = { prompt?: unknown; options?: unknown; answer?: unknown };
type Check = 'bankSize' | 'badStory' | 'duplicateId' | 'duplicateTitle' | 'badLevel' |
  'badTopicId' | 'badCast' | 'pageCount' | 'badPage' | 'sentenceLength' |
  'repeatedPage' | 'questionCount' | 'badQuestion' | 'badOption' |
  'badAnswer' | 'tooManyOpinions' | 'badWords';

const checks: Record<Check, number> = {
  bankSize: 0, badStory: 0, duplicateId: 0, duplicateTitle: 0, badLevel: 0,
  badTopicId: 0, badCast: 0, pageCount: 0, badPage: 0, sentenceLength: 0,
  repeatedPage: 0, questionCount: 0, badQuestion: 0, badOption: 0,
  badAnswer: 0, tooManyOpinions: 0, badWords: 0,
};
const errors: string[] = [];
function fail(check: Check, where: string, message: string): void {
  checks[check] += 1;
  errors.push(`${where}: ${message}`);
}
const dataDir = path.resolve('src/data');
const stickers = JSON.parse(fs.readFileSync(path.join(dataDir, 'sticker-words.json'), 'utf8')) as { id: string }[];
const stickerIds = new Set(stickers.map((row) => row.id));
const topics = JSON.parse(fs.readFileSync(path.join(dataDir, 'topic-briefings.json'), 'utf8')) as { id: string }[];
const topicIds = new Set(topics.map((row) => row.id));
const topicBySuffix = new Map(topics.map((row) => [row.id.replace(/^topic-(?:kids|teens)-/, ''), row.id]));
const file = path.join(dataDir, 'junior-picture-stories.json');

if (process.argv.includes('--build')) {
  const source = fs.readFileSync(path.resolve('docs/library-round-23-story-seeds.txt'), 'utf8');
  const blocks = source.trim().split(/\r?\n\s*\r?\n/);
  const built = blocks.map((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const header = lines[0].split('|').map((part) => part.trim());
    if (header.length !== 6 || lines.length !== 10) throw new Error(`Bad story seed block: ${lines[0]}`);
    const [id, title, level, topicField, castField, wordField] = header;
    const mappedTopics = topicField === '-' ? [] : topicField.split(' ').map((suffix) => {
      const found = topicBySuffix.get(suffix);
      if (!found) throw new Error(`${id}: unknown topic suffix ${suffix}`);
      return found;
    });
    const pages = lines.slice(1, 7).map((line) => {
      const [kind, text, pictures] = line.split('|').map((part) => part.trim());
      if (kind !== 'P' || !text || !pictures) throw new Error(`${id}: bad page ${line}`);
      return { text, pictures: pictures.split(' ') };
    });
    const questions = lines.slice(7).map((line) => {
      const [kind, prompt, options, answer] = line.split('|').map((part) => part.trim());
      if (kind !== 'Q' || !prompt || !options || !answer) throw new Error(`${id}: bad question ${line}`);
      return { prompt, options: options.split(' '), answer: answer === '-' ? null : answer };
    });
    return { id, title, level, topicIds: mappedTopics, cast: castField.split(' '), pages, questions,
      words: wordField.split(' ') };
  });
  fs.writeFileSync(file, JSON.stringify(built, null, 2) + '\n');
  console.log(`Built ${built.length} Junior picture stories from reviewed seeds.`);
}

let raw: unknown;
try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); }
catch (error) { fail('badStory', file, `cannot parse story bank: ${String(error)}`); raw = []; }
if (!Array.isArray(raw)) { fail('badStory', file, 'top-level value must be an array'); raw = []; }
const stories = raw as Story[];
const storyIds = new Set<string>();
const titles = new Set<string>();
const pageTexts = new Set<string>();
const usedStickers = new Set<string>();
const levels = { A1: 0, A2: 0 };
let pagesTotal = 0;

function checkSticker(value: unknown, check: Check, where: string): void {
  if (typeof value !== 'string' || !stickerIds.has(value)) fail(check, where, `unknown sticker id ${String(value)}`);
  else usedStickers.add(value);
}
function checkStickerList(value: unknown, check: Check, where: string, min: number, max: number): void {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    fail(check, where, `expected ${min}–${max} sticker IDs`);
    return;
  }
  if (new Set(value).size !== value.length) fail(check, where, 'duplicate sticker ID');
  for (const id of value) checkSticker(id, check, where);
}

for (const [index, story] of Array.from(stories.entries())) {
  const at = `story[${index}]`;
  if (!story || typeof story !== 'object' || Array.isArray(story) ||
      typeof story.id !== 'string' || !story.id.trim() ||
      typeof story.title !== 'string' || !story.title.trim()) {
    fail('badStory', at, 'id and title are required');
    continue;
  }
  if (storyIds.has(story.id)) fail('duplicateId', at, `duplicate id ${story.id}`);
  storyIds.add(story.id);
  const titleKey = story.title.trim().toLowerCase();
  if (titles.has(titleKey)) fail('duplicateTitle', at, `duplicate title ${story.title}`);
  titles.add(titleKey);
  if (story.level === 'A1' || story.level === 'A2') levels[story.level] += 1;
  else fail('badLevel', at, 'level must be A1 or A2');
  if (!Array.isArray(story.topicIds)) fail('badTopicId', at, 'topicIds must be an array');
  else {
    if (new Set(story.topicIds).size !== story.topicIds.length) fail('badTopicId', at, 'duplicate topicId');
    for (const id of story.topicIds) if (typeof id !== 'string' || !topicIds.has(id)) {
      fail('badTopicId', at, `unknown topicId ${String(id)}`);
    }
  }
  checkStickerList(story.cast, 'badCast', `${at}.cast`, 1, 3);
  if (!Array.isArray(story.pages) || story.pages.length < 6 || story.pages.length > 8) {
    fail('pageCount', at, 'expected 6–8 pages');
  } else for (const [pageIndex, rawPage] of Array.from(story.pages.entries())) {
    const where = `${at}.pages[${pageIndex}]`;
    pagesTotal += 1;
    const page = rawPage as Page;
    if (!page || typeof page.text !== 'string' || !page.text.trim()) { fail('badPage', where, 'text is required'); continue; }
    const sentences = page.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((part) => part.trim()).filter(Boolean) || [];
    if (sentences.length < 1 || sentences.length > 2 || !/[.!?]$/.test(page.text.trim())) {
      fail('badPage', where, 'text must contain 1–2 complete sentences');
    }
    for (const sentence of sentences) if (sentence.split(/\s+/).filter(Boolean).length > 10) {
      fail('sentenceLength', where, `sentence exceeds ten words: ${sentence}`);
    }
    const key = page.text.trim().toLowerCase().replace(/\s+/g, ' ');
    if (pageTexts.has(key)) fail('repeatedPage', where, `page text repeats: ${page.text}`);
    pageTexts.add(key);
    checkStickerList(page.pictures, 'badPage', `${where}.pictures`, 1, 3);
  }
  if (!Array.isArray(story.questions) || story.questions.length !== 3) {
    fail('questionCount', at, 'expected exactly three questions');
  } else {
    let opinions = 0;
    for (const [questionIndex, rawQuestion] of Array.from(story.questions.entries())) {
      const where = `${at}.questions[${questionIndex}]`;
      const question = rawQuestion as Question;
      if (!question || typeof question.prompt !== 'string' || !question.prompt.trim()) {
        fail('badQuestion', where, 'prompt is required'); continue;
      }
      checkStickerList(question.options, 'badOption', `${where}.options`, 2, 4);
      if (question.answer === null) opinions += 1;
      else if (typeof question.answer !== 'string' || !Array.isArray(question.options) || !question.options.includes(question.answer)) {
        fail('badAnswer', where, 'answer must be an option or null');
      } else checkSticker(question.answer, 'badAnswer', where);
    }
    if (opinions > 1) fail('tooManyOpinions', at, 'at most one opinion question is allowed');
  }
  checkStickerList(story.words, 'badWords', `${at}.words`, 4, 6);
}
if (stories.length !== 40 || levels.A1 !== 20 || levels.A2 !== 20) {
  fail('bankSize', file, `expected 40 stories split 20/20, found ${stories.length} split ${levels.A1}/${levels.A2}`);
}
console.log(`Junior picture stories: ${stories.length} stories, ${pagesTotal} pages, A1 ${levels.A1}, A2 ${levels.A2}, ${usedStickers.size} distinct sticker IDs used.`);
console.log(`Junior story checks: ${Object.entries(checks).map(([key, value]) => `${key} ${value}`).join(', ')}.`);
if (errors.length) {
  console.error(`Junior story validation failed with ${errors.length} error(s):\n${errors.slice(0, 80).join('\n')}`);
  process.exitCode = 1;
} else console.log('Junior story validation passed.');
