/** Expand reviewed Round 25 seeds into the two existing Junior banks. */
import fs from 'node:fs';

const phase = process.argv[2];
if (phase !== 'task1' && phase !== 'task2') throw new Error('Use task1 or task2');
const dataDir = 'src/data';
const stickers = new Map(JSON.parse(fs.readFileSync(`${dataDir}/sticker-words.json`, 'utf8')).map((row) => [row.id, row.word]));
const topics = new Map(JSON.parse(fs.readFileSync(`${dataDir}/topic-briefings.json`, 'utf8')).map((row) => [row.id.replace(/^topic-(?:kids|teens)-/, ''), row.id]));
const blocks = (file) => fs.readFileSync(file, 'utf8').trim().split(/\r?\n\s*\r?\n/).map((block) => block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
const idsFor = (field, where) => field.split(' ').filter(Boolean).map((suffix) => {
  const id = topics.get(suffix);
  if (!id) throw new Error(`${where}: unknown topic suffix ${suffix}`);
  return id;
});

const questionFile = `${dataDir}/junior-picture-questions.json`;
let sets = JSON.parse(fs.readFileSync(questionFile, 'utf8'));
const newSets = blocks(`docs/library-round-25-questions-${phase}.txt`).map((lines, setIndex) => {
  if (lines.length !== 11) throw new Error(`Question seed needs 10 rows: ${lines[0]}`);
  const [id, topic, suffixes] = lines[0].split('|').map((part) => part.trim());
  if (!id || !topic || !suffixes) throw new Error(`Bad question heading: ${lines[0]}`);
  let objective = 0;
  const questions = lines.slice(1).map((line, index) => {
    const [prompt, answerField, optionField] = line.split('|').map((part) => part.trim());
    if (!prompt || !answerField || !optionField) throw new Error(`Bad question seed: ${line}`);
    const answer = answerField === '-' ? null : answerField;
    const options = optionField.split(',').map((part) => part.trim());
    if (answer !== null) {
      options.splice((objective + setIndex) % (options.length + 1), 0, answer);
      objective += 1;
    }
    const names = options.map((id) => {
      const word = stickers.get(id);
      if (!word) throw new Error(`${id}: unknown sticker in ${prompt}`);
      return word;
    });
    const spoken = names.length === 2 ? `${names[0]} or ${names[1]}` :
      `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}`;
    return { id: `${id}-${String(index + 1).padStart(2, '0')}`, prompt, options, answer,
      say: `${prompt} ${spoken.charAt(0).toUpperCase()}${spoken.slice(1)}?` };
  });
  return { id, topic, topicIds: idsFor(suffixes, id), questions };
});
const setIds = new Set(newSets.map((row) => row.id));
sets = sets.filter((row) => !setIds.has(row.id)).concat(newSets);
fs.writeFileSync(questionFile, JSON.stringify(sets, null, 2) + '\n');

const storyFile = `${dataDir}/junior-picture-stories.json`;
let stories = JSON.parse(fs.readFileSync(storyFile, 'utf8'));
const newStories = blocks(`docs/library-round-25-stories-${phase}.txt`).map((lines) => {
  const [id, title, level, suffixes, castField, wordsField] = lines[0].split('|').map((part) => part.trim());
  if (!id || !title || !level || !suffixes || !castField || !wordsField) throw new Error(`Bad story heading: ${lines[0]}`);
  const pageLines = lines.slice(1).filter((line) => line.startsWith('P|'));
  const questionLines = lines.slice(1).filter((line) => line.startsWith('Q|'));
  if (pageLines.length < 6 || pageLines.length > 8 || questionLines.length !== 3 || lines.length !== 1 + pageLines.length + questionLines.length) {
    throw new Error(`${id}: expected 6–8 pages and three questions`);
  }
  const pages = pageLines.map((line) => {
    const [, text, pictures] = line.split('|').map((part) => part.trim());
    if (!text || !pictures) throw new Error(`${id}: bad page ${line}`);
    return { text, pictures: pictures.split(' ') };
  });
  const questions = questionLines.map((line) => {
    const [, prompt, options, answer] = line.split('|').map((part) => part.trim());
    if (!prompt || !options || !answer) throw new Error(`${id}: bad question ${line}`);
    return { prompt, options: options.split(' '), answer: answer === '-' ? null : answer };
  });
  return { id, title, level, topicIds: idsFor(suffixes, id), cast: castField.split(' '), pages, questions,
    words: wordsField.split(' '), length: pages.length === 6 && pages.every((page) =>
      (page.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.filter(Boolean).length || 0) === 1) ? 'short' : 'standard' };
});
const storyIds = new Set(newStories.map((row) => row.id));
stories = stories.filter((row) => !storyIds.has(row.id)).concat(newStories);
fs.writeFileSync(storyFile, JSON.stringify(stories, null, 2) + '\n');
console.log(`Applied ${phase}: ${newSets.length} new question sets and ${newStories.length} new stories.`);
