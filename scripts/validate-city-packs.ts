import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WORLD_DESTINATIONS } from '../src/data/world-flight/destinations';

const EXPECTED_IDS = [
  'bangkok', 'tokyo', 'seoul', 'singapore', 'paris', 'london', 'new-york', 'cairo', 'dubai', 'sydney',
  'beijing', 'shanghai', 'berlin', 'moscow', 'istanbul', 'vancouver', 'toronto', 'mumbai', 'cape-town', 'rome',
  'rio-de-janeiro', 'mexico-city', 'buenos-aires', 'los-angeles', 'jakarta', 'lagos', 'hong-kong', 'amsterdam',
  'honolulu', 'miami', 'bogota', 'reykjavik', 'nairobi', 'lima', 'perth', 'auckland', 'suva', 'ulaanbaatar',
  'almaty', 'madrid', 'lisbon', 'dublin', 'dakar', 'recife', 'panama-city', 'santiago', 'addis-ababa', 'delhi',
  'manila', 'ho-chi-minh-city',
];
const BATCHES = [
  ['bangkok', 'tokyo', 'paris', 'cairo', 'rio-de-janeiro'],
  ['seoul', 'singapore', 'london', 'new-york', 'dubai'],
  ['sydney', 'beijing', 'shanghai', 'berlin', 'moscow'],
  ['istanbul', 'vancouver', 'toronto', 'mumbai', 'cape-town'],
  ['rome', 'mexico-city', 'buenos-aires', 'los-angeles', 'jakarta'],
  ['lagos', 'hong-kong', 'amsterdam', 'honolulu', 'miami'],
  ['bogota', 'reykjavik', 'nairobi', 'lima', 'perth'],
  ['auckland', 'suva', 'ulaanbaatar', 'almaty', 'madrid'],
  ['lisbon', 'dublin', 'dakar', 'recife', 'panama-city'],
  ['santiago', 'addis-ababa', 'delhi', 'manila', 'ho-chi-minh-city'],
];

const CLUE_KINDS = new Set([
  'weather', 'food', 'language', 'nature', 'landmark', 'culture', 'animal', 'sport', 'history', 'giveaway',
]);
const MODES = new Set(['world', 'topic', 'mystery', 'free']);
const CHALLENGES = new Set([
  'words-3', 'vote-reasons', 'debate-win', 'quiz-perfect', 'postcard', 'return-visit',
]);
const DATA_PATH = fileURLToPath(new URL('../src/data/world-flight/city-packs.json', import.meta.url));
const errors: string[] = [];

function fail(message: string): void {
  errors.push(message);
}

function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function containsPhrase(text: string, phrase: unknown): boolean {
  if (typeof phrase !== 'string') return false;
  const escaped = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  if (!escaped) return false;
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu').test(text);
}

function lucideExportName(icon: string): string {
  return icon.replace(/(^|[-_\s]+)([a-z])/g, (_match, _separator: string, letter: string) => letter.toUpperCase());
}

function checkText(text: unknown, label: string, maxWords: number): text is string {
  if (typeof text !== 'string' || !text.trim()) {
    fail(`${label}: expected non-empty text`);
    return false;
  }
  if (wordCount(text) > maxWords) fail(`${label}: ${wordCount(text)} words exceeds ${maxWords}`);
  return true;
}

let packs: unknown;
try {
  packs = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
} catch (error) {
  console.error(`Could not read ${DATA_PATH}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

if (!isRecord(packs)) {
  console.error('City packs must be a JSON object keyed by destination id.');
  process.exit(1);
}

const actualIds = Object.keys(packs);
const batchArg = process.argv.indexOf('--batch');
let checkIds = EXPECTED_IDS;
if (batchArg >= 0) {
  const batchNumber = Number(process.argv[batchArg + 1]);
  if (!Number.isInteger(batchNumber) || batchNumber < 1 || batchNumber > BATCHES.length) {
    console.error(`--batch must be a number from 1 to ${BATCHES.length}`);
    process.exit(1);
  }
  checkIds = BATCHES[batchNumber - 1];
} else {
  for (const id of EXPECTED_IDS) if (!(id in packs)) fail(`Missing destination: ${id}`);
}
for (const id of actualIds) if (!EXPECTED_IDS.includes(id)) fail(`Unexpected destination: ${id}`);
for (const id of checkIds) if (!(id in packs)) fail(`Missing destination in validation scope: ${id}`);

const destinations = new Map(WORLD_DESTINATIONS.map((destination) => [destination.id, destination]));
if (EXPECTED_IDS.some((id) => !destinations.has(id))) fail('destinations.ts is missing one or more expected destination records');

let lucideExports: Record<string, unknown>;
try {
  // Resolve from the invoking repository so the script also works when the checkout has no local install.
  const repoRequire = createRequire(path.resolve(process.cwd(), 'package.json'));
  lucideExports = repoRequire('lucide-react') as Record<string, unknown>;
} catch (error) {
  console.error(`Could not load lucide-react from this repository: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const souvenirIds = new Set<string>();
let souvenirCount = 0;
let reviewCount = 0;

for (const id of checkIds) {
  const pack = packs[id];
  if (!isRecord(pack)) {
    fail(`${id}: pack must be an object`);
    continue;
  }
  if (pack.id !== id) fail(`${id}: id field must equal its key`);
  const destination = destinations.get(id);
  const cityNames = new Set<string>([destination?.city ?? '', id.replaceAll('-', ' ')]);
  if (id === 'new-york') cityNames.add('New York City');
  if (id === 'ho-chi-minh-city') cityNames.add('Ho Chi Minh City');
  if (id === 'rio-de-janeiro') cityNames.add('Rio');

  if (!Array.isArray(pack.mysteryClues) || pack.mysteryClues.length !== 6) {
    fail(`${id}: mysteryClues must contain exactly 6 clues`);
  } else {
    const kinds = new Set<string>();
    pack.mysteryClues.forEach((clue: unknown, index: number) => {
      const label = `${id} clue ${index + 1}`;
      if (!isRecord(clue)) {
        fail(`${label}: expected an object`);
        return;
      }
      if (clue.order !== index + 1) fail(`${label}: order must be ${index + 1}`);
      if (typeof clue.kind !== 'string' || !CLUE_KINDS.has(clue.kind)) fail(`${label}: unknown kind`);
      else kinds.add(clue.kind);
      if (checkText(clue.text, label, 28)) {
        if (index === 5 && clue.kind !== 'giveaway') fail(`${label}: clue 6 must be giveaway`);
        if (index < 5) {
          for (const cityName of Array.from(cityNames)) {
            if (cityName && containsPhrase(clue.text, cityName)) fail(`${label}: names the city (${cityName})`);
          }
          if (index < 4) {
            if (destination?.country && containsPhrase(clue.text, destination.country)) {
              fail(`${label}: names the country (${destination.country})`);
            }
            const attractions = destination?.travelAnchors?.attractions ?? [];
            for (const attraction of attractions) {
              if (containsPhrase(clue.text, attraction.name)) {
                fail(`${label}: names travel-anchor attraction (${attraction.name}); famous named places belong in clues 5–6`);
              }
            }
          }
        }
      }
    });
    const firstFiveKinds = new Set(pack.mysteryClues.slice(0, 5).map((clue: unknown) => isRecord(clue) ? clue.kind : undefined).filter(Boolean));
    if (firstFiveKinds.size < 4) fail(`${id}: clues 1–5 must use at least 4 different kinds`);
    if (kinds.size < 4) fail(`${id}: clue kinds are invalid or too few`);
  }

  if (!Array.isArray(pack.souvenirs) || pack.souvenirs.length !== 5) {
    fail(`${id}: souvenirs must contain exactly 5 items`);
  } else {
    souvenirCount += pack.souvenirs.length;
    const earnTypes = new Map<string, number>();
    for (const [index, souvenir] of Array.from(pack.souvenirs.entries())) {
      const label = `${id} souvenir ${index + 1}`;
      if (!isRecord(souvenir)) {
        fail(`${label}: expected an object`);
        continue;
      }
      if (typeof souvenir.id !== 'string' || !souvenir.id.startsWith(`${id}-`)) {
        fail(`${label}: id must start with ${id}-`);
      } else if (souvenirIds.has(souvenir.id)) fail(`${label}: duplicate id ${souvenir.id}`);
      else souvenirIds.add(souvenir.id);
      if (typeof souvenir.name !== 'string' || wordCount(souvenir.name) < 2 || wordCount(souvenir.name) > 4) {
        fail(`${label}: name must contain 2–4 words`);
      }
      if (checkText(souvenir.description, `${label} description`, 22)) {
        if (!souvenir.description.trim().endsWith('.')) fail(`${label}: description must be one sentence ending in a period`);
      }
      if (!isRecord(souvenir.earn) || typeof souvenir.earn.type !== 'string') {
        fail(`${label}: missing earn type`);
      } else {
        const type = souvenir.earn.type;
        earnTypes.set(type, (earnTypes.get(type) ?? 0) + 1);
        if (!['land', 'mode', 'challenge', 'rare'].includes(type)) fail(`${label}: unknown earn type ${type}`);
        if (type === 'mode' && !MODES.has(souvenir.earn.mode)) fail(`${label}: unknown mode ${souvenir.earn.mode}`);
        if (type === 'challenge' && !CHALLENGES.has(souvenir.earn.challenge)) fail(`${label}: unknown challenge ${souvenir.earn.challenge}`);
      }
      if (typeof souvenir.icon !== 'string' || !(lucideExportName(souvenir.icon) in lucideExports)) {
        fail(`${label}: icon is not a lucide-react export`);
      }
      if (typeof souvenir.artPrompt !== 'string' || !souvenir.artPrompt.startsWith('sticker-style')) {
        fail(`${label}: artPrompt must start with "sticker-style"`);
      }
    }
    if (earnTypes.get('land') !== 1) fail(`${id}: must have exactly one land souvenir`);
    if (!earnTypes.has('mode')) fail(`${id}: must have at least one mode souvenir`);
    if (earnTypes.get('challenge') !== 2) fail(`${id}: must have exactly two challenge souvenirs`);
    const challenges = pack.souvenirs
      .filter((souvenir: unknown) => isRecord(souvenir) && isRecord(souvenir.earn) && souvenir.earn.type === 'challenge')
      .map((souvenir: Record<string, any>) => souvenir.earn.challenge);
    if (challenges.length === 2 && challenges[0] === challenges[1]) fail(`${id}: challenge souvenirs must use different challenges`);
    if (earnTypes.get('rare') !== 1) fail(`${id}: must have exactly one rare souvenir`);
  }

  if (!Array.isArray(pack.postcardPrompts) || pack.postcardPrompts.length !== 3) {
    fail(`${id}: postcardPrompts must contain exactly 3 prompts`);
  } else {
    pack.postcardPrompts.forEach((prompt: unknown, index: number) => {
      const label = `${id} postcard prompt ${index + 1}`;
      if (checkText(prompt, label, 18) && destination) {
        const referencesCity = Array.from(cityNames).some((cityName) => cityName && containsPhrase(prompt, cityName));
        const anchors = [
          ...(destination.travelAnchors?.attractions ?? []).map((item) => item.name),
          ...(destination.travelAnchors?.dishes ?? []).map((item) => item.name),
          ...(destination.travelAnchors?.transport ?? []).map((item) => item.mode),
        ];
        if (!referencesCity && !anchors.some((anchor) => containsPhrase(prompt, anchor))) {
          fail(`${label}: must mention the city or a travel anchor`);
        }
      }
    });
  }

  if (!Array.isArray(pack.localWords) || pack.localWords.length !== 3) {
    fail(`${id}: localWords must contain exactly 3 words`);
  } else {
    pack.localWords.forEach((entry: unknown, index: number) => {
      const label = `${id} local word ${index + 1}`;
      if (!isRecord(entry)) {
        fail(`${label}: expected an object`);
        return;
      }
      for (const field of ['word', 'language', 'meaning', 'say']) {
        if (typeof entry[field] !== 'string' || !entry[field].trim()) fail(`${label}: missing ${field}`);
      }
    });
  }

  if (typeof pack.needsReview !== 'boolean') fail(`${id}: needsReview must be a boolean`);
  else if (pack.needsReview) reviewCount += 1;
  if (typeof pack.reviewNotes !== 'string') fail(`${id}: reviewNotes must be a string`);
  if (pack.needsReview === true && !pack.reviewNotes.trim()) fail(`${id}: reviewNotes is required when needsReview is true`);
}

console.log(`Cities done: ${actualIds.filter((id) => EXPECTED_IDS.includes(id)).length} / 50`);
console.log(`Souvenirs total: ${souvenirCount}`);
console.log(`Needs review: ${reviewCount}`);
if (errors.length) {
  console.error(`\n${errors.length} validation error(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('City pack validation passed.');
