/** Round 18 Focus bank checks; shared with the existing library validation command. */
import fs from 'node:fs';
import path from 'node:path';

type Counts = {
  topics: number; kids: number; teens: number; A1: number; A2: number; B1: number; B2: number;
  shortPictureWords: number; averagePictureWords: number;
  briefingFactOverlap: number; titleAliasVocab: number; genericVocab: number;
  overusedVocab: number; expressionFactOverlap: number; crossTopicSentences: number;
  identicalFactsAcrossLevels: number; identicalAnglesAcrossLevels: number;
};
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');
const normalizeSentence = (text: string) => normalize(text).replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const tokens = (text: string) => normalizeSentence(text).split(' ').filter(Boolean);
const sentences = (text: string) => (text.trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map((part) => part.trim()).filter(Boolean);
const sensitive = /\b(?:currently|this year|the newest|record|20[0-9]{2}|21[0-9]{2})\b/i;
const genericWords = new Set(['place', 'shape', 'change', 'look', 'screen', 'try', 'thing', 'way', 'use', 'good', 'people', 'part', 'kind', 'type', 'area']);

function factCopiedIntoExample(fact: string, example: string): boolean {
  const a = tokens(fact);
  const b = tokens(example);
  if (a.length === 0 || b.length === 0) return false;
  const n = Math.ceil(a.length * 0.8);
  for (let i = 0; i <= a.length - n; i += 1) {
    const section = a.slice(i, i + n).join(' ');
    for (let j = 0; j <= b.length - n; j += 1) if (b.slice(j, j + n).join(' ') === section) return true;
  }
  return false;
}

function mostlySameAcrossLevels(left: string, right: string): boolean {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.length || !b.length) return false;
  const rows: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = a[i - 1] === b[j - 1] ? rows[i - 1][j - 1] + 1 : Math.max(rows[i - 1][j], rows[i][j - 1]);
    }
  }
  return rows[a.length][b.length] >= Math.ceil(Math.min(a.length, b.length) * 0.8);
}

export function validateTopicBriefings(dataDir: string, fail: (where: string, message: string) => void): Counts {
  const counts: Counts = { topics: 0, kids: 0, teens: 0, A1: 0, A2: 0, B1: 0, B2: 0,
    shortPictureWords: 0, averagePictureWords: 0,
    briefingFactOverlap: 0, titleAliasVocab: 0, genericVocab: 0,
    overusedVocab: 0, expressionFactOverlap: 0, crossTopicSentences: 0,
    identicalFactsAcrossLevels: 0, identicalAnglesAcrossLevels: 0 };
  const file = path.join(dataDir, 'topic-briefings.json');
  if (!fs.existsSync(file)) { fail('topic-briefings.json', 'required Focus bank is missing'); return counts; }
  let raw: unknown;
  try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { fail('topic-briefings.json', `invalid JSON: ${String(error)}`); return counts; }
  if (!Array.isArray(raw)) { fail('topic-briefings.json', 'top-level value must be an array'); return counts; }
  counts.topics = raw.length;
  const stickerFile = path.join(dataDir, 'sticker-words.json');
  let stickerIds = new Set<string>();
  try {
    const stickerRows = JSON.parse(fs.readFileSync(stickerFile, 'utf8')) as { id: string }[];
    if (!Array.isArray(stickerRows)) throw new Error('expected an array');
    stickerIds = new Set(stickerRows.map((row) => row.id));
  } catch (error) { fail('sticker-words.json', `cannot check picture words: ${String(error)}`); }
  let totalPictureWords = 0;
  const ids = new Set<string>();
  const titles = new Set<string>();
  const aliases = new Map<string, string>();
  const sentenceOwners = new Map<string, Set<string>>();
  const vocabOwners = new Map<string, Set<string>>();
  for (const [index, entry] of Array.from(raw.entries())) {
    const where = `topic-briefings.json[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) { fail(where, 'must be an object'); continue; }
    const topic = entry as Record<string, unknown>;
    if (!Array.isArray(topic.pictureWords) || topic.pictureWords.length < 3 || topic.pictureWords.length > 10) {
      fail(where, 'pictureWords must contain 3–10 sticker IDs');
    } else {
      const words = topic.pictureWords as unknown[];
      totalPictureWords += words.length;
      if (words.length < 6) counts.shortPictureWords += 1;
      const seen = new Set<string>();
      for (const word of words) {
        if (typeof word !== 'string' || !stickerIds.has(word)) fail(where, `unknown picture word ${String(word)}`);
        else if (seen.has(word)) fail(where, `duplicate picture word ${word}`);
        else seen.add(word);
      }
    }
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
          if (word === normalize(String(topic.title)) || (Array.isArray(topic.aliases) && topic.aliases.some((alias) => isText(alias) && normalize(alias) === word))) counts.titleAliasVocab += 1;
          if (genericWords.has(word)) counts.genericVocab += 1;
          if (!vocabOwners.has(word)) vocabOwners.set(word, new Set<string>());
          vocabOwners.get(word)?.add(String(topic.id));
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
      const facts = Array.isArray(item.facts) ? item.facts.filter(isText) : [];
      const briefing = isText(item.briefing) ? item.briefing : '';
      if (briefing && facts.some((fact) => sentences(briefing).some((sentence) => {
        const a = normalizeSentence(sentence);
        const b = normalizeSentence(fact);
        return a.length > 0 && b.length > 0 && (a.includes(b) || b.includes(a));
      }))) counts.briefingFactOverlap += 1;
      if (Array.isArray(expressions) && expressions.some((expression) => isText(expression?.example) && facts.some((fact) => factCopiedIntoExample(fact, expression.example)))) {
        counts.expressionFactOverlap += 1;
      }
      for (const text of [...(isText(item.briefing) ? sentences(item.briefing) : []), ...facts]) {
        const key = normalizeSentence(text);
        if (!key) continue;
        if (!sentenceOwners.has(key)) sentenceOwners.set(key, new Set<string>());
        sentenceOwners.get(key)?.add(String(topic.id));
      }
    }
    for (const field of ['facts', 'angles'] as const) {
      let repeated = false;
      for (let i = 0; i < wanted.length && !repeated; i += 1) {
        for (let j = i + 1; j < wanted.length && !repeated; j += 1) {
          const first = (levels[wanted[i]] as Record<string, unknown> | undefined)?.[field];
          const second = (levels[wanted[j]] as Record<string, unknown> | undefined)?.[field];
          if (!Array.isArray(first) || !Array.isArray(second)) continue;
          repeated = first.some((a) => isText(a) && second.some((b) => isText(b) && mostlySameAcrossLevels(a, b)));
        }
      }
      if (repeated) counts[field === 'facts' ? 'identicalFactsAcrossLevels' : 'identicalAnglesAcrossLevels'] += 1;
    }
  }
  if (counts.topics !== 150 || counts.kids !== 80 || counts.teens !== 70) {
    fail('topic-briefings.json', `expected 150 topics, 80 kids and 70 teens (found ${counts.topics}/${counts.kids}/${counts.teens})`);
  }
  if (counts.A1 !== 80 || counts.A2 !== 80 || counts.B1 !== 150 || counts.B2 !== 70) {
    fail('topic-briefings.json', `expected level counts 80/80/150/70 (found ${counts.A1}/${counts.A2}/${counts.B1}/${counts.B2})`);
  }
  counts.overusedVocab = Array.from(vocabOwners.values()).filter((owners) => owners.size > 4).length;
  counts.averagePictureWords = counts.topics ? totalPictureWords / counts.topics : 0;
  counts.crossTopicSentences = Array.from(sentenceOwners.values()).filter((owners) => owners.size > 1).length;
  for (const key of ['briefingFactOverlap', 'titleAliasVocab', 'genericVocab', 'overusedVocab', 'expressionFactOverlap', 'crossTopicSentences'] as const) {
    if (counts[key] !== 0) fail('topic-briefings.json', `Round 19 ${key}: ${counts[key]} (expected 0)`);
  }
  for (const key of ['identicalFactsAcrossLevels', 'identicalAnglesAcrossLevels'] as const) {
    if (counts[key] !== 0) fail('topic-briefings.json', `Round 20 ${key}: ${counts[key]} (expected 0)`);
  }
  return counts;
}
