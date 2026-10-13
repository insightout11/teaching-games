/** Read-only cached-caption inventory and audit integrity checks (Round 35).
 * --inventory --env-file <existing .env.local> --snapshot <outside-repo JSON>
 * --check --snapshot <JSON> [--library <filename>] (full coverage unless restricted)
 * Never fetches YouTube, invokes AI, or writes to Supabase or library entries.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createServiceClient } from '../src/lib/supabase/service';

type Entry = { id: string; title: string; youtubeId?: string; description?: string; summary?: string; cefr?: string; difficultyLevel?: string; durationSecs?: number; transcriptSourceType?: string; [key: string]: unknown };
type Source = { file: string; entry: Entry; sourceType: string; sourceKey: string };
type Row = { source_type: string; source_key: string; raw_transcript: string | null; transcript_quality?: string | null };
type Segment = { text: string; startSecs: number | null; endSecs: number | null };
type Inventory = { key: string; file: string; entry: Entry; expectedCacheKey: string; cacheKey: string | null; cacheMatch: 'exact' | 'same-youtube-id' | 'none'; segments: Segment[]; text: string; rawCharacters: number; wordCount: number; timedSegments: number; lastTimestampSecs: number | null; captionEndSecs: number | null; wordsPerMinute: number | null; durationDifferenceRatio: number | null; parseIssue: string | null };
type Snapshot = { capturedAt: string; entries: Inventory[] };
type Status = 'ok' | 'mismatch' | 'partial' | 'weak-captions' | 'no-captions' | 'level-off';
type Judgement = { status: Status; note: string };
const statuses: Status[] = ['ok', 'mismatch', 'partial', 'weak-captions', 'no-captions', 'level-off'];
const args = process.argv.slice(2);
const option = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const snapshotPath = option('--snapshot');
const library = option('--library');
const root = process.cwd();
function libraryEntries(): { file: string; entry: Entry }[] {
  return fs.readdirSync(path.join(root, 'src/data')).filter(file => /-library\.json$/.test(file)).sort().flatMap(file => {
    const entries = JSON.parse(fs.readFileSync(path.join(root, 'src/data', file), 'utf8')) as Entry[];
    return entries.map(entry => ({ file, entry }));
  });
}
function sources(): Source[] {
  return libraryEntries().filter(({ entry }) => typeof entry.youtubeId === 'string' && entry.youtubeId.trim()).map(({ file, entry }) => ({ file, entry, sourceType: entry.transcriptSourceType || file.replace(/-library\.json$/, ''), sourceKey: entry.id }));
}
function checkMetadata() {
  const levels: Record<string, string> = { A1: 'Beginner', A2: 'Easy', B1: 'Intermediate', B2: 'Advanced', C1: 'Expert' };
  let hiddenWithoutNote = 0; let levelDisagreements = 0;
  const entries = libraryEntries();
  for (const { file, entry } of entries) {
    if (entry.hidden === true && (typeof entry.hiddenNote !== 'string' || !entry.hiddenNote.trim())) {
      console.error(`${file}/${entry.id}: hidden entry lacks hiddenNote.`); hiddenWithoutNote += 1;
    }
    if (!entry.cefr || !levels[entry.cefr] || entry.difficultyLevel !== levels[entry.cefr]) {
      console.error(`${file}/${entry.id}: CEFR/difficulty label disagreement.`); levelDisagreements += 1;
    }
  }
  console.log(`Library metadata: ${entries.length} entries; hidden without note ${hiddenWithoutNote}; level disagreements ${levelDisagreements}.`);
  if (hiddenWithoutNote || levelDisagreements) process.exitCode = 1;
}
// Round 36 permits metadata correction after capturing captions. All other
// fields, including IDs, URLs, durations and needsReview, must still match.
const editableMetadata = ['title', 'description', 'summary', 'topicTags', 'cefr', 'difficultyLevel', 'hidden', 'hiddenNote', 'publisherLevel'];
function immutableEntry(entry: Entry) {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(entry).sort()) if (!editableMetadata.includes(key)) result[key] = entry[key];
  return JSON.stringify(result);
}
const cacheKey = (sourceType: string, sourceKey: string) => `${sourceType}/${sourceKey}`;
const auditKey = (source: Source) => `${source.file}/${source.entry.id}`;
// Whitespace-delimited word tokens, including translated captions; do not count
// punctuation-only tokens. This is not a language-independent segmentation model.
const countWords = (text: string) => text.split(/\s+/).filter(token => /[A-Za-z0-9\u00C0-\u02AF\u0370-\u052F\u0621-\u064A\u066E-\u06D3\u0900-\u097F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7A3]/.test(token)).length;
function decode(text: string): string {
  return text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#(?:39|x27);/gi, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
function captions(raw: string | null): { segments: Segment[]; parseIssue: string | null } {
  if (!raw || !raw.trim()) return { segments: [], parseIssue: null };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch {
    if (/^\s*[\[{]/.test(raw)) return { segments: [], parseIssue: 'Malformed JSON-shaped transcript; not treated as speech.' };
    return { segments: [{ text: decode(raw), startSecs: null, endSecs: null }], parseIssue: null };
  }
  if (typeof parsed === 'string') return { segments: [{ text: decode(parsed), startSecs: null, endSecs: null }], parseIssue: null };
  if (!Array.isArray(parsed)) return { segments: [], parseIssue: 'Unsupported cached transcript structure (not a caption array or plain text).' };
  const segments: Segment[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object' || typeof item.text !== 'string') continue;
    // Cache pipeline stores youtube-transcript offset/duration in milliseconds.
    // Explicit seconds fields, if supplied, are honored without a guessed conversion.
    const start = typeof item.startSecs === 'number' ? item.startSecs : typeof item.offset === 'number' ? item.offset / 1000 : null;
    const duration = typeof item.durationSecs === 'number' ? item.durationSecs : typeof item.duration === 'number' ? item.duration / 1000 : null;
    const valid = start !== null && Number.isFinite(start) && start >= 0 ? start : null;
    segments.push({ text: decode(item.text), startSecs: valid, endSecs: valid !== null && duration !== null && Number.isFinite(duration) && duration >= 0 ? valid + duration : null });
  }
  return { segments, parseIssue: segments.length ? null : 'Cached caption array contains no readable text segments.' };
}
async function inventory(): Promise<Snapshot> {
  const envFile = option('--env-file');
  if (envFile) for (const line of fs.readFileSync(path.resolve(envFile), 'utf8').split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  const all = sources(); const selected = all.filter(source => source.file !== 'world-flight-library.json');
  const sourceGroups = new Map<string, string[]>();
  for (const source of all) {
    if (!sourceGroups.has(source.sourceType)) sourceGroups.set(source.sourceType, []);
    sourceGroups.get(source.sourceType)!.push(source.sourceKey);
  }
  const client = createServiceClient(); const rows = new Map<string, Row>();
  for (const [type, keys] of Array.from(sourceGroups.entries())) {
    const unique = Array.from(new Set(keys));
    for (let i = 0; i < unique.length; i += 50) {
      const { data, error } = await client.from('source_extractions').select('source_type,source_key,raw_transcript,transcript_quality').eq('source_type', type).in('source_key', unique.slice(i, i + 50));
      if (error) throw new Error(`Cached caption SELECT failed for ${type}; audit stopped rather than marking inaccessible rows no-captions.`);
      for (const row of (data || []) as Row[]) {
        const key = cacheKey(row.source_type, row.source_key);
        if (rows.has(key)) throw new Error(`Ambiguous cache rows for ${key}.`);
        rows.set(key, row);
      }
    }
  }
  const entries: Inventory[] = selected.map(source => {
    const expected = cacheKey(source.sourceType, source.sourceKey);
    let found = rows.get(expected); let match: Inventory['cacheMatch'] = found?.raw_transcript?.trim() ? 'exact' : 'none';
    if (match === 'none') {
      const other = all.find(candidate => candidate.entry.youtubeId === source.entry.youtubeId && rows.get(cacheKey(candidate.sourceType, candidate.sourceKey))?.raw_transcript?.trim());
      if (other) { found = rows.get(cacheKey(other.sourceType, other.sourceKey)); match = 'same-youtube-id'; }
    }
    const raw = found?.raw_transcript || null; const parsed = captions(raw);
    const text = parsed.segments.map(segment => segment.text).join(' ').trim();
    const starts = parsed.segments.map(segment => segment.startSecs).filter((n): n is number => n !== null);
    const ends = parsed.segments.map(segment => segment.endSecs).filter((n): n is number => n !== null);
    const last = starts.length ? Math.max(...starts) : null;
    const end = ends.length ? Math.max(...ends) : null;
    const duration = typeof source.entry.durationSecs === 'number' && source.entry.durationSecs > 0 ? source.entry.durationSecs : null;
    const wordCount = countWords(text);
    return { key: auditKey(source), file: source.file, entry: source.entry, expectedCacheKey: expected, cacheKey: match !== 'none' && found ? cacheKey(found.source_type, found.source_key) : null, cacheMatch: match, segments: parsed.segments, text, rawCharacters: raw?.length || 0, wordCount, timedSegments: starts.length, lastTimestampSecs: last, captionEndSecs: end, wordsPerMinute: duration ? wordCount * 60 / duration : null, durationDifferenceRatio: duration && last !== null ? Math.abs(duration - last) / duration : null, parseIssue: parsed.parseIssue };
  });
  return { capturedAt: new Date().toISOString(), entries };
}
function mechanical(snapshot: Snapshot) {
  const entries = snapshot.entries.filter(entry => !library || entry.file === library);
  const withRaw = entries.filter(entry => entry.cacheMatch !== 'none');
  console.log(`Inventory: ${entries.length}; cached ${withRaw.length}; no cache ${entries.length - withRaw.length}; timestamped ${entries.filter(entry => entry.timedSegments > 0).length}.`);
  for (const file of Array.from(new Set(entries.map(entry => entry.file))).sort()) {
    const group = entries.filter(entry => entry.file === file);
    console.log(`${file}: entries ${group.length}, cached ${group.filter(entry => entry.cacheMatch !== 'none').length}, same-video fallback ${group.filter(entry => entry.cacheMatch === 'same-youtube-id').length}.`);
  }
  console.log('20 shortest existing caption sets (missing cache excluded):');
  for (const entry of withRaw.slice().sort((a, b) => a.wordCount - b.wordCount || a.key.localeCompare(b.key)).slice(0, 20)) console.log(`${entry.key}: ${entry.wordCount} words; ${entry.rawCharacters} raw characters.`);
  console.log('20 lowest WPM existing caption sets (words / library duration; not speaker speed):');
  for (const entry of withRaw.filter(entry => entry.wordsPerMinute !== null).sort((a, b) => a.wordsPerMinute! - b.wordsPerMinute! || a.key.localeCompare(b.key)).slice(0, 20)) console.log(`${entry.key}: ${entry.wordsPerMinute!.toFixed(2)} WPM; ${entry.wordCount} words / ${entry.entry.durationSecs}s.`);
  console.log('Duration differs from last caption start by >25% (review signals, not automatic mismatches):');
  for (const entry of entries.filter(entry => entry.durationDifferenceRatio !== null && entry.durationDifferenceRatio > 0.25)) console.log(`${entry.key}: library ${entry.entry.durationSecs}s; last start ${entry.lastTimestampSecs?.toFixed(3)}s; end ${entry.captionEndSecs?.toFixed(3) ?? 'unknown'}s; ${(entry.durationDifferenceRatio! * 100).toFixed(1)}%.`);
}
function check(snapshot: Snapshot) {
  checkMetadata();
  const expected = sources().filter(source => source.file !== 'world-flight-library.json' && (!library || source.file === library));
  const audit = JSON.parse(fs.readFileSync(path.join(root, 'src/data/library-video-audit.json'), 'utf8')) as Record<string, Judgement>;
  const keys = expected.map(auditKey); const allKeys = new Set(sources().filter(source => source.file !== 'world-flight-library.json').map(auditKey));
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate entry IDs within a library.');
  for (const key of Object.keys(audit)) if (!allKeys.has(key)) throw new Error(`Unknown audit key: ${key}`);
  const counts: Record<string, number> = {}; let missing = 0; let invalid = 0;
  for (const source of expected) {
    const key = auditKey(source); const judgement = audit[key];
    if (!judgement) { missing += 1; continue; }
    if (!statuses.includes(judgement.status) || typeof judgement.note !== 'string' || !judgement.note.trim()) { invalid += 1; continue; }
    const item = snapshot.entries.find(entry => entry.key === key);
    if (!item || immutableEntry(item.entry) !== immutableEntry(source.entry)) throw new Error(`Snapshot missing or immutable fields changed for ${key}.`);
    if (judgement.status === 'no-captions' && item.cacheMatch !== 'none') throw new Error(`No-captions status conflicts with inventory for ${key}.`);
    if (item.cacheMatch === 'none' && judgement.status !== 'no-captions') throw new Error(`Missing cache must be reported for ${key}.`);
    if (judgement.status !== 'ok' && !/Suggested action: /i.test(judgement.note)) throw new Error(`Missing action for ${key}.`);
    if (judgement.status !== 'ok' && judgement.status !== 'no-captions' && !/Evidence: /i.test(judgement.note)) throw new Error(`Missing caption evidence for ${key}.`);
    counts[`${source.file}/${judgement.status}`] = (counts[`${source.file}/${judgement.status}`] || 0) + 1;
  }
  console.log(`Audit coverage: ${expected.length - missing}/${expected.length}; missing ${missing}; invalid ${invalid}; unknown 0.`);
  for (const file of Array.from(new Set(expected.map(source => source.file))).sort()) console.log(`${file}: ${statuses.map(status => `${status} ${counts[`${file}/${status}`] || 0}`).join(', ')}.`);
  for (const status of statuses) console.log(`TOTAL ${status}: ${expected.reduce((n, source) => n + Number(audit[auditKey(source)]?.status === status), 0)}`);
  if (missing || invalid) process.exitCode = 1;
}
async function main() {
  if (!snapshotPath) throw new Error('Supply --snapshot <outside-repo JSON>.');
  if (args.includes('--inventory')) {
    const snapshot = await inventory(); const target = path.resolve(snapshotPath);
    if (target.toLowerCase().startsWith(root.toLowerCase() + path.sep)) throw new Error('Caption snapshots must stay outside the repo.');
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, JSON.stringify(snapshot, null, 2)); mechanical(snapshot);
  } else {
    const snapshot = JSON.parse(fs.readFileSync(path.resolve(snapshotPath), 'utf8')) as Snapshot;
    if (args.includes('--check')) check(snapshot); else mechanical(snapshot);
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Audit failed.'); process.exitCode = 1; });
