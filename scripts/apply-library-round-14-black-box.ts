/** Build timed Black Box passages from locally stored caption rows, no runtime fetch. */
import fs from 'node:fs';
import path from 'node:path';
import { createServiceClient } from '../src/lib/supabase/service';
import { listeningWindow, type ListeningPack } from '../src/lib/listening-pack';

type Pick = [string, number, number, string?, string[]?];
type Caption = { text: string; offset: number };
type Item = { id: string; cefr: string; ageBand: string; listeningPack?: ListeningPack & { static?: Array<{ target: string; swap: string }>; blackBox?: unknown } };
const selections = JSON.parse(fs.readFileSync('scripts/library-round-14-black-box-selections.json', 'utf8')) as Pick[];
const byId = new Map(selections.map((pick) => [pick[0], pick]));
const groups = [
  { file: 'bigthink-library.json', sourceType: 'bigthink' },
  { file: 'kids-library.json', sourceType: 'kids' },
  { file: 'listening-library.json', sourceType: 'listening' },
  { file: 'teded-library.json', sourceType: 'teded' },
  { file: 'world-flight-library.json', sourceType: 'world-flight' },
];
const stop = new Set(['about', 'after', 'again', 'also', 'always', 'another', 'around', 'back', 'been', 'before', 'being', 'both', 'could', 'does', 'doing', 'every', 'from', 'have', 'here', 'into', 'just', 'like', 'more', 'much', 'only', 'other', 'really', 'some', 'than', 'that', 'their', 'them', 'there', 'these', 'they', 'this', 'those', 'through', 'time', 'very', 'when', 'where', 'which', 'while', 'with', 'would', 'your', 'you', 'what', 'well', 'were', 'will', 'then', 'the', 'and', 'for', 'but', 'are', 'was', 'its', 'not', 'out', 'all', 'one', 'two', 'how', 'why', 'who', 'can', 'our', 'had', 'has', 'her', 'his', 'she', 'him', 'did', 'any', 'now', 'get', 'got', 'too', 'let', 'yet', 'yes', 'no', 'into', 'theyre', 'dont', 'were', 'been', 'said', 'say', 'says', 'look', 'looks', 'thing', 'things', 'people']);
const words = (s: string) => s.match(/[A-Za-z]+(?:['’][A-Za-z]+)?|\d+(?:[.,]\d+)*/g) || [];
const normalized = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
function clean(text: string) { return text.replace(/\[[^\]]+\]/g, ' ').replace(/>>/g, ' ').replace(/\s+/g, ' ').trim(); }

async function main() {
  const client = createServiceClient();
  const pending: Array<{ file: string; items: Item[] }> = [];
  const failures: string[] = [];
  let count = 0;
  for (const group of groups) {
    const file = path.join('src/data', group.file);
    const items = JSON.parse(fs.readFileSync(file, 'utf8')) as Item[];
    let changed = false;
    for (const item of items) {
      if (!item.listeningPack) continue;
      const pick = byId.get(item.id);
      if (!pick) continue;
      const [id, start, end, manual, manualDecoys] = pick;
      const kids = item.ageBand === 'kids' && (item.cefr === 'A1' || item.cefr === 'A2');
      const win = listeningWindow(item.listeningPack, kids);
      try {
        if (start < win.start || end > win.end || end <= start) throw new Error(`span ${start}-${end} outside ${win.start}-${win.end}`);
        const { data, error } = await client.from('source_extractions').select('raw_transcript')
          .eq('source_type', group.sourceType).eq('source_key', id).maybeSingle();
        if (error) throw new Error(error.message);
        if (!data?.raw_transcript) throw new Error('missing stored captions');
        const parts = JSON.parse(data.raw_transcript) as Caption[];
        const boundary = (seconds: number) => parts.findIndex((p) => Math.abs(p.offset / 1000 - seconds) < 0.2);
        const first = boundary(start);
        const last = boundary(end);
        if (first < 0 || last < 0 || last <= first) throw new Error(`caption boundaries not found: ${start}-${end}`);
        const excerpt = parts.slice(first, last)
          .map((p) => clean(p.text)).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        const passage = manual ? manual.replace(/\s+/g, ' ').trim() : excerpt;
        if (!normalized(excerpt).includes(normalized(passage))) throw new Error(`passage not an exact word sequence in selected captions: ${passage}`);
        const wordCount = words(passage).length;
        if (wordCount < (kids ? 10 : 15) || wordCount > (kids ? 20 : 35)) throw new Error(`passage has ${wordCount} words: ${passage}`);
        const used = new Set(words(passage).map((word) => normalized(word)));
        const candidates = [
          ...((item.listeningPack.words || []).map((w) => w.word)),
          ...((item.listeningPack.static || []).map((round) => round.swap)),
          ...((item.listeningPack.static || []).map((round) => round.target)),
          ...parts.filter((p) => p.offset / 1000 >= win.start && p.offset / 1000 < win.end)
            .flatMap((p) => words(clean(p.text))).filter((word) => word.length >= 4),
        ];
        const decoys: string[] = [];
        for (const candidate of manualDecoys || candidates) {
          if (words(candidate).length !== 1) continue;
          const norm = normalized(candidate);
          if (!norm || used.has(norm) || decoys.some((decoy) => normalized(decoy) === norm) || stop.has(norm)) continue;
          if (kids && candidate.length > 12) continue;
          decoys.push(candidate.toLowerCase());
          if (decoys.length === 6) break;
        }
        if (decoys.length !== 6) throw new Error(`only ${decoys.length} usable decoys`);
        item.listeningPack.blackBox = { passage, start, end, decoys };
        changed = true;
        count += 1;
        console.log(`# ${count} ${id} | ${wordCount} words | ${start}-${end} | ${passage} | decoys: ${decoys.join(', ')}`);
      } catch (error) {
        const message = `${id}: ${String(error)}`;
        failures.push(message);
        console.error(message);
      }
    }
    if (changed) pending.push({ file, items });
  }
  if (failures.length) throw new Error(`${failures.length} Black Box selections failed`);
  if (count !== selections.length) throw new Error(`${selections.length - count} selections not found`);
  if (process.argv.indexOf('--write') !== -1) for (const { file, items } of pending) fs.writeFileSync(file, JSON.stringify(items, null, 2) + '\n');
  console.log(`Black Box passages verified: ${count}.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
