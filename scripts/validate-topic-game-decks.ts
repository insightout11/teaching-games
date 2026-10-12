/** Round 31-34 spoken-game bank checks. --partial permits missing decks during batch authoring. */
import fs from 'node:fs';
import path from 'node:path';
type Topic = { id: string; ageBand: string; levels: Record<string, unknown> };
type Card = { word?: string; forbidden?: string[]; decoy?: string; secret?: string; kind?: string; level?: string; description?: string; hint?: string; crewQuestion?: string; imposterQuestion?: string };
type Deck = { topicId: string; ageBand: string; taboo: Card[]; hotSeat: Card[]; imposter: Card[]; twentyQuestions: Card[] };
const dataDir = path.resolve('src/data');
const topics: Topic[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'topic-briefings.json'), 'utf8'));
const raw: unknown = JSON.parse(fs.readFileSync(path.join(dataDir, 'topic-game-decks.json'), 'utf8'));
const stickerIds: string[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'sticker-ids.json'), 'utf8'));
const partial = process.argv.includes('--partial');
const reviewArg = process.argv.find(arg => arg.startsWith('--round34-count='));
const reviewedCount = reviewArg ? Number(reviewArg.split('=')[1]) : topics.length;
if (!Number.isInteger(reviewedCount) || reviewedCount < 0 || reviewedCount > topics.length) throw new Error('Invalid --round34-count');
function questionDistance(a: string, b: string) {
 const left = normalize(a).split(' '); const right = normalize(b).split(' ');
 let previous = right.map((_, i) => i + 1); previous.unshift(0);
 for (let i = 0; i < left.length; i += 1) {
  const next = [i + 1];
  for (let j = 0; j < right.length; j += 1) next.push(Math.min(next[j] + 1, previous[j + 1] + 1, previous[j] + (left[i] === right[j] ? 0 : 1)));
  previous = next;
 }
 return previous[right.length];
}
const similarQuestions: Array<{ at: string; crew: string; imposter: string; distance: number; similarity: number }> = [];
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const normalize = (value: string) => value.toLowerCase().replace(/[’']/g, '').replace(/[-_]/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const wordForms = (value: string) => {
  const forms = [value];
  if (value.length > 2) {
    forms.push(`${value}s`, `${value}es`, `${value}ed`, `${value}ing`);
    if (value.endsWith('y')) forms.push(`${value.slice(0, -1)}ies`, `${value.slice(0, -1)}ied`, `${value.slice(0, -1)}ying`);
    if (value.endsWith('e')) forms.push(`${value.slice(0, -1)}ing`, `${value}d`);
    if (/[bcdfghjklmnpqrstvwxz]$/.test(value)) forms.push(`${value}${value.slice(-1)}ing`, `${value}${value.slice(-1)}ed`);
  }
  return new Set(forms);
};
const containsWordOrForm = (sentence: string, target: string) => {
  const sentenceWords = normalize(sentence).split(' ');
  const targetWords = normalize(target).split(' ');
  if (!targetWords.length) return false;
  const finalForms = wordForms(targetWords[targetWords.length - 1]);
  for (let start = 0; start <= sentenceWords.length - targetWords.length; start += 1) {
    let matches = true;
    for (let offset = 0; offset < targetWords.length; offset += 1) {
      const actual = sentenceWords[start + offset];
      const expected = targetWords[offset];
      if (offset === targetWords.length - 1 ? !finalForms.has(actual) : actual !== expected) { matches = false; break; }
    }
    if (matches) return true;
  }
  return false;
};
const stickers = new Set(stickerIds.map(normalize));
const known = new Map(topics.map((topic) => [topic.id, topic]));
const counts: Record<string, number> = { missing: 0, unknown: 0, duplicateDeck: 0, ageBand: 0, cardCount: 0, badCard: 0, level: 0, lowestLevel: 0, forbidden: 0, description: 0, repeatedTabooHotSeat: 0, imposter: 0, longPhrase: 0, singleWordHotSeat: 0, repeatedSecret: 0, questionDifference: 0, overusedWord: 0, similarDeck: 0 };
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
const twoWordEntries: string[] = [];
const kind = new Set(['thing', 'place', 'animal', 'job', 'food', 'activity']);
if (!Array.isArray(raw)) throw new Error('topic-game-decks.json must contain an array');
for (const [index, value] of Array.from(raw.entries())) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) { fail('badCard', String(index), 'deck must be an object'); continue; }
  const deck = value as Deck;
  const round34 = index < reviewedCount;
  const topic = known.get(deck.topicId);
  if (!topic) { fail('unknown', String(deck.topicId), 'unknown topic'); continue; }
  if (ids.has(deck.topicId)) fail('duplicateDeck', deck.topicId, 'duplicate topic');
  ids.add(deck.topicId);
  if (deck.ageBand !== topic.ageBand) fail('ageBand', deck.topicId, 'ageBand does not match topic');
  byAge[topic.ageBand] += 1;
  const allowed = topic.ageBand === 'kids' ? ['A1', 'A2'] : Object.keys(topic.levels);
  const lowest = topic.ageBand === 'kids' ? 'A1' : 'B1';
  const round32 = Array.isArray(deck.imposter) && deck.imposter.length === 6;
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
  for (const [field, size] of [['taboo', 14], ['hotSeat', 14], ['imposter', partial && !round32 ? 8 : 6], ['twentyQuestions', 8]] as const) {
    const cards = deck[field];
    if (!Array.isArray(cards) || cards.length !== size) { fail('cardCount', deck.topicId, `${field} needs ${size} cards`); if (!Array.isArray(cards)) continue; }
    let easy = 0;
    let singleWords = 0;
    const secrets = new Set<string>();
    for (const [cardIndex, card] of Array.from(cards.entries())) {
      const at = `${deck.topicId}.${field}[${cardIndex}]`;
      if (!card || typeof card !== 'object' || Array.isArray(card)) { fail('badCard', at, 'must be an object'); continue; }
      if (!text(card.level) || !allowed.includes(card.level)) fail('level', at, 'level must be present in the topic and within its age band');
      else { byLevel[card.level] += 1; byAgeLevel[topic.ageBand][card.level] += 1; if (card.level === lowest) easy += 1; }
      if ((!partial || round32) && Object.prototype.hasOwnProperty.call(card, 'decoy')) fail('imposter', at, 'decoy field must be removed');
      const word = field === 'twentyQuestions' ? card.secret : card.word;
      if (!text(word) || word.trim().split(/\s+/).length > 5) { fail('badCard', at, 'need a concrete word or short phrase (1–5 words)'); continue; }
      const normalized = normalize(word);
      addWord(word);
      const wordCount = normalized ? normalized.split(' ').length : 0;
      if (field === 'hotSeat' && wordCount === 1) singleWords += 1;
      if ((!partial || round32) && (field === 'hotSeat' || field === 'twentyQuestions') && wordCount > 2) fail('longPhrase', at, 'entry must be one or two words');
      if ((!partial || round32) && (field === 'hotSeat' || field === 'twentyQuestions') && wordCount === 2) twoWordEntries.push(`${deck.topicId}.${field}: ${word}`);
      if (field === 'taboo' || field === 'hotSeat') {
        if (tabooAndSeat.has(normalized)) fail('repeatedTabooHotSeat', at, `repeated word ${word}`);
        tabooAndSeat.add(normalized);
      }
      if (field === 'taboo') {
        if ((!partial || round32) && (!text(card.description) || card.description.trim().split(/\s+/).length < 4 || card.description.trim().split(/\s+/).length > 10)) fail('description', at, 'description must be 4–10 words');
        else if ((!partial || round32) && containsWordOrForm(card.description as string, word)) fail('description', at, 'description contains target word or a form of it');
        if (!Array.isArray(card.forbidden) || card.forbidden.length !== 4 || card.forbidden.some((item) => !text(item))) fail('forbidden', at, 'need four non-empty forbidden words');
        else {
          const banned = card.forbidden.map(normalize);
          if (new Set(banned).size !== 4) fail('forbidden', at, 'forbidden words must be distinct');
          for (const item of banned) if (normalized.includes(item) || item.includes(normalized)) fail('forbidden', at, `target and forbidden word overlap: ${item}`);
        }
      }
      if (field === 'hotSeat') {
        if ((!partial || round32) && (!text(card.description) || card.description.trim().split(/\s+/).length < 4 || card.description.trim().split(/\s+/).length > 10)) fail('description', at, 'description must be 4–10 words');
        else if ((!partial || round32) && containsWordOrForm(card.description as string, word)) fail('description', at, 'description contains target word or a form of it');
      }
      if (field === 'imposter') {
        if (!partial || round32) {
          if (!text(card.description) || card.description.trim().split(/\s+/).length < 4 || card.description.trim().split(/\s+/).length > 10) fail('description', at, 'description must be 4–10 words');
          else if (containsWordOrForm(card.description, word)) fail('description', at, 'description contains target word or a form of it');
          if (!text(card.hint) || card.hint.trim().split(/\s+/).length < 2 || card.hint.trim().split(/\s+/).length > 4) fail('imposter', at, 'hint must be 2–4 words');
          else if (containsWordOrForm(card.hint, word)) fail('imposter', at, 'hint contains the secret word');
          for (const [questionField, question] of [['crewQuestion', card.crewQuestion], ['imposterQuestion', card.imposterQuestion]] as const) {
            if (!text(question) || !question.trim().endsWith('?')) fail('imposter', at, `${questionField} must be a question ending in ?`);
            else if (/^(?:do|does|is|are|can|did|will|have)\b/i.test(question.trim())) fail('imposter', at, `${questionField} must not be a yes/no question`);
            else if (!/^(?:what|which|who|where|when|why|how)\b/i.test(question.trim())) fail('imposter', at, `${questionField} must ask an open question`);
          }
          if (text(card.crewQuestion) && text(card.imposterQuestion)) {
            const distance = questionDistance(card.crewQuestion, card.imposterQuestion);
            const longest = Math.max(normalize(card.crewQuestion).split(' ').length, normalize(card.imposterQuestion).split(' ').length);
            if (round34 && distance < 3) fail('questionDifference', at, 'questions need at least three word edits');
            if (round34) similarQuestions.push({ at, crew: card.crewQuestion, imposter: card.imposterQuestion, distance, similarity: 1 - distance / longest });
            if (!distance) fail('imposter', at, 'crew and imposter questions must differ');
          }
          if (pairWords.has(normalized)) fail('imposter', at, 'secret word repeated');
          pairWords.add(normalized);
        }
      }
      if (field === 'twentyQuestions') {
        if (round34 && tabooAndSeat.has(normalized)) fail('repeatedSecret', at, 'secret repeats a Taboo or Hot Seat target');
        if (round34 && card.kind === 'activity') fail('badCard', at, 'secret must be a concrete thing, place, animal, job, or food');
        if (!text(card.kind) || !kind.has(card.kind)) fail('badCard', at, 'invalid secret kind');
        if (secrets.has(normalized)) fail('badCard', at, 'secret repeated');
        secrets.add(normalized);
      }
    }
    if (round34 && field === 'hotSeat' && singleWords < 9) fail('singleWordHotSeat', deck.topicId, 'Hot Seat needs at least nine single-word targets');
    if ((field === 'taboo' || field === 'hotSeat') && easy < 4) fail('lowestLevel', deck.topicId, `${field} needs at least four ${lowest} cards`);
  }
  if (!partial && Array.isArray(deck.imposter) && deck.imposter.length !== 6) fail('imposter', deck.topicId, 'imposter needs exactly 6 rounds');
  if (partial && round32 && deck.imposter.length !== 6) fail('imposter', deck.topicId, 'imposter needs exactly 6 rounds');
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
console.log(`Two-word Hot Seat / Twenty Questions entries (${twoWordEntries.length}):\n${twoWordEntries.join('\n')}`);
console.log(`Round 34 reviewed: ${reviewedCount}/${topics.length}; 20 most similar question pairs:`);
similarQuestions.sort((a, b) => b.similarity - a.similarity || a.at.localeCompare(b.at)).slice(0, 20).forEach(pair => console.log(`${pair.at}: ${(100 * pair.similarity).toFixed(1)}% similar; ${pair.distance} word edits; crew: ${pair.crew} / imposter: ${pair.imposter}`));
console.log(`Maximum target overlap: ${(maximumOverlap * 100).toFixed(2)}% (${closest || 'no pairs'}).`);
console.log(`Deck checks: ${Object.keys(counts).map((check) => `${check} ${counts[check]}`).join(', ')}.`);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; } else console.log('Topic-game deck validation passed.');
