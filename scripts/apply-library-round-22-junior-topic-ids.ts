/** Reviewed links from Junior quiz sets to Focus briefing IDs. */
import fs from 'node:fs';

const links: Record<string, string> = {
  animals: 'cats dogs horses elephants giraffes zebras lions tigers pandas koalas kangaroos penguins polar-bears dolphins whales sharks sea-turtles frogs butterflies bees',
  'pet-animals': 'cats dogs caring-for-pets',
  'farm-animals': 'horses',
  'wild-animals': 'elephants giraffes zebras lions tigers pandas koalas kangaroos polar-bears rainforests forests',
  'sea-animals': 'dolphins whales sharks sea-turtles oceans coral-reefs',
  'small-animals': 'frogs butterflies bees forests rainforests',
  food: 'cooking baking fruits vegetables breakfast school-lunch',
  fruit: 'fruits breakfast healthy-eating',
  vegetables: 'vegetables cooking plant-growth healthy-eating',
  breakfast: 'breakfast cooking baking healthy-eating',
  'body-parts': 'the-five-senses',
  clothes: 'fashion personal-style sustainable-fashion',
  'getting-dressed': 'fashion personal-style',
  weather: 'rain snow wind clouds rainbows seasons water-cycle',
  seasons: 'seasons snow rain plant-growth',
  home: '',
  'kitchen-things': 'cooking baking cooking-skills',
  'bathroom-things': 'the-five-senses water-conservation',
  'school-things': 'school-day classroom-rules homework study-habits',
  toys: 'board-games puzzles building-blocks kites playgrounds robots',
  transport: 'trains airplanes boats cycling public-transport',
  places: 'holidays jobs-people-do travel-planning',
  jobs: 'jobs-people-do future-jobs part-time-jobs career-skills',
  'family-time': 'family-traditions holidays birthday-parties',
  actions: '',
  feelings: 'making-friends friendship stress-management',
  'colours-of-things': 'drawing painting rainbows digital-art',
  sizes: '',
  'birthday-party': 'birthday-parties family-traditions',
  sports: 'soccer basketball swimming cycling running team-sports solo-sports fitness',
  nature: 'forests plant-growth mountains rivers oceans',
  opposites: '',
  'what-do-you-use': '',
  'where-do-you': 'travel-planning',
  'at-the-park': 'playgrounds running cycling making-friends urban-nature',
  'at-the-beach': 'oceans sea-turtles holidays',
  'music-and-art': 'musical-instruments drawing painting dancing music-genres live-music',
  bedtime: 'sleep-and-learning',
  'on-a-trip': 'holidays trains airplanes boats travel-planning',
  'in-the-garden': 'plant-growth butterflies bees forests',
};

const topicRows = JSON.parse(fs.readFileSync('src/data/topic-briefings.json', 'utf8')) as { id: string }[];
const bySuffix = new Map(topicRows.map((row) => [row.id.replace(/^topic-(?:kids|teens)-/, ''), row.id]));
const file = 'src/data/junior-picture-questions.json';
let text = fs.readFileSync(file, 'utf8');
const sets = JSON.parse(text) as { id: string; topic: string; topicIds?: string[] }[];
if (sets.length !== 40) throw new Error(`Expected 40 sets, found ${sets.length}`);
for (const set of sets) {
  if (!(set.id in links)) throw new Error(`No topic map for ${set.id}`);
  const ids = links[set.id].split(' ').filter(Boolean).map((suffix) => {
    const id = bySuffix.get(suffix);
    if (!id) throw new Error(`Unknown briefing suffix ${suffix} in ${set.id}`);
    return id;
  });
  const heading = `"id": "${set.id}",\\r?\\n    "topic": "${set.topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}",`;
  const pattern = set.topicIds === undefined
    ? new RegExp(`(${heading})(\\r?\\n)`)
    : new RegExp(`(${heading}\\r?\\n    "topicIds": )\\[[^\\]]*\\]`);
  if (!pattern.test(text)) throw new Error(`Could not locate topicIds for ${set.id}`);
  text = text.replace(pattern, set.topicIds === undefined
    ? `$1$2    "topicIds": ${JSON.stringify(ids)},$2`
    : `$1${JSON.stringify(ids)}`);
}
fs.writeFileSync(file, text);
console.log(`Added topicIds to ${sets.length} Junior sets.`);
