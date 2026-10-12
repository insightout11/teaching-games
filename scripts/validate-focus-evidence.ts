import fs from 'node:fs';
import path from 'node:path';
import { WORLD_DESTINATIONS } from '../src/data/world-flight/destinations';
import { WORLD_FLIGHT_INVESTIGATIONS } from '../src/lib/world-flight/investigations';

type Evidence = { keyIdea: string; tradeoff: string; designUse: string; investigationTags: string[]; thin?: boolean; tradeoffInferred?: boolean };
const partial = process.argv.includes('--partial');
const file = path.resolve('src/data/world-flight/focus-evidence.json');
const entries: Record<string, Evidence> = JSON.parse(fs.readFileSync(file, 'utf8'));
const expected: Record<string, { city: string; skills: string[] }> = {};
WORLD_DESTINATIONS.forEach(d => d.focusOptions.forEach(f => { expected[d.id + '/' + f.id] = { city: d.id, skills: f.skills }; }));
const validTags = new Set<string>();
WORLD_FLIGHT_INVESTIGATIONS.forEach(i => i.requirements.forEach(r => r.matchTags.forEach(t => validTags.add(t))));
const counts: Record<string, number> = { missing: 0, unknown: 0, fields: 0, wordCount: 0, sentence: 0, starts: 0, tags: 0, duplicateKeyIdea: 0, duplicateDesignUse: 0, similarDesignUse: 0, coverage: 0 };
const errors: string[] = [];
function fail(kind: string, message: string) { counts[kind] += 1; errors.push(message); }
function words(s: string) { return s.trim().split(/\s+/).filter(Boolean); }
function normalized(s: string) { return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim(); }
const verbs = new Set(('repeat tell retain compare consider prepare coordinate extend schedule study ask help join match pair add adapt allow arrange balance build carry channel check choose collect combine connect create cut deliver design direct divide explain fund give grow guide include keep label leave link locate make mark measure move offer open place plan protect provide raise record reduce replace reserve restore reuse route save separate set shade share show slow space spread store support teach test track train turn use vary widen').split(' '));
Object.keys(expected).forEach(k => { if (!entries[k] && !partial) fail('missing', k + ': missing'); });
Object.keys(entries).forEach(k => { if (!expected[k]) fail('unknown', k + ': unknown'); });
const ideaOwners: Record<string, string> = {};
const useOwners: Record<string, string> = {};
let thin = 0; let inferred = 0;
const designs: Array<{ key: string; tokens: string[] }> = [];
Object.keys(entries).forEach(k => {
 const e = entries[k];
 if (!e || typeof e !== 'object' || Array.isArray(e)) { fail('fields', k + ': invalid object'); return; }
 if (e.thin === true) thin += 1;
 if (e.tradeoffInferred === true) inferred += 1;
 ['thin', 'tradeoffInferred'].forEach(flag => { const v = (e as unknown as Record<string, unknown>)[flag]; if (v !== undefined && typeof v !== 'boolean') fail('fields', k + ': ' + flag + ' must be boolean'); });
 const specs: Array<[keyof Evidence, number, number]> = [['keyIdea',10,22],['tradeoff',8,18],['designUse',6,14]];
 specs.forEach(([field, min, max]) => {
  const s = e[field];
  if (typeof s !== 'string' || !s.trim()) { fail('fields', k + ': missing ' + field); return; }
  const n = words(s).length;
  if (n < min || n > max) fail('wordCount', k + '.' + field + ': ' + n + ' words; expected ' + min + '-' + max);
  if (!/[.!?]$/.test(s.trim()) || (s.match(/[.!?](?:\s|$)/g) || []).length !== 1) fail('sentence', k + '.' + field + ': must be one complete sentence');
 });
 if (typeof e.keyIdea === 'string') {
  if (/^(?:this video|the video|this reading|the article|students)\b/i.test(e.keyIdea.trim())) fail('starts', k + ': keyIdea describes the lesson instead of its evidence');
  const n = normalized(e.keyIdea); if (ideaOwners[n]) fail('duplicateKeyIdea', k + ': same keyIdea as ' + ideaOwners[n]); else ideaOwners[n] = k;
 }
 if (typeof e.designUse === 'string') {
  const first = normalized(e.designUse).split(' ')[0];
  if (!verbs.has(first)) fail('starts', k + ': designUse must start with an imperative verb (' + first + ')');
  const n = normalized(e.designUse); if (useOwners[n]) fail('duplicateDesignUse', k + ': same designUse as ' + useOwners[n]); else useOwners[n] = k;
  designs.push({key:k,tokens:Array.from(new Set(n.split(' ')))});
 }
 if (!Array.isArray(e.investigationTags) || e.investigationTags.length < 2 || e.investigationTags.length > 4) fail('tags', k + ': expected 2-4 tags');
 else {
  const seen = new Set<string>();
  e.investigationTags.forEach(t => { if (!validTags.has(t) || seen.has(t)) fail('tags', k + ': unknown or repeated tag ' + t); seen.add(t); });
 }
});
for (let a = 0; a < designs.length; a += 1) {
 for (let b = a + 1; b < designs.length; b += 1) {
  const left = designs[a]; const right = designs[b];
  const shared = left.tokens.filter(t => right.tokens.includes(t)).length;
  // Jaccard overlap of normalized word sets: punctuation and word order cannot hide repeated instructions.
  const overlap = shared / (left.tokens.length + right.tokens.length - shared);
  if (overlap > .7 && normalized(entries[left.key].designUse) !== normalized(entries[right.key].designUse)) fail('similarDesignUse', left.key + ' / ' + right.key + ': designUse overlap ' + (100 * overlap).toFixed(1) + '%');
 }
}
console.log('Focus evidence: ' + Object.keys(entries).length + '/' + Object.keys(expected).length + (partial ? ' (partial)' : '') + '; thin ' + thin + '; tradeoffInferred ' + inferred + '.');
WORLD_FLIGHT_INVESTIGATIONS.forEach(i => i.requirements.forEach(r => {
 const before = new Set<string>(); const after = new Set<string>(); const explicit = new Set<string>();
 Object.keys(expected).forEach(k => {
  const f = expected[k]; const e = entries[k]; const skills = f.skills.map(t => t.toLowerCase().trim());
  const added = e && Array.isArray(e.investigationTags) ? e.investigationTags : [];
  if (r.matchTags.some(t => skills.includes(t))) before.add(f.city);
  if (r.matchTags.some(t => skills.concat(added).includes(t))) after.add(f.city);
  if (r.matchTags.some(t => added.includes(t))) explicit.add(f.city);
 });
 console.log(i.id + '/' + r.id + ': cities before ' + before.size + ', after ' + after.size + ', evidence tags only ' + explicit.size + '.');
 if (!partial && after.size < 8) fail('coverage', i.id + '/' + r.id + ': fewer than 8 cities');
}));
console.log('Evidence checks: ' + Object.keys(counts).map(k => k + ' ' + counts[k]).join(', ') + '.');
errors.forEach(e => console.error(e));
if (errors.length) process.exitCode = 1;
else console.log('Focus-evidence validation passed.');
