// Re-derive richer topicTags for the local source library JSON files.
//
// Usage:
//   pnpm exec tsx scripts/enrich-library-topic-tags.ts --apply
//
// This intentionally does not fetch YouTube transcripts. It only uses the existing
// JSON metadata and, when available, prefetched source_extractions rows.

import * as fs from 'fs';
import * as path from 'path';
import { generateJSON } from '../src/lib/ai';
import type { AISchema } from '../src/lib/ai';
import { createServiceClient } from '../src/lib/supabase/service';

(function loadEnvLocal() {
  const envFile = path.join(path.resolve('.'), '.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
})();

type LibraryEntry = {
  id: string;
  title: string;
  speaker?: string;
  author?: string;
  topicTags?: string[];
  description?: string;
  summary?: string;
  durationSecs?: number;
  wordCount?: number;
  [key: string]: unknown;
};

type TagsResult = {
  topic_tags: string[];
};

const schema: AISchema = {
  type: 'object',
  properties: {
    topic_tags: {
      type: 'array',
      items: { type: 'string' },
      description: '6-10 lowercase, specific noun/topic tags for source-library matching.',
    },
  },
  required: ['topic_tags'],
};

const LIBRARIES: Array<{ filename: string; sourceType: string }> = [
  { filename: 'teded-library.json', sourceType: 'teded' },
  { filename: 'ted-library.json', sourceType: 'ted' },
  { filename: 'bbc-library.json', sourceType: 'bbc' },
  { filename: 'kurzgesagt-library.json', sourceType: 'kurzgesagt' },
  { filename: 'bbc-ideas-library.json', sourceType: 'bbc-ideas' },
  { filename: 'bigthink-library.json', sourceType: 'bigthink' },
  { filename: 'vox-library.json', sourceType: 'vox' },
  { filename: 'kids-library.json', sourceType: 'kids' },
  { filename: 'natgeo-library.json', sourceType: 'natgeo' },
  { filename: 'crash-course-library.json', sourceType: 'crash-course' },
  { filename: 'travel-english-library.json', sourceType: 'travel-english' },
  { filename: 'world-flight-library.json', sourceType: 'world-flight' },
  { filename: 'business-english-library.json', sourceType: 'business-english' },
  { filename: 'internet-memes-library.json', sourceType: 'internet-memes' },
  { filename: 'minecraft-library.json', sourceType: 'minecraft' },
  { filename: 'sports-library.json', sourceType: 'sports' },
  { filename: 'stories-library.json', sourceType: 'stories' },
  { filename: 'voa-library.json', sourceType: 'voa' },
  { filename: 'picture-books-library.json', sourceType: 'picture-books' },
];

function cleanTag(tag: string): string | null {
  const cleaned = tag
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned.length >= 3 ? cleaned : null;
}

function cleanTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of tags) {
    const tag = cleanTag(raw);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    cleaned.push(tag);
    if (cleaned.length === 10) break;
  }
  return cleaned;
}

function transcriptExcerpt(raw: string | null): string {
  if (!raw) return '';
  try {
    const segments = JSON.parse(raw) as Array<{ text?: string }>;
    return segments.map((s) => s.text ?? '').join(' ').slice(0, 2500);
  } catch {
    return raw.slice(0, 2500);
  }
}

async function existingExtraction(sourceType: string, sourceKey: string): Promise<{ summary: string | null; raw_transcript: string | null } | null> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('source_extractions')
    .select('summary, raw_transcript')
    .eq('source_type', sourceType)
    .eq('source_key', sourceKey)
    .maybeSingle();
  if (error) throw new Error(`source_extractions read failed for ${sourceType}/${sourceKey}: ${error.message}`);
  return data;
}

function buildPrompt(entry: LibraryEntry, sourceType: string, extraction: { summary: string | null; raw_transcript: string | null } | null): string {
  const creator = entry.speaker ?? entry.author ?? 'unknown';
  const transcript = transcriptExcerpt(extraction?.raw_transcript ?? null);
  return `Create source-library topic tags for ESL course-source matching.

Source type: ${sourceType}
Title: ${entry.title}
Creator: ${creator}
Existing tags: ${(entry.topicTags ?? []).join(', ') || 'none'}
Description: ${entry.description ?? ''}
Library summary: ${entry.summary ?? ''}
Prefetched extraction summary: ${extraction?.summary ?? ''}
Prefetched transcript excerpt: ${transcript}

Return 6-10 specific lowercase topic_tags. Prefer concrete subject nouns and noun phrases:
animals, wildlife, predators, wolves, ecosystems, job-interviews, resumes, tourism, airports.
Avoid filler or overly broad tags unless central: world, society, people, nature, science, culture,
relationships, sharing, efforts. Do not invent tags unsupported by the metadata.`;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const onlyArg = args.find((arg) => arg.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean)) : null;
  const dataDir = path.join(path.resolve('.'), 'src', 'data');

  let changed = 0;
  let processed = 0;

  for (const library of LIBRARIES) {
    const filePath = path.join(dataDir, library.filename);
    const entries = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as LibraryEntry[];
    let fileChanged = false;

    for (const entry of entries) {
      if (only && !only.has(entry.id)) continue;
      processed++;
      const extraction = await existingExtraction(library.sourceType, entry.id);
      const result = await generateJSON<TagsResult>(buildPrompt(entry, library.sourceType, extraction), schema, {
        taskClass: 'bulk-generation',
        temperature: 0.2,
      });
      const nextTags = cleanTags(result.topic_tags);
      if (nextTags.length < 6) throw new Error(`${library.sourceType}/${entry.id} returned too few tags: ${nextTags.join(', ')}`);
      if (JSON.stringify(entry.topicTags ?? []) !== JSON.stringify(nextTags)) {
        console.log(`${apply ? 'UPDATE' : 'WOULD'} ${library.filename} ${entry.id}: ${(entry.topicTags ?? []).join(', ')} -> ${nextTags.join(', ')}`);
        entry.topicTags = nextTags;
        changed++;
        fileChanged = true;
      } else {
        console.log(`OK ${library.filename} ${entry.id}`);
      }
    }

    if (apply && fileChanged) {
      fs.writeFileSync(filePath, `${JSON.stringify(entries, null, 2)}\n`);
    }
  }

  console.log(`${apply ? 'Applied' : 'Dry run'}: processed=${processed} changed=${changed}`);
  if (!apply) console.log('Re-run with --apply to write JSON files.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
