// scripts/audit-course-preset-sources.ts
// Read-only readiness check for Course Builder preset sources.
//
// Usage:
//   pnpm run audit-course-preset-sources
//
// Verifies every preset suggestedSource:
//   1. points to an entry in the local JSON library
//   2. has a source_extractions row in Supabase
//   3. has raw transcript + enrichment metadata required for source-grounded lessons

import * as fs from 'fs';
import * as path from 'path';
import { createServiceClient } from '../src/lib/supabase/service';
import { COURSE_PRESETS } from '../src/lib/course-presets';

import tedLibrary from '../src/data/ted-library.json';
import tededLibrary from '../src/data/teded-library.json';
import bbcLibrary from '../src/data/bbc-library.json';
import kurzgesagtLibrary from '../src/data/kurzgesagt-library.json';
import bbcIdeasLibrary from '../src/data/bbc-ideas-library.json';
import bigthinkLibrary from '../src/data/bigthink-library.json';
import voxLibrary from '../src/data/vox-library.json';
import kidsLibrary from '../src/data/kids-library.json';
import natgeoLibrary from '../src/data/natgeo-library.json';
import crashCourseLibrary from '../src/data/crash-course-library.json';
import travelEnglishLibrary from '../src/data/travel-english-library.json';
import worldFlightLibrary from '../src/data/world-flight-library.json';
import businessEnglishLibrary from '../src/data/business-english-library.json';
import internetMemesLibrary from '../src/data/internet-memes-library.json';
import minecraftLibrary from '../src/data/minecraft-library.json';
import sportsLibrary from '../src/data/sports-library.json';
import storiesLibrary from '../src/data/stories-library.json';
import voaLibrary from '../src/data/voa-library.json';
import pictureBooksLibrary from '../src/data/picture-books-library.json';

(function loadEnvLocal() {
  const envFile = path.join(path.resolve('.'), '.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim();
    const value = raw.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
})();

type LibraryEntry = {
  id: string;
  title: string;
  topicTags?: string[];
  summary?: string;
  description?: string;
  youtubeId?: string | null;
  transcriptUrl?: string | null;
};

type ExtractionRow = {
  id: string;
  raw_transcript: string | null;
  summary: string | null;
  difficulty: string | null;
  key_vocabulary: string[] | null;
  topic_tags: string[] | null;
  lesson_fit_tags: string[] | null;
  grammar_features: string[] | null;
  accent: string | null;
  content_flags: string[] | null;
};

type PresetSource = {
  presetTitle: string;
  lessonTitle: string;
  sourceType: string;
  id: string;
  title: string;
};

const libraries = new Map<string, LibraryEntry[]>([
  ['ted', tedLibrary],
  ['teded', tededLibrary],
  ['bbc', bbcLibrary],
  ['kurzgesagt', kurzgesagtLibrary],
  ['bbc-ideas', bbcIdeasLibrary],
  ['bigthink', bigthinkLibrary],
  ['vox', voxLibrary],
  ['kids', kidsLibrary],
  ['natgeo', natgeoLibrary],
  ['crash-course', crashCourseLibrary],
  ['travel-english', travelEnglishLibrary],
  ['world-flight', worldFlightLibrary],
  ['business-english', businessEnglishLibrary],
  ['internet-memes', internetMemesLibrary],
  ['minecraft', minecraftLibrary],
  ['sports', sportsLibrary],
  ['stories', storiesLibrary],
  ['voa', voaLibrary],
  ['picture-books', pictureBooksLibrary],
]);

const entryIndexes = new Map(
  Array.from(libraries.entries()).map(([sourceType, entries]) => [
    sourceType,
    new Map(entries.map((entry) => [entry.id, entry])),
  ]),
);

const extractionFields = [
  'raw_transcript',
  'summary',
  'difficulty',
  'key_vocabulary',
  'topic_tags',
  'lesson_fit_tags',
  'grammar_features',
  'accent',
  'content_flags',
] as const;

function collectPresetSources(): PresetSource[] {
  const sources: PresetSource[] = [];
  for (const preset of COURSE_PRESETS) {
    for (const lesson of preset.lessons) {
      const ref = lesson.suggestedSource;
      if (!ref) continue;
      sources.push({
        presetTitle: preset.title,
        lessonTitle: lesson.title,
        sourceType: ref.sourceType,
        id: ref.id,
        title: ref.title,
      });
    }
  }
  return sources;
}

function uniqueSources(sources: PresetSource[]): PresetSource[] {
  const seen = new Set<string>();
  const unique: PresetSource[] = [];
  for (const source of sources) {
    const key = `${source.sourceType}:${source.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(source);
  }
  return unique;
}

function missingExtractionFields(row: ExtractionRow): string[] {
  const missing: string[] = [];
  for (const field of extractionFields) {
    const value = row[field];
    if (value == null) {
      missing.push(field);
    } else if (Array.isArray(value) && value.length === 0 && field !== 'content_flags') {
      missing.push(field);
    } else if (typeof value === 'string' && value.trim().length === 0) {
      missing.push(field);
    }
  }
  return missing;
}

async function getExtraction(sourceType: string, sourceKey: string): Promise<ExtractionRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('source_extractions')
    .select('id, raw_transcript, summary, difficulty, key_vocabulary, topic_tags, lesson_fit_tags, grammar_features, accent, content_flags')
    .eq('source_type', sourceType)
    .eq('source_key', sourceKey)
    .maybeSingle();
  if (error) throw new Error(`source_extractions read failed for ${sourceType}/${sourceKey}: ${error.message}`);
  return data as ExtractionRow | null;
}

async function main() {
  const presetSources = collectPresetSources();
  const unique = uniqueSources(presetSources);
  const issues: string[] = [];
  const warnings: string[] = [];

  console.log(`Auditing ${presetSources.length} preset lesson source refs (${unique.length} unique sources).\n`);

  for (const source of unique) {
    const entry = entryIndexes.get(source.sourceType)?.get(source.id);
    const label = `${source.sourceType}/${source.id}`;

    if (!entry) {
      issues.push(`${label}: missing local JSON library entry`);
      console.log(`FAIL ${label} — missing local JSON library entry`);
      continue;
    }

    const entryMissing: string[] = [];
    if (!entry.title?.trim()) entryMissing.push('title');
    if (!entry.description?.trim()) entryMissing.push('description');
    if (!entry.summary?.trim()) entryMissing.push('summary');
    if (!entry.topicTags || entry.topicTags.length === 0) entryMissing.push('topicTags');
    if (entryMissing.length > 0) warnings.push(`${label}: local JSON missing ${entryMissing.join(', ')}`);

    const row = await getExtraction(source.sourceType, source.id);
    if (!row) {
      issues.push(`${label}: missing source_extractions row`);
      console.log(`FAIL ${label} — missing source_extractions row`);
      continue;
    }

    const missingFields = missingExtractionFields(row);
    if (missingFields.length > 0) {
      issues.push(`${label}: extraction missing ${missingFields.join(', ')}`);
      console.log(`FAIL ${label} — extraction missing ${missingFields.join(', ')}`);
      continue;
    }

    console.log(`OK   ${label}`);
  }

  if (issues.length > 0) {
    if (warnings.length > 0) {
      console.log(`\n${warnings.length} non-blocking warning(s):`);
      for (const warning of warnings) console.log(`- ${warning}`);
    }
    console.log(`\n${issues.length} readiness issue(s):`);
    for (const issue of issues) console.log(`- ${issue}`);
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} non-blocking warning(s):`);
    for (const warning of warnings) console.log(`- ${warning}`);
  }

  console.log('\nAll preset sources are library-ready.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
