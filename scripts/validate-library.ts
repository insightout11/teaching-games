/** Validate curated library JSON files, including the expanded item schema. */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalTopicTag } from './library-topic-tags';
import { validSpeakSituation } from '../src/lib/speak-check';
import { listeningWindow, type ListeningPack } from '../src/lib/listening-pack';
import { readingSentences } from './library-reading-sentences';
import { validateTopicBriefings } from './library-topic-briefings-validator';

type Item = {
  id?: unknown;
  title?: unknown;
  kind?: unknown;
  author?: unknown;
  speaker?: unknown;
  url?: unknown;
  youtubeId?: unknown;
  durationSecs?: unknown;
  wordCount?: unknown;
  summary?: unknown;
  shortSummary?: unknown;
  images?: unknown;
  description?: unknown;
  topicTags?: unknown;
  genre?: unknown;
  difficultyLevel?: unknown;
  cefr?: unknown;
  ageBand?: unknown;
  place?: unknown;
  license?: unknown;
  attribution?: unknown;
  needsReview?: unknown;
  reviewNote?: unknown;
  flightQuestion?: unknown;
  series?: unknown;
  source?: unknown;
  retellings?: unknown;
  transcriptVerified?: unknown;
  listeningPack?: unknown;
  readingPack?: unknown;
};

const dataDir = path.resolve('src/data');
const files = fs.readdirSync(dataDir)
  .filter((file) => file.endsWith('-library.json'))
  .sort();
const errors: string[] = [];
const ids = new Map<string, string>();
const urls = new Map<string, string>();
const cefrValues = new Set(['A1', 'A2', 'B1', 'B2', 'C1']);
const ageBandValues = new Set(['kids', 'teens', 'all']);
const genres = new Set(['expository', 'narrative', 'news', 'opinion', 'discussion', 'poem', 'dialogue']);
const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;
const grammarTags = new Set([
  'grammar:present-simple', 'grammar:present-continuous', 'grammar:past-simple',
  'grammar:past-continuous', 'grammar:present-perfect', 'grammar:past-perfect',
  'grammar:future-will', 'grammar:future-going-to', 'grammar:questions',
  'grammar:comparatives-superlatives', 'grammar:modals', 'grammar:conditionals',
  'grammar:passive', 'grammar:reported-speech', 'grammar:relative-clauses',
  'grammar:prepositions', 'grammar:articles',
]);
const listeningTags = new Set([
  'listening:podcast', 'listening:interview', 'listening:announcement', 'listening:dialogue',
]);
const round4FlightQuestionVideos = new Set([
  'kids_four_spheres_geo_bio', 'kids_what_on_earth', 'kids_up_up_away', 'kids_landforms_hey',
  'kids_engineer', 'kids_defining_problem', 'kids_solutions', 'kids_what_ifs',
  'kids_succeed_failing', 'kids_picky_pineapples', 'teded_video_games_babies_learning',
  'teded_brief_history_video_games_part_1', 'teded_african_american_social_dance_history',
  'teded_instrument_music_brain_benefits', 'teded_earth_in_2125', 'teded_ai_change_world',
  'teded_food_brain_effects', 'teded_perfect_cookies_science', 'teded_food_expiration_dates',
  'teded_prolonged_space_travel', 'teded_hibernation', 'teded_tardigrade_survival',
  'teded_wildlife_climate_adaptation', 'teded_savanna_mystery', 'teded_fwtnmzk9vg4',
  'teded_n2uqwfv6jr4', 'teded_1jxq9779zwu', 'teded_fxpc_8f__xo', 'teded_dmmpykrrd4o',
  'teded__r307w05ijc', 'teded_hmfqqjmf_f0', 'teded_2tm1lffxekg', 'teded_g1pb2ak2we4',
  'teded_mknv3t5qbuc', 'teded_jyzpxry5mfg', 'teded_2uphazryvpy', 'teded_wyq3o8u6smy',
  'teded__6xlnywppb8', 'teded_k93fmnfkwfi', 'teded_qwg2f9dwwpy',
]);
const seriesGroups: Record<string, Item[]> = {};
let bookCourseItemCount = 0;
let readingPackCount = 0;
const reflectiveCandidates: string[] = [];
let readingPassageCount = 0;
let readingGistCount = 0;
let readingCheckCount = 0;
let readingWordCount = 0;
const grammarCoverage: Record<string, { total: number; kids: number }> = {};
const listeningCoverage: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, kids: 0, dialogue: 0, announcement: 0 };
const round8ListeningCoverage = { a1Dialogue: 0, a1Kids: 0, a2B1Announcements: 0 };
let listeningItemCount = 0;
let flightQuestionCount = 0;
const flightQuestionOwners: Record<string, string> = {};
let speakSituationCount = 0;
const speakAgeCounts: Record<string, number> = { kids: 0, teens: 0 };
const speakPositions = { before: [0, 0, 0, 0], after: [0, 0, 0, 0] };
const round12Speak = { kids: 0, teens: 0, teenB2: 0 };
const speakCanDoVerbs = new Set(['Accept', 'Acknowledge', 'Answer', 'Apologize', 'Ask',
  'Borrow', 'Cancel', 'Comfort', 'Correct', 'Decline', 'Describe', 'Disagree', 'Explain',
  'Express', 'Give', 'Introduce', 'Invite', 'Name', 'Negotiate', 'Offer', 'Order',
  'Praise', 'Propose', 'Request', 'Respond', 'State', 'Suggest', 'Take', 'Tell', 'Volunteer']);
let listeningPackCount = 0;
let listeningSegmentCount = 0;
let listeningGistCount = 0;
let listeningHarderCount = 0;
let listeningWordCount = 0;
let listeningStaticCount = 0;
let listeningBlackBoxCount = 0;
const packCohorts: Record<string, number> = { kids: 0, B1: 0, B2: 0 };
let debateMotionCount = 0;
const debateCohorts: Record<string, number> = { kids: 0, teens: 0 };
const debateLevels: Record<string, number> = { A2: 0, B1: 0, B2: 0 };
let debateEvidenceCount = 0;
const round14DebateCounts = { kidsA2: 0, teensB1: 0, teensB2: 0 };
const round14TeenTopics = new Set<string>();

function fail(where: string, message: string) {
  errors.push(`${where}: ${message}`);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validatePackQuestion(raw: unknown, where: string, optionMin: number, optionMax: number): string {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { fail(where, 'must be a question object'); return ''; }
  const question = raw as { q?: unknown; options?: unknown; correctIndex?: unknown };
  if (!nonEmpty(question.q) || !question.q.trim().endsWith('?')) fail(where, 'q must be a non-empty question');
  if (!Array.isArray(question.options) || question.options.length < optionMin || question.options.length > optionMax
    || question.options.some((option) => !nonEmpty(option))
    || new Set(question.options).size !== question.options.length) fail(where, `options must be ${optionMin}–${optionMax} distinct non-empty strings`);
  if (!Number.isInteger(question.correctIndex) || Number(question.correctIndex) < 0
    || !Array.isArray(question.options) || Number(question.correctIndex) >= question.options.length) fail(where, 'correctIndex must identify an option');
  return nonEmpty(question.q) ? question.q.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ') : '';
}

function validateExpandedItem(item: Item, where: string) {
  if (!nonEmpty(item.title)) fail(where, 'title is required');
  if (!nonEmpty(item.description)) fail(where, 'description is required');
  if (!Array.isArray(item.topicTags) || item.topicTags.length === 0) fail(where, 'topicTags must be a non-empty array');
  if (!nonEmpty(item.difficultyLevel)) fail(where, 'difficultyLevel is required');
  if (!cefrValues.has(String(item.cefr))) fail(where, 'cefr must be A1, A2, B1, B2, or C1');
  if (!ageBandValues.has(String(item.ageBand))) fail(where, 'ageBand must be kids, teens, or all');
  if (typeof item.needsReview !== 'boolean') fail(where, 'needsReview must be a boolean');
  if (item.reviewNote !== undefined && !nonEmpty(item.reviewNote)) fail(where, 'reviewNote, when present, must be non-empty');
  if (item.flightQuestion !== undefined) {
    const youngNarrative = item.ageBand === 'kids'
      && (item.kind === 'text' || item.kind === 'picture-book');
    if (item.genre !== 'opinion' && item.genre !== 'expository'
      && where.indexOf('book-library.json[') !== 0 && !youngNarrative) {
      fail(where, 'flightQuestion requires opinion or expository genre, except narrative text for young learners');
    }
    if (item.kind === 'video' && round4FlightQuestionVideos.has(String(item.id || ''))
      && (typeof item.durationSecs !== 'number' || item.durationSecs < 180 || item.durationSecs > 480)) {
      fail(where, 'Flight Question videos must be 3–8 minutes long');
    }
  }
  if (item.place !== null && item.place !== undefined) {
    const place = item.place as { name?: unknown; lat?: unknown; lng?: unknown };
    if (!nonEmpty(place.name) || typeof place.lat !== 'number' || typeof place.lng !== 'number') {
      fail(where, 'place must be null or include name, numeric lat, and numeric lng');
    }
  }

  if (item.kind === 'text' || item.kind === 'picture-book') {
    if (!nonEmpty(item.author)) fail(where, 'author is required for text items');
    if (!nonEmpty(item.url)) fail(where, 'url is required for text items');
    if (!nonEmpty(item.summary)) fail(where, 'full text summary is required');
    const words = String(item.summary).trim().split(/\s+/).filter(Boolean).length;
    if (typeof item.wordCount !== 'number' || item.wordCount !== words) {
      fail(where, `wordCount must equal the summary word count (${words})`);
    }
    if (words < 150 || words > 900) fail(where, `text must contain 150–900 words (found ${words})`);
    if (!nonEmpty(item.license) || !nonEmpty(item.attribution)) fail(where, 'license and attribution are required for text');
    else if (!/^(public domain|cc by(?:-sa)?)(?:\s|$)/i.test(item.license.trim())) {
      fail(where, 'license must be Public domain, CC BY, or CC BY-SA');
    }
    if (item.kind === 'picture-book') {
      if (!Array.isArray(item.images) || item.images.length === 0) fail(where, 'picture-book requires at least one image');
      else for (const [index, value] of Array.from(item.images.entries())) {
        const image = value as { url?: unknown; alt?: unknown; license?: unknown; attribution?: unknown };
        if (!nonEmpty(image.url) || !nonEmpty(image.alt)) fail(where, `images[${index}] requires url and alt`);
        if (!nonEmpty(image.license ?? item.license) || !nonEmpty(image.attribution ?? item.attribution)) {
          fail(where, `images[${index}] requires license and attribution (or item-level values)`);
        }
      }
    }
  } else if (item.kind === 'video') {
    if (!nonEmpty(item.author ?? item.speaker)) fail(where, 'author or speaker is required for video');
    if (!youtubeIdPattern.test(String(item.youtubeId ?? ''))) fail(where, 'youtubeId must be an 11-character YouTube ID');
    if (typeof item.durationSecs !== 'number' || item.durationSecs <= 0) fail(where, 'durationSecs must be positive');
    if (!nonEmpty(item.url)) fail(where, 'url is required for video');
    else if (!/^https?:\/\//i.test(item.url)) fail(where, 'video url must be http(s)');
  } else {
    fail(where, `kind must be text, video, or picture-book (found ${String(item.kind)})`);
  }
  if (!nonEmpty(item.genre) || !genres.has(item.genre)) fail(where, 'genre must be expository, narrative, news, opinion, discussion, poem, or dialogue');
  if (where.indexOf('grammar-library.json[') === 0 && Array.isArray(item.topicTags)) {
    for (const tag of item.topicTags) {
      if (typeof tag === 'string' && tag.indexOf('grammar:') === 0 && !grammarTags.has(tag)) {
        fail(where, `unsupported grammar tag ${tag}`);
      }
      if (typeof tag === 'string' && grammarTags.has(tag)) {
        if (!grammarCoverage[tag]) grammarCoverage[tag] = { total: 0, kids: 0 };
        grammarCoverage[tag].total += 1;
        if (item.ageBand === 'kids' && (item.cefr === 'A1' || item.cefr === 'A2')) grammarCoverage[tag].kids += 1;
      }
    }
  }
  if (where.indexOf('grammar-library.json[') === 0 && String(item.id || '').indexOf('grammar-r7-') === 0
    && item.transcriptVerified !== true) fail(where, 'Round 7 grammar clips require a locally verified transcript');
  if (where.indexOf('book-library.json[') === 0) {
    bookCourseItemCount += 1;
    const source = item.source as { title?: unknown; url?: unknown } | undefined;
    if (!source || !nonEmpty(source.title) || !nonEmpty(source.url)
      || !/^https:\/\/(www\.)?gutenberg\.org\//i.test(String(source.url))) {
      fail(where, 'book item source must link to a Project Gutenberg original');
    }
    if (item.genre !== 'narrative') fail(where, 'book course items must use narrative genre');
    if (!nonEmpty(item.shortSummary)) fail(where, 'book course items require a shortSummary synopsis');
    if (!nonEmpty(item.flightQuestion)) fail(where, 'book course items require a flightQuestion');
    const versions = item.retellings as Record<string, unknown> | undefined;
    const series = item.series as { id?: string } | undefined;
    // Round 5's Sherlock course is teen-labelled but follows the A2/B1 schema;
    // Round 6 teen courses are identified by their added B2 version.
    const teenCourse = !!versions?.B2 && item.ageBand === 'teens' && !!series?.id && series.id.indexOf('book-course-') === 0;
    const earlyReader = !!versions?.A1 && !versions?.B1;
    const levels = teenCourse ? ['B1', 'B2'] : earlyReader ? ['A1', 'A2'] : ['A2', 'B1'];
    if (versions?.A1 && !earlyReader) levels.unshift('A1');
    const defaultLevel = teenCourse ? 'B1' : earlyReader ? 'A1' : 'A2';
    let defaultWordCount: number | undefined;
    for (const level of levels) {
      const version = versions?.[level] as { cefr?: unknown; ageBand?: unknown; text?: unknown; wordCount?: unknown } | undefined;
      if (!version || version.cefr !== level || version.ageBand !== item.ageBand || !nonEmpty(version.text)) {
        fail(where, `${level} retelling requires matching cefr, ageBand, and text`);
        continue;
      }
      const words = version.text.trim().split(/\s+/).filter(Boolean).length;
      const minimumWords = level === 'A1' ? 120 : level === 'A2' ? 250 : level === 'B1' ? 300 : 400;
      const maximumWords = level === 'A1' ? 220 : level === 'A2' ? 450 : level === 'B1' ? 500 : 600;
      if (words < minimumWords || words > maximumWords) fail(where, `${level} retelling must contain ${minimumWords}–${maximumWords} words (found ${words})`);
      if (version.wordCount !== words) fail(where, `${level} wordCount must match its retelling (${words})`);
      if (level === 'A1') {
        const sentences = readingSentences(version.text);
        const lengths = sentences.map(sentence => sentence.trim().split(/\s+/).length);
        if (!lengths.length || words / lengths.length > 10) fail(where, `A1 average sentence length must be at most 10 words (found ${(words / (lengths.length || 1)).toFixed(1)})`);
        for (const [sentenceIndex, length] of Array.from(lengths.entries())) {
          if (length > 14) fail(`${where}.A1.sentence[${sentenceIndex}]`, `A1 sentence exceeds 14 words (found ${length})`);
        }
      }
      const paragraphs = version.text.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean);
      for (const [paragraphIndex, paragraph] of Array.from(paragraphs.entries())) {
        const at = `${where}.${level}.paragraph[${paragraphIndex}]`;
        if (/^(?:The adults|This chapter|This part shows|This part of the story|We learn|In the end, the story|The episode marks|The story (?:shows|teaches|warns)|The lesson|The moral)\b/i.test(paragraph)) {
          fail(at, 'reflective padding pattern; replace commentary with chapter events');
        }
        const abstract = (paragraph.match(/\b(?:theme|lesson|moral|responsibility|confidence|understanding|judgment|choice|choices|consequence|identity|meaning|experience|trust|courage|loyalty|society|humanity|freedom|ambition|relationship|development|growth)\b/gi) || []).length;
        const action = (paragraph.match(/\b(?:said|asked|told|ran|walked|went|came|found|took|gave|carried|opened|closed|saw|heard|met|left|returned|jumped|climbed|fought|followed|reached|arrived|entered|helped|rescued|caught|pulled|pushed|searched|watched|wrote|read|sailed|escaped|died|killed|hid|held|moved)\b/gi) || []).length;
        if (abstract >= 4 && abstract > action * 2) reflectiveCandidates.push(`${at}: ${paragraph.slice(0, 120)}…`);
      }
      if (level === defaultLevel) defaultWordCount = words;
    }
    if (item.cefr !== defaultLevel) fail(where, `book item default cefr must be ${defaultLevel}`);
    if (typeof item.wordCount !== 'number' || item.wordCount !== defaultWordCount) {
      fail(where, `book item wordCount must match the ${defaultLevel} version word count`);
    }
    const defaultVersion = versions?.[defaultLevel] as { text?: unknown } | undefined;
    if (nonEmpty(defaultVersion?.text) && item.summary !== defaultVersion.text) {
      fail(where, `summary must contain the full ${defaultLevel} retelling for existing reading tools`);
    }
    const packs = item.readingPack as Record<string, unknown> | undefined;
    if (!packs || typeof packs !== 'object' || Array.isArray(packs)) fail(where, 'readingPack must contain a pack for every retelling level');
    else {
      const presentLevels = Object.keys(versions || {}).sort();
      if (Object.keys(packs).sort().join(',') !== presentLevels.join(',')) fail(where, `readingPack levels must exactly match retellings: ${presentLevels.join(', ')}`);
      for (const level of presentLevels) {
        const version = versions?.[level] as { text?: unknown } | undefined;
        const rawPack = packs[level];
        const at = `${where}.readingPack.${level}`;
        if (!rawPack || typeof rawPack !== 'object' || Array.isArray(rawPack) || !nonEmpty(version?.text)) { fail(at, 'pack requires a retelling'); continue; }
        readingPackCount += 1;
        const pack = rawPack as Record<string, unknown>;
        const passages = pack.passages;
        const gistQuestions = new Set<string>();
        const minPassages = 4;
        const maxPassages = level === 'A1' ? 6 : 8;
        if (!Array.isArray(passages) || passages.length < minPassages || passages.length > maxPassages) fail(at, `passages must contain ${minPassages}–${maxPassages} items`);
        else {
          readingPassageCount += passages.length;
          const texts: string[] = [];
          for (const [index, rawPassage] of Array.from(passages.entries())) {
            const passageAt = `${at}.passages[${index}]`;
            if (!rawPassage || typeof rawPassage !== 'object' || Array.isArray(rawPassage)) { fail(passageAt, 'passage must be an object'); continue; }
            const passage = rawPassage as { text?: unknown; gist?: unknown };
            if (!nonEmpty(passage.text)) fail(passageAt, 'text is required');
            else {
              texts.push(passage.text);
              const sentences = readingSentences(passage.text);
              const minimum = level === 'A1' ? 1 : 2;
              const maximum = level === 'A1' ? 3 : 4;
              if (sentences.length < minimum || sentences.length > maximum) fail(passageAt, `passage must contain ${minimum}–${maximum} sentences`);
            }
            readingGistCount += 1;
            const signature = validatePackQuestion(passage.gist, `${passageAt}.gist`, 3, 3);
            if (level === 'A1' && passage.gist && typeof passage.gist === 'object') {
              const options = (passage.gist as { options?: unknown }).options;
              if (Array.isArray(options) && options.some(option => typeof option === 'string' && option.trim().split(/\s+/).length > 4)) {
                fail(`${passageAt}.gist`, 'A1 gist options must be 1–4 words');
              }
            }
            if (signature) gistQuestions.add(signature);
          }
          if (texts.join(' ').replace(/\s+/g, ' ').trim() !== version.text.replace(/\s+/g, ' ').trim()) fail(at, 'passage texts must rejoin to the exact retelling');
        }
        const predict = pack.predict as { q?: unknown; options?: unknown; outcomeIndex?: unknown } | undefined;
        if (!predict || !nonEmpty(predict.q) || !predict.q.endsWith('?') || !Array.isArray(predict.options)
          || predict.options.length !== 3 || predict.options.some((option) => !nonEmpty(option))
          || new Set(predict.options).size !== 3 || !Number.isInteger(predict.outcomeIndex)
          || Number(predict.outcomeIndex) < 0 || Number(predict.outcomeIndex) > 2) fail(`${at}.predict`, 'requires a question, three distinct outcomes and valid outcomeIndex');
        if (!Array.isArray(pack.check) || pack.check.length !== 3) fail(at, 'check requires exactly three questions');
        else for (const [index, question] of Array.from(pack.check.entries())) {
          readingCheckCount += 1;
          const signature = validatePackQuestion(question, `${at}.check[${index}]`, 3, 3);
          if (signature && gistQuestions.has(signature)) fail(at, 'check question must differ from every passage gist');
        }
        if (!Array.isArray(pack.words) || pack.words.length !== 5) fail(at, 'words requires exactly five entries');
        else {
          const seen = new Set<string>();
          const textWords = new Set((version.text.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g) || []).map((word) => word.toLowerCase()));
          for (const [index, rawWord] of Array.from(pack.words.entries())) {
            readingWordCount += 1;
            const word = rawWord as { word?: unknown; meaning?: unknown } | undefined;
            if (!word || !nonEmpty(word.word) || !nonEmpty(word.meaning) || word.word.trim().split(/\s+/).length !== 1) { fail(`${at}.words[${index}]`, 'word and meaning must be non-empty, with a single word'); continue; }
            const normalized = word.word.toLowerCase();
            if (!textWords.has(normalized)) fail(`${at}.words[${index}]`, 'word must appear in this retelling');
            if (seen.has(normalized)) fail(`${at}.words[${index}]`, 'word repeats in the pack');
            seen.add(normalized);
          }
        }
        if (!Array.isArray(pack.cast) || pack.cast.length === 0) fail(at, 'cast requires at least one character');
        else for (const [index, rawCharacter] of Array.from(pack.cast.entries())) {
          const character = rawCharacter as { name?: unknown; who?: unknown } | undefined;
          if (!character || !nonEmpty(character.name) || !nonEmpty(character.who) || character.who.trim().split(/\s+/).length < 4
            || character.who.trim().split(/\s+/).length > 8) fail(`${at}.cast[${index}]`, 'cast needs name and a 4–8 word description');
          else {
            const escapedName = character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (!new RegExp(`(^|[^A-Za-z])${escapedName}([^A-Za-z]|$)`, 'i').test(version.text)) fail(`${at}.cast[${index}]`, 'cast name must appear in this retelling');
          }
        }
        const talkLimit = level === 'A1' ? 10 : 14;
        if (!nonEmpty(pack.talk) || !pack.talk.trim().endsWith('?') || pack.talk.trim().split(/\s+/).length > talkLimit) fail(at, `talk must be a question of at most ${talkLimit} words`);
      }
    }
  }
}

for (const file of files) {
  const filePath = path.join(dataDir, file);
  let items: unknown;
  try {
    items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(file, `invalid JSON: ${String(error)}`);
    continue;
  }
  if (!Array.isArray(items)) {
    fail(file, 'top-level JSON value must be an array');
    continue;
  }

  for (const [index, raw] of Array.from(items.entries())) {
    const item = raw as Item;
    const where = `${file}[${index}]${nonEmpty(item.id) ? ` (${item.id})` : ''}`;
    if (nonEmpty(item.flightQuestion)) flightQuestionCount += 1;
    if (item.flightQuestion !== undefined) {
      if (!nonEmpty(item.flightQuestion)) fail(where, 'flightQuestion must be a non-empty question');
      else {
        const normalizedQuestion = item.flightQuestion.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
        const normalizedTitle = String(item.title || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
        if (normalizedQuestion === normalizedTitle) fail(where, 'flightQuestion must not copy the item title');
        if (/^(but|so|and)\b/i.test(item.flightQuestion.trim())) fail(where, 'flightQuestion must not start with But, So, or And');
        if (flightQuestionOwners[normalizedQuestion]) fail(where, `flightQuestion duplicates ${flightQuestionOwners[normalizedQuestion]}`);
        else flightQuestionOwners[normalizedQuestion] = where;
        if (item.flightQuestion.trim().split(/\s+/).length > 12) fail(where, 'flightQuestion must be 12 words or fewer');
        if (!item.flightQuestion.trim().endsWith('?')) fail(where, 'flightQuestion must end with a question mark');
      }
    }
    if (item.listeningPack !== undefined) {
      listeningPackCount += 1;
      if (item.ageBand === 'kids' && (item.cefr === 'A1' || item.cefr === 'A2')) packCohorts.kids += 1;
      else if (item.cefr === 'B1') packCohorts.B1 += 1;
      else if (item.cefr === 'B2') packCohorts.B2 += 1;
      else fail(where, 'listening pack must be kids A1–A2, B1, or B2');
      if (!nonEmpty(item.youtubeId) || item.transcriptVerified !== true) fail(where, 'listening pack requires a verified YouTube transcript');
      const pack = item.listeningPack as { segments?: unknown; gist?: unknown; harder?: unknown; words?: unknown; static?: unknown; blackBox?: unknown };
      if (!pack || !Array.isArray(pack.segments) || pack.segments.length !== 3) fail(where, 'listeningPack requires exactly three segments');
      else for (const [segmentIndex, rawSegment] of Array.from(pack.segments.entries())) {
        listeningSegmentCount += 1;
        const segment = rawSegment as { start?: unknown; end?: unknown; question?: unknown;
          options?: unknown; correctIndex?: unknown; keyLine?: unknown };
        const at = `${where}.listeningPack.segments[${segmentIndex}]`;
        if (!Number.isInteger(segment.start) || !Number.isInteger(segment.end)
          || Number(segment.end) - Number(segment.start) < 10 || Number(segment.end) - Number(segment.start) > 30
          || Number(segment.start) < 0 || Number(segment.end) > Number(item.durationSecs)) {
          fail(at, 'start/end must be a 10–30 second window within the video');
        }
        if (!nonEmpty(segment.question) || !segment.question.trim().endsWith('?')) fail(at, 'question must end with ?');
        if (!Array.isArray(segment.options) || segment.options.length < 3 || segment.options.length > 4
          || segment.options.some((option) => !nonEmpty(option))
          || new Set(segment.options).size !== segment.options.length) fail(at, 'options must be 3–4 distinct non-empty strings');
        if (!Number.isInteger(segment.correctIndex) || Number(segment.correctIndex) < 0
          || !Array.isArray(segment.options) || Number(segment.correctIndex) >= segment.options.length) fail(at, 'correctIndex must identify one option');
        if (!nonEmpty(segment.keyLine)) fail(at, 'keyLine must be a non-empty exact caption line');
      }
      const detailQuestions = Array.isArray(pack?.segments) ? pack.segments.map((rawSegment) =>
        String((rawSegment as { question?: unknown })?.question || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')) : [];
      if (!Array.isArray(pack?.gist) || pack.gist.length !== 3) fail(where, 'listeningPack.gist requires exactly three questions');
      else {
        const seenGist = new Set<string>();
        for (const [gistIndex, rawGist] of Array.from(pack.gist.entries())) {
          listeningGistCount += 1;
          const signature = validatePackQuestion(rawGist, `${where}.listeningPack.gist[${gistIndex}]`, 3, 3);
          if (signature && (detailQuestions.indexOf(signature) !== -1 || seenGist.has(signature))) fail(where, 'gist question repeats a segment or gist question');
          seenGist.add(signature);
        }
      }
      if (pack?.harder === undefined) fail(where, 'listeningPack.harder is required');
      else {
        listeningHarderCount += 1;
        validatePackQuestion(pack.harder, `${where}.listeningPack.harder`, 3, 4);
      }
      if (!Array.isArray(pack?.words) || pack.words.length !== 5) fail(where, 'listeningPack.words requires exactly five timed words');
      else if (Array.isArray(pack.segments) && pack.segments.length === 3) {
        const window = listeningWindow(pack as ListeningPack, item.ageBand === 'kids' && (item.cefr === 'A1' || item.cefr === 'A2'));
        const seenWords = new Set<string>();
        for (const [wordIndex, rawWord] of Array.from(pack.words.entries())) {
          listeningWordCount += 1;
          const at = `${where}.listeningPack.words[${wordIndex}]`;
          if (!rawWord || typeof rawWord !== 'object' || Array.isArray(rawWord)) { fail(at, 'must be a word object'); continue; }
          const word = rawWord as { word?: unknown; meaning?: unknown; at?: unknown };
          if (!nonEmpty(word.word) || !nonEmpty(word.meaning)) fail(at, 'word and short meaning are required');
          if (nonEmpty(word.word)) {
            const normalized = word.word.trim().toLowerCase();
            if (seenWords.has(normalized)) fail(at, 'word must be unique within its pack');
            seenWords.add(normalized);
          }
          if (typeof word.at !== 'number' || !Number.isFinite(word.at)
            || word.at < window.start || word.at >= window.end) fail(at, `at must be inside the ${window.start}-${window.end}s listening window`);
        }
      }
      if (!Array.isArray(pack?.static) || pack.static.length !== 5) fail(where, 'listeningPack.static requires exactly five rounds');
      else {
        const seenSentences = new Set<string>();
        for (const [roundIndex, rawRound] of Array.from(pack.static.entries())) {
          listeningStaticCount += 1;
          const at = `${where}.listeningPack.static[${roundIndex}]`;
          if (!rawRound || typeof rawRound !== 'object' || Array.isArray(rawRound)) { fail(at, 'must be a Static round object'); continue; }
          const round = rawRound as { sentence?: unknown; spoken?: unknown; target?: unknown; swap?: unknown; options?: unknown; correctIndex?: unknown };
          if (!nonEmpty(round.sentence) || !nonEmpty(round.spoken) || !nonEmpty(round.target) || !nonEmpty(round.swap)) { fail(at, 'sentence, spoken, target and swap are required'); continue; }
          const sentence = round.sentence.trim();
          const tokens = sentence.match(/[A-Za-z]+(?:['’][A-Za-z]+)?|\d+/g) || [];
          if (tokens.length > 14) fail(at, 'sentence must have at most 14 words');
          if (seenSentences.has(sentence.toLowerCase())) fail(at, 'sentence repeats within pack');
          seenSentences.add(sentence.toLowerCase());
          if (!/^[A-Za-z0-9]+(?:['’][A-Za-z]+)?$/.test(round.target) || !/^[A-Za-z0-9]+(?:['’][A-Za-z]+)?$/.test(round.swap)) fail(at, 'target and swap must each be one word');
          if (round.target.toLowerCase() === round.swap.toLowerCase()) fail(at, 'swap must change the word');
          if (tokens.filter((token) => token.toLowerCase() === String(round.target).toLowerCase()).length !== 1) fail(at, 'target must appear exactly once in sentence');
          const escapedTarget = round.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (sentence.replace(new RegExp(`\\b${escapedTarget}\\b`), round.swap) !== round.spoken) fail(at, 'spoken must replace exactly the target word');
          if (!Array.isArray(round.options) || round.options.length !== 4 || round.options.some((option) => !nonEmpty(option))) fail(at, 'options must be four non-empty words');
          else {
            const optionWords = round.options as string[];
            if (new Set(optionWords.map((option) => option.toLowerCase())).size !== 4) fail(at, 'options must be distinct');
            if (optionWords.some((option) => !tokens.some((token) => token.toLowerCase() === option.toLowerCase()))) fail(at, 'each option must be a word in sentence');
            if (!Number.isInteger(round.correctIndex) || Number(round.correctIndex) < 0 || Number(round.correctIndex) > 3 || optionWords[Number(round.correctIndex)] !== round.target) fail(at, 'correctIndex must point to target');
          }
        }
      }
      const box = pack?.blackBox as { passage?: unknown; start?: unknown; end?: unknown; decoys?: unknown } | undefined;
      const boxAt = `${where}.listeningPack.blackBox`;
      if (!box || typeof box !== 'object' || Array.isArray(box)) fail(boxAt, 'requires a timed passage and decoys');
      else {
        listeningBlackBoxCount += 1;
        const kids = item.ageBand === 'kids' && (item.cefr === 'A1' || item.cefr === 'A2');
        const window = listeningWindow(pack as ListeningPack, kids);
        if (!nonEmpty(box.passage)) fail(boxAt, 'passage is required');
        else {
          const wordCount = (box.passage.match(/[A-Za-z]+(?:['’][A-Za-z]+)?|\d+(?:[.,]\d+)*/g) || []).length;
          if (wordCount < (kids ? 10 : 15) || wordCount > (kids ? 20 : 35)) fail(boxAt, `passage needs ${kids ? '10–20' : '15–35'} words`);
        }
        if (typeof box.start !== 'number' || typeof box.end !== 'number' || !Number.isFinite(box.start) || !Number.isFinite(box.end)
          || box.start < window.start || box.end > window.end || box.end <= box.start) fail(boxAt, 'start/end must be inside the listening window');
        if (!Array.isArray(box.decoys) || box.decoys.length < 6 || box.decoys.length > 8) fail(boxAt, 'requires 6–8 decoy words');
        else {
          const decoys = box.decoys as unknown[];
          const normalized = decoys.map((word) => String(word).toLowerCase());
          if (new Set(normalized).size !== decoys.length) fail(boxAt, 'decoys must be distinct');
          const passageWords = new Set((nonEmpty(box.passage) ? box.passage.match(/[A-Za-z]+(?:['’][A-Za-z]+)?|\d+(?:[.,]\d+)*/g) || [] : []).map((word) => word.toLowerCase()));
          if (decoys.some((word) => !nonEmpty(word) || String(word).trim().split(/\s+/).length !== 1 || passageWords.has(String(word).toLowerCase()))) fail(boxAt, 'decoys must be single words absent from passage');
        }
      }
    }
    if (item.kind === 'video' || nonEmpty(item.youtubeId)) {
      if (typeof item.durationSecs !== 'number' || item.durationSecs <= 0) fail(where, 'video durationSecs must be present and positive');
    }
    if (item.topicTags !== undefined) {
      if (!Array.isArray(item.topicTags)) fail(where, 'topicTags must be an array when present');
      else {
        const seenTags: Record<string, boolean> = {};
        for (const tag of item.topicTags) {
          if (typeof tag !== 'string') {
            fail(where, 'topicTags entries must be strings');
            continue;
          }
          const canonical = canonicalTopicTag(tag);
          if (tag !== tag.toLowerCase()) fail(where, `topic tag ${tag} must be lowercase`);
          if (tag !== canonical) fail(where, `topic tag ${tag} is a near-duplicate spelling; use ${canonical}`);
          if (seenTags[canonical]) fail(where, `duplicate topic tag ${tag}`);
          seenTags[canonical] = true;
        }
      }
    }
    if (!nonEmpty(item.id)) fail(where, 'id is required');
    else if (ids.has(item.id)) fail(where, `duplicate id also found in ${ids.get(item.id)}`);
    else ids.set(item.id, where);

    if (nonEmpty(item.url)) {
      const normalized = item.url.trim().replace(/\/$/, '').toLowerCase();
      if (urls.has(normalized)) fail(where, `duplicate URL also found in ${urls.get(normalized)}`);
      else urls.set(normalized, where);
    }

    // Course metadata also appears on legacy library records.
    if (item.series !== undefined) {
      const series = item.series as { id?: unknown; title?: unknown; order?: unknown };
      if (!nonEmpty(series.id) || !nonEmpty(series.title)
        || typeof series.order !== 'number' || Math.floor(series.order) !== series.order || series.order < 1) {
        fail(where, 'series requires a non-empty id/title and positive integer order');
      } else {
        if (!seriesGroups[series.id]) seriesGroups[series.id] = [];
        seriesGroups[series.id].push(item);
      }
    }

    if (file === 'grammar-library.json') {
      const tagged = Array.isArray(item.topicTags)
        && item.topicTags.some((tag) => typeof tag === 'string' && grammarTags.has(tag));
      if (!tagged && !(item.needsReview === true && nonEmpty(item.reviewNote))) {
        fail(where, 'grammar clips require an exact grammar:* tag or needsReview with an explanatory reviewNote');
      }
    }
    if (Array.isArray(item.topicTags)) {
      for (const tag of item.topicTags) {
        if (typeof tag === 'string' && tag.indexOf('listening:') === 0 && !listeningTags.has(tag)) {
          fail(where, `unsupported listening format tag ${tag}`);
        }
      }
    }
    if (file === 'listening-library.json'
      && (!Array.isArray(item.topicTags) || !item.topicTags.some((tag) => typeof tag === 'string' && tag.indexOf('listening:') === 0))) {
      fail(where, 'listening sources require a listening:* format tag');
    }
    if (file === 'listening-library.json') {
      listeningItemCount += 1;
      const isRound8Listening = typeof item.id === 'string' && item.id.indexOf('listening-r8-') === 0;
      if (item.transcriptVerified !== true) fail(where, 'listening clips require a locally verified transcript');
      const minDuration = isRound8Listening ? 30 : 60;
      const maxDuration = isRound8Listening ? 120 : 180;
      if (typeof item.durationSecs !== 'number' || item.durationSecs < minDuration || item.durationSecs > maxDuration) {
        fail(where, isRound8Listening ? 'Round 8 listening clips must be 30 seconds–2 minutes' : 'Round 7 listening clips must be 1–3 minutes');
      }
      if (typeof item.cefr === 'string' && listeningCoverage[item.cefr] !== undefined) listeningCoverage[item.cefr] += 1;
      if (item.ageBand === 'kids' && (item.cefr === 'A1' || item.cefr === 'A2')) listeningCoverage.kids += 1;
      if (isRound8Listening && item.cefr === 'A1' && Array.isArray(item.topicTags)
        && item.topicTags.indexOf('listening:dialogue') !== -1) {
        round8ListeningCoverage.a1Dialogue += 1;
        if (item.ageBand === 'kids') round8ListeningCoverage.a1Kids += 1;
      }
      if (Array.isArray(item.topicTags)) for (const tag of item.topicTags) {
        if (tag === 'listening:dialogue') listeningCoverage.dialogue += 1;
        if (tag === 'listening:announcement') {
          listeningCoverage.announcement += 1;
          if (isRound8Listening && (item.cefr === 'A2' || item.cefr === 'B1')) round8ListeningCoverage.a2B1Announcements += 1;
        }
      }
    }

    // The current library contains legacy records. Apply the complete contract
    // to records explicitly migrated to the new schema; keep legacy records
    // participating in global ID/URL collision checks.
    // Metadata-only backfills on legacy records should not force unrelated schema migration.
    // New-schema records declare kind or license; cefr/ageBand alone are valid legacy additions.
    if (item.kind !== undefined || item.license !== undefined) {
      validateExpandedItem(item, where);
    }
  }
}

// Round 9's templated Flight Questions were removed in review (Oct 3); round 10 redoes them grounded.
if (flightQuestionCount < 500) fail('flight questions', `expected at least 500 items after Round 10 (found ${flightQuestionCount})`);
if (listeningPackCount !== 60 || listeningSegmentCount !== 180) fail('listening packs', `expected 60 packs and 180 segments (found ${listeningPackCount} and ${listeningSegmentCount})`);
if (listeningGistCount !== 180 || listeningHarderCount !== 60) fail('listening packs', `expected 180 gist and 60 harder questions (found ${listeningGistCount} and ${listeningHarderCount})`);
if (listeningWordCount !== 300) fail('listening packs', `expected 300 timed words (found ${listeningWordCount})`);
if (listeningStaticCount !== 300) fail('listening packs', `expected 300 Static rounds (found ${listeningStaticCount})`);
if (listeningBlackBoxCount !== 60) fail('listening packs', `expected 60 Black Box passages (found ${listeningBlackBoxCount})`);
if (packCohorts.kids !== 22 || packCohorts.B1 !== 22 || packCohorts.B2 !== 16) fail('listening packs', `expected kids/B1/B2 = 22/22/16 (found ${packCohorts.kids}/${packCohorts.B1}/${packCohorts.B2})`);

const speakPath = path.join(dataDir, 'speak-situations.json');
if (!fs.existsSync(speakPath)) fail('speak-situations.json', 'required Speak situations bank is missing');
else {
  let situations: unknown;
  try { situations = JSON.parse(fs.readFileSync(speakPath, 'utf8')); }
  catch (error) { fail('speak-situations.json', `invalid JSON: ${String(error)}`); }
  if (!Array.isArray(situations)) fail('speak-situations.json', 'top-level value must be an array');
  else {
    speakSituationCount = situations.length;
    const speakIds = new Set<string>();
    const speakTopics = new Set<string>();
    for (const [index, raw] of Array.from(situations.entries())) {
      const where = `speak-situations.json[${index}]`;
      const situation = raw as Record<string, unknown>;
      if (!nonEmpty(situation.id) || speakIds.has(String(situation.id))) fail(where, 'id must be non-empty and unique');
      else speakIds.add(situation.id);
      if (!Array.isArray(situation.topics) || situation.topics.length === 0
        || situation.topics.some((tag) => !nonEmpty(tag))) fail(where, 'topics must be non-empty strings');
      else for (const tag of situation.topics) speakTopics.add(String(tag).toLowerCase());
      if (situation.ageBand !== 'kids' && situation.ageBand !== 'teens') fail(where, 'ageBand must be kids or teens');
      else speakAgeCounts[situation.ageBand] += 1;
      if (String(situation.id).indexOf('speak-r12-') === 0) {
        if (situation.ageBand === 'kids') round12Speak.kids += 1;
        if (situation.ageBand === 'teens') {
          round12Speak.teens += 1;
          if (situation.cefr === 'B2') round12Speak.teenB2 += 1;
        }
      }
      if (situation.ageBand === 'kids' && situation.cefr !== 'A1' && situation.cefr !== 'A2') fail(where, 'kids cefr must be A1 or A2');
      if (situation.ageBand === 'teens' && situation.cefr !== 'A2' && situation.cefr !== 'B1' && situation.cefr !== 'B2') fail(where, 'teens cefr must be A2, B1, or B2');
      if (!validSpeakSituation(raw)) fail(where, 'must satisfy validSpeakSituation');
      if (!nonEmpty(situation.canDo) || !speakCanDoVerbs.has(situation.canDo.split(/\s+/)[0]) || situation.canDo.includes('?')) fail(where, 'canDo must start with a verb and contain no question mark');
      const before = situation.before as { replies?: unknown; natural?: unknown } | undefined;
      const after = situation.after as { replies?: unknown; natural?: unknown } | undefined;
      if (!Array.isArray(before?.replies) || before.replies.length !== 4
        || !Array.isArray(after?.replies) || after.replies.length !== 4) fail(where, 'before and after each require exactly four replies');
      if (before?.natural === after?.natural) fail(where, 'after natural reply must use a different index');
      if (!Number.isInteger(before?.natural) || !Number.isInteger(after?.natural)) fail(where, 'natural indexes must be integers');
      if (Number.isInteger(before?.natural) && Number(before?.natural) >= 0 && Number(before?.natural) < 4) speakPositions.before[Number(before?.natural)] += 1;
      if (Number.isInteger(after?.natural) && Number(after?.natural) >= 0 && Number(after?.natural) < 4) speakPositions.after[Number(after?.natural)] += 1;
    }
    if (speakSituationCount !== 80) fail('speak-situations.json', `expected 80 situations (found ${speakSituationCount})`);
    if (speakAgeCounts.kids !== 40 || speakAgeCounts.teens !== 40) fail('speak-situations.json', 'expected 40 kids and 40 teens situations');
    if (round12Speak.kids !== 20 || round12Speak.teens !== 20 || round12Speak.teenB2 < 8) fail('speak-situations.json', `Round 12 requires 20 kids, 20 teens and 8 B2 teens (found ${round12Speak.kids}/${round12Speak.teens}/${round12Speak.teenB2})`);
    if (speakPositions.before.some((count) => count > speakSituationCount * 0.35)
      || speakPositions.after.some((count) => count > speakSituationCount * 0.35)) fail('speak-situations.json', 'natural reply positions must each be at most 35% before and after');
    if (speakTopics.size < 16) fail('speak-situations.json', `expected at least 16 topics (found ${speakTopics.size})`);
  }
}

for (const tag of Array.from(grammarTags)) {
  const coverage = grammarCoverage[tag] || { total: 0, kids: 0 };
  // One Round 7 past-perfect clip was removed in Round 9 after oEmbed returned 401.
  const minimumTotal = tag === 'grammar:past-perfect' ? 4 : 5;
  if (coverage.total < minimumTotal) fail('grammar coverage', `${tag} requires at least ${minimumTotal} clips (found ${coverage.total})`);
  if (coverage.kids < 2) fail('grammar coverage', `${tag} requires at least 2 A1–A2 kids clips (found ${coverage.kids})`);
}
if (files.indexOf('listening-library.json') !== -1) {
  if (listeningItemCount < 25) fail('listening-library.json', `expected at least 25 Round 7 listening clips (found ${listeningItemCount})`);
  if (listeningCoverage.A1 + listeningCoverage.A2 < 10) fail('listening-library.json', `expected at least 10 A1–A2 clips (found ${listeningCoverage.A1 + listeningCoverage.A2})`);
  if (listeningCoverage.B1 < 10) fail('listening-library.json', `expected at least 10 B1 clips (found ${listeningCoverage.B1})`);
  if (listeningCoverage.B2 < 5) fail('listening-library.json', `expected at least 5 B2 clips (found ${listeningCoverage.B2})`);
  if (listeningCoverage.kids < 10) fail('listening-library.json', `expected at least 10 kids clips (found ${listeningCoverage.kids})`);
  if (round8ListeningCoverage.a1Dialogue < 15) fail('Round 8 listening coverage', `expected at least 15 A1 dialogue clips (found ${round8ListeningCoverage.a1Dialogue})`);
  if (round8ListeningCoverage.a1Kids < 10) fail('Round 8 listening coverage', `expected at least 10 A1 kids clips (found ${round8ListeningCoverage.a1Kids})`);
  if (round8ListeningCoverage.a2B1Announcements < 15) fail('Round 8 listening coverage', `expected at least 15 A2–B1 announcement clips (found ${round8ListeningCoverage.a2B1Announcements})`);
}

const cefrRank: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };
for (const seriesId of Object.keys(seriesGroups)) {
  const members = seriesGroups[seriesId];
  if (members.length < 4 || members.length > 6) fail(`series ${seriesId}`, 'series must contain 4–6 items');
  const first = members[0].series as { title: string; order: number };
  const orders = new Set<number>();
  const ranks: number[] = [];
  for (const member of members) {
    const series = member.series as { title: string; order: number };
    if (series.title !== first.title) fail(`series ${seriesId}`, 'all members must use the same title');
    if (orders.has(series.order)) fail(`series ${seriesId}`, `duplicate order ${series.order}`);
    orders.add(series.order);
    ranks.push(cefrRank[String(member.cefr)] || 0);
    if (member.ageBand !== members[0].ageBand) fail(`series ${seriesId}`, 'all members must use one ageBand');
    if (seriesId.indexOf('round10-') === 0 && member.cefr !== members[0].cefr) fail(`series ${seriesId}`, 'Round 10 series must use one exact CEFR level');
    if (seriesId.indexOf('round10-') === 0 && !nonEmpty(member.flightQuestion)) fail(`series ${seriesId}`, 'every Round 10 course item requires a Flight Question');
  }
  if (Math.max(...ranks) - Math.min(...ranks) > 1) fail(`series ${seriesId}`, 'CEFR levels may span no more than one step');
}

const seriesIds = Object.keys(seriesGroups);
if (seriesIds.length < 51) fail('series catalog', `expected at least 51 course series after round 10 (found ${seriesIds.length})`);
const round10SeriesIds = seriesIds.filter((seriesId) => seriesId.indexOf('round10-') === 0);
if (round10SeriesIds.length !== 20) fail('Round 10 series', `expected exactly 20 new course series (found ${round10SeriesIds.length})`);
const round10Cohorts = [
  { prefix: 'round10-kids-a1-', count: 8, cefr: 'A1', ageBand: 'kids' },
  { prefix: 'round10-kids-b1-', count: 4, cefr: 'B1', ageBand: 'kids' },
  { prefix: 'round10-teens-a2-', count: 6, cefr: 'A2', ageBand: 'teens' },
  { prefix: 'round10-teens-b1-', count: 2, cefr: 'B1', ageBand: 'teens' },
];
for (const cohort of round10Cohorts) {
  const ids = round10SeriesIds.filter((seriesId) => seriesId.indexOf(cohort.prefix) === 0);
  if (ids.length !== cohort.count) fail('Round 10 series', `expected ${cohort.count} ${cohort.cefr} ${cohort.ageBand} series (found ${ids.length})`);
  for (const id of ids) {
    const members = seriesGroups[id] || [];
    if (members.some((member) => member.cefr !== cohort.cefr || member.ageBand !== cohort.ageBand)) fail(`series ${id}`, `all items must be ${cohort.cefr} and ${cohort.ageBand}`);
  }
}
const bookSeriesIds = seriesIds.filter((seriesId) => seriesId.indexOf('book-course-') === 0);
if (bookSeriesIds.length < 14) fail('book-library.json', `expected at least 14 public-domain book courses after round 17 (found ${bookSeriesIds.length})`);
if (bookCourseItemCount < 56) fail('book-library.json', `expected at least 56 book lesson items after round 17 (found ${bookCourseItemCount})`);
if (readingPackCount !== bookCourseItemCount * 2 + 24) fail('book-library.json', `expected two packs per lesson plus 24 A1 versions (found ${readingPackCount})`);

const debatePath = path.join(dataDir, 'debate-motions.json');
if (!fs.existsSync(debatePath)) fail('debate-motions.json', 'required debate motions bank is missing');
else {
  let bank: unknown;
  try { bank = JSON.parse(fs.readFileSync(debatePath, 'utf8')); }
  catch (error) { fail('debate-motions.json', `invalid JSON: ${String(error)}`); }
  if (!Array.isArray(bank)) fail('debate-motions.json', 'top-level value must be an array');
  else {
    debateMotionCount = bank.length;
    const seenMotionIds = new Set<string>();
    const seenMotions = new Set<string>();
    for (const [index, raw] of Array.from(bank.entries())) {
      const where = `debate-motions.json[${index}]`;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { fail(where, 'must be an object'); continue; }
      const motion = raw as Record<string, unknown>;
      if (!nonEmpty(motion.id) || seenMotionIds.has(String(motion.id))) fail(where, 'id must be non-empty and unique');
      else seenMotionIds.add(motion.id);
      if (!nonEmpty(motion.motion) || motion.motion.trim().split(/\s+/).length > 12
        || motion.motion.endsWith('?')) fail(where, 'motion must be plain text of at most 12 words');
      else {
        const normalized = motion.motion.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        if (seenMotions.has(normalized)) fail(where, 'duplicate motion');
        seenMotions.add(normalized);
      }
      if (!Array.isArray(motion.topics) || motion.topics.length === 0
        || motion.topics.some((tag) => !nonEmpty(tag))) fail(where, 'topics must be a non-empty string array');
      if (motion.ageBand === 'kids' && (motion.cefr === 'A2' || motion.cefr === 'B1')) debateCohorts.kids += 1;
      else if (motion.ageBand === 'teens' && (motion.cefr === 'B1' || motion.cefr === 'B2')) debateCohorts.teens += 1;
      else fail(where, 'kids require A2–B1 and teens require B1–B2');
      if (motion.cefr === 'A2' || motion.cefr === 'B1' || motion.cefr === 'B2') debateLevels[motion.cefr] += 1;
      if (String(motion.id).indexOf('debate-r14-') === 0) {
        if (motion.ageBand === 'kids' && motion.cefr === 'A2') round14DebateCounts.kidsA2 += 1;
        else if (motion.ageBand === 'teens' && motion.cefr === 'B1') round14DebateCounts.teensB1 += 1;
        else if (motion.ageBand === 'teens' && motion.cefr === 'B2') round14DebateCounts.teensB2 += 1;
        if (motion.ageBand === 'teens' && Array.isArray(motion.topics)) for (const tag of motion.topics) round14TeenTopics.add(String(tag));
      }
      for (const side of ['forPoints', 'againstPoints']) {
        const points = motion[side];
        if (!Array.isArray(points) || points.length !== 3 || points.some((point) => !nonEmpty(point))) {
          fail(where, `${side} must have exactly three non-empty arguments`);
        }
      }
      if (!Array.isArray(motion.evidence) || motion.evidence.length < 2 || motion.evidence.length > 4) {
        fail(where, 'evidence must have 2–4 items');
      } else {
        debateEvidenceCount += motion.evidence.length;
        const sides = new Set<string>();
        for (const [evidenceIndex, rawEvidence] of Array.from(motion.evidence.entries())) {
          const at = `${where}.evidence[${evidenceIndex}]`;
          if (!rawEvidence || typeof rawEvidence !== 'object' || Array.isArray(rawEvidence)) { fail(at, 'must be an object'); continue; }
          const evidence = rawEvidence as Record<string, unknown>;
          if (!nonEmpty(evidence.fact) || !nonEmpty(evidence.source)) fail(at, 'fact and named source are required');
          if (evidence.side !== 'for' && evidence.side !== 'against') fail(at, 'side must be for or against');
          else sides.add(evidence.side);
        }
        if (!sides.has('for') || !sides.has('against')) fail(where, 'evidence must support both sides');
      }
      if (!nonEmpty(motion.pulse) || !motion.pulse.trim().endsWith('?')) fail(where, 'pulse must be a question');
    }
    if (debateMotionCount !== 120 || debateCohorts.kids !== 60 || debateCohorts.teens !== 60) {
      fail('debate-motions.json', `expected 120 motions, 60 kids and 60 teens (found ${debateMotionCount}/${debateCohorts.kids}/${debateCohorts.teens})`);
    }
    if (round14DebateCounts.kidsA2 !== 30 || round14DebateCounts.teensB1 !== 15 || round14DebateCounts.teensB2 !== 15) fail('debate-motions.json', `Round 14 expected kids A2 30, teens B1 15, teens B2 15 (found ${round14DebateCounts.kidsA2}/${round14DebateCounts.teensB1}/${round14DebateCounts.teensB2})`);
    if (round14TeenTopics.size < 15) fail('debate-motions.json', `Round 14 teen motions need at least 15 topic areas (found ${round14TeenTopics.size})`);
    if (debateEvidenceCount < 240) fail('debate-motions.json', `expected at least 240 evidence facts (found ${debateEvidenceCount})`);
  }
}

const topicBriefingCounts = validateTopicBriefings(dataDir, fail);
console.log(`Round 19 writing audit: briefing/fact overlap ${topicBriefingCounts.briefingFactOverlap}, title/alias vocab ${topicBriefingCounts.titleAliasVocab}, generic vocab ${topicBriefingCounts.genericVocab}, overused vocab ${topicBriefingCounts.overusedVocab}, expression/fact overlap ${topicBriefingCounts.expressionFactOverlap}, cross-topic sentences ${topicBriefingCounts.crossTopicSentences}.`);
if (reflectiveCandidates.length) console.warn(`Reflective-paragraph candidates for review (${reflectiveCandidates.length}):\n${reflectiveCandidates.join('\n')}`);

if (errors.length) {
  console.error(`Library validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Library validation passed: ${ids.size} items across ${files.length} files.`);
  console.log(`Flight Questions: ${flightQuestionCount}. Speak situations: ${speakSituationCount} (kids ${speakAgeCounts.kids}, teens ${speakAgeCounts.teens}; before ${speakPositions.before.join('/')}, after ${speakPositions.after.join('/')}).`);
  console.log(`Listening packs: ${listeningPackCount}, segments: ${listeningSegmentCount}, gist: ${listeningGistCount}, harder: ${listeningHarderCount}, words: ${listeningWordCount}, Static rounds: ${listeningStaticCount}, Black Box passages: ${listeningBlackBoxCount} (kids A1–A2 ${packCohorts.kids}, B1 ${packCohorts.B1}, B2 ${packCohorts.B2}).`);
  console.log(`Debate motions: ${debateMotionCount} (kids ${debateCohorts.kids}, teens ${debateCohorts.teens}; A2 ${debateLevels.A2}, B1 ${debateLevels.B1}, B2 ${debateLevels.B2}; evidence ${debateEvidenceCount}).`);
  console.log(`Reading packs: ${readingPackCount} across ${bookCourseItemCount} book lessons; passages ${readingPassageCount}, gist ${readingGistCount}, chapter checks ${readingCheckCount}, words ${readingWordCount}.`);
  console.log(`Topic briefings: ${topicBriefingCounts.topics} (kids ${topicBriefingCounts.kids}, teens ${topicBriefingCounts.teens}; A1 ${topicBriefingCounts.A1}, A2 ${topicBriefingCounts.A2}, B1 ${topicBriefingCounts.B1}, B2 ${topicBriefingCounts.B2}).`);
}
