/** Validate curated library JSON files, including the expanded item schema. */
import fs from 'node:fs';
import path from 'node:path';

type Item = {
  id?: unknown;
  title?: unknown;
  kind?: unknown;
  author?: unknown;
  speaker?: unknown;
  url?: unknown;
  youtubeId?: unknown;
  durationSecs?: unknown;
  wordCount?: unknown;
  summary?: unknown;
  images?: unknown;
  description?: unknown;
  topicTags?: unknown;
  genre?: unknown;
  difficultyLevel?: unknown;
  cefr?: unknown;
  ageBand?: unknown;
  place?: unknown;
  license?: unknown;
  attribution?: unknown;
  needsReview?: unknown;
};

const dataDir = path.resolve('src/data');
const files = fs.readdirSync(dataDir)
  .filter((file) => file.endsWith('-library.json'))
  .sort();
const errors: string[] = [];
const ids = new Map<string, string>();
const urls = new Map<string, string>();
const cefrValues = new Set(['A1', 'A2', 'B1', 'B2', 'C1']);
const ageBandValues = new Set(['kids', 'teens', 'all']);
const genres = new Set(['expository', 'narrative', 'news', 'opinion', 'poem', 'dialogue']);
const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;

function fail(where: string, message: string) {
  errors.push(`${where}: ${message}`);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateExpandedItem(item: Item, where: string) {
  if (!nonEmpty(item.title)) fail(where, 'title is required');
  if (!nonEmpty(item.description)) fail(where, 'description is required');
  if (!Array.isArray(item.topicTags) || item.topicTags.length === 0) fail(where, 'topicTags must be a non-empty array');
  if (!nonEmpty(item.difficultyLevel)) fail(where, 'difficultyLevel is required');
  if (!cefrValues.has(String(item.cefr))) fail(where, 'cefr must be A1, A2, B1, B2, or C1');
  if (!ageBandValues.has(String(item.ageBand))) fail(where, 'ageBand must be kids, teens, or all');
  if (typeof item.needsReview !== 'boolean') fail(where, 'needsReview must be a boolean');
  if (item.place !== null && item.place !== undefined) {
    const place = item.place as { name?: unknown; lat?: unknown; lng?: unknown };
    if (!nonEmpty(place.name) || typeof place.lat !== 'number' || typeof place.lng !== 'number') {
      fail(where, 'place must be null or include name, numeric lat, and numeric lng');
    }
  }

  if (item.kind === 'text' || item.kind === 'picture-book') {
    if (!nonEmpty(item.author)) fail(where, 'author is required for text items');
    if (!nonEmpty(item.url)) fail(where, 'url is required for text items');
    if (!nonEmpty(item.summary)) fail(where, 'full text summary is required');
    const words = String(item.summary).trim().split(/\s+/).filter(Boolean).length;
    if (typeof item.wordCount !== 'number' || item.wordCount !== words) {
      fail(where, `wordCount must equal the summary word count (${words})`);
    }
    if (words < 150 || words > 900) fail(where, `text must contain 150–900 words (found ${words})`);
    if (!nonEmpty(item.license) || !nonEmpty(item.attribution)) fail(where, 'license and attribution are required for text');
    else if (!/^(public domain|cc by(?:-sa)?)(?:\s|$)/i.test(item.license.trim())) {
      fail(where, 'license must be Public domain, CC BY, or CC BY-SA');
    }
    if (item.kind === 'picture-book') {
      if (!Array.isArray(item.images) || item.images.length === 0) fail(where, 'picture-book requires at least one image');
      else for (const [index, value] of Array.from(item.images.entries())) {
        const image = value as { url?: unknown; alt?: unknown; license?: unknown; attribution?: unknown };
        if (!nonEmpty(image.url) || !nonEmpty(image.alt)) fail(where, `images[${index}] requires url and alt`);
        if (!nonEmpty(image.license ?? item.license) || !nonEmpty(image.attribution ?? item.attribution)) {
          fail(where, `images[${index}] requires license and attribution (or item-level values)`);
        }
      }
    }
  } else if (item.kind === 'video') {
    if (!nonEmpty(item.author ?? item.speaker)) fail(where, 'author or speaker is required for video');
    if (!youtubeIdPattern.test(String(item.youtubeId ?? ''))) fail(where, 'youtubeId must be an 11-character YouTube ID');
    if (typeof item.durationSecs !== 'number' || item.durationSecs <= 0) fail(where, 'durationSecs must be positive');
    if (!nonEmpty(item.url)) fail(where, 'url is required for video');
    else if (!/^https?:\/\//i.test(item.url)) fail(where, 'video url must be http(s)');
  } else {
    fail(where, `kind must be text, video, or picture-book (found ${String(item.kind)})`);
  }
  if (!nonEmpty(item.genre) || !genres.has(item.genre)) fail(where, 'genre must be expository, narrative, news, opinion, poem, or dialogue');
}

for (const file of files) {
  const filePath = path.join(dataDir, file);
  let items: unknown;
  try {
    items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(file, `invalid JSON: ${String(error)}`);
    continue;
  }
  if (!Array.isArray(items)) {
    fail(file, 'top-level JSON value must be an array');
    continue;
  }

  for (const [index, raw] of Array.from(items.entries())) {
    const item = raw as Item;
    const where = `${file}[${index}]${nonEmpty(item.id) ? ` (${item.id})` : ''}`;
    if (!nonEmpty(item.id)) fail(where, 'id is required');
    else if (ids.has(item.id)) fail(where, `duplicate id also found in ${ids.get(item.id)}`);
    else ids.set(item.id, where);

    if (nonEmpty(item.url)) {
      const normalized = item.url.trim().replace(/\/$/, '').toLowerCase();
      if (urls.has(normalized)) fail(where, `duplicate URL also found in ${urls.get(normalized)}`);
      else urls.set(normalized, where);
    }

    // The current library contains legacy records. Apply the complete contract
    // to records explicitly migrated to the new schema; keep legacy records
    // participating in global ID/URL collision checks.
    if (item.kind !== undefined || item.cefr !== undefined || item.ageBand !== undefined || item.license !== undefined) {
      validateExpandedItem(item, where);
    }
  }
}

if (errors.length) {
  console.error(`Library validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Library validation passed: ${ids.size} items across ${files.length} files.`);
}
