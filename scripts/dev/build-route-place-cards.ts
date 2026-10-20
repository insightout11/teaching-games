/** Build checked, static cards. No AI/network calls. Source snapshots and original
 * editorial sentences live next to this script. Re-run after editorial review:
 * pnpm exec tsx --tsconfig tsconfig.json scripts/dev/build-route-place-cards.ts
 * Natural Earth: public domain. World Bank capital data: CC BY 4.0. Reference
 * Wikipedia pages are attributed per place; sentences here are original wording.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import recipe from './data/route-place-source-data.json';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

type Triple = [string, string, string];
const entries = new Map<string, Triple[]>();
for (const line of readFileSync('scripts/dev/data/route-place-editorial.tsv', 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.startsWith('#')) continue;
  const [title, text] = line.split('\t');
  if (!text || entries.has(title)) throw new Error('Missing/duplicate editorial entry: ' + title);
  const cards = text.split('~').map(part => part.split('^') as Triple);
  if (cards.some(c => c.length !== 3 || c.some(s => !s.trim()))) throw new Error('Invalid sentences: ' + title);
  entries.set(title, cards);
}
const sentence = (text: string) => text.replace(/[.!?]+$/, '') + '.';
const words = (text: string) => text.trim().split(/\s+/).length;
const shortName = (title: string) => title === 'United States of America' ? 'The United States' : title;
// Explicit editorial simplifications for A1; retain the fuller wording at B1.
const a1Phrases: Record<string, string> = {
  'Two tectonic plates push together here': 'Two huge rock plates push together here',
  'Two tectonic plates meet here': 'Two huge rock plates meet here',
  'They are part of a larger archipelago': 'They are part of a bigger island group',
  'This archipelago lies in Southeast Asia': 'These islands lie in Southeast Asia',
  'The Bijagós form an Atlantic archipelago': 'The Bijagós are Atlantic islands',
  'Rivers carried sediment onto the plain': 'Rivers carried mud onto the plain',
  'They deposited layers of sediment': 'They left layers of sand and mud',
  'Water supports intensive farming': 'Water helps farmers grow many crops',
  'The Baltic has relatively low salinity': 'The Baltic has less salt',
  'Salinity differs between areas': 'Some parts are saltier than others',
  'Coral reefs support marine habitats': 'Coral reefs are homes for sea animals',
  'Mountain valleys have different habitats': 'Different animals live in mountain valleys',
  'Mountain habitats change with height': 'Different animals live at different heights',
  'The highlands contain varied habitats': 'Many animals live in the highlands',
  'They provide habitat for wildlife': 'Wild animals live there',
  'Sand and sediment build beaches and islands': 'Sand and mud build beaches and islands',
  'Rivers carry sediment into coastal waters': 'Rivers carry mud towards the sea',
  'They provide varied wildlife habitats': 'They are homes for wild animals',
  'They affect temperatures and marine habitats': 'They change sea temperatures',
  'Building islands changes marine habitats': 'Building islands changes life in the sea',
  'It provides habitats within the urban region': 'Wild animals live inside the city',
  'Wild animals live within its habitats': 'Wild animals live there',
  'Dzanga-Sangha protects rainforest habitats': 'Dzanga-Sangha protects forests',
  'Wildlife uses these coastal habitats': 'Wild animals use these places',
  'Costa Rica protects many natural habitats': 'Costa Rica protects many wild places',
  'It is a huge drainage region': 'Many rivers flow through this area',
  'Suburban trains carry many commuters': 'Trains carry people to work',
  'Delhi is a large urban region': 'Delhi is a large city area',
  'Dubai Creek crosses older urban districts': 'Dubai Creek crosses older city areas',
  'Several rivers cross the urban area': 'Several rivers cross the city',
  'Mountains surround the urban area': 'Mountains surround the city',
  'Bridges connect its urban banks': 'Bridges join parts of the city',
  'Damascus has a long urban history': 'Damascus is a very old city',
  'Lumbini is a pilgrimage place': 'People visit Lumbini for their religion',
  'Kuwait has a maritime trading history': 'Kuwait traded goods by sea',
  'Builders fitted stones without mortar': 'Builders fitted stones without sticky cement',
  'Seven emirates form this federation': 'Seven places joined to make this country',
  'substantial rain': 'heavy rain', 'Monsoon winds influence the climate': 'Seasonal winds bring rain',
  'Tectonic activity shaped these islands': 'Moving rock plates shaped these islands',
  'extensive': 'large', 'distinctive': 'special', 'Tagus estuary': 'wide Tagus river mouth',
  'a wide estuary': 'a wide river mouth', 'rugged coasts': 'rocky coasts',
};
const a1Sentence = (text: string) => Object.keys(a1Phrases).reduce((s, phrase) => s.split(phrase).join(a1Phrases[phrase]), text);
const queryOverrides: Record<string, string> = { 'Georgia': 'Georgia Caucasus landscape', 'hills of southern China': 'southern China hills', 'forests of Scandinavia': 'Scandinavia forest landscape', 'Siberian taiga': 'Siberia taiga forest', 'Canadian boreal forest': 'Canada boreal forest', 'Central Lowlands': 'North America Central Lowlands', 'Palm Islands of Dubai': 'Palm Islands Dubai aerial', 'Appennino Ligure': 'Ligurian Apennines mountains' };

const bank = recipe.places.map(place => {
  const custom = entries.get(place.title);
  if (!custom) throw new Error('Editorial facts missing: ' + place.title);
  const name = shortName(place.title);
  let all: Triple[], junior: number[];
  if (place.country) {
    if (custom.length !== 2) throw new Error('Expected two editorial cards: ' + place.title);
    const c = place.country;
    const city = c.capital.replace(/D\.C\./g, 'DC');
    const people = c.population >= 1_000_000 ? Math.round(c.population / 100_000) * 100_000 : Math.round(c.population / 1000) * 1000;
    const lat = Math.abs(c.capitalLatitude), direction = c.capitalLatitude >= 0 ? 'north' : 'south';
    all = [
      [`${name} is in ${c.continent}`, `It is in ${c.subregion}`, `${city} is a city here`],
      [`${city} is a city here`, `It is in ${place.title}`, c.capitalNote ?? `${city} is near ${lat} degrees ${direction} of the equator`],
      [`About ${people.toLocaleString('en-US')} people lived here`, `That was the estimated population in ${c.populationYear}`, 'This is a dated estimate rather than today’s population'],
      ...custom,
    ];
    junior = [0, 1, 3, 4];
  } else { if (custom.length !== 5) throw new Error('Expected five editorial cards: ' + place.title); all = custom; junior = [0, 1, 2, 3]; }
  const titleWords = place.title.split(/\s+/);
  const destination = WORLD_DESTINATIONS.find(d => d.city === place.appTitle || (d.city === 'Bogota' && place.title === 'Bogotá'));
  const cityQuery = destination ? destination.country === place.title ? `${place.title} skyline` : `${place.title} ${destination.country === 'United States' ? 'USA' : destination.country}` : null;
  const picture = queryOverrides[place.title] ?? cityQuery ?? (titleWords.length < 5 ? place.title + ' landscape' : place.title);
  if (words(picture) < 2 || words(picture) > 5) throw new Error('Picture phrase: ' + place.title);
  const levels = Object.fromEntries(['A1','B1'].map(level => {
    const indices = level === 'A1' ? junior : [0,1,2,3,4];
    const cards = indices.map((index, order) => {
      const triple = level === 'A1' ? all[index].map(a1Sentence) : all[index], limit = level === 'A1' ? 8 : 14;
      if (words(triple[0]) > limit) throw new Error(`Headline exceeds ${limit} words: ${place.title}: ${triple[0]}`);
      const headline = triple[0];
      const detail = triple.slice(0, level === 'A1' ? 2 : 3).map(sentence).join(' ');
      const questions = level === 'A1'
        ? [['Would you like to visit?', 'What would you take?'], ['What would you like to see?', 'How would you travel there?'], ['What would you like to draw?', 'Would you go with your family?'], ['What do you like about this place?', 'What would you ask about it?']][order]
        : [['What makes this place different from your home?', 'How might its location affect daily life?'], ['What would you explore first, and why?', 'How could visitors learn from local people?'], ['What changes could affect people here?', 'What would you like to find out next?'], ['How would you describe this place to a visitor?', 'What should visitors take care to protect?'], ['Which fact surprised you most, and why?', 'How could a class show what is special here?']][order];
      return {headline,detail,questions,picture};
    });
    return [level,{briefing:`Let us explore ${place.title} together. Read the facts, look at the pictures, and share your own ideas.`,facts:cards.map(c=>c.headline),angles:cards[0].questions,vocab:[],expressions:[],cards}];
  }));
  return {id:'route-place-'+place.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),title:place.title,aliases:place.aliases,category:'geography',levels,sources:place.sources};
});
writeFileSync('src/data/route-place-briefings.json', JSON.stringify(bank,null,2)+'\n');
console.log(`Built ${bank.length} places, A1/B1 cards; no live lookup needed.`);
