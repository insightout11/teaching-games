import fs from 'node:fs';
import path from 'node:path';

const countryPlaces: Record<string, { name: string; lat: number; lng: number }> = {
  china: { name: 'China', lat: 35.8617, lng: 104.1954 },
  egypt: { name: 'Egypt', lat: 26.8206, lng: 30.8025 },
  india: { name: 'India', lat: 20.5937, lng: 78.9629 },
  'south-africa': { name: 'South Africa', lat: -30.5595, lng: 22.9375 },
};
const titlePlaces: Record<string, { name: string; lat: number; lng: number }> = {
  'the secrets of ancient egypt': countryPlaces.egypt,
  'us and china vs climate change - 6 minute english': countryPlaces.china,
};

const dataDirectory = 'src/data';
const files = fs.readdirSync(dataDirectory).filter((file) => file.endsWith('-library.json'));
const updatedByCountry = new Map<string, number>();

for (const file of files) {
  const filePath = path.join(dataDirectory, file);
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;
  for (const item of items) {
    if (item.place) continue;
    const countryTag = (item.topicTags ?? []).find((tag: string) => countryPlaces[tag.toLowerCase()]);
    const place = countryTag ? countryPlaces[countryTag.toLowerCase()] : titlePlaces[item.title?.toLowerCase()];
    if (!place) continue;
    item.place = place;
    const key = countryTag?.toLowerCase() ?? 'title-matched';
    updatedByCountry.set(key, (updatedByCountry.get(key) ?? 0) + 1);
    changed = true;
  }
  if (changed) fs.writeFileSync(filePath, `${JSON.stringify(items, null, 2)}\n`);
}

for (const [country, count] of Array.from(updatedByCountry)) console.log(`${country}: added place metadata to ${count} tagged items`);
console.log(`Place metadata audit updated ${Array.from(updatedByCountry.values()).reduce((sum, count) => sum + count, 0)} items.`);
