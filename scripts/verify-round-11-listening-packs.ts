/** Verify every Round 11 keyLine and playback window against locally stored caption rows. */
import fs from 'node:fs';
import path from 'node:path';
import { createServiceClient } from '../src/lib/supabase/service';

type Segment = { start: number; end: number; keyLine: string };
type Entry = { id: string; listeningPack?: { segments: Segment[] } };
const groups = [
  { file: 'listening-library.json', sourceType: 'listening' },
  { file: 'kids-library.json', sourceType: 'kids' },
  { file: 'teded-library.json', sourceType: 'teded' },
  { file: 'world-flight-library.json', sourceType: 'world-flight' },
];

async function main() {
  const client = createServiceClient();
  let packs = 0;
  let checked = 0;
  const errors: string[] = [];
  for (const group of groups) {
    const entries = JSON.parse(fs.readFileSync(path.join('src/data', group.file), 'utf8')) as Entry[];
    const chosen = entries.filter((e) => e.listeningPack);
    for (let start = 0; start < chosen.length; start += 40) {
      const batch = chosen.slice(start, start + 40);
      const { data, error } = await client.from('source_extractions').select('source_key,raw_transcript')
        .eq('source_type', group.sourceType).in('source_key', batch.map((e) => e.id));
      if (error) throw new Error(error.message);
      const rows = new Map((data || []).map((r) => [r.source_key, r.raw_transcript]));
      for (const entry of batch) {
        packs += 1;
        const raw = rows.get(entry.id);
        if (!raw) { errors.push(`${entry.id}: missing stored transcript`); continue; }
        let captions: Array<{ text: string; offset: number; duration: number }>;
        try { captions = JSON.parse(raw); }
        catch { errors.push(`${entry.id}: invalid stored transcript`); continue; }
        for (const [index, segment] of Array.from(entry.listeningPack!.segments.entries())) {
          const matching = captions.find((c) => c.text === segment.keyLine);
          if (!matching) { errors.push(`${entry.id}[${index}]: keyLine is not an exact caption`); continue; }
          const captionStart = matching.offset / 1000;
          const captionEnd = (matching.offset + matching.duration) / 1000;
          if (segment.start > captionStart || segment.end < captionEnd) {
            errors.push(`${entry.id}[${index}]: ${segment.start}-${segment.end}s does not cover caption ${captionStart.toFixed(1)}-${captionEnd.toFixed(1)}s`);
            continue;
          }
          checked += 1;
        }
      }
    }
  }
  if (errors.length) {
    for (const error of errors) console.error(error);
    throw new Error(`${errors.length} listening pack verification error(s)`);
  }
  console.log(`Stored-caption verification passed: ${packs} packs, ${checked} exact keyLines inside playback windows.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
