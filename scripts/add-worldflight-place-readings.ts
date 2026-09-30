import fs from 'node:fs';
import { WORLD_DESTINATIONS } from '../src/data/world-flight/destinations';

const pageTitles: Record<string, string> = {
  bangkok: 'Bangkok',
  seoul: 'Seoul',
  singapore: 'Singapore',
  paris: 'Paris',
  london: 'London',
  cairo: 'Cairo',
  dubai: 'Dubai',
  sydney: 'Sydney',
  berlin: 'Berlin',
  moscow: 'Moscow',
  istanbul: 'Istanbul',
  vancouver: 'Vancouver',
  toronto: 'Toronto',
  rome: 'Rome',
  'rio-de-janeiro': 'Rio de Janeiro',
  'mexico-city': 'Mexico City',
  lagos: 'Lagos',
  amsterdam: 'Amsterdam',
  perth: 'Perth',
  madrid: 'Madrid',
  dublin: 'Dublin',
  dakar: 'Dakar',
  recife: 'Recife',
  santiago: 'Santiago',
  manila: 'Manila',
  'buenos-aires': 'Buenos Aires',
  jakarta: 'Jakarta',
  bogota: 'Bogotá',
  reykjavik: 'Reykjavík',
  auckland: 'Auckland',
  suva: 'Suva',
  ulaanbaatar: 'Ulaanbaatar',
  almaty: 'Almaty',
  lisbon: 'Lisbon',
  'panama-city': 'Panama City',
  'addis-ababa': 'Addis Ababa',
  'ho-chi-minh-city': 'Ho Chi Minh City',
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function trimAtSentence(text: string, maxWords = 450) {
  const sentences = text.trim().split(/(?<=[.!?])\s+/);
  let result = '';
  for (const sentence of sentences) {
    const next = `${result}${result ? ' ' : ''}${sentence}`;
    if (wordCount(next) > maxWords && wordCount(result) >= 150) break;
    result = next;
  }
  return result.trim();
}

async function getPage(title: string, introOnly: boolean) {
  const params = new URLSearchParams({
    action: 'query', prop: 'extracts|info', explaintext: '1', exsectionformat: 'plain',
    inprop: 'url', titles: title, format: 'json', formatversion: '2',
  });
  if (introOnly) params.set('exintro', '1');
  let response: Response | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
      headers: { 'User-Agent': 'LessonCaptain-library-expansion/1.0 (educational catalog)' },
    });
    if (response.status !== 429) break;
    const retryAfter = Number(response.headers.get('retry-after'));
    const waitSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 15 * (attempt + 1);
    console.warn(`Wikipedia rate limit for ${title}; retrying after ${waitSeconds}s.`);
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
  }
  if (!response?.ok) throw new Error(`Wikipedia API failed for ${title}: ${response?.status ?? 'no response'}`);
  const json = await response.json();
  const page = json.query?.pages?.[0];
  if (!page || page.missing || !page.extract || !page.fullurl || !page.lastrevid) {
    throw new Error(`Wikipedia page metadata or extract missing for ${title}`);
  }
  return page;
}

function destinationFor(entry: (typeof WORLD_DESTINATIONS)[number]) {
  return {
    name: `${entry.city}, ${entry.country}`,
    lat: entry.lat,
    lng: entry.lng,
  };
}

async function main() {
  const path = 'src/data/destination-reading-library.json';
  const existing = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : [];
  const existingIds = new Set(existing.map((entry: { id: string }) => entry.id));
  const destinations = Object.entries(pageTitles).map(([id, title]) => {
    const destination = WORLD_DESTINATIONS.find((candidate) => candidate.id === id);
    if (!destination) throw new Error(`World Flight destination not found: ${id}`);
    return { id, title, destination };
  });

  const newRecords = [];
  for (const { id, title, destination } of destinations) {
    if (existingIds.has(`destination-reading-${id}`)) continue;
    let page = await getPage(title, true);
    let text = page.extract.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
    if (wordCount(text) < 150) {
      page = await getPage(title, false);
      text = page.extract.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
    }
    text = trimAtSentence(text);
    const count = wordCount(text);
    if (count < 150 || count > 900) throw new Error(`Invalid source text length for ${title}: ${count}`);
    const url = `${page.fullurl}?oldid=${page.lastrevid}`;
    const cityTag = id;
    const countryTag = destination.country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    newRecords.push({
      id: `destination-reading-${id}`,
      title: `${destination.city}: A Place Profile`,
      kind: 'text',
      author: 'Wikipedia contributors',
      url,
      youtubeId: null,
      durationSecs: null,
      wordCount: count,
      summary: text,
      images: [],
      description: `An expository reading introduces ${destination.city} and its place in ${destination.country}.`,
      topicTags: ['world-flight', 'geography', 'cities', cityTag, countryTag],
      genre: 'expository',
      difficultyLevel: 'Intermediate',
      cefr: 'B2',
      ageBand: 'teens',
      place: destinationFor(destination),
      license: 'CC BY-SA 4.0',
      attribution: `Wikipedia contributors, “${title},” Wikipedia, CC BY-SA 4.0. This text is reproduced under the same license; source revision: ${url}`,
      needsReview: true,
    });
    console.log(`${destination.city}, ${destination.country}: ${count} words; source revision ${page.lastrevid}`);
    const partial = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : [];
    partial.push(newRecords[newRecords.length - 1]);
    fs.writeFileSync(path, `${JSON.stringify(partial, null, 2)}\n`);
    existingIds.add(`destination-reading-${id}`);
  }

  if (newRecords.length === 0 && !fs.existsSync(path)) fs.writeFileSync(path, `${JSON.stringify(existing, null, 2)}\n`);

  const libraryPath = 'src/data/world-flight-library.json';
  const worldFlight = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
  let placesAdded = 0;
  for (const item of worldFlight) {
    const match = WORLD_DESTINATIONS.find((destination) => {
      const tags = (item.topicTags ?? []).map((tag: string) => tag.toLowerCase());
      return tags.includes(destination.id) || item.title.toLowerCase().startsWith(`${destination.city.toLowerCase()} -`);
    });
    if (!match) throw new Error(`Could not match World Flight video to a destination: ${item.title}`);
    if (item.place && (item.place.lat !== match.lat || item.place.lng !== match.lng)) {
      throw new Error(`Conflicting place metadata on ${item.title}`);
    }
    item.place = { name: `${match.city}, ${match.country}`, lat: match.lat, lng: match.lng };
    placesAdded++;
  }
  fs.writeFileSync(libraryPath, `${JSON.stringify(worldFlight, null, 2)}\n`);
  console.log(`Added ${newRecords.length} place readings and verified place pins on ${placesAdded} World Flight videos.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
