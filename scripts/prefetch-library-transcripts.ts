// scripts/prefetch-library-transcripts.ts
// Pre-fetches real transcripts for all curated video library entries and stores
// them in the source_extractions table in Supabase.
//
// IMPORTANT: Run locally, NOT on Vercel — YouTube's caption API blocks cloud IPs.
//
// Usage:
//   npm run prefetch-transcripts
//
// The script is idempotent — entries that already have a raw_transcript are skipped.

import * as fs from 'fs';
import * as path from 'path';
import { createServiceClient } from '../src/lib/supabase/service';
import { YoutubeTranscript } from 'youtube-transcript';

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
    const raw = t.slice(eq + 1).trim();
    const val = raw.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
})();

// ── Types ─────────────────────────────────────────────────────────────────────

type LibraryEntry = {
  id: string;
  title: string;
  speaker: string;
  youtubeId?: string | null;
  durationSecs: number;
};

// ── Core prefetch ─────────────────────────────────────────────────────────────

async function prefetchEntry(
  sourceType: string,
  entry: LibraryEntry,
): Promise<'ok' | 'skip' | 'no-id' | 'fail'> {
  if (!entry.youtubeId) {
    console.log(`NO-ID  [${sourceType}] ${entry.id}`);
    return 'no-id';
  }

  const supabase = createServiceClient();

  // Already has a real transcript — skip
  const { data: existing } = await supabase
    .from('source_extractions')
    .select('raw_transcript')
    .eq('source_type', sourceType)
    .eq('source_key', entry.id)
    .single();

  if (existing?.raw_transcript) {
    console.log(`SKIP   [${sourceType}] ${entry.id}`);
    return 'skip';
  }

  try {
    const segments = await YoutubeTranscript.fetchTranscript(entry.youtubeId);
    const plainText = segments.map((s) => s.text).join(' ').trim();

    if (!plainText) {
      console.log(`EMPTY  [${sourceType}] ${entry.id} — transcript returned no text`);
      return 'fail';
    }

    const title = `${entry.title} — ${entry.speaker}`;

    await supabase.from('source_extractions').upsert(
      {
        source_type: sourceType,
        source_key: entry.id,
        title,
        // Use first 500 chars of transcript as placeholder summary.
        // The AI summary will be generated (and overwrite this) on first teacher selection.
        summary: plainText.slice(0, 500),
        raw_transcript: JSON.stringify(segments),
        duration_secs: entry.durationSecs,
      },
      { onConflict: 'source_type,source_key', ignoreDuplicates: false },
    );

    console.log(`OK     [${sourceType}] ${entry.id} — ${segments.length} segments`);
    return 'ok';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`FAIL   [${sourceType}] ${entry.id} — ${msg}`);
    return 'fail';
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const dataDir = path.join(path.resolve('.'), 'src', 'data');

  const tedLibrary = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'ted-library.json'), 'utf-8'),
  ) as LibraryEntry[];

  const tededLibrary = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'teded-library.json'), 'utf-8'),
  ) as LibraryEntry[];

  const entries = [
    ...tedLibrary.map((e) => ({ ...e, sourceType: 'ted' as const })),
    ...tededLibrary.map((e) => ({ ...e, sourceType: 'teded' as const })),
  ];

  console.log(`\nPrefetching transcripts for ${entries.length} library entries...\n`);

  const stats = { ok: 0, skip: 0, noId: 0, fail: 0 };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    process.stdout.write(`[${i + 1}/${entries.length}] `);
    const result = await prefetchEntry(entry.sourceType, entry);
    stats[result === 'no-id' ? 'noId' : result]++;

    // Pause between requests to avoid triggering YouTube rate limits
    if (result !== 'skip' && result !== 'no-id') await sleep(1500);
  }

  console.log(`\n──────────────────────────────`);
  console.log(`Fetched:  ${stats.ok}`);
  console.log(`Skipped:  ${stats.skip} (already had transcript)`);
  console.log(`No ID:    ${stats.noId}`);
  console.log(`Failed:   ${stats.fail}`);
  console.log(`──────────────────────────────\n`);

  if (stats.fail > 0) {
    console.log(`${stats.fail} entries failed. Re-run the script to retry them.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
