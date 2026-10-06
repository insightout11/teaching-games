/** Apply hand-selected Static rounds after checking every sentence against stored captions. */
import fs from 'node:fs';
import path from 'node:path';
import { createServiceClient } from '../src/lib/supabase/service';
import { listeningWindow, type ListeningPack } from '../src/lib/listening-pack';

type Selection = [string, string, string];
type Pick = [string, Selection[]];
type Caption = { text: string; offset: number };
type Item = { id: string; cefr: string; ageBand: string; listeningPack?: ListeningPack & { static?: unknown } };
const picks = JSON.parse(fs.readFileSync('scripts/library-round-14-static-selections.json', 'utf8')) as Pick[];
const byId = new Map(picks);
const groups = [
  { file: 'bigthink-library.json', sourceType: 'bigthink' },
  { file: 'kids-library.json', sourceType: 'kids' },
  { file: 'listening-library.json', sourceType: 'listening' },
  { file: 'teded-library.json', sourceType: 'teded' },
  { file: 'world-flight-library.json', sourceType: 'world-flight' },
];
const stop = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'at', 'for', 'from', 'by', 'with', 'as', 'it', 'is', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did', 'i', 'you', 'we', 'they', 'he', 'she', 'this', 'that', 'these', 'those', 'my', 'your', 'our', 'their', 'his', 'her', 'its']);
const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/\b(?:uh|um|er)\b/g, ' ').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
function wordTokens(s: string) { return s.match(/[A-Za-z]+(?:['’][A-Za-z]+)?|\d+/g) || []; }

async function main() {
  const client = createServiceClient();
  let processed = 0;
  let rounds = 0;
  const failures: string[] = [];
  const pending: Array<{ file: string; items: Item[] }> = [];
  for (const group of groups) {
    const file = path.join('src/data', group.file);
    const items = JSON.parse(fs.readFileSync(file, 'utf8')) as Item[];
    let changed = false;
    for (const item of items) {
      if (!item.listeningPack) continue;
      const selections = byId.get(item.id);
      if (!selections) continue;
      if (selections.length !== 5) throw new Error(`${item.id}: need five selections`);
      const win = listeningWindow(item.listeningPack, item.ageBand === 'kids' && (item.cefr === 'A1' || item.cefr === 'A2'));
      const { data, error } = await client.from('source_extractions').select('raw_transcript')
        .eq('source_type', group.sourceType).eq('source_key', item.id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data?.raw_transcript) throw new Error(`${item.id}: no stored transcript`);
      const parts = JSON.parse(data.raw_transcript) as Caption[];
      const heard = norm(parts.filter((p) => p.offset / 1000 >= win.start && p.offset / 1000 < win.end)
        .map((p) => p.text.replace(/\[[^\]]+\]/g, ' ')).join(' '));
      const seen = new Set<string>();
      let built: Array<{ sentence: string; spoken: string; target: string; swap: string; options: string[]; correctIndex: number }>;
      try { built = selections.map(([sentence, target, swap], index) => {
        if (wordTokens(sentence).length > 14) throw new Error(`${item.id} round ${index + 1}: over 14 words`);
        if (!heard.includes(norm(sentence))) throw new Error(`${item.id} round ${index + 1}: sentence not in listening window: ${sentence}`);
        if (seen.has(norm(sentence))) throw new Error(`${item.id}: repeated Static sentence`);
        seen.add(norm(sentence));
        const targetPattern = new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        const hits = sentence.match(targetPattern) || [];
        if (hits.length !== 1) throw new Error(`${item.id} round ${index + 1}: target must occur once`);
        if (norm(target) === norm(swap)) throw new Error(`${item.id} round ${index + 1}: swap unchanged`);
        const tokens = wordTokens(sentence);
        const seenOptions = new Set<string>();
        const options = tokens.filter((t) => {
          const normalized = t.toLowerCase();
          if (normalized === target.toLowerCase() || seenOptions.has(normalized)) return false;
          seenOptions.add(normalized);
          return true;
        }).sort((a, b) => Number(stop.has(a.toLowerCase())) - Number(stop.has(b.toLowerCase())));
        if (options.length < 3) throw new Error(`${item.id} round ${index + 1}: fewer than three other words`);
        const rotation = (processed + index) % 4;
        const initial = [target, ...options.slice(0, 3)];
        const rotated = initial.slice(rotation).concat(initial.slice(0, rotation));
        const spoken = sentence.replace(targetPattern, swap);
        return { sentence, spoken, target, swap, options: rotated, correctIndex: rotated.indexOf(target) };
      }); } catch (error) {
        failures.push(String(error));
        console.error(String(error));
        continue;
      }
      item.listeningPack.static = built;
      processed += 1;
      rounds += built.length;
      changed = true;
      console.log(`${item.id}: ${built.length} caption-checked rounds`);
    }
    if (changed) pending.push({ file, items });
  }
  if (failures.length) throw new Error(`${failures.length} Static selections failed caption validation`);
  if (processed !== picks.length) throw new Error(`Selection ids not found: ${picks.length - processed}`);
  if (process.argv.indexOf('--write') !== -1) for (const { file, items } of pending) fs.writeFileSync(file, JSON.stringify(items, null, 2) + '\n');
  console.log(`Static selections verified: ${rounds} rounds across ${processed} packs.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
