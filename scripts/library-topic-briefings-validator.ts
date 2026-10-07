/** Round 18 Focus bank checks; shared with the existing library validation command. */
import fs from 'node:fs';
import path from 'node:path';

type Counts = { topics: number; kids: number; teens: number; A1: number; A2: number; B1: number; B2: number };
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');
const sentences = (text: string) => (text.trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map((part) => part.trim()).filter(Boolean);
const sensitive = /\b(?:currently|this year|the newest|record|20[0-9]{2}|21[0-9]{2})\b/i;

export function validateTopicBriefings(dataDir: string, fail: (where: string, message: string) => void): Counts {
  const counts: Counts = { topics: 0, kids: 0, teens: 0, A1: 0, A2: 0, B1: 0, B2: 0 };
  const file = path.join(dataDir, 'topic-briefings.json');
  if (!fs.existsSync(file)) { fail('topic-briefings.json', 'required Focus bank is missing'); return counts; }
  let raw: unknown;
  try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { fail('topic-briefings.json', `invalid JSON: ${String(error)}`); return counts; }
  if (!Array.isArray(raw)) { fail('topic-briefings.json', 'top-level value must be an array'); return counts; }
  counts.topics = raw.length;
  const ids = new Set<string>();
  const titles = new Set<string>();
  const aliases = new Map<string, string>();
  for (const [index, entry] of Array.from(raw.entries())) {
    const where = `topic-briefings.json[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) { fail(where, 'must be an object'); continue; }
    const topic = entry as Record<string, unknown>;
    for (const key of ['id', 'title', 'category']) {
      if (!isText(topic[key])) fail(where, `${key} is required`);
    }
    if (isText(topic.id)) {
      const id = normalize(topic.id);
      if (ids.has(id)) fail(where, `duplicate id: ${topic.id}`);
      ids.add(id);
    }
    if (isText(topic.title)) {
      const title = normalize(topic.title);
      if (titles.has(title)) fail(where, `duplicate title: ${topic.title}`);
      titles.add(title);
    }
    const ageBand = topic.ageBand;
    if (ageBand === 'kids') counts.kids += 1;
    else if (ageBand === 'teens') counts.teens += 1;
    else fail(where, 'ageBand must be kids or teens');
    if (!Array.isArray(topic.aliases) || topic.aliases.length < 3 || topic.aliases.length > 8) {
      fail(where, 'aliases must contain 3–8 phrases');
    } else for (const alias of topic.aliases) {
      if (!isText(alias)) { fail(where, 'aliases must be non-empty strings'); continue; }
      const key = normalize(alias);
      if (aliases.has(key)) fail(where, `duplicate alias ${alias} (also ${aliases.get(key)})`);
      else aliases.set(key, String(topic.title));
    }
    if (!topic.levels || typeof topic.levels !== 'object' || Array.isArray(topic.levels)) {
      fail(where, 'levels object is required'); continue;
    }
    const levels = topic.levels as Record<string, unknown>;
    const wanted = ageBand === 'kids' ? ['A1', 'A2', 'B1'] : ['B1', 'B2'];
    if (Object.keys(levels).sort().join(',') !== wanted.sort().join(',')) {
      fail(where, `required levels: ${wanted.join(', ')}`);
    }
    for (const level of wanted) {
      const at = `${where}.levels.${level}`;
      const rawLevel = levels[level];
      if (!rawLevel || typeof rawLevel !== 'object' || Array.isArray(rawLevel)) { fail(at, 'level object is required'); continue; }
      counts[level as keyof Counts] += 1;
      const item = rawLevel as Record<string, unknown>;
      if (!isText(item.briefing)) fail(at, 'briefing is required');
      else if (sentences(item.briefing).length < 3 || sentences(item.briefing).length > 4) fail(at, 'briefing must have 3–4 sentences');
      const textFields: string[] = isText(item.briefing) ? [item.briefing] : [];
      for (const [name, count] of [['facts', 4], ['angles', 3]] as const) {
        const entries = item[name];
        if (!Array.isArray(entries) || entries.length !== count || entries.some((text) => !isText(text))) {
          fail(at, `${name} needs exactly ${count} non-empty strings`);
        } else textFields.push(...entries);
      }
      const vocab = item.vocab;
      if (!Array.isArray(vocab) || vocab.length !== 7) fail(at, 'vocab needs exactly 7 items');
      else {
        const vocabWords = vocab.map((value) => isText(value?.word) ? normalize(value.word) : '').filter(Boolean);
        if (new Set(vocabWords).size !== 7) fail(at, 'vocab words must be distinct');
      }
      if (Array.isArray(vocab)) for (const [vocabIndex, value] of Array.from(vocab.entries())) {
        const vWhere = `${at}.vocab[${vocabIndex}]`;
        if (!value || typeof value !== 'object' || Array.isArray(value)) { fail(vWhere, 'must be an object'); continue; }
        const row = value as Record<string, unknown>;
        for (const key of ['word', 'definition', 'partOfSpeech', 'example', 'starter']) if (!isText(row[key])) fail(vWhere, `${key} is required`);
        if (isText(row.definition) && countWords(row.definition) > 15) fail(vWhere, 'definition must have at most 15 words');
        if (isText(row.starter) && !row.starter.endsWith('…')) fail(vWhere, 'starter must end with …');
        for (const key of ['definition', 'example', 'starter']) if (isText(row[key])) textFields.push(row[key]);
        if (isText(row.word)) {
          const word = normalize(row.word);
          const usage = [item.briefing, ...(Array.isArray(item.facts) ? item.facts : []), ...(Array.isArray(vocab) ? vocab.map((card) => card?.example) : []), ...(Array.isArray(item.expressions) ? item.expressions.map((expression) => expression?.example) : [])].filter(isText);
          if (!usage.some((text) => normalize(text).includes(word))) fail(vWhere, `word ${row.word} is absent from briefing, facts, and examples`);
          if (isText(row.example) && !normalize(row.example).includes(word)) fail(vWhere, 'the example must use the word');
        }
      }
      const expressions = item.expressions;
      if (!Array.isArray(expressions) || expressions.length !== 6) fail(at, 'expressions need exactly 6 items');
      else for (const [expressionIndex, value] of Array.from(expressions.entries())) {
        const eWhere = `${at}.expressions[${expressionIndex}]`;
        if (!value || typeof value !== 'object' || Array.isArray(value)) { fail(eWhere, 'must be an object'); continue; }
        const row = value as Record<string, unknown>;
        if (!isText(row.phrase) || !isText(row.example)) fail(eWhere, 'phrase and example are required');
        for (const key of ['phrase', 'example']) if (isText(row[key])) textFields.push(row[key]);
      }
      const limit = level === 'A1' ? 10 : level === 'A2' ? 14 : 0;
      if (limit) for (const text of [item.briefing, ...(Array.isArray(item.facts) ? item.facts : []), ...(Array.isArray(item.angles) ? item.angles : []), ...(Array.isArray(vocab) ? vocab.flatMap((row) => [row?.definition, row?.example]) : []), ...(Array.isArray(expressions) ? expressions.map((row) => row?.example) : [])].filter(isText)) {
        for (const sentence of sentences(text)) if (countWords(sentence) > limit) fail(at, `${level} sentence exceeds ${limit} words: ${sentence}`);
      }
      for (const text of textFields) {
        const match = text.match(sensitive);
        if (match && (match[0] !== '2000')) fail(at, `time-sensitive wording needs review: ${match[0]}`);
      }
    }
  }
  if (counts.topics !== 150 || counts.kids !== 80 || counts.teens !== 70) {
    fail('topic-briefings.json', `expected 150 topics, 80 kids and 70 teens (found ${counts.topics}/${counts.kids}/${counts.teens})`);
  }
  if (counts.A1 !== 80 || counts.A2 !== 80 || counts.B1 !== 150 || counts.B2 !== 70) {
    fail('topic-briefings.json', `expected level counts 80/80/150/70 (found ${counts.A1}/${counts.A2}/${counts.B1}/${counts.B2})`);
  }
  return counts;
}
