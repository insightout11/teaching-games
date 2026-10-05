/** Read-only caption audit for authoring Round 13 questions and words. */
import fs from 'node:fs';
import path from 'node:path';
import { createServiceClient } from '../src/lib/supabase/service';
import { listeningWindow, type ListeningPack } from '../src/lib/listening-pack';

const groups = [
  { file: 'bigthink-library.json', sourceType: 'bigthink' },
  { file: 'kids-library.json', sourceType: 'kids' },
  { file: 'listening-library.json', sourceType: 'listening' },
  { file: 'teded-library.json', sourceType: 'teded' },
  { file: 'world-flight-library.json', sourceType: 'world-flight' },
];
type Entry = { id: string; title: string; cefr: string; ageBand: string; listeningPack?: ListeningPack };
const all = groups.flatMap((group) =>
  (JSON.parse(fs.readFileSync(path.join('src/data', group.file), 'utf8')) as Entry[])
    .filter((entry) => entry.listeningPack)
    .map((entry) => ({ ...entry, sourceType: group.sourceType })));
const from = Math.max(0, Number(process.argv[2] ?? 1) - 1);
const count = Math.max(1, Math.min(60, Number(process.argv[3] ?? 5)));

async function main() {
  const selected = all.slice(from, from + count);
  const client = createServiceClient();
  for (const entry of selected) {
    const { data, error } = await client.from('source_extractions')
      .select('raw_transcript').eq('source_type', entry.sourceType).eq('source_key', entry.id).maybeSingle();
    if (error) throw new Error(error.message);
    const window = listeningWindow(entry.listeningPack!, entry.ageBand === 'kids' && (entry.cefr === 'A1' || entry.cefr === 'A2'));
    const captions = data?.raw_transcript ? JSON.parse(data.raw_transcript) as Array<{ text: string; offset: number }> : [];
    console.log(`\n# ${all.indexOf(entry) + 1} ${entry.id} | ${entry.cefr} ${entry.ageBand} | ${window.start}-${window.end}s | ${entry.title}`);
    console.log('DETAIL:', entry.listeningPack!.segments.map((segment) => segment.question).join(' / '));
    console.log(captions.filter((part) => part.offset / 1000 >= window.start && part.offset / 1000 < window.end)
      .map((part) => `${(part.offset / 1000).toFixed(1)} ${String(part.text).replace(/\s+/g, ' ').trim()}`).join('\n'));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
