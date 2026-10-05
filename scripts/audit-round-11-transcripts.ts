/** Read-only local audit of caption rows for Round 11 listening pack authoring. */
import fs from 'node:fs';
import path from 'node:path';
import { createServiceClient } from '../src/lib/supabase/service';

type Entry = { id: string; title: string; youtubeId?: string; cefr?: string; ageBand?: string; durationSecs?: number };
const groups = [
  { file: 'listening-library.json', sourceType: 'listening' },
  { file: 'kids-library.json', sourceType: 'kids' },
  { file: 'teded-library.json', sourceType: 'teded' },
  { file: 'world-flight-library.json', sourceType: 'world-flight' },
  { file: 'bigthink-library.json', sourceType: 'bigthink' },
];
const selected = process.argv[2];
const selectedIds = selected ? new Set(selected.split(',')) : null;
async function main() {
const client = createServiceClient();
for (const group of groups) {
  const entries = JSON.parse(fs.readFileSync(path.join('src/data', group.file), 'utf8')) as Entry[];
  const candidates = entries.filter((e) => e.youtubeId && e.durationSecs && e.durationSecs <= 240 && (!selectedIds || selectedIds.has(e.id)));
  const keys = candidates.map((e) => e.id);
  for (let start = 0; start < keys.length; start += 40) {
    const subset = keys.slice(start, start + 40);
    const { data, error } = await client.from('source_extractions')
      .select('source_key,raw_transcript').eq('source_type', group.sourceType).in('source_key', subset);
    if (error) throw new Error(error.message);
    const rows = new Map((data || []).map((r) => [r.source_key, r.raw_transcript]));
    for (const e of candidates.slice(start, start + 40)) {
      const raw = rows.get(e.id);
      if (!raw) continue;
      let segments: Array<Record<string, unknown>>;
      try { segments = JSON.parse(raw); } catch { continue; }
      if (!Array.isArray(segments) || !segments.length) continue;
      if (selectedIds) {
        console.log(`\n${e.id} | ${e.title} | ${e.cefr} | ${e.durationSecs}s`);
        for (const s of segments) {
          const sec = Number(s.offset) / 1000;
          if (Number.isFinite(sec)) console.log(`${sec.toFixed(1)} ${JSON.stringify(s.text)}`);
        }
      } else console.log(`${group.sourceType}\t${e.id}\t${e.cefr}\t${e.ageBand}\t${e.durationSecs}\t${segments.length}\t${e.title}`);
    }
  }
}
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
