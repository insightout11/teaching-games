/** Validate curated library JSON files, including the expanded item schema. */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalTopicTag } from './library-topic-tags';
import { validSpeakSituation } from '../src/lib/speak-check';

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
const grammarCoverage: Record<string, { total: number; kids: number }> = {};
const listeningCoverage: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, kids: 0, dialogue: 0, announcement: 0 };
const round8ListeningCoverage = { a1Dialogue: 0, a1Kids: 0, a2B1Announcements: 0 };
let listeningItemCount = 0;
let flightQuestionCount = 0;
const flightQuestionOwners: Record<string, string> = {};
let speakSituationCount = 0;
const speakAgeCounts: Record<string, number> = { kids: 0, teens: 0 };
const speakCanDoVerbs = new Set(['Accept', 'Ask', 'Borrow', 'Cancel', 'Correct', 'Decline',
  'Describe', 'Explain', 'Give', 'Introduce', 'Invite', 'Order', 'Propose', 'Request',
  'Respond', 'State', 'Suggest', 'Tell']);

function fail(where: string, message: string) {
  errors.push(`${where}: ${message}`);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
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
    const levels = teenCourse ? ['B1', 'B2'] : ['A2', 'B1'];
    const minimumWords = teenCourse ? 300 : 250;
    const defaultLevel = teenCourse ? 'B1' : 'A2';
    let defaultWordCount: number | undefined;
    for (const level of levels) {
      const version = versions?.[level] as { cefr?: unknown; ageBand?: unknown; text?: unknown; wordCount?: unknown } | undefined;
      if (!version || version.cefr !== level || version.ageBand !== item.ageBand || !nonEmpty(version.text)) {
        fail(where, `${level} retelling requires matching cefr, ageBand, and text`);
        continue;
      }
      const words = version.text.trim().split(/\s+/).filter(Boolean).length;
      if (words < minimumWords || words > 500) fail(where, `${level} retelling must contain ${minimumWords}–500 words (found ${words})`);
      if (version.wordCount !== words) fail(where, `${level} wordCount must match its retelling (${words})`);
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

const speakPath = path.join(dataDir, 'speak-situations.json');
if (fs.existsSync(speakPath)) {
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
    }
    if (speakSituationCount !== 40) fail('speak-situations.json', `expected 40 situations (found ${speakSituationCount})`);
    if (speakAgeCounts.kids !== 20 || speakAgeCounts.teens !== 20) fail('speak-situations.json', 'expected 20 kids and 20 teens situations');
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
if (bookSeriesIds.length < 12) fail('book-library.json', `expected at least 12 public-domain book courses after round 6 (found ${bookSeriesIds.length})`);
if (bookCourseItemCount < 48) fail('book-library.json', `expected at least 48 book lesson items after round 6 (found ${bookCourseItemCount})`);

if (errors.length) {
  console.error(`Library validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Library validation passed: ${ids.size} items across ${files.length} files.`);
  console.log(`Flight Questions: ${flightQuestionCount}. Speak situations: ${speakSituationCount} (kids ${speakAgeCounts.kids}, teens ${speakAgeCounts.teens}).`);
}
