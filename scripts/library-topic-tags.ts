/** Canonical topic tag spellings shared by normalization and validation. */
const aliases: Record<string, string> = {
  'outer-space': 'space',
  adaptations: 'adaptation',
  'animal-behaviour': 'animal-behavior',
  belongings: 'belonging',
  birthdays: 'birthday',
  brains: 'brain',
  careers: 'career',
  choices: 'choice',
  colors: 'color',
  colours: 'color',
  comparisons: 'comparison',
  descriptions: 'description',
  deserts: 'desert',
  festivals: 'festival',
  folktales: 'folktale',
  forests: 'forest',
  gardens: 'garden',
  inventions: 'invention',
  languages: 'language',
  measurements: 'measurement',
  observations: 'observation',
  opinions: 'opinion',
  'public-spaces': 'public-space',
  routines: 'routine',
  'social-skills': 'social-skills',
  'social-media': 'social-media',
  'fairy-tales': 'fairy-tale',
  'food-chains': 'food-chain',
  'weekends': 'weekend',
  zoos: 'zoo',
  fables: 'fable',
  rivers: 'river',
  mysteries: 'mystery',
  communities: 'community',
  homes: 'home',
  oceans: 'ocean',
  parties: 'party',
  memories: 'memory',
  possibilities: 'possibility',
  families: 'family',
  sounds: 'sound',
  sport: 'sports',
  teen: 'teens',
  place: 'places',
};

export function canonicalTopicTag(tag: string): string {
  const lower = tag.trim().toLowerCase();
  if (lower.indexOf('grammar:') === 0 || lower.indexOf('listening:') === 0) return lower;
  const normalized = lower.replace(/\s+/g, '-');
  return aliases[normalized] || normalized;
}
