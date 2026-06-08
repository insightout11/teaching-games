// Prefetch transcript caches for World Flight destination-pack videos.
//
// Usage:
//   npm run prefetch-world-flight-transcripts -- --city tokyo
//   npm run prefetch-world-flight-transcripts -- --check-only
//
// This uses the same local YouTube transcript path as the curated library
// prefetcher because direct YouTube caption fetching is unreliable on Vercel.

import * as fs from 'fs';
import * as path from 'path';
import { YoutubeTranscript } from 'youtube-transcript';
import { WORLD_DESTINATIONS, WORLD_FLIGHT_MAX_VIDEO_DURATION_SECS } from '../src/data/world-flight/destinations';
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
    const raw = trimmed.slice(eq + 1).trim();
    const value = raw.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
})();

type TranscriptResult = {
  text: string;
  offset?: number;
  duration?: number;
  lang?: string;
};

type WorldFlightVideo = {
  cityId: string;
  focusId: string;
  title: string;
  summary: string;
  publisher: string;
  sourceUrl: string | undefined;
  sourceKey: string;
  duration: number | undefined;
};

async function dbGetRow(sourceType: string, sourceKey: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('source_extractions')
    .select('id, raw_transcript')
    .eq('source_type', sourceType)
    .eq('source_key', sourceKey)
    .maybeSingle();
  if (error) throw new Error(`DB select failed: ${error.message}`);
  return data;
}

async function dbInsert(record: Record<string, unknown>) {
  const supabase = createServiceClient();
  const { error } = await supabase.from('source_extractions').insert(record);
  if (error) throw new Error(`DB insert failed: ${error.message}`);
}

async function dbUpdate(id: string, fields: Record<string, unknown>) {
  const supabase = createServiceClient();
  const { error } = await supabase.from('source_extractions').update(fields).eq('id', id);
  if (error) throw new Error(`DB update failed: ${error.message}`);
}

function collectVideos(cityFilter?: string): WorldFlightVideo[] {
  return WORLD_DESTINATIONS
    .filter((destination) => !cityFilter || destination.id === cityFilter)
    .flatMap((destination) =>
      destination.focusOptions
        .filter((focus) => focus.kind === 'video' && focus.sourceMaterial.sourceType === 'youtube' && focus.sourceMaterial.sourceKey)
        .map((focus) => ({
          cityId: destination.id,
          focusId: focus.id,
          title: focus.sourceMaterial.title,
          summary: focus.sourceMaterial.summary,
          publisher: focus.publisher,
          sourceUrl: focus.sourceUrl,
          sourceKey: focus.sourceMaterial.sourceKey!,
          duration: focus.sourceMaterial.duration,
        })),
    );
}

async function prefetchVideo(video: WorldFlightVideo, checkOnly: boolean) {
  if (!video.duration || video.duration >= WORLD_FLIGHT_MAX_VIDEO_DURATION_SECS) {
    throw new Error(`INVALID_DURATION:${video.duration ?? 'missing'}s`);
  }

  const segments = await YoutubeTranscript.fetchTranscript(video.sourceKey) as TranscriptResult[];
  const text = segments.map((segment) => segment.text).join(' ').trim();
  if (!text) throw new Error('EMPTY_TRANSCRIPT');

  const lang = segments[0]?.lang ?? 'en';
  if (checkOnly) {
    console.log(`  OK     ${video.cityId}/${video.focusId} ${video.sourceKey} - ${segments.length} segments, lang:${lang}`);
    return;
  }

  const record = {
    source_type: 'youtube',
    source_key: video.sourceKey,
    title: video.title,
    summary: video.summary,
    raw_transcript: JSON.stringify(segments),
    duration_secs: video.duration ?? null,
    transcript_quality: 'youtube_captions',
    approved_for_library: true,
    topic_tags: ['world-flight', video.cityId],
    lesson_fit_tags: ['listening-practice', 'discussion'],
    metadata: {
      worldFlight: true,
      cityId: video.cityId,
      focusId: video.focusId,
      publisher: video.publisher,
      sourceUrl: video.sourceUrl,
      transcriptLanguage: lang,
      transcriptVerifiedAt: '2026-06-08',
    },
  };

  const existing = await dbGetRow('youtube', video.sourceKey);
  if (existing) {
    await dbUpdate(existing.id, record);
  } else {
    await dbInsert(record);
  }

  console.log(`  STORED ${video.cityId}/${video.focusId} ${video.sourceKey} - ${segments.length} segments, lang:${lang}`);
}

async function main() {
  const args = process.argv.slice(2);
  const cityIndex = args.indexOf('--city');
  const positionalCity = args.find((arg) => !arg.startsWith('-'));
  const npmCity = process.env.npm_config_city && process.env.npm_config_city !== 'true'
    ? process.env.npm_config_city
    : undefined;
  const cityFilter = cityIndex !== -1 ? args[cityIndex + 1] : npmCity ?? positionalCity;
  const checkOnly = args.includes('--check-only') || process.env.npm_config_check_only === 'true';
  const videos = collectVideos(cityFilter);

  if (videos.length === 0) {
    console.log(`No World Flight videos found${cityFilter ? ` for city "${cityFilter}"` : ''}.`);
    return;
  }

  console.log(`\nWorld Flight transcript prefetch (${videos.length} video${videos.length === 1 ? '' : 's'})`);
  if (cityFilter) console.log(`City: ${cityFilter}`);
  if (checkOnly) console.log('Mode: check only');
  console.log('');

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < videos.length; i += 1) {
    const video = videos[i];
    process.stdout.write(`[${i + 1}/${videos.length}] `);
    try {
      await prefetchVideo(video, checkOnly);
      ok += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  FAIL   ${video.cityId}/${video.focusId} ${video.sourceKey} - ${message}`);
      fail += 1;
    }
  }

  console.log(`\nAvailable: ${ok}  Failed: ${fail}\n`);
  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
