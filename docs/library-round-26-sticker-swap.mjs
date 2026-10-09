/** Replace Round 25 picture stand-ins after the nine requested stickers arrived. */
import fs from 'node:fs';

const dataDir = 'src/data';
const words = new Map(JSON.parse(fs.readFileSync(`${dataDir}/sticker-words.json`, 'utf8'))
  .map(({ id, word }) => [id, word]));
const questionFile = `${dataDir}/junior-picture-questions.json`;
const storyFile = `${dataDir}/junior-picture-stories.json`;
const sets = JSON.parse(fs.readFileSync(questionFile, 'utf8'));
const stories = JSON.parse(fs.readFileSync(storyFile, 'utf8'));

function replace(list, oldId, newId, where) {
  if (!words.has(newId)) throw new Error(`${where}: missing sticker ${newId}`);
  const index = list.indexOf(oldId);
  if (index < 0) {
    if (list.includes(newId)) return;
    throw new Error(`${where}: expected stand-in ${oldId}`);
  }
  list[index] = newId;
}
function question(id, oldId, newId, prompt) {
  const row = sets.flatMap((set) => set.questions).find((item) => item.id === id);
  if (!row) throw new Error(`Missing question ${id}`);
  replace(row.options, oldId, newId, id);
  if (row.answer === oldId) row.answer = newId;
  if (prompt) row.prompt = prompt;
  const labels = row.options.map((option) => words.get(option));
  const spoken = `${labels.slice(0, -1).join(', ')}, or ${labels.at(-1)}`;
  row.say = `${row.prompt} ${spoken.charAt(0).toUpperCase()}${spoken.slice(1)}?`;
}
function story(id, swaps) {
  const row = stories.find((item) => item.id === id);
  if (!row) throw new Error(`Missing story ${id}`);
  for (const { page, oldId, newId, word, text } of swaps) {
    replace(row.pages[page - 1].pictures, oldId, newId, `${id} page ${page}`);
    if (word) replace(row.words, word, newId, `${id} words`);
    if (text) row.pages[page - 1].text = text;
  }
}

question('dinosaurs-03', 'rock', 'dinosaur-footprint', 'Which picture shows an ancient track?');
question('fossils-01', 'rock', 'fossil', 'Which picture shows an ancient animal mark?');
question('fossils-05', 'rock', 'fossil');
question('planets-05', 'map', 'telescope', 'What helps us see distant planets?');
question('astronauts-08', 'map', 'astronaut-helmet');
question('volcanoes-02', 'fire', 'lava');
question('earthquakes-01', 'house', 'earthquake', 'Which picture shows the ground shaking?');
question('deserts-03', 'sand', 'sand-dune', 'Which picture shows a desert sand hill?');
question('festivals-around-the-world-01', 'flag', 'festival-lantern');

story('dino-tracks', [
  { page: 1, oldId: 'mud', newId: 'dinosaur-footprint', word: 'rock' },
  { page: 6, oldId: 'rock', newId: 'dinosaur-footprint' },
]);
story('shell-in-stone', [
  { page: 1, oldId: 'shell', newId: 'fossil', word: 'shovel' },
  { page: 3, oldId: 'rock', newId: 'fossil' },
]);
story('space-camera', [
  { page: 1, oldId: 'astronaut', newId: 'astronaut-helmet', word: 'moon' },
]);
story('volcano-walk', [
  { page: 3, oldId: 'volcano', newId: 'lava', word: 'water',
    text: 'Hot lava glows below a dark cloud.' },
]);
story('shaky-shelf', [
  { page: 1, oldId: 'classroom', newId: 'earthquake', word: 'flashlight' },
]);
story('camel-water', [
  { page: 1, oldId: 'sand', newId: 'sand-dune', word: 'sand' },
  { page: 6, oldId: 'sand', newId: 'sand-dune' },
]);
story('festival-drum', [
  { page: 1, oldId: 'flag', newId: 'festival-lantern', word: 'flag' },
]);
story('small-hero', [
  { page: 1, oldId: 'crown', newId: 'superhero-cape', word: 'crosswalk' },
]);

fs.writeFileSync(questionFile, JSON.stringify(sets, null, 2) + '\n');
fs.writeFileSync(storyFile, JSON.stringify(stories, null, 2) + '\n');
console.log('Swapped all nine requested stickers into Round 25 pictures.');
