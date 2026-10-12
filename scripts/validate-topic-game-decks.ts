/** Round 31 spoken-game bank checks. --partial permits missing decks during batch authoring. */
import fs from 'node:fs';
import path from 'node:path';
type Topic = { id: string; ageBand: string; levels: Record<string, unknown> };
type Card = { word?: string; forbidden?: string[]; decoy?: string; secret?: string; kind?: string; level?: string };
type Deck = { topicId: string; ageBand: string; taboo: Card[]; hotSeat: Card[]; imposter: Card[]; twentyQuestions: Card[] };
const dataDir = path.resolve('src/data');
const topics: Topic[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'topic-briefings.json'), 'utf8'));
const raw: unknown = JSON.parse(fs.readFileSync(path.join(dataDir, 'topic-game-decks.json'), 'utf8'));
const stickerIds: string[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'sticker-ids.json'), 'utf8'));
const partial = process.argv.includes('--partial');
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const normalize = (value: string) => value.toLowerCase().replace(/[’']/g, '').replace(/[-_]/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const stickers = new Set(stickerIds.map(normalize));
const known = new Map(topics.map((topic) => [topic.id, topic]));
const counts: Record<string, number> = { missing: 0, unknown: 0, duplicateDeck: 0, ageBand: 0, cardCount: 0, badCard: 0, level: 0, lowestLevel: 0, forbidden: 0, repeatedTabooHotSeat: 0, imposter: 0, overusedWord: 0, similarDeck: 0 };
const errors: string[] = [];
const fail = (check: string, where: string, message: string) => { counts[check] += 1; errors.push(`${where}: ${message}`); };
const ids = new Set<string>();
const owners = new Map<string, Set<string>>();
const deckWords: Array<{ id: string; words: Set<string> }> = [];
const byAge: Record<string, number> = { kids: 0, teens: 0 };
const byLevel: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0 };
const byAgeLevel: Record<string, Record<string, number>> = { kids: { A1: 0, A2: 0 }, teens: { B1: 0, B2: 0 } };
const stickerWords = new Set<string>();
let stickerOccurrences = 0;
const kind = new Set(['thing', 'place', 'animal', 'job', 'food', 'activity']);
if (!Array.isArray(raw)) throw new Error('topic-game-decks.json must contain an array');
for (const [index, value] of Array.from(raw.entries())) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) { fail('badCard', String(index), 'deck must be an object'); continue; }
  const deck = value as Deck;
  const topic = known.get(deck.topicId);
  if (!topic) { fail('unknown', String(deck.topicId), 'unknown topic'); continue; }
  if (ids.has(deck.topicId)) fail('duplicateDeck', deck.topicId, 'duplicate topic');
  ids.add(deck.topicId);
  if (deck.ageBand !== topic.ageBand) fail('ageBand', deck.topicId, 'ageBand does not match topic');
  byAge[topic.ageBand] += 1;
  const allowed = topic.ageBand === 'kids' ? ['A1', 'A2'] : Object.keys(topic.levels);
  const lowest = topic.ageBand === 'kids' ? 'A1' : 'B1';
  const all = new Set<string>();
  const tabooAndSeat = new Set<string>();
  const pairWords = new Set<string>();
  const addWord = (word: string) => {
    const normalized = normalize(word);
    all.add(normalized);
    if (!owners.has(normalized)) owners.set(normalized, new Set<string>());
    owners.get(normalized)?.add(deck.topicId);
    const sticker = normalized.replace(/^(?:a|an|the) /, '');
    if (stickers.has(sticker)) { stickerOccurrences += 1; stickerWords.add(sticker); }
  };
  for (const [field, size] of [['taboo', 14], ['hotSeat', 14], ['imposter', 8], ['twentyQuestions', 8]] as const) {
    const cards = deck[field];
    if (!Array.isArray(cards) || cards.length !== size) { fail('cardCount', deck.topicId, `${field} needs ${size} cards`); if (!Array.isArray(cards)) continue; }
    let easy = 0;
    const secrets = new Set<string>();
    for (const [cardIndex, card] of Array.from(cards.entries())) {
      const at = `${deck.topicId}.${field}[${cardIndex}]`;
      if (!card || typeof card !== 'object' || Array.isArray(card)) { fail('badCard', at, 'must be an object'); continue; }
      if (!text(card.level) || !allowed.includes(card.level)) fail('level', at, 'level must be present in the topic and within its age band');
      else { byLevel[card.level] += 1; byAgeLevel[topic.ageBand][card.level] += 1; if (card.level === lowest) easy += 1; }
      const word = field === 'twentyQuestions' ? card.secret : card.word;
      if (!text(word) || word.trim().split(/\s+/).length > 5) { fail('badCard', at, 'need a concrete word or short phrase (1–5 words)'); continue; }
      const normalized = normalize(word);
      addWord(word);
      if (field === 'taboo' || field === 'hotSeat') {
        if (tabooAndSeat.has(normalized)) fail('repeatedTabooHotSeat', at, `repeated word ${word}`);
        tabooAndSeat.add(normalized);
      }
      if (field === 'taboo') {
        if (!Array.isArray(card.forbidden) || card.forbidden.length !== 4 || card.forbidden.some((item) => !text(item))) fail('forbidden', at, 'need four non-empty forbidden words');
        else {
          const banned = card.forbidden.map(normalize);
          if (new Set(banned).size !== 4) fail('forbidden', at, 'forbidden words must be distinct');
          for (const item of banned) if (normalized.includes(item) || item.includes(normalized)) fail('forbidden', at, `target and forbidden word overlap: ${item}`);
        }
      }
      if (field === 'imposter') {
        if (!text(card.decoy) || normalize(card.decoy) === normalized) fail('imposter', at, 'decoy must differ from word');
        else {
          const decoy = normalize(card.decoy);
          if (pairWords.has(normalized) || pairWords.has(decoy)) fail('imposter', at, 'pair word or decoy repeated');
          pairWords.add(normalized); pairWords.add(decoy); addWord(card.decoy);
        }
      }
      if (field === 'twentyQuestions') {
        if (!text(card.kind) || !kind.has(card.kind)) fail('badCard', at, 'invalid secret kind');
        if (secrets.has(normalized)) fail('badCard', at, 'secret repeated');
        secrets.add(normalized);
      }
    }
    if ((field === 'taboo' || field === 'hotSeat') && easy < 4) fail('lowestLevel', deck.topicId, `${field} needs at least four ${lowest} cards`);
  }
  const levelsUsed = new Set([...deck.taboo || [], ...deck.hotSeat || [], ...deck.imposter || [], ...deck.twentyQuestions || []].map((card) => card?.level));
  for (const level of allowed) if (!levelsUsed.has(level)) fail('level', deck.topicId, `deck needs cards at ${level}`);
  deckWords.push({ id: deck.topicId, words: all });
}
if (!partial) for (const topic of topics) if (!ids.has(topic.id)) fail('missing', topic.id, 'missing deck');
for (const [word, topicIds] of Array.from(owners.entries())) if (topicIds.size > 4) fail('overusedWord', word, `used in ${topicIds.size} topics: ${Array.from(topicIds).join(', ')}`);
let maximumOverlap = 0;
let closest = '';
for (let i = 0; i < deckWords.length; i += 1) for (let j = i + 1; j < deckWords.length; j += 1) {
  const first = deckWords[i]; const second = deckWords[j];
  const shared = Array.from(first.words).filter((word) => second.words.has(word)).length;
  const fraction = shared / Math.min(first.words.size, second.words.size);
  if (fraction > maximumOverlap) { maximumOverlap = fraction; closest = `${first.id} / ${second.id}`; }
  if (fraction > 0.40) fail('similarDeck', first.id, `more than 40% shared targets with ${second.id}`);
}
console.log(`Topic decks: ${ids.size}/${topics.length}${partial ? ' (partial batch check)' : ''}; kids ${byAge.kids}, teens ${byAge.teens}.`);
console.log(`Cards by level: ${Object.keys(byLevel).map((level) => `${level} ${byLevel[level]}`).join(', ')}.`);
for (const age of ['kids', 'teens']) console.log(`${age}: ${Object.keys(byAgeLevel[age]).map((level) => `${level} ${byAgeLevel[age][level]}`).join(', ')}.`);
console.log(`Sticker matches: ${stickerWords.size} unique words, ${stickerOccurrences} target/decoy occurrences.`);
console.log(`Maximum target overlap: ${(maximumOverlap * 100).toFixed(2)}% (${closest || 'no pairs'}).`);
console.log(`Deck checks: ${Object.keys(counts).map((check) => `${check} ${counts[check]}`).join(', ')}.`);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; } else console.log('Topic-game deck validation passed.');
