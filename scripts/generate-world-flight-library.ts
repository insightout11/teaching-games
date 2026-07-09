// Generate Course Builder library entries from reviewed World Flight video focuses.
//
// Usage:
//   pnpm exec tsx scripts/generate-world-flight-library.ts

import * as fs from 'fs';
import * as path from 'path';
import { WORLD_DESTINATIONS } from '../src/data/world-flight/destinations';

type WorldFlightLibraryEntry = {
  id: string;
  title: string;
  speaker: string;
  url: string;
  youtubeId: string;
  durationSecs: number;
  topicTags: string[];
  difficultyLevel: string;
  description: string;
  summary: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function tagify(value: string): string | null {
  const tag = slugify(value);
  return tag.length >= 3 ? tag : null;
}

function normalizeSkill(skill: string): string[] {
  const raw = skill.toLowerCase();
  const tags = [raw];
  if (raw.includes('food')) tags.push('food', 'cuisine', 'restaurants', 'markets');
  if (raw.includes('transport')) tags.push('transportation', 'public transport', 'getting around');
  if (raw.includes('history')) tags.push('history', 'heritage');
  if (raw.includes('culture')) tags.push('culture', 'traditions');
  if (raw.includes('art')) tags.push('art', 'museums');
  if (raw.includes('architecture')) tags.push('architecture', 'landmarks');
  if (raw.includes('environment')) tags.push('environment', 'climate');
  if (raw.includes('engineering')) tags.push('engineering', 'infrastructure');
  if (raw.includes('animals')) tags.push('animals', 'wildlife');
  if (raw.includes('music')) tags.push('music', 'performance');
  if (raw.includes('dance')) tags.push('dance', 'performance');
  if (raw.includes('younger learners')) tags.push('kids', 'young learners');
  return tags;
}

function titleTags(title: string): string[] {
  const lower = title.toLowerCase();
  const tags: string[] = [];
  if (lower.includes('metro') || lower.includes('subway') || lower.includes('underground')) {
    tags.push('metro', 'subway', 'public transport', 'transportation');
  }
  if (lower.includes('airport') || lower.includes('changi')) tags.push('airports', 'travel');
  if (lower.includes('food') || lower.includes('hawker') || lower.includes('restaurant') || lower.includes('coffee')) {
    tags.push('food culture', 'cuisine');
  }
  if (lower.includes('museum') || lower.includes('louvre') || lower.includes('prado')) tags.push('museums', 'art');
  if (lower.includes('canal') || lower.includes('river') || lower.includes('water')) tags.push('water', 'infrastructure');
  if (lower.includes('city') || lower.includes('capital')) tags.push('cities', 'city life');
  if (lower.includes('kids') || lower.includes('child-friendly')) tags.push('kids', 'young learners');
  return tags;
}

function cleanTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of tags) {
    const tag = tagify(raw);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    cleaned.push(tag);
    if (cleaned.length === 12) break;
  }
  return cleaned;
}

function entries(): WorldFlightLibraryEntry[] {
  return WORLD_DESTINATIONS.flatMap((destination) =>
    destination.focusOptions
      .filter((focus) => focus.kind === 'video' && focus.sourceMaterial.sourceType === 'youtube' && focus.sourceMaterial.sourceKey)
      .map((focus) => {
        const youtubeId = focus.sourceMaterial.sourceKey!;
        const sourceUrl = focus.sourceUrl ?? `https://www.youtube.com/watch?v=${youtubeId}`;
        const topicTags = cleanTags([
          'world-flight',
          'travel',
          'cities',
          'city life',
          'geography',
          destination.city,
          destination.country,
          ...focus.skills.flatMap(normalizeSkill),
          ...titleTags(focus.title),
        ]);

        return {
          id: `world-flight-${destination.id}-${focus.id}`,
          title: focus.title,
          speaker: focus.publisher ?? 'World Flight source',
          url: sourceUrl,
          youtubeId,
          durationSecs: focus.sourceMaterial.duration ?? 0,
          topicTags,
          difficultyLevel: focus.difficulty,
          description: focus.subtitle,
          summary: focus.sourceMaterial.summary,
        };
      }),
  );
}

const outPath = path.join(path.resolve('.'), 'src', 'data', 'world-flight-library.json');
fs.writeFileSync(outPath, `${JSON.stringify(entries(), null, 2)}\n`);
console.log(`Wrote ${outPath}`);
