// scripts/classify-library-genres.ts
// One-time (idempotent) LLM classification of curated library sources into a semantic
// genre, written back into the *-library.json files. The app's fit-tagging reads this
// stored genre (via resolveSourceGenre) and falls back to a heuristic when absent — so
// running this just upgrades accuracy; nothing breaks if it hasn't run.
//
// Run locally (needs the AI key from .env.local):
//   npm run classify-genres            # all library files, only entries missing a genre
//   npm run classify-genres -- ted     # just ted-library.json
//   npm run classify-genres -- --force # re-classify everything
//
// Mirrors the genre taxonomy + intent of src/lib/preset-fit.ts (SourceGenre).

import * as fs from 'fs';
import * as path from 'path';
import { generateJSON } from '../src/lib/ai';
import type { AISchema } from '../src/lib/ai';
import type { SourceGenre } from '../src/lib/preset-fit';

// ── Load .env.local ────────────────────────────────────────────────────────────
(function loadEnvLocal() {
  const envFile = path.join(path.resolve('.'), '.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
})();

interface LibraryEntry {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  topicTags?: string[];
  genre?: SourceGenre;
  [k: string]: unknown;
}

const GENRES: SourceGenre[] = ['opinion', 'discussion', 'expository', 'narrative', 'travelogue', 'how-to', 'dialogue'];

const schema: AISchema = {
  type: 'object',
  properties: { genre: { type: 'string', enum: GENRES } },
  required: ['genre'],
};

function buildPrompt(entry: LibraryEntry): string {
  return `Classify this English-lesson source into ONE genre, based on what the source *is* (its rhetorical type), not its topic.

Title: ${entry.title}
${entry.description ? `Description: ${entry.description}` : ''}
${entry.summary ? `Summary: ${entry.summary.slice(0, 600)}` : ''}
${entry.topicTags?.length ? `Topic tags: ${entry.topicTags.join(', ')}` : ''}

Genres:
- opinion: argues a position / persuades / has two credible sides (suits a debate lesson)
- discussion: cultural or experiential; invites sharing views and reactions, not strongly one-sided (suits open speaking)
- expository: neutrally explains, informs, or teaches about a topic — INCLUDING general tutorials and "how things work" explainers (the all-round default; most educational content)
- narrative: tells a story or a personal account
- travelogue: a place or travel, OR a functional real-world situation a traveller/customer handles — directions, getting around, ordering, booking, checking in, asking for help
- how-to: specifically about an ENGLISH LANGUAGE form or rule — grammar, tenses, sentence structure, pronunciation. NOT general "how to do X" content (that is expository)
- dialogue: an interview or conversation between people

Return JSON: { "genre": "<one of the genres>" }`;
}

async function classifyEntry(entry: LibraryEntry): Promise<SourceGenre | null> {
  try {
    const { genre } = await generateJSON<{ genre: string }>(buildPrompt(entry), schema);
    return GENRES.includes(genre as SourceGenre) ? (genre as SourceGenre) : null;
  } catch (err) {
    console.warn(`  ! classify failed for "${entry.title}": ${(err as Error).message}`);
    return null;
  }
}

// Small concurrency pool so we don't hammer the API.
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.find((a) => !a.startsWith('--'));

  const dataDir = path.join(path.resolve('.'), 'src', 'data');
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith('-library.json'))
    .filter((f) => !only || f.startsWith(only));

  if (files.length === 0) {
    console.error(`No matching library files${only ? ` for "${only}"` : ''}.`);
    process.exit(1);
  }

  let totalClassified = 0;
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const entries = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as LibraryEntry[];
    const pending = entries.filter((e) => force || !e.genre);
    if (pending.length === 0) {
      console.log(`= ${file}: all ${entries.length} already classified`);
      continue;
    }
    console.log(`→ ${file}: classifying ${pending.length}/${entries.length}…`);
    const genres = await mapPool(pending, 5, classifyEntry);
    pending.forEach((entry, idx) => {
      if (genres[idx]) { entry.genre = genres[idx]!; totalClassified++; }
    });
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
    console.log(`  ✓ ${file}: wrote ${genres.filter(Boolean).length} genres`);
  }
  console.log(`\nDone — classified ${totalClassified} entries.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
