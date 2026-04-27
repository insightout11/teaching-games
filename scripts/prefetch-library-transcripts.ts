// scripts/prefetch-library-transcripts.ts
// Two-phase enrichment script for the curated TED / TED-Ed video library.
//
// IMPORTANT: Run locally — YouTube's caption API blocks cloud IPs (Vercel).
//
// Usage:
//   npm run prefetch-transcripts
//
// Both phases are idempotent. Re-running is always safe:
//   Phase A: fetch YouTube transcript → skip if raw_transcript already set
//   Phase B: AI enrichment            → skip if difficulty already set

import * as fs from 'fs';
import * as path from 'path';
import { createServiceClient } from '../src/lib/supabase/service';
import { YoutubeTranscript } from 'youtube-transcript';
import { generateJSON } from '../src/lib/ai';
import type { AISchema } from '../src/lib/ai';

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
  summary: string;
  youtubeId?: string | null;
  transcriptUrl?: string | null;
  durationSecs: number;
};

type EnrichmentResult = {
  summary: string;
  difficulty: 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced' | 'Expert';
  key_vocabulary: string[];
  topic_tags: string[];
  lesson_fit_tags: string[];
  grammar_features: string[];
  accent: string;
  content_flags: string[];
};

// ── AI schema ─────────────────────────────────────────────────────────────────

const enrichmentSchema: AISchema = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: '400-word teaching summary. Highlight key vocabulary in **bold**. End with 2 discussion questions.',
    },
    difficulty: {
      type: 'string',
      enum: ['Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'],
      description: 'Overall language difficulty of the talk for English learners.',
    },
    key_vocabulary: {
      type: 'array',
      items: { type: 'string' },
      description: '8–15 key vocabulary items students would learn from this talk.',
    },
    topic_tags: {
      type: 'array',
      items: { type: 'string' },
      description: '3–6 specific topic tags (lowercase, hyphenated, e.g. "climate-change", "neuroscience").',
    },
    lesson_fit_tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lesson activity types this talk suits. Choose from: discussion, debate, critical-thinking, listening-practice, reading-input, vocabulary-focus, grammar-focus, presentation-skills, creative-writing.',
    },
    grammar_features: {
      type: 'array',
      items: { type: 'string' },
      description: 'Prominent grammar structures. Choose from: passive_voice, conditionals, reported_speech, relative_clauses, modal_verbs, perfect_tenses, narrative_past, comparatives.',
    },
    accent: {
      type: 'string',
      enum: ['american', 'british', 'australian', 'mixed', 'unknown'],
      description: "Speaker's English accent variety.",
    },
    content_flags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Content sensitivity flags for classroom use (e.g. "political", "mature_themes", "violence"). Return empty array if none.',
    },
  },
  required: ['summary', 'difficulty', 'key_vocabulary', 'topic_tags', 'lesson_fit_tags', 'grammar_features', 'accent', 'content_flags'],
};

// ── DB helpers (avoids upsert + partial index conflict) ───────────────────────

async function dbGetRow(sourceType: string, sourceKey: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('source_extractions')
    .select('id, raw_transcript, difficulty')
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

// ── BBC transcript scraper ────────────────────────────────────────────────────
//
// BBC Learning English transcript pages embed the script as plain HTML paragraphs
// inside one of several container elements. We try each known selector in order
// and take the first one that yields >200 chars of text.
//
// Known containers (verified against live pages where possible):
//   .widget-richtext  — most 6 Minute English episodes
//   .lc-wide          — some older episode formats
//   #media-asset-page — fallback for some series pages
//
// Run `npm run prefetch-transcripts -- --probe <url>` to test selectors locally.

const BBC_SELECTORS = [
  // Matches: <div class="...widget-richtext...">...</div>
  /class="[^"]*widget-richtext[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  // Matches: <div class="...lc-wide...">...</div>
  /class="[^"]*\blc-wide\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  // Matches: <section class="...script...">...</section>
  /class="[^"]*\bscript\b[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
  // Matches: <div id="media-asset-page...">...</div>  (greedy enough to get full body)
  /id="media-asset-page[^"]*"[^>]*>([\s\S]{200,10000}?)<\/div>/i,
];

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function scrapeBBCTranscript(transcriptUrl: string): Promise<string> {
  const res = await fetch(transcriptUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`BBC_FETCH_FAILED:${res.status}`);
  const html = await res.text();

  for (const selector of BBC_SELECTORS) {
    const match = html.match(selector);
    if (match?.[1]) {
      const text = stripHtmlTags(match[1]);
      if (text.length > 200) return text.slice(0, 60000);
    }
  }

  throw new Error('BBC_NO_TRANSCRIPT_FOUND — no known selector matched. Run --probe to debug.');
}

// ── Phase A: Transcript fetch ─────────────────────────────────────────────────

async function fetchTranscript(
  sourceType: string,
  entry: LibraryEntry,
): Promise<'ok' | 'skip' | 'no-id' | 'fail'> {
  // BBC entries use transcriptUrl for website scraping instead of YouTube captions
  if (entry.transcriptUrl) {
    return fetchBBCTranscript(sourceType, entry);
  }

  if (!entry.youtubeId) {
    console.log(`  NO-ID  [${sourceType}] ${entry.id}`);
    return 'no-id';
  }

  try {
    const existing = await dbGetRow(sourceType, entry.id);
    if (existing?.raw_transcript) {
      console.log(`  SKIP   [${sourceType}] ${entry.id}`);
      return 'skip';
    }

    const segments = await YoutubeTranscript.fetchTranscript(entry.youtubeId);
    const plainText = segments.map((s) => s.text).join(' ').trim();

    if (!plainText) {
      console.log(`  EMPTY  [${sourceType}] ${entry.id}`);
      return 'fail';
    }

    const record = {
      source_type: sourceType,
      source_key: entry.id,
      title: `${entry.title} — ${entry.speaker}`,
      // Placeholder summary — overwritten by Phase B AI enrichment
      summary: plainText.slice(0, 500),
      raw_transcript: JSON.stringify(segments),
      duration_secs: entry.durationSecs,
      transcript_quality: 'youtube_captions',
      approved_for_library: true,
    };

    if (existing) {
      await dbUpdate(existing.id, record);
    } else {
      await dbInsert(record);
    }

    console.log(`  OK     [${sourceType}] ${entry.id} — ${segments.length} segments`);
    return 'ok';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  FAIL   [${sourceType}] ${entry.id} — ${msg}`);
    return 'fail';
  }
}

// ── BBC Phase A: website scrape ───────────────────────────────────────────────

async function fetchBBCTranscript(
  sourceType: string,
  entry: LibraryEntry,
): Promise<'ok' | 'skip' | 'fail'> {
  try {
    const existing = await dbGetRow(sourceType, entry.id);
    if (existing?.raw_transcript) {
      console.log(`  SKIP   [${sourceType}] ${entry.id}`);
      return 'skip';
    }

    const text = await scrapeBBCTranscript(entry.transcriptUrl!);

    const record = {
      source_type: sourceType,
      source_key: entry.id,
      title: `${entry.title} — ${entry.speaker}`,
      summary: text.slice(0, 500),
      raw_transcript: text,
      duration_secs: entry.durationSecs,
      transcript_quality: 'bbc_website',
      approved_for_library: true,
    };

    if (existing) {
      await dbUpdate(existing.id, record);
    } else {
      await dbInsert(record);
    }

    console.log(`  OK     [${sourceType}] ${entry.id} — ${text.length} chars (bbc_website)`);
    return 'ok';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  FAIL   [${sourceType}] ${entry.id} — ${msg}`);
    return 'fail';
  }
}

// ── Phase B: AI enrichment ────────────────────────────────────────────────────

async function enrichEntry(
  sourceType: string,
  entry: LibraryEntry,
): Promise<'ok' | 'skip' | 'no-transcript' | 'fail'> {
  try {
    const row = await dbGetRow(sourceType, entry.id);

    if (!row?.raw_transcript) {
      console.log(`  NO-TRANSCRIPT  [${sourceType}] ${entry.id}`);
      return 'no-transcript';
    }

    if (row.difficulty) {
      console.log(`  SKIP   [${sourceType}] ${entry.id}`);
      return 'skip';
    }

    // Parse transcript and get plain text (up to 4000 chars)
    let transcriptText = '';
    try {
      const segments = JSON.parse(row.raw_transcript) as Array<{ text: string }>;
      transcriptText = segments.map((s) => s.text).join(' ').slice(0, 4000);
    } catch {
      transcriptText = row.raw_transcript.slice(0, 4000);
    }

    const prompt = `You are creating teaching metadata for an EFL/ESL classroom video resource.

TALK: "${entry.title}" by ${entry.speaker}
DURATION: ${Math.round(entry.durationSecs / 60)} minutes

PRE-WRITTEN SUMMARY (authoritative description of the talk):
${entry.summary}

TRANSCRIPT EXCERPT (use for vocabulary and grammar feature detection):
${transcriptText}

Based on the above, generate teaching metadata for this video. Be specific and accurate.
For difficulty: assess the actual language level of the SPEAKER (vocabulary complexity, sentence structure, speed of delivery implied by transcript density).
For key_vocabulary: extract words actually used in the talk that students would need to learn, not generic words.
For grammar_features: identify structures prominently used, not all possible structures.
For lesson_fit_tags and topic_tags: be specific, not generic.`;

    const result = await generateJSON<EnrichmentResult>(prompt, enrichmentSchema, {
      taskClass: 'bulk-generation',
      temperature: 0.3,
    });

    await dbUpdate(row.id, {
      summary: result.summary,
      difficulty: result.difficulty,
      key_vocabulary: result.key_vocabulary,
      topic_tags: result.topic_tags,
      lesson_fit_tags: result.lesson_fit_tags,
      grammar_features: result.grammar_features,
      accent: result.accent,
      content_flags: result.content_flags,
    });

    console.log(`  OK     [${sourceType}] ${entry.id} — ${result.difficulty}, ${result.key_vocabulary.length} vocab items`);
    return 'ok';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  FAIL   [${sourceType}] ${entry.id} — ${msg}`);
    return 'fail';
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // --probe <url>  — scrape a BBC page and print what each selector captures
  const probeIdx = args.indexOf('--probe');
  if (probeIdx !== -1) {
    const probeUrl = args[probeIdx + 1];
    if (!probeUrl) {
      console.error('Usage: npm run prefetch-transcripts -- --probe <bbc-url>');
      process.exit(1);
    }
    console.log(`\nProbing: ${probeUrl}\n`);
    const res = await fetch(probeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
    });
    if (!res.ok) { console.error(`Fetch failed: ${res.status}`); process.exit(1); }
    const html = await res.text();
    for (let i = 0; i < BBC_SELECTORS.length; i++) {
      const match = html.match(BBC_SELECTORS[i]);
      const extracted = match?.[1] ? stripHtmlTags(match[1]) : null;
      console.log(`Selector ${i + 1}: ${extracted ? `${extracted.length} chars — "${extracted.slice(0, 120)}..."` : 'NO MATCH'}`);
    }
    return;
  }

  const dataDir = path.join(path.resolve('.'), 'src', 'data');

  function loadLibrary(filename: string): LibraryEntry[] {
    return JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf-8')) as LibraryEntry[];
  }

  const entries = [
    ...loadLibrary('ted-library.json').map((e) => ({ ...e, sourceType: 'ted' as const })),
    ...loadLibrary('teded-library.json').map((e) => ({ ...e, sourceType: 'teded' as const })),
    ...loadLibrary('bbc-library.json').map((e) => ({ ...e, sourceType: 'bbc' as const })),
    ...loadLibrary('kurzgesagt-library.json').map((e) => ({ ...e, sourceType: 'kurzgesagt' as const })),
    ...loadLibrary('bbc-ideas-library.json').map((e) => ({ ...e, sourceType: 'bbc-ideas' as const })),
    ...loadLibrary('bigthink-library.json').map((e) => ({ ...e, sourceType: 'bigthink' as const })),
    ...loadLibrary('vox-library.json').map((e) => ({ ...e, sourceType: 'vox' as const })),
    ...loadLibrary('kids-library.json').map((e) => ({ ...e, sourceType: 'kids' as const })),
    ...loadLibrary('natgeo-library.json').map((e) => ({ ...e, sourceType: 'natgeo' as const })),
    ...loadLibrary('crash-course-library.json').map((e) => ({ ...e, sourceType: 'crash-course' as const })),
    ...loadLibrary('travel-english-library.json').map((e) => ({ ...e, sourceType: 'travel-english' as const })),
    ...loadLibrary('business-english-library.json').map((e) => ({ ...e, sourceType: 'business-english' as const })),
    ...loadLibrary('internet-memes-library.json').map((e) => ({ ...e, sourceType: 'internet-memes' as const })),
    ...loadLibrary('minecraft-library.json').map((e) => ({ ...e, sourceType: 'minecraft' as const })),
  ];

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`PHASE A — Transcript fetch (${entries.length} entries)`);
  console.log(`${'─'.repeat(50)}\n`);

  const phaseAStats = { ok: 0, skip: 0, noId: 0, fail: 0 };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    process.stdout.write(`[${i + 1}/${entries.length}] `);
    const result = await fetchTranscript(entry.sourceType, entry);
    phaseAStats[result === 'no-id' ? 'noId' : result]++;
    if (result !== 'skip' && result !== 'no-id') await sleep(1500);
  }

  console.log(`\nPhase A: fetched=${phaseAStats.ok}  skipped=${phaseAStats.skip}  no-id=${phaseAStats.noId}  failed=${phaseAStats.fail}`);

  if (phaseAStats.fail > 0) {
    console.log(`\n⚠  ${phaseAStats.fail} transcript fetch(es) failed — transcripts are disabled on YouTube for those videos.`);
    console.log(`   They will be skipped in Phase B. Remove them from the JSON library if permanently broken.\n`);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`PHASE B — AI enrichment (${entries.length} entries)`);
  console.log(`${'─'.repeat(50)}\n`);

  const phaseBStats = { ok: 0, skip: 0, noTranscript: 0, fail: 0 };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    process.stdout.write(`[${i + 1}/${entries.length}] `);
    const result = await enrichEntry(entry.sourceType, entry);
    if (result === 'no-transcript') phaseBStats.noTranscript++;
    else if (result === 'ok') phaseBStats.ok++;
    else if (result === 'skip') phaseBStats.skip++;
    else phaseBStats.fail++;
    // Sleep after every entry (not just skips) to stay within Gemini RPM limits
    if (result === 'fail') await sleep(8000); // extra backoff after rate-limit failures
    else if (result !== 'skip' && result !== 'no-transcript') await sleep(4000);
  }

  console.log(`\nPhase B: enriched=${phaseBStats.ok}  skipped=${phaseBStats.skip}  no-transcript=${phaseBStats.noTranscript}  failed=${phaseBStats.fail}`);

  const totalFails = phaseAStats.fail + phaseBStats.fail;
  if (totalFails > 0) {
    console.log(`\n✗  ${totalFails} total failure(s). Re-run the script to retry.\n`);
    process.exit(1);
  } else {
    console.log(`\n✓  All entries processed successfully.\n`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
