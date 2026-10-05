/** Read-only check that each timed key word appears in a stored caption inside the listening window. */
import fs from 'node:fs';
import path from 'node:path';
import { createServiceClient } from '../src/lib/supabase/service';
import { listeningWindow, type ListeningPack } from '../src/lib/listening-pack';

type Entry = { id: string; cefr: string; ageBand: string; listeningPack?: ListeningPack };
const groups = [
  { file: 'bigthink-library.json', sourceType: 'bigthink' },
  { file: 'kids-library.json', sourceType: 'kids' },
  { file: 'listening-library.json', sourceType: 'listening' },
  { file: 'teded-library.json', sourceType: 'teded' },
  { file: 'world-flight-library.json', sourceType: 'world-flight' },
];
const normalize = (text: string) => text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

async function main() {
  const client = createServiceClient();
  const errors: string[] = [];
  let count = 0;
  for (const group of groups) {
    const entries = (JSON.parse(fs.readFileSync(path.join('src/data', group.file), 'utf8')) as Entry[])
      .filter((entry) => entry.listeningPack);
    for (let start = 0; start < entries.length; start += 40) {
      const batch = entries.slice(start, start + 40);
      const { data, error } = await client.from('source_extractions').select('source_key,raw_transcript')
        .eq('source_type', group.sourceType).in('source_key', batch.map((entry) => entry.id));
      if (error) throw new Error(error.message);
      const rows = new Map((data || []).map((row) => [row.source_key, row.raw_transcript]));
      for (const entry of batch) {
        const raw = rows.get(entry.id);
        if (!raw) { errors.push(`${entry.id}: no stored transcript`); continue; }
        const captions = JSON.parse(raw) as Array<{ text: string; offset: number }>;
        const window = listeningWindow(entry.listeningPack!, entry.ageBand === 'kids' && (entry.cefr === 'A1' || entry.cefr === 'A2'));
        for (const word of entry.listeningPack!.words || []) {
          count += 1;
          if (word.at === undefined || word.at < window.start || word.at >= window.end) {
            errors.push(`${entry.id}: ${word.word} at ${word.at} is outside ${window.start}-${window.end}s`);
            continue;
          }
          const matching = captions.find((caption) => Math.abs(caption.offset / 1000 - word.at!) <= 0.12
            && normalize(caption.text).includes(normalize(word.word)));
          if (!matching) {
            const alternatives = captions.filter((caption) => caption.offset / 1000 >= window.start
              && caption.offset / 1000 < window.end && normalize(caption.text).includes(normalize(word.word)))
              .map((caption) => (caption.offset / 1000).toFixed(1));
            errors.push(`${entry.id}: ${word.word} at ${word.at} not found in caption at that time; exact matches at ${alternatives.join(', ') || 'none'}`);
          }
        }
      }
    }
  }
  if (errors.length) {
    errors.forEach((error) => console.error(error));
    throw new Error(`${errors.length} timed-word verification error(s)`);
  }
  console.log(`Timed-word verification passed: ${count} words in exact stored caption lines and listening windows.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
