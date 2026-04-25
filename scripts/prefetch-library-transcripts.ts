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

// ── Phase A: Transcript fetch ─────────────────────────────────────────────────

async function fetchTranscript(
  sourceType: string,
  entry: LibraryEntry,
): Promise<'ok' | 'skip' | 'no-id' | 'fail'> {
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
    // Sleep after every entry (not just successes) to stay within Gemini RPM limits
    if (result !== 'skip' && result !== 'no-transcript') await sleep(4000);
    else if (result === 'fail') await sleep(8000); // extra backoff after rate-limit fail
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
