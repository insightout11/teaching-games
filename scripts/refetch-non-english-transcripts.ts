/**
 * Library transcripts that were saved in the wrong language.
 *
 * The library pre-fetch downloads YouTube's caption track for each video (free; it does not transcribe audio). For
 * some videos YouTube handed back a TRANSLATED track (Arabic, for example) and it was saved unchecked, so lessons
 * were built from text the class never hears. This script finds those rows and fetches the English track again,
 * saving it only if what comes back really is English.
 *
 *   tsx scripts/refetch-non-english-transcripts.ts            # dry run: list the rows and what could be fetched
 *   tsx scripts/refetch-non-english-transcripts.ts --write    # save the English transcripts
 *   tsx scripts/refetch-non-english-transcripts.ts --limit=5  # only the first few (either mode)
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run it from a home connection: YouTube blocks
 * caption requests from cloud servers. Videos with no English captions at all are listed at the end; those need
 * real speech-to-text, which is a separate (paid) job.
 */
import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { isUsableEnglishTranscript } from '../src/lib/source-context';

const write = process.argv.includes('--write');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) : Infinity;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase environment');
  const supabase = createClient(url, key);

  // Every library video's YouTube id, by library id.
  const youtubeIdFor = new Map<string, string>();
  const dataDir = join(__dirname, '..', 'src', 'data');
  for (const file of readdirSync(dataDir).filter((f) => f.endsWith('-library.json'))) {
    const parsed = JSON.parse(readFileSync(join(dataDir, file), 'utf-8')) as unknown;
    const items = Array.isArray(parsed) ? parsed : (Object.values(parsed as Record<string, unknown>).find(Array.isArray) as unknown[] | undefined) ?? [];
    for (const item of items as Array<{ id?: string; youtubeId?: string }>) if (item?.id && item.youtubeId) youtubeIdFor.set(item.id, item.youtubeId);
  }

  // All stored transcripts, in pages.
  const bad: Array<{ id: string; source_type: string; source_key: string; sample: string }> = [];
  let total = 0;
  for (let from = 0; ; from += 200) {
    const { data, error } = await supabase.from('source_extractions').select('id, source_type, source_key, raw_transcript').not('raw_transcript', 'is', null).range(from, from + 199);
    if (error) throw error;
    if (!data?.length) break;
    for (const row of data as Array<{ id: string; source_type: string; source_key: string; raw_transcript: string }>) {
      total += 1;
      if (!isUsableEnglishTranscript(row.raw_transcript)) bad.push({ id: row.id, source_type: row.source_type, source_key: row.source_key, sample: row.raw_transcript.slice(0, 60) });
    }
    if (data.length < 200) break;
  }
  console.log(`${total} stored transcripts; ${bad.length} are not usable English.\n`);

  const esmPath = 'youtube-transcript/dist/youtube-transcript.esm.js';
  const { YoutubeTranscript } = (await import(esmPath)) as typeof import('youtube-transcript');
  const stats = { fixed: 0, noEnglish: [] as string[], noVideoId: [] as string[] };

  for (const row of bad.slice(0, limit)) {
    const videoId = youtubeIdFor.get(row.source_key) ?? (row.source_type === 'youtube' ? row.source_key : undefined);
    if (!videoId) { stats.noVideoId.push(`${row.source_type}/${row.source_key}`); continue; }
    let english: Array<{ text: string }> | null = null;
    for (const lang of ['en', 'en-US', 'en-GB']) {
      try {
        const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });
        // Trust the words, not the label: YouTube can answer a request for English with a translated track.
        if (segments.length > 0 && isUsableEnglishTranscript(JSON.stringify(segments))) { english = segments; break; }
      } catch { /* try the next label */ }
    }
    if (!english) {
      stats.noEnglish.push(`${row.source_type}/${row.source_key} (${videoId})`);
      console.log(`  NO ENGLISH  ${row.source_type}/${row.source_key}`);
    } else {
      const words = english.map((s) => s.text).join(' ').split(/\s+/).length;
      if (write) {
        const { error } = await supabase.from('source_extractions').update({ raw_transcript: JSON.stringify(english), transcript_quality: 'youtube_captions' }).eq('id', row.id);
        if (error) { console.log(`  SAVE FAILED ${row.source_key}: ${error.message}`); continue; }
      }
      stats.fixed += 1;
      console.log(`  ${write ? 'SAVED ' : 'WOULD SAVE'}  ${row.source_type}/${row.source_key} (${words} words): "${english[0].text.slice(0, 50)}"`);
    }
    await sleep(1200);
  }

  console.log(`\n${write ? 'Saved' : 'Could save'} English for ${stats.fixed}. No English captions: ${stats.noEnglish.length}. Not a library video: ${stats.noVideoId.length}.`);
  if (stats.noEnglish.length) console.log(`\nNeed real speech-to-text:\n  ${stats.noEnglish.join('\n  ')}`);
  if (stats.noVideoId.length) console.log(`\nNo YouTube id found:\n  ${stats.noVideoId.join('\n  ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
